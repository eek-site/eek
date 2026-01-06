import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { sendInternalNotification } from '@/lib/internal-notifications'
import { generateSupplierCode } from '@/lib/booking-utils'
import { sendAdminNotification, AdminNotifications } from '@/lib/admin-notifications'

/**
 * Direct Job Dispatch API
 * 
 * Use this to bypass the payment flow and directly create/dispatch a job.
 * Useful for:
 * - Cash payments
 * - Trusted customers
 * - Manual job creation from admin
 * 
 * This triggers the same notifications as a paid booking but without Stripe.
 */

// Microsoft Graph API for sending emails/SMS
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

// Send SMS via TNZ gateway
async function sendCustomerSMS(phone: string, bookingId: string, eta: string, accessToken: string): Promise<boolean> {
  const fromEmail = 'no-reply@eek.co.nz'
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.eek.co.nz'
  
  let formattedPhone = phone.replace(/\s+/g, '').replace(/^0/, '64')
  if (!formattedPhone.startsWith('64')) {
    formattedPhone = '64' + formattedPhone.replace(/^\+/, '')
  }
  
  const smsEmail = `${formattedPhone}@sms.tnz.co.nz`
  const portalLink = `${baseUrl}/customer/${bookingId}`
  
  const message = `Eek Mechanical - Confirmed!

Job dispatched, ETA ${eta}

Mechanic will call when nearby.

Track your job: ${portalLink}

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
  const fromEmail = 'no-reply@eek.co.nz'
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.eek.co.nz'
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
      <h1 style="color: #22c55e; font-size: 28px; margin: 0;">Job Confirmed</h1>
      <p style="color: #71717a; margin: 8px 0 0 0;">Eek Mechanical | NZIFDA Certified</p>
    </div>
    
    <div style="background-color: #22c55e20; border: 1px solid #22c55e50; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
      <p style="color: #22c55e; font-size: 14px; margin: 0 0 8px 0;">Estimated Arrival</p>
      <p style="font-size: 32px; font-weight: bold; color: #22c55e; margin: 0;">${eta}</p>
    </div>
    
    <p style="color: #a1a1aa; line-height: 1.6; margin: 0 0 24px 0;">
      Your job has been dispatched! Our mechanic will call you when they are nearby.
    </p>
    
    <div style="background-color: #27272a; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
      <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3f3f46;">
        <span style="color: #71717a; font-size: 12px;">Reference</span>
        <p style="font-family: monospace; font-size: 16px; font-weight: bold; margin: 4px 0 0 0; color: #fff;">${bookingId}</p>
      </div>
      <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3f3f46;">
        <span style="color: #71717a; font-size: 12px;">Vehicle</span>
        <p style="margin: 4px 0 0 0; color: #fff;">${vehicleInfo}</p>
      </div>
      <div>
        <span style="color: #71717a; font-size: 12px;">Location</span>
        <p style="margin: 4px 0 0 0; color: #fff;">${jobData.pickupLocation || 'As discussed'}</p>
      </div>
    </div>
    
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${portalLink}" style="display: inline-block; background: linear-gradient(135deg, #ff5500 0%, #e64a00 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 700; font-size: 16px;">
        💬 Track Job / Message Us
      </a>
    </div>
    
    <div style="background-color: #27272a; border-radius: 12px; padding: 16px; text-align: center;">
      <p style="color: #71717a; font-size: 12px; margin: 0 0 4px 0;">Questions?</p>
      <a href="tel:0800769000" style="color: #ff5500; font-size: 20px; font-weight: bold; text-decoration: none;">0800 769 000</a>
    </div>
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
        subject: `Job Confirmed - ${bookingId} - Eek Mechanical`,
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
    const { 
      // Job details
      bookingId,
      vehicleRego,
      vehicleMake,
      vehicleModel,
      vehicleColor,
      vehicleYear,
      // Customer
      customerName,
      customerPhone,
      customerEmail,
      // Location
      pickupLocation,
      dropoffLocation,
      // Job info
      issueType,
      eta,
      price,
      // Supplier (optional - if pre-assigned)
      supplierName,
      supplierPhone,
      supplierEmail,
      supplierAddress,
      supplierPrice,
      // Options
      sendCustomerNotifications = true,
      sendSupplierNotifications = true,
      paymentMethod = 'cash', // 'cash', 'invoice', 'prepaid', 'account'
      createdBy = 'admin'
    } = body
    
    // Generate booking ID if not provided
    const jobBookingId = bookingId || `EEK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    const rego = vehicleRego?.toUpperCase() || ''
    
    console.log('🚀 DIRECT JOB DISPATCH:', {
      bookingId: jobBookingId,
      rego,
      customerName,
      customerPhone,
      pickupLocation,
      supplierName,
      paymentMethod
    })
    
    // Create job record
    const jobData: Record<string, unknown> = {
      bookingId: jobBookingId,
      rego,
      customerName: customerName || '',
      customerPhone: customerPhone || '',
      customerEmail: customerEmail || '',
      pickupLocation: pickupLocation || '',
      dropoffLocation: dropoffLocation || '',
      price: price || 0,
      eta: eta || '30 mins',
      issueType: issueType || 'Misfuel',
      vehicleMake: vehicleMake || '',
      vehicleModel: vehicleModel || '',
      vehicleColor: vehicleColor || '',
      vehicleYear: vehicleYear || '',
      status: supplierName ? 'awaiting_supplier' : 'booked',
      paymentMethod,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy,
      history: [{
        action: 'direct_dispatch',
        timestamp: new Date().toISOString(),
        by: createdBy,
        data: { paymentMethod, price }
      }]
    }
    
    // Add supplier info if provided
    if (supplierName) {
      jobData.supplierName = supplierName
      jobData.supplierPhone = supplierPhone || ''
      jobData.supplierEmail = supplierEmail || ''
      jobData.supplierAddress = supplierAddress || ''
      jobData.supplierPrice = supplierPrice || 0
    }
    
    // Store job in KV
    await kv.hset(`job:${jobBookingId}`, jobData)
    await kv.lpush('jobs:list', jobBookingId)
    
    // Create rego index
    if (rego) {
      await kv.lpush(`rego:${rego}:jobs`, jobBookingId)
    }
    
    console.log('✅ Job created:', jobBookingId)
    
    const results: Record<string, boolean> = {
      jobCreated: true,
      customerSms: false,
      customerEmail: false,
      supplierNotified: false,
      internalNotification: false
    }
    
    const accessToken = await getGraphAccessToken()
    
    if (accessToken) {
      // Send customer notifications
      if (sendCustomerNotifications) {
        if (customerPhone) {
          results.customerSms = await sendCustomerSMS(
            customerPhone,
            jobBookingId,
            eta || '30 mins',
            accessToken
          )
          console.log('📱 Customer SMS:', results.customerSms)
        }
        
        if (customerEmail) {
          results.customerEmail = await sendCustomerEmail(
            customerEmail,
            customerName || 'Customer',
            jobBookingId,
            eta || '30 mins',
            jobData,
            accessToken
          )
          console.log('📧 Customer Email:', results.customerEmail)
        }
      }
      
      // Send supplier notification if assigned
      if (sendSupplierNotifications && supplierName && (supplierPhone || supplierEmail)) {
        try {
          const code = generateSupplierCode()
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.eek.co.nz'
          const supplierLink = `${baseUrl}/supplier/${code}`
          
          // Store supplier link
          await kv.hset(`supplier-link:${code}`, {
            code,
            bookingId: jobBookingId,
            rego,
            supplierName,
            supplierPhone: supplierPhone || '',
            supplierEmail: supplierEmail || '',
            customerName: customerName || '',
            customerPhone: customerPhone || '',
            pickup: pickupLocation || '',
            dropoff: dropoffLocation || '',
            price: supplierPrice || 0,
            status: 'pending',
            createdAt: new Date().toISOString()
          })
          
          // Send to supplier
          const sendMethod = (supplierPhone && supplierEmail) ? 'both' : (supplierPhone ? 'sms' : 'email')
          
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
              pickup: pickupLocation || '',
              dropoff: dropoffLocation || '',
              price: supplierPrice || 0,
              customerName: customerName || '',
              customerPhone: customerPhone || '',
              method: sendMethod
            })
          })
          
          const supplierResult = await supplierResponse.json()
          results.supplierNotified = supplierResult.success
          console.log('📤 Supplier notified:', supplierResult)
          
          // Update job history
          const history = jobData.history as Array<Record<string, unknown>>
          history.push({
            action: 'sent_to_supplier',
            timestamp: new Date().toISOString(),
            by: 'system',
            data: { supplierName, sendMethod, result: supplierResult.success }
          })
          await kv.hset(`job:${jobBookingId}`, { history })
          
        } catch (supplierError) {
          console.error('Failed to notify supplier:', supplierError)
        }
      }
      
      // Send internal notification
      try {
        await sendInternalNotification({
          type: 'direct_dispatch',
          bookingId: jobBookingId,
          customerName,
          customerPhone,
          customerEmail,
          vehicleRego: rego,
          vehicleMake,
          vehicleModel,
          vehicleColour: vehicleColor,
          vehicleYear,
          pickupLocation,
          dropoffLocation,
          eta,
          price,
          paymentMethod
        })
        results.internalNotification = true
      } catch (e) {
        console.error('Internal notification failed:', e)
      }
      
      // Admin push notification
      try {
        await sendAdminNotification(
          AdminNotifications.newJob(
            rego || jobBookingId,
            pickupLocation?.split(',')[0] || 'New job dispatched'
          )
        )
      } catch (e) {
        console.error('Admin push failed:', e)
      }
    }
    
    return NextResponse.json({
      success: true,
      bookingId: jobBookingId,
      status: jobData.status,
      results
    })
    
  } catch (error) {
    console.error('Dispatch job error:', error)
    return NextResponse.json(
      { error: 'Failed to dispatch job' },
      { status: 500 }
    )
  }
}

// GET endpoint to check job status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')
    
    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId required' }, { status: 400 })
    }
    
    const job = await kv.hgetall(`job:${bookingId}`)
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, job })
  } catch (error) {
    console.error('Get job error:', error)
    return NextResponse.json({ error: 'Failed to get job' }, { status: 500 })
  }
}
