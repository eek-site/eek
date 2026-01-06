import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

/**
 * Send customer invoice email when job is completed
 */

const MS_TENANT_ID = process.env.MS_TENANT_ID || ''
const MS_CLIENT_ID = process.env.MS_CLIENT_ID || ''
const MS_CLIENT_SECRET = process.env.MS_CLIENT_SECRET || ''
const MS_FROM_EMAIL = 'no-reply@eek.co.nz'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.eek.co.nz'

async function getMicrosoftToken(): Promise<string | null> {
  if (!MS_TENANT_ID || !MS_CLIENT_ID || !MS_CLIENT_SECRET) return null
  
  try {
    const response = await fetch(
      `https://login.microsoftonline.com/${MS_TENANT_ID}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: MS_CLIENT_ID,
          client_secret: MS_CLIENT_SECRET,
          scope: 'https://graph.microsoft.com/.default',
          grant_type: 'client_credentials'
        })
      }
    )
    const data = await response.json()
    return data.access_token
  } catch {
    return null
  }
}

interface JobData {
  bookingId: string
  rego: string
  customerName: string
  customerEmail: string
  customerPhone: string
  pickupLocation: string
  dropoffLocation?: string
  price: number
  vehicleMake?: string
  vehicleModel?: string
  vehicleColor?: string
  createdAt: string
  completedAt?: string
}

function generateCustomerInvoiceEmail(job: JobData): string {
  const invoiceDate = new Date().toLocaleDateString('en-NZ', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  })
  const invoiceNumber = `INV-${job.bookingId.replace('HT-', '').slice(0, 8).toUpperCase()}`
  const totalAmount = (job.price / 100).toFixed(2)
  
  const invoiceUrl = `${BASE_URL}/invoice/${job.bookingId}`
  const portalUrl = `${BASE_URL}/customer/${job.bookingId}`

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #18181b; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #f97316; font-size: 24px; font-weight: bold;">Eek Mechanical</h1>
              <p style="margin: 5px 0 0; color: #a1a1aa; font-size: 12px;">Get Going</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 20px;">
                <tr>
                  <td width="50%" style="text-align: left; color: #a1a1aa; font-size: 12px; text-transform: uppercase;">Invoice</td>
                  <td width="50%" style="text-align: right;">
                    <span style="background-color: #22c55e; color: white; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: bold;">PAID</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 30px 20px;">
              <p style="margin: 0; color: #333; font-size: 16px;">
                Hi <strong>${job.customerName}</strong>,
              </p>
              <p style="margin: 10px 0 0; color: #666; font-size: 14px;">
                Thank you for using Eek Mechanical! Your job has been completed and here is your invoice for your records.
              </p>
            </td>
          </tr>
          
          <!-- Invoice Summary Box -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9f9f9; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="8">
                      <tr>
                        <td style="color: #666; font-size: 14px; width: 140px;">Invoice Number</td>
                        <td style="color: #333; font-size: 14px; font-weight: bold; font-family: monospace;">${invoiceNumber}</td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-size: 14px;">Date</td>
                        <td style="color: #333; font-size: 14px; font-weight: bold;">${invoiceDate}</td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-size: 14px;">Job Reference</td>
                        <td style="color: #333; font-size: 14px; font-weight: bold; font-family: monospace;">${job.bookingId}</td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-size: 14px;">Vehicle</td>
                        <td style="color: #f97316; font-size: 14px; font-weight: bold;">${job.rego}${job.vehicleMake ? ` - ${job.vehicleMake} ${job.vehicleModel || ''}` : ''}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Service Details -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 15px; color: #c2410c; font-weight: bold; font-size: 14px;">&#128663; Service Details</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="4">
                      <tr>
                        <td style="color: #666; font-size: 13px; vertical-align: top; width: 60px;">From:</td>
                        <td style="color: #333; font-size: 13px;">${job.pickupLocation}</td>
                      </tr>
                      ${job.dropoffLocation ? `
                      <tr>
                        <td style="color: #666; font-size: 13px; vertical-align: top;">To:</td>
                        <td style="color: #333; font-size: 13px;">${job.dropoffLocation}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Amount Box -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
                <tr>
                  <td style="padding: 25px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="6">
                      <tr>
                        <td style="color: #166534; font-size: 18px; font-weight: bold;">Total Paid</td>
                        <td style="color: #166534; font-size: 24px; font-weight: bold; text-align: right;">$${totalAmount}</td>
                      </tr>
                    </table>
                    <p style="margin: 15px 0 0; color: #22c55e; font-size: 12px; text-align: center;">&#10003; Payment received - Thank you!</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- View Invoice Button -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${invoiceUrl}" target="_blank" style="display: inline-block; background-color: #f97316; color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                      View &amp; Print Invoice
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 15px;">
                    <a href="${portalUrl}" target="_blank" style="color: #666; font-size: 13px; text-decoration: underline;">
                      View job details in your portal
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #18181b; padding: 25px; text-align: center;">
              <p style="margin: 0; color: #f97316; font-size: 14px; font-weight: bold;">
                Eek Mechanical | Get Going
              </p>
              <p style="margin: 10px 0 0; color: #a1a1aa; font-size: 12px;">
                24/7 Towing Services | Nationwide New Zealand
              </p>
              <p style="margin: 10px 0 0; color: #71717a; font-size: 11px;">
                &#128222; <a href="tel:0800769000" style="color: #f97316; text-decoration: none;">0800 769 000</a>
              </p>
              <p style="margin: 15px 0 0; color: #52525b; font-size: 10px;">
                Eek Mechanical Ltd | Auckland, New Zealand
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json()
    
    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'Booking ID required' }, { status: 400 })
    }
    
    // Get job data
    let job = await kv.hgetall(`job:${bookingId}`) as Record<string, unknown> | null
    
    // Fallback search
    if (!job) {
      const allJobKeys = await kv.lrange('jobs:list', 0, 200) as string[]
      for (const key of allJobKeys) {
        const candidate = await kv.hgetall(`job:${key}`) as Record<string, unknown> | null
        if (candidate && candidate.bookingId === bookingId) {
          job = candidate
          break
        }
      }
    }
    
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 })
    }
    
    if (!job.customerEmail) {
      return NextResponse.json({ success: false, error: 'No customer email' }, { status: 400 })
    }
    
    const jobData: JobData = {
      bookingId: job.bookingId as string,
      rego: job.rego as string,
      customerName: job.customerName as string || 'Customer',
      customerEmail: job.customerEmail as string,
      customerPhone: job.customerPhone as string || '',
      pickupLocation: job.pickupLocation as string,
      dropoffLocation: job.dropoffLocation as string | undefined,
      price: job.price as number || 0,
      vehicleMake: job.vehicleMake as string | undefined,
      vehicleModel: job.vehicleModel as string | undefined,
      vehicleColor: job.vehicleColor as string | undefined,
      createdAt: job.createdAt as string,
      completedAt: job.completedAt as string | undefined
    }
    
    const emailHtml = generateCustomerInvoiceEmail(jobData)
    
    // Send email
    const token = await getMicrosoftToken()
    if (!token) {
      console.log('No token - would send customer invoice to:', jobData.customerEmail)
      return NextResponse.json({ success: true, demo: true })
    }
    
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/users/${MS_FROM_EMAIL}/sendMail`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: {
            subject: `${jobData.rego} - Your Invoice from Eek Mechanical`,
            body: { contentType: 'HTML', content: emailHtml },
            toRecipients: [
              { emailAddress: { address: jobData.customerEmail, name: jobData.customerName } }
            ],
            from: {
              emailAddress: { address: MS_FROM_EMAIL, name: 'Eek Mechanical' }
            }
          }
        })
      }
    )
    
    if (!response.ok) {
      const error = await response.text()
      console.error('Failed to send customer invoice:', error)
      return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 })
    }
    
    console.log(`Customer invoice sent to ${jobData.customerEmail} for ${jobData.bookingId}`)
    
    return NextResponse.json({ 
      success: true, 
      email: jobData.customerEmail,
      invoiceUrl: `${BASE_URL}/invoice/${bookingId}`
    })
  } catch (error) {
    console.error('Send customer invoice error:', error)
    return NextResponse.json({ success: false, error: 'Failed to send invoice' }, { status: 500 })
  }
}
