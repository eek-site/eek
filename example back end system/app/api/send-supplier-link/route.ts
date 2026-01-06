import { NextRequest, NextResponse } from 'next/server'

// Microsoft Graph API helpers (reuse from send-booking-link)
async function getAccessToken(): Promise<string | null> {
  const tenantId = process.env.MS_TENANT_ID
  const clientId = process.env.MS_CLIENT_ID
  const clientSecret = process.env.MS_CLIENT_SECRET

  if (!tenantId || !clientId || !clientSecret) {
    console.log('Microsoft Graph credentials not configured')
    return null
  }

  try {
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials'
      })
    })

    const data = await response.json()
    return data.access_token || null
  } catch (error) {
    console.error('Failed to get access token:', error)
    return null
  }
}

// Send SMS via TNZ email-to-SMS gateway
async function sendSMS(
  accessToken: string,
  to: string,
  subject: string,
  message: string
): Promise<boolean> {
  // Always use no-reply for transactional emails
  const fromEmail = 'no-reply@eek.co.nz'
  
  // Format phone for TNZ gateway: just the number without country code
  // e.g., 0277740405 -> 277740405@sms.tnz.co.nz
  let formattedPhone = to.replace(/[\s\-()]/g, '')
  if (formattedPhone.startsWith('+64')) {
    formattedPhone = formattedPhone.substring(3)
  }
  if (formattedPhone.startsWith('0')) {
    formattedPhone = formattedPhone.substring(1)
  }
  
  const toEmail = `${formattedPhone}@sms.tnz.co.nz`
  console.log('📱 SMS gateway address:', toEmail, 'from:', fromEmail, 'original:', to)
  
  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/users/' + fromEmail + '/sendMail', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: {
          subject,  // Same subject as email
          body: { contentType: 'Text', content: message },
          toRecipients: [{ emailAddress: { address: toEmail } }]
        },
        saveToSentItems: true  // Save to sent items so user can verify
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('📱 SMS send failed:', response.status, errorText)
      return false
    }
    
    console.log('📱 SMS sent successfully to:', toEmail)
    return true
  } catch (error) {
    console.error('📱 SMS send error:', error)
    return false
  }
}

