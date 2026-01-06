import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

// Microsoft Graph API - get access token
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

// Send email via Microsoft Graph
async function sendEmail(
  accessToken: string,
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  // Always use no-reply for transactional emails
  const fromEmail = 'no-reply@eek.co.nz'
  
  try {
    const response = await fetch(`https://graph.microsoft.com/v1.0/users/${fromEmail}/sendMail`, {
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
  } catch (e) {
    console.error('Email send error:', e)
    return false
  }
}

// Send SMS via TNZ gateway
async function sendSMS(
  accessToken: string,
  phone: string,
  subject: string,
  message: string
): Promise<boolean> {
  // Always use no-reply for transactional emails
  const fromEmail = 'no-reply@eek.co.nz'
  
  // Format for TNZ: remove +64, remove leading 0, add @sms.tnz.co.nz
  let smsNumber = phone.replace(/\s+/g, '').replace(/[()-]/g, '')
  if (smsNumber.startsWith('+64')) {
    smsNumber = smsNumber.substring(3)
  } else if (smsNumber.startsWith('64')) {
    smsNumber = smsNumber.substring(2)
  }
  if (smsNumber.startsWith('0')) {
    smsNumber = smsNumber.substring(1)
  }
  
  const smsEmail = `${smsNumber}@sms.tnz.co.nz`
  console.log(`📱 Sending SMS to: ${smsEmail}`)
  
  try {
    const response = await fetch(`https://graph.microsoft.com/v1.0/users/${fromEmail}/sendMail`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: {
          subject,
          body: { contentType: 'Text', content: message },
          toRecipients: [{ emailAddress: { address: smsEmail } }]
        },
        saveToSentItems: true
      })
    })
    
    console.log(`📱 SMS response status: ${response.status}`)
    return response.ok
  } catch (e) {
    console.error('SMS send error:', e)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const { bookingId, reason, cancelledBy } = await request.json()
    
    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'Booking ID required' }, { status: 400 })
    }
    
    // Get job details - try by bookingId first, then by rego for legacy jobs
    let job = await kv.hgetall(`job:${bookingId}`)
    let jobKey = `job:${bookingId}`
    
    // If not found, try looking up by rego (legacy jobs)
    if (!job) {
      // Check if bookingId might actually be a rego
      const regoJobs = await kv.lrange(`rego:${bookingId}:jobs`, 0, 0)
      if (regoJobs && regoJobs.length > 0) {
        const latestBookingId = regoJobs[0]
        job = await kv.hgetall(`job:${latestBookingId}`)
        jobKey = `job:${latestBookingId}`
      }
    }
    
    // Also try booking: prefix (another legacy format)
    if (!job) {
      job = await kv.hgetall(`booking:${bookingId}`)
      jobKey = `booking:${bookingId}`
    }
    
    if (!job) {
      console.log('❌ Job not found for:', bookingId)
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 })
    }
    
    console.log('✅ Found job:', jobKey)
    
    // Update job status using the correct key
    await kv.hset(jobKey, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancelledBy: cancelledBy || 'admin',
      cancelReason: reason || ''
    })
    
    // Get access token for sending notifications
    const accessToken = await getAccessToken()
    
    const notifications: {
      customer?: { sms?: boolean; email?: boolean }
      supplier?: { sms?: boolean; email?: boolean }
    } = {}
    
    const rego = job.rego as string || ''
    const customerName = job.customerName as string || 'Customer'
    const customerPhone = job.customerPhone as string || ''
    const customerEmail = job.customerEmail as string || ''
    const supplierName = job.supplierName as string || ''
    const supplierPhone = job.supplierPhone as string || ''
    const supplierMobile = job.supplierMobile as string || ''
    const supplierEmail = job.supplierEmail as string || ''
    const pickupLocation = job.pickupLocation as string || ''
    
    const subject = `Job Cancelled - ${rego} | Eek Mechanical`
    const reasonText = reason ? `\nReason: ${reason}` : ''
    
    if (accessToken) {
      // ===== CUSTOMER NOTIFICATIONS =====
      if (customerPhone || customerEmail) {
        notifications.customer = {}
        
        // Customer SMS
        if (customerPhone) {
          const customerSmsMessage = `Hi ${customerName}

Your towing booking has been cancelled.

Rego: ${rego}
Pickup: ${pickupLocation}${reasonText}

We apologise for any inconvenience. If you need assistance, please call us on 0800 769 000 or visit eek.co.nz to rebook.

Eek Mechanical`

          notifications.customer.sms = await sendSMS(accessToken, customerPhone, subject, customerSmsMessage)
        }
        
        // Customer Email
        if (customerEmail) {
          const customerEmailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background-color: #09090b; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px;">
  <div style="max-width: 500px; margin: 0 auto; background-color: #18181b; border-radius: 16px; padding: 32px; border: 1px solid #27272a;">
    <div style="text-align: center; margin-bottom: 24px;">
      <img src="https://eek.co.nz/logo.svg" alt="Eek Mechanical" style="height: 40px;" />
    </div>
    
    <h1 style="color: #ef4444; font-size: 24px; margin: 0 0 16px 0; text-align: center;">Booking Cancelled</h1>
    
    <p style="color: #a1a1aa; margin: 0 0 24px 0; text-align: center;">
      Your towing booking has been cancelled.
    </p>
    
    <div style="background-color: #27272a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <div style="margin-bottom: 16px;">
        <div style="color: #71717a; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Vehicle</div>
        <div style="color: #ffffff; font-size: 18px; font-weight: 700;">${rego}</div>
      </div>
      <div style="margin-bottom: 16px;">
        <div style="color: #71717a; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Pickup Location</div>
        <div style="color: #ffffff; font-size: 14px;">${pickupLocation}</div>
      </div>
      ${reason ? `<div>
        <div style="color: #71717a; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Reason</div>
        <div style="color: #ffffff; font-size: 14px;">${reason}</div>
      </div>` : ''}
    </div>
    
    <p style="color: #a1a1aa; text-align: center; margin: 0 0 24px 0;">
      We apologise for any inconvenience. If you need assistance, please contact us.
    </p>
    
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="https://eek.co.nz/book-service" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 12px;">
        Rebook Service
      </a>
    </div>
    
    <div style="border-top: 1px solid #27272a; padding-top: 20px; text-align: center;">
      <p style="color: #52525b; font-size: 12px; margin: 0;">
        Questions? Call us on <a href="tel:0800769000" style="color: #ef4444; text-decoration: none;">0800 769 000</a>
      </p>
    </div>
  </div>
</body>
</html>`

          notifications.customer.email = await sendEmail(accessToken, customerEmail, subject, customerEmailHtml)
        }
      }
      
      // ===== SUPPLIER NOTIFICATIONS =====
      if (supplierName && (supplierPhone || supplierMobile || supplierEmail)) {
        notifications.supplier = {}
        
        // Supplier SMS (prefer mobile)
        const smsPhone = supplierMobile || supplierPhone
        if (smsPhone) {
          const supplierSmsMessage = `Hi ${supplierName}

A job you were assigned has been CANCELLED.

Rego: ${rego}
Pickup: ${pickupLocation}${reasonText}

No action required. Thank you for your understanding.

Eek Mechanical
0800 769 000`

          notifications.supplier.sms = await sendSMS(accessToken, smsPhone, subject, supplierSmsMessage)
        }
        
        // Supplier Email
        if (supplierEmail) {
          const supplierEmailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background-color: #09090b; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px;">
  <div style="max-width: 500px; margin: 0 auto; background-color: #18181b; border-radius: 16px; padding: 32px; border: 1px solid #27272a;">
    <div style="text-align: center; margin-bottom: 24px;">
      <img src="https://eek.co.nz/logo.svg" alt="Eek Mechanical" style="height: 40px;" />
    </div>
    
    <h1 style="color: #ef4444; font-size: 24px; margin: 0 0 16px 0; text-align: center;">Job Cancelled</h1>
    
    <p style="color: #a1a1aa; margin: 0 0 24px 0; text-align: center;">
      The following job has been cancelled. No further action is required.
    </p>
    
    <div style="background-color: #27272a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <div style="margin-bottom: 16px;">
        <div style="color: #71717a; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Vehicle</div>
        <div style="color: #ffffff; font-size: 18px; font-weight: 700;">${rego}</div>
      </div>
      <div style="margin-bottom: 16px;">
        <div style="color: #71717a; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Pickup Location</div>
        <div style="color: #ffffff; font-size: 14px;">${pickupLocation}</div>
      </div>
      ${reason ? `<div>
        <div style="color: #71717a; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Reason</div>
        <div style="color: #ffffff; font-size: 14px;">${reason}</div>
      </div>` : ''}
    </div>
    
    <p style="color: #71717a; text-align: center; font-size: 13px; margin: 0 0 24px 0;">
      Thank you for your understanding. We'll be in touch with new opportunities soon.
    </p>
    
    <div style="border-top: 1px solid #27272a; padding-top: 20px; text-align: center;">
      <p style="color: #52525b; font-size: 12px; margin: 0;">
        Questions? Call us on <a href="tel:0800769000" style="color: #ef4444; text-decoration: none;">0800 769 000</a>
      </p>
    </div>
  </div>
</body>
</html>`

          notifications.supplier.email = await sendEmail(accessToken, supplierEmail, subject, supplierEmailHtml)
        }
      }
    }
    
    console.log('✅ Job cancelled:', bookingId, 'Notifications:', notifications)
    
    return NextResponse.json({
      success: true,
      bookingId,
      notifications
    })
    
  } catch (error) {
    console.error('Cancel job error:', error)
    return NextResponse.json({ success: false, error: 'Failed to cancel job' }, { status: 500 })
  }
}
