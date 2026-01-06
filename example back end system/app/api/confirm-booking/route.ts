import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { sendInternalNotification } from '@/lib/internal-notifications'
import { generateSupplierCode } from '@/lib/booking-utils'
import { sendAdminNotification, AdminNotifications } from '@/lib/admin-notifications'

// Microsoft Graph API for sending emails
async function getGraphAccessToken(): Promise<string | null> {
  const tenantId = process.env.MS_TENANT_ID
  const clientId = process.env.MS_CLIENT_ID
  const clientSecret = process.env.MS_CLIENT_SECRET
  
  if (!tenantId || !clientId || !clientSecret) {
    console.error('Missing Microsoft Graph credentials')
    return null
  }
  
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
  
  if (!response.ok) {
    console.error('Failed to get Graph access token:', await response.text())
    return null
  }
  
  const data = await response.json()
  return data.access_token
}

// Send SMS via TNZ email-to-SMS gateway (GSM-7 safe)
async function sendCustomerSMS(phone: string, bookingId: string, eta: string, accessToken: string): Promise<boolean> {
  // Always use no-reply for transactional emails
  const fromEmail = 'no-reply@eek.co.nz'
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.eek.co.nz'
  
  // Format phone for TNZ gateway
  let formattedPhone = phone.replace(/\s+/g, '').replace(/^0/, '64')
  if (!formattedPhone.startsWith('64')) {
    formattedPhone = '64' + formattedPhone.replace(/^\+/, '')
  }
  
  const smsEmail = `${formattedPhone}@sms.tnz.co.nz`
  
  // Customer portal link for messaging
  const portalLink = `${baseUrl}/customer/${bookingId}`
  
  // GSM-7 safe message - no special characters, clean and concise
  const message = `Eek Mechanical - Confirmed!

Tow truck on the way, ETA ${eta}

Driver will call when nearby.

Questions or updates: ${portalLink}

0800 769 000`

  const sendUrl = `https://graph.microsoft.com/v1.0/users/${fromEmail}/sendMail`
  
  const response = await fetch(sendUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: {
        subject: 'Eek Mechanical',
        body: { contentType: 'Text', content: message },
        toRecipients: [{ emailAddress: { address: smsEmail } }]
      },
      saveToSentItems: true
    })
  })
  
  if (!response.ok) {
    console.error('SMS send failed:', await response.text())
    return false
  }
  
  return true
}