// Send email
async function sendEmail(
  accessToken: string,
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  // Always use no-reply for transactional emails
  const fromEmail = 'no-reply@eek.co.nz'
  
  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/users/' + fromEmail + '/sendMail', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: {
          subject,
          body: { contentType: 'HTML', content: html },
          toRecipients: [{ emailAddress: { address: to } }]
        },
        saveToSentItems: true
      })
    })
    
    return response.ok
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      supplierName,
      supplierPhone,
      supplierEmail,
      supplierAddress,
      link,
      rego,
      pickup,
      dropoff,
      price,
      customerName,
      customerPhone,
      method
    } = await request.json()
    
    const accessToken = await getAccessToken()
    
    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: 'Email service not configured'
      }, { status: 500 })
    }
    
    const results = { sms: false, email: false, smsSkipped: '', emailSkipped: '' }
    
    // Subject line (same for SMS and email)
    const subject = `New Job Available - ${rego} | Eek Mechanical`
    
    // Build Google Maps route URL (Current Location → Pickup → Dropoff)
    const buildMapsUrl = () => {
      // Encode address for Google Maps URL
      // - Strip unit numbers (10/152 -> 152) - Google Maps mobile can't handle them reliably
      // - The full address with unit is shown in job details
      const encodeAddress = (addr: string) => {
        if (!addr) return ''
        return addr
          .replace(/^\d+\//, '')  // Remove unit prefix: "10/152 Street" -> "152 Street"
          .replace(/\s+/g, '+')   // spaces -> +
          .replace(/&/g, '%26')   // & -> %26
          .replace(/'/g, '%27')   // ' -> %27
      }
      
      // Start from current location, then pickup, then dropoff
      const pickupEncoded = encodeAddress(pickup)
      const dropoffEncoded = encodeAddress(dropoff)
      
      if (pickupEncoded && dropoffEncoded) {
        // Using empty origin makes Google Maps use current location
        return `https://www.google.com/maps/dir//${pickupEncoded}/${dropoffEncoded}`
      }
      return null
    }
    
    const mapsUrl = buildMapsUrl()
    const mapsLine = mapsUrl ? `\n\nROUTE: ${mapsUrl}` : ''
    
    // SMS message (GSM-7 safe) - includes customer contact
    // Only show pay if price > 0 (otherwise invoiced later)
    const priceNum = parseFloat(price) || 0
    const payLine = priceNum > 0 ? `\nPay: $${price}` : ''
    
    const smsMessage = `Hi ${supplierName || 'there'}

Eek Mechanical has a job for you.
CLICK THE LINK TO ACCEPT.

Rego: ${rego}
Customer: ${customerName || 'See link'}
Ph: ${customerPhone || 'See link'}
Pickup: ${pickup}
Dropoff: ${dropoff}${payLine}

ACCEPT JOB: ${link}${mapsLine}

Reply via the link or call 0800 769 000

Eek Mechanical`
    
    // Send SMS
    if (method === 'sms' || method === 'both') {
      console.log('📱 SMS requested. Phone provided:', supplierPhone, '| Method:', method)
      if (supplierPhone) {
        results.sms = await sendSMS(accessToken, supplierPhone, subject, smsMessage)
        console.log('📱 SMS result:', results.sms ? 'SUCCESS' : 'FAILED')
      } else {
        console.log('⚠️ SMS skipped - no phone number provided')
        results.smsSkipped = 'No phone number'
      }
    }
    
    // Email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 520px; margin: 0 auto; padding: 40px 20px;">
    <!-- Logo -->
    <div style="text-align: center; margin-bottom: 32px;">
      <img src="https://www.eek.co.nz/logo.svg" alt="Eek Mechanical" width="140" height="56" />
      <div style="color: #ef4444; font-size: 13px; font-weight: 600; letter-spacing: 2px; margin-top: 8px;">GET GOING</div>
    </div>
    
    <!-- Badge -->
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="background-color: rgba(249, 115, 22, 0.15); color: #f97316; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; padding: 6px 16px; border-radius: 100px; text-transform: uppercase;">
        New Job Available
      </span>
    </div>
    
    <!-- Greeting -->
    <h2 style="font-size: 24px; font-weight: 700; color: #ffffff; margin: 0 0 12px 0; text-align: center;">
      Hi ${supplierName || 'there'}
    </h2>
    <p style="color: #a1a1aa; font-size: 15px; text-align: center; margin: 0 0 8px 0;">
      Eek Mechanical has a job for you.
    </p>
    <p style="color: #ef4444; font-size: 16px; font-weight: 700; text-align: center; margin: 0 0 28px 0;">
      Click below to ACCEPT the job.
    </p>
    
    <!-- Job Details -->
    <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
      <div style="margin-bottom: 16px;">
        <div style="color: #71717a; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Rego</div>
        <div style="color: #ffffff; font-size: 20px; font-weight: 700;">${rego}</div>
      </div>
      <!-- Customer Contact - highlighted -->
      <div style="background-color: #27272a; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
        <div style="color: #71717a; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;">Customer Contact</div>
        <div style="color: #ffffff; font-size: 14px; font-weight: 600;">${customerName || 'See job details'}</div>
        ${customerPhone ? `<div style="color: #a1a1aa; font-size: 14px; margin-top: 4px;"><a href="tel:${customerPhone}" style="color: #60a5fa; text-decoration: none;">${customerPhone}</a></div>` : ''}
      </div>
      <!-- Route with clickable locations -->
      <div style="background-color: #27272a; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
        <div style="color: #71717a; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;">📍 Route</div>
        
        <!-- Step 1: Your Location -->
        ${supplierAddress ? `
        <div style="display: flex; margin-bottom: 8px;">
          <div style="width: 24px; text-align: center;">
            <span style="display: inline-block; width: 20px; height: 20px; background-color: #f97316; border-radius: 50%; color: white; font-size: 12px; font-weight: 700; line-height: 20px;">A</span>
          </div>
          <div style="flex: 1; margin-left: 12px;">
            <div style="color: #f97316; font-size: 11px; font-weight: 600;">YOUR LOCATION</div>
            <div style="color: #ffffff; font-size: 13px;">${supplierAddress.split(',')[0]}</div>
          </div>
        </div>
        <div style="width: 24px; text-align: center; padding: 4px 0;"><span style="color: #52525b;">↓</span></div>
        ` : ''}
        
        <!-- Step 2: Pickup -->
        <div style="display: flex; margin-bottom: 8px;">
          <div style="width: 24px; text-align: center;">
            <span style="display: inline-block; width: 20px; height: 20px; background-color: #22c55e; border-radius: 50%; color: white; font-size: 12px; font-weight: 700; line-height: 20px;">${supplierAddress ? 'B' : 'A'}</span>
          </div>
          <div style="flex: 1; margin-left: 12px;">
            <div style="color: #22c55e; font-size: 11px; font-weight: 600;">PICKUP</div>
            <div style="color: #ffffff; font-size: 13px;">${pickup}</div>
          </div>
        </div>
        <div style="width: 24px; text-align: center; padding: 4px 0;"><span style="color: #52525b;">↓</span></div>
        
        <!-- Step 3: Drop-off -->
        <div style="display: flex;">
          <div style="width: 24px; text-align: center;">
            <span style="display: inline-block; width: 20px; height: 20px; background-color: #ef4444; border-radius: 50%; color: white; font-size: 12px; font-weight: 700; line-height: 20px;">${supplierAddress ? 'C' : 'B'}</span>
          </div>
          <div style="flex: 1; margin-left: 12px;">
            <div style="color: #ef4444; font-size: 11px; font-weight: 600;">DROP-OFF</div>
            <div style="color: #ffffff; font-size: 13px;">${dropoff}</div>
          </div>
        </div>
        
        <!-- Open in Maps button -->
        ${mapsUrl ? `
        <div style="margin-top: 16px; text-align: center;">
          <a href="${mapsUrl}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px;">
            🗺️ Open Route in Maps
          </a>
        </div>
        ` : ''}
      </div>
      
      ${priceNum > 0 ? `<div style="border-top: 1px solid #27272a; padding-top: 16px;">
        <div style="color: #71717a; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Your Pay</div>
        <div style="color: #22c55e; font-size: 28px; font-weight: 800;">$${price}</div>
      </div>` : ''}
    </div>
    
    <!-- CTA Button -->
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${link}" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 40px; border-radius: 12px;">
        ACCEPT JOB
      </a>
    </div>
    
    <!-- Info -->
    <p style="color: #71717a; font-size: 13px; text-align: center; margin: 0 0 24px 0;">
      Click the link to accept, discuss details, provide bank account, and upload your invoice.
    </p>
    
    <!-- Footer -->
    <div style="border-top: 1px solid #27272a; padding-top: 24px; text-align: center;">
      <p style="color: #52525b; font-size: 12px; margin: 0;">
        Questions? Call us on <a href="tel:0800769000" style="color: #ef4444; text-decoration: none;">0800 769 000</a>
      </p>
    </div>
  </div>
</body>
</html>`
    
    // Send email
    if (method === 'email' || method === 'both') {
      if (supplierEmail) {
        console.log('📧 Sending email to:', supplierEmail)
        results.email = await sendEmail(
          accessToken,
          supplierEmail,
          subject,
          emailHtml
        )
        console.log('📧 Email result:', results.email)
      } else {
        console.log('⚠️ Email skipped - no email address provided')
        results.emailSkipped = 'No email address'
      }
    }
    
    const anySuccess = results.sms || results.email || method === 'link'
    
    console.log('📤 Send results:', { method, anySuccess, results })
    
    return NextResponse.json({
      success: anySuccess,
      results,
      debug: { supplierPhone: !!supplierPhone, supplierEmail: !!supplierEmail, method }
    })
  } catch (error) {
    console.error('Send supplier link error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to send'
    }, { status: 500 })
  }
}
