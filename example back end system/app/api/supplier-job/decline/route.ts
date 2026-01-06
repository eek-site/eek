import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { sendAdminNotification, AdminNotifications } from '@/lib/admin-notifications'

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
    
    return response.ok
  } catch (e) {
    console.error('SMS send error:', e)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ref, reason } = await request.json()
    
    if (!ref) {
      return NextResponse.json({ success: false, error: 'Reference required' }, { status: 400 })
    }
    
    // Get supplier job details
    const supplierJob = await kv.hgetall(`supplier-job:${ref}`)
    
    if (!supplierJob) {
      return NextResponse.json({ success: false, error: 'Supplier job not found' }, { status: 404 })
    }
    
    const supplierName = supplierJob.supplierName as string || ''
    const rego = supplierJob.rego as string || ''
    const bookingId = supplierJob.bookingId as string || ''
    const pickup = supplierJob.pickup as string || ''
    const dropoff = supplierJob.dropoff as string || ''
    const price = supplierJob.price as number || 0
    const customerName = supplierJob.customerName as string || ''
    
    // Update supplier job status to declined
    await kv.hset(`supplier-job:${ref}`, {
      status: 'declined',
      declinedAt: new Date().toISOString(),
      declineReason: reason || ''
    })
    
    // Update main job status back to booked (so it can be reallocated)
    // Customer has already paid, so status should be 'booked' not 'pending'
    // Use bookingId as primary key (not rego)
    if (bookingId) {
      await kv.hset(`job:${bookingId}`, {
        status: 'booked',
        supplierName: '', // Clear supplier
        supplierDeclined: supplierName,
        supplierDeclinedAt: new Date().toISOString(),
        supplierDeclineReason: reason || ''
      })
    }
    
    // Send notification to Eek Mechanical admin
    const accessToken = await getAccessToken()
    let notificationSent = false
    
    if (accessToken) {
      const adminEmail = 'operations@eek.co.nz'
      const subject = `⚠️ Job Declined - ${rego} | ${supplierName}`
      const reasonText = reason ? `\nReason: ${reason}` : ''
      
      // Admin Email
      const adminEmailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background-color: #09090b; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px;">
  <div style="max-width: 500px; margin: 0 auto; background-color: #18181b; border-radius: 16px; padding: 32px; border: 1px solid #f97316;">
    <div style="text-align: center; margin-bottom: 24px;">
      <img src="https://eek.co.nz/logo.svg" alt="Eek Mechanical" style="height: 40px;" />
    </div>
    
    <h1 style="color: #f97316; font-size: 24px; margin: 0 0 16px 0; text-align: center;">⚠️ Job Declined</h1>
    
    <p style="color: #a1a1aa; margin: 0 0 24px 0; text-align: center;">
      A supplier has declined a job. Action required to reallocate.
    </p>
    
    <div style="background-color: #27272a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <div style="margin-bottom: 16px;">
        <div style="color: #71717a; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Declined By</div>
        <div style="color: #f97316; font-size: 18px; font-weight: 700;">${supplierName}</div>
      </div>
      ${reason ? `<div style="margin-bottom: 16px;">
        <div style="color: #71717a; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Reason</div>
        <div style="color: #ffffff; font-size: 14px;">${reason}</div>
      </div>` : ''}
      <div style="margin-bottom: 16px;">
        <div style="color: #71717a; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Vehicle</div>
        <div style="color: #ffffff; font-size: 18px; font-weight: 700;">${rego}</div>
      </div>
      <div style="margin-bottom: 16px;">
        <div style="color: #71717a; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Customer</div>
        <div style="color: #ffffff; font-size: 14px;">${customerName || 'N/A'}</div>
      </div>
      <div style="margin-bottom: 16px;">
        <div style="color: #71717a; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Pickup</div>
        <div style="color: #ffffff; font-size: 14px;">${pickup}</div>
      </div>
      <div style="margin-bottom: 16px;">
        <div style="color: #71717a; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Drop-off</div>
        <div style="color: #ffffff; font-size: 14px;">${dropoff}</div>
      </div>
      ${price ? `<div>
        <div style="color: #71717a; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Supplier Price</div>
        <div style="color: #22c55e; font-size: 20px; font-weight: 700;">$${(price / 100).toFixed(2)}</div>
      </div>` : ''}
    </div>
    
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="https://eek.co.nz/admin?tab=supplier&rego=${encodeURIComponent(rego)}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 12px;">
        Reallocate Job
      </a>
    </div>
    
    <p style="color: #71717a; text-align: center; font-size: 13px; margin: 0;">
      The job status has been set back to "Pending" and can be assigned to another supplier.
    </p>
  </div>
</body>
</html>`

      notificationSent = await sendEmail(accessToken, adminEmail, subject, adminEmailHtml)
      
      // Also send SMS to admin
      const adminSmsMessage = `⚠️ JOB DECLINED

${supplierName} declined job ${rego}${reasonText}

Pickup: ${pickup}

Please reallocate ASAP.

https://eek.co.nz/admin?tab=supplier&rego=${encodeURIComponent(rego)}`

      await sendSMS(accessToken, '0277740405', subject, adminSmsMessage)
    }
    
    // Send push notification to admins
    try {
      await sendAdminNotification(
        AdminNotifications.supplierDeclined(rego, supplierName, reason)
      )
    } catch (e) {
      console.error('Failed to send admin notification:', e)
    }
    
    console.log('✅ Job declined:', ref, 'by', supplierName)
    
    return NextResponse.json({
      success: true,
      ref,
      notificationSent
    })
    
  } catch (error) {
    console.error('Decline job error:', error)
    return NextResponse.json({ success: false, error: 'Failed to decline job' }, { status: 500 })
  }
}