// Send customer confirmation email
async function sendCustomerEmail(email: string, name: string, bookingId: string, eta: string, jobData: Record<string, unknown>, accessToken: string): Promise<boolean> {
  // Always use no-reply for transactional emails
  const fromEmail = 'no-reply@eek.co.nz'
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.eek.co.nz'
  
  // Customer portal link for messaging
  const portalLink = `${baseUrl}/customer/${bookingId}`
  
  const vehicleInfo = jobData.vehicleMake 
    ? `${jobData.vehicleColor || ''} ${jobData.vehicleMake} ${jobData.vehicleModel}`.trim()
    : jobData.vehicleRego as string || 'Your vehicle'
  
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #000; color: #fff; padding: 40px 20px; margin: 0;">
  <div style="max-width: 500px; margin: 0 auto; background-color: #18181b; border-radius: 16px; padding: 32px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #22c55e; font-size: 28px; margin: 0;">Booking Confirmed</h1>
      <p style="color: #71717a; margin: 8px 0 0 0;">Eek Mechanical | Get Going</p>
    </div>
    
    <div style="background-color: #22c55e20; border: 1px solid #22c55e50; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
      <p style="color: #22c55e; font-size: 14px; margin: 0 0 8px 0;">Estimated Arrival</p>
      <p style="font-size: 32px; font-weight: bold; color: #22c55e; margin: 0;">${eta}</p>
    </div>
    
    <h2 style="font-size: 18px; margin: 0 0 16px 0;">Hi there</h2>
    
    <p style="color: #a1a1aa; line-height: 1.6; margin: 0 0 24px 0;">
      Your tow truck is on the way! The driver will call you when they are nearby to confirm your exact location.
    </p>
    
    <div style="background-color: #27272a; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
      <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3f3f46;">
        <span style="color: #71717a; font-size: 12px;">Booking Reference</span>
        <p style="font-family: monospace; font-size: 16px; font-weight: bold; margin: 4px 0 0 0; color: #fff;">${bookingId}</p>
      </div>
      <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3f3f46;">
        <span style="color: #71717a; font-size: 12px;">Vehicle</span>
        <p style="margin: 4px 0 0 0; color: #fff;">${vehicleInfo}</p>
      </div>
      <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3f3f46;">
        <span style="color: #71717a; font-size: 12px;">Pickup</span>
        <p style="margin: 4px 0 0 0; color: #fff;">${jobData.pickupLocation || 'As discussed'}</p>
      </div>
      ${jobData.dropoffLocation ? `
      <div>
        <span style="color: #71717a; font-size: 12px;">Drop-off</span>
        <p style="margin: 4px 0 0 0; color: #fff;">${jobData.dropoffLocation}</p>
      </div>
      ` : ''}
    </div>
    
    <!-- Message Us Button -->
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${portalLink}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 700; font-size: 16px;">
        💬 Questions? Message Us
      </a>
      <p style="color: #71717a; font-size: 12px; margin: 12px 0 0 0;">
        Track your booking or send us a message
      </p>
    </div>
    
    <div style="background-color: #27272a; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
      <p style="color: #71717a; font-size: 12px; margin: 0 0 4px 0;">Need to call?</p>
      <a href="tel:0800769000" style="color: #ef4444; font-size: 20px; font-weight: bold; text-decoration: none;">0800 769 000</a>
      <p style="color: #71717a; font-size: 12px; margin: 8px 0 0 0;">Available 24/7</p>
    </div>
    
    <p style="color: #71717a; font-size: 12px; text-align: center; margin: 0;">
      Thanks for choosing Eek Mechanical
    </p>
  </div>
</body>
</html>`

  const sendUrl = `https://graph.microsoft.com/v1.0/users/${fromEmail}/sendMail`
  
  const response = await fetch(sendUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: {
        subject: `Booking Confirmed - ${bookingId} - Eek Mechanical`,
        body: { contentType: 'HTML', content: html },
        toRecipients: [{ emailAddress: { address: email } }]
      },
      saveToSentItems: true
    })
  })
  
  if (!response.ok) {
    console.error('Email send failed:', await response.text())
    return false
  }
  
  return true
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobData } = body
    
    if (!jobData || !jobData.bookingId) {
      return NextResponse.json({ error: 'Missing job data' }, { status: 400 })
    }
    
    console.log('📧 Sending booking confirmations for:', jobData.bookingId)
    
    // Save/update job in database if we have a rego
    if (jobData.vehicleRego) {
      const rego = jobData.vehicleRego.toUpperCase()
      
      try {
        // Check if job exists - always by bookingId (unique per job)
        let existingJob = await kv.hgetall(`job:${jobData.bookingId}`)
        let jobKey = `job:${jobData.bookingId}`
        
        // Search jobs list for legacy jobs that might be keyed differently
        if (!existingJob) {
          const jobsList = await kv.lrange('jobs:list', 0, 100) as string[]
          for (const id of jobsList) {
            const j = await kv.hgetall(`job:${id}`) as Record<string, unknown> | null
            if (j && j.bookingId === jobData.bookingId) {
              existingJob = j
              jobKey = `job:${id}`
              break
            }
          }
        }
        
        let updatedJob: Record<string, unknown> = {}
        
        if (existingJob) {
          // Update existing job with payment info
          const history = (existingJob.history as Array<Record<string, unknown>>) || []
          history.push({
            action: 'payment_completed',
            timestamp: new Date().toISOString(),
            by: 'customer',
            data: { transactionId: jobData.transactionId, amount: jobData.value }
          })
          
          // Determine status: if supplier already assigned, go straight to awaiting_supplier
          const hasSupplier = existingJob.supplierName && String(existingJob.supplierName).trim() !== ''
          const newStatus = hasSupplier ? 'awaiting_supplier' : 'booked'
          
          updatedJob = {
            ...existingJob,
            status: newStatus,
            customerName: jobData.customerName || existingJob.customerName,
            customerPhone: jobData.customerPhone || existingJob.customerPhone,
            customerEmail: jobData.customerEmail || existingJob.customerEmail,
            vehicleMake: jobData.vehicleMake || existingJob.vehicleMake,
            vehicleModel: jobData.vehicleModel || existingJob.vehicleModel,
            vehicleColor: jobData.vehicleColor || existingJob.vehicleColor,
            vehicleYear: jobData.vehicleYear || existingJob.vehicleYear,
            updatedAt: new Date().toISOString(),
            history
          }
          
          await kv.hset(jobKey, updatedJob)
          console.log('Updated existing job:', rego, '| Status:', newStatus, '| Has supplier:', hasSupplier)
          
          // If supplier already assigned, automatically send them the job notification
          if (hasSupplier) {
            try {
              const supplierName = String(existingJob.supplierName)
              const supplierPhone = existingJob.supplierPhoneLandline 
                ? String(existingJob.supplierMobile || '') 
                : String(existingJob.supplierPhone || existingJob.supplierMobile || '')
              const supplierEmail = String(existingJob.supplierEmail || '')
              const supplierAddress = String(existingJob.supplierAddress || '')
              const supplierPrice = existingJob.supplierPrice || 0
              
              // Generate supplier link code
              const code = generateSupplierCode()
              const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.eek.co.nz'
              const supplierLink = `${baseUrl}/supplier/${code}`
              
              // Store supplier job link
              await kv.hset(`supplier-link:${code}`, {
                code,
                bookingId: jobData.bookingId,
                rego: rego,
                supplierName,
                supplierPhone: existingJob.supplierPhone || '',
                supplierMobile: existingJob.supplierMobile || '',
                supplierEmail,
                customerName: jobData.customerName || existingJob.customerName || '',
                customerPhone: jobData.customerPhone || existingJob.customerPhone || '',
                pickup: jobData.pickupLocation || existingJob.pickupLocation || '',
                dropoff: jobData.dropoffLocation || existingJob.dropoffLocation || '',
                price: supplierPrice,
                status: 'pending',
                createdAt: new Date().toISOString()
              })
              
              // Send notification to supplier
              const sendMethod = (supplierPhone && supplierEmail) ? 'both' : (supplierPhone ? 'sms' : 'email')
              
              if (supplierPhone || supplierEmail) {
                const supplierResponse = await fetch(`${baseUrl}/api/send-supplier-link`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    supplierName,
                    supplierPhone,
                    supplierEmail,
                    supplierAddress,
                    link: supplierLink,
                    rego,
                    pickup: jobData.pickupLocation || existingJob.pickupLocation || '',
                    dropoff: jobData.dropoffLocation || existingJob.dropoffLocation || '',
                    price: supplierPrice,
                    customerName: jobData.customerName || existingJob.customerName || '',
                    customerPhone: jobData.customerPhone || existingJob.customerPhone || '',
                    method: sendMethod
                  })
                })
                
                const supplierResult = await supplierResponse.json()
                console.log('📤 Auto-sent to supplier:', supplierName, supplierResult)
                
                // Add to history
                const historyUpdate = [...(updatedJob.history as Array<Record<string, unknown>>)]
                historyUpdate.push({
                  action: 'auto_sent_to_supplier',
                  timestamp: new Date().toISOString(),
                  by: 'system',
                  data: { supplierName, sendMethod, result: supplierResult.success }
                })
                await kv.hset(jobKey, { history: historyUpdate })
              }
            } catch (supplierError) {
              console.error('Failed to auto-send to supplier:', supplierError)
              // Don't fail the confirmation - supplier can be contacted manually
            }
          }
        } else {
          // Create new job
          const newJob = {
            rego,
            bookingId: jobData.bookingId,
            customerName: jobData.customerName || '',
            customerPhone: jobData.customerPhone || '',
            customerEmail: jobData.customerEmail || '',
            pickupLocation: jobData.pickupLocation || '',
            dropoffLocation: jobData.dropoffLocation || '',
            price: jobData.value || 0,
            eta: jobData.eta || '30 mins',
            issueType: jobData.issueType || 'Tow',
            vehicleMake: jobData.vehicleMake || '',
            vehicleModel: jobData.vehicleModel || '',
            vehicleColor: jobData.vehicleColor || '',
            vehicleYear: jobData.vehicleYear || '',
            status: 'booked',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'customer_payment',
            history: [{
              action: 'created_from_payment',
              timestamp: new Date().toISOString(),
              by: 'customer',
              data: { transactionId: jobData.transactionId, amount: jobData.value }
            }]
          }
          
          // Store by bookingId (unique per job, not rego which can have multiple jobs)
          const jobKey = jobData.bookingId || `HT-${Date.now()}`
          await kv.hset(`job:${jobKey}`, newJob)
          await kv.lpush('jobs:list', jobKey)
          console.log('Created new job from payment:', jobKey, 'rego:', rego)
        }
      } catch (dbError) {
        console.error('Database error saving job:', dbError)
        // Continue anyway - don't fail the confirmation
      }
    }
    
    const accessToken = await getGraphAccessToken()
    
    const results = {
      customerSms: false,
      customerEmail: false,
      internalNotification: false
    }
    
    if (accessToken) {
      // Send SMS to customer
      if (jobData.customerPhone) {
        results.customerSms = await sendCustomerSMS(
          jobData.customerPhone,
          jobData.bookingId,
          jobData.eta || '30 mins',
          accessToken
        )
        console.log('SMS result:', results.customerSms)
      }
      
      // Send email to customer
      if (jobData.customerEmail) {
        results.customerEmail = await sendCustomerEmail(
          jobData.customerEmail,
          jobData.customerName || 'Customer',
          jobData.bookingId,
          jobData.eta || '30 mins',
          jobData,
          accessToken
        )
        console.log('Email result:', results.customerEmail)
      }
      
      // Send internal notification to Eek Mechanical
      try {
        await sendInternalNotification({
          type: 'payment_completed',
          bookingId: jobData.bookingId,
          transactionId: jobData.transactionId,
          customerName: jobData.customerName,
          customerPhone: jobData.customerPhone,
          customerEmail: jobData.customerEmail,
          vehicleRego: jobData.vehicleRego,
          vehicleMake: jobData.vehicleMake,
          vehicleModel: jobData.vehicleModel,
          vehicleColour: jobData.vehicleColor,
          vehicleYear: jobData.vehicleYear,
          vehicleVin: jobData.vehicleVin,
          pickupLocation: jobData.pickupLocation,
          dropoffLocation: jobData.dropoffLocation,
          eta: jobData.eta,
          price: jobData.value
        })
        results.internalNotification = true
        console.log('Internal notification sent')
      } catch (e) {
        console.error('Internal notification failed:', e)
      }
      
      // Send push notification to admins
      try {
        await sendAdminNotification(
          AdminNotifications.newJob(
            jobData.vehicleRego || jobData.bookingId,
            jobData.pickupLocation?.split(',')[0] || 'New booking'
          )
        )
      } catch (e) {
        console.error('Failed to send admin push notification:', e)
      }
    } else {
      console.log('No Graph access token - running in demo mode')
    }
    
    return NextResponse.json({
      success: true,
      results
    })
    
  } catch (error) {
    console.error('Confirm booking error:', error)
    return NextResponse.json(
      { error: 'Failed to send confirmations' },
      { status: 500 }
    )
  }
}
