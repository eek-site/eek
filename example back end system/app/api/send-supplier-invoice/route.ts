import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

/**
 * Send buyer-created invoice to supplier
 * Called automatically when job completes and supplier hasn't submitted their own invoice
 */

// Microsoft Graph credentials
const MS_TENANT_ID = process.env.MS_TENANT_ID || ''
const MS_CLIENT_ID = process.env.MS_CLIENT_ID || ''
const MS_CLIENT_SECRET = process.env.MS_CLIENT_SECRET || ''
const MS_FROM_EMAIL = 'no-reply@eek.co.nz'

interface SupplierRecord {
  name: string
  legalName?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  postcode?: string
  bankName?: string
  bankAccount?: string
  bankAccountName?: string
  gstNumber?: string
  portalCode?: string
}

interface JobRecord {
  bookingId: string
  rego: string
  customerName?: string
  pickupLocation: string
  dropoffLocation?: string
  supplierName?: string
  supplierPrice?: number
  supplierInvoiceRef?: string
  createdAt: string
  updatedAt?: string
  status: string
}

async function getMicrosoftToken(): Promise<string | null> {
  if (!MS_TENANT_ID || !MS_CLIENT_ID || !MS_CLIENT_SECRET) {
    console.log('Microsoft Graph not configured')
    return null
  }

  try {
    const tokenUrl = `https://login.microsoftonline.com/${MS_TENANT_ID}/oauth2/v2.0/token`
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: MS_CLIENT_ID,
        client_secret: MS_CLIENT_SECRET,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials'
      })
    })

    if (!response.ok) {
      console.error('Failed to get Microsoft token')
      return null
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error('Token error:', error)
    return null
  }
}

function generateInvoiceNumber(bookingId: string): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  // Use last 6 chars of bookingId for uniqueness
  const suffix = bookingId.replace('HT-', '').slice(-6).toUpperCase()
  return `HOOK-${year}${month}-${suffix}`
}

function generateBuyerCreatedInvoiceHtml(
  job: JobRecord,
  supplier: SupplierRecord,
  invoiceNumber: string,
  portalCode?: string
): string {
  const totalAmount = ((job.supplierPrice || 0) / 100).toFixed(2)
  
  const today = new Date().toLocaleDateString('en-NZ', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  })
  
  const jobDate = new Date(job.createdAt).toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'long', 
    year: 'numeric'
  })

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Buyer-Created Invoice ${invoiceNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #f97316; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">Eek Mechanical | Get Going</h1>
              <p style="margin: 10px 0 0; color: #fed7aa; font-size: 14px;">BUYER-CREATED INVOICE</p>
            </td>
          </tr>
          
          <!-- Invoice Details -->
          <tr>
            <td style="padding: 30px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="50%" valign="top">
                    <p style="margin: 0 0 5px; color: #666; font-size: 12px; text-transform: uppercase;">Invoice Number</p>
                    <p style="margin: 0 0 20px; color: #000; font-size: 18px; font-weight: bold;">${invoiceNumber}</p>
                    
                    <p style="margin: 0 0 5px; color: #666; font-size: 12px; text-transform: uppercase;">Date Issued</p>
                    <p style="margin: 0 0 20px; color: #000; font-size: 14px;">${today}</p>
                    
                    <p style="margin: 0 0 5px; color: #666; font-size: 12px; text-transform: uppercase;">Job Reference</p>
                    <p style="margin: 0; color: #000; font-size: 14px; font-family: monospace;">${job.bookingId}</p>
                  </td>
                  <td width="50%" valign="top" style="text-align: right;">
                    <p style="margin: 0 0 5px; color: #666; font-size: 12px; text-transform: uppercase;">From</p>
                    <p style="margin: 0; color: #000; font-size: 14px; font-weight: bold;">Eek Mechanical Ltd</p>
                    <p style="margin: 5px 0 0; color: #666; font-size: 12px;">Auckland, New Zealand</p>
                    <p style="margin: 5px 0 0; color: #666; font-size: 12px;">0800 769 000</p>
                  </td>
                </tr>
              </table>
              
              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 25px 0;">
              
              <!-- Supplier (Bill To) -->
              <p style="margin: 0 0 10px; color: #666; font-size: 12px; text-transform: uppercase;">Issued To (Supplier)</p>
              <p style="margin: 0; color: #000; font-size: 16px; font-weight: bold;">${supplier.legalName || supplier.name}</p>
              ${supplier.address ? `<p style="margin: 5px 0 0; color: #666; font-size: 14px;">${supplier.address}</p>` : ''}
              ${supplier.city ? `<p style="margin: 0; color: #666; font-size: 14px;">${supplier.city} ${supplier.postcode || ''}</p>` : ''}
              
              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 25px 0;">
              
              <!-- Service Details -->
              <p style="margin: 0 0 15px; color: #666; font-size: 12px; text-transform: uppercase;">Service Details</p>
              
              <table role="presentation" width="100%" cellspacing="0" cellpadding="8" style="border: 1px solid #e5e5e5; border-radius: 4px;">
                <tr style="background-color: #f9f9f9;">
                  <td style="font-weight: bold; color: #333; border-bottom: 1px solid #e5e5e5;">Description</td>
                  <td style="text-align: right; font-weight: bold; color: #333; border-bottom: 1px solid #e5e5e5;">Amount</td>
                </tr>
                <tr>
                  <td style="color: #333;">
                    <strong>Towing Service - ${job.rego}</strong><br>
                    <span style="color: #666; font-size: 12px;">Date: ${jobDate}</span><br>
                    <span style="color: #666; font-size: 12px;">From: ${job.pickupLocation?.split(',')[0] || 'N/A'}</span><br>
                    <span style="color: #666; font-size: 12px;">To: ${job.dropoffLocation?.split(',')[0] || 'N/A'}</span>
                  </td>
                  <td style="text-align: right; color: #333; vertical-align: top;">$${totalAmount}</td>
                </tr>
              </table>
              
              <!-- Totals -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="8" style="margin-top: 20px;">
                <tr>
                  <td style="text-align: right; color: #000; font-weight: bold; font-size: 18px;">Total (NZD):</td>
                  <td style="text-align: right; width: 100px; color: #22c55e; font-weight: bold; font-size: 18px;">$${totalAmount}</td>
                </tr>
              </table>
              
              <!-- Payment Info -->
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-top: 25px;">
                <p style="margin: 0 0 10px; color: #166534; font-weight: bold;">&#9989; Payment Processing</p>
                <p style="margin: 0; color: #166534; font-size: 14px;">
                  Payment is processed instantly via ANZ batch transfer.
                </p>
                ${supplier.bankAccount ? `
                <p style="margin: 15px 0 0; color: #166534; font-size: 12px;">
                  <strong>Bank:</strong> ${supplier.bankName || 'N/A'}<br>
                  <strong>Account:</strong> ****${supplier.bankAccount.slice(-4)}<br>
                  <strong>Name:</strong> ${supplier.bankAccountName || supplier.legalName || supplier.name}
                </p>
                ` : `
                <p style="margin: 15px 0 0; color: #dc2626; font-size: 12px;">
                  &#9888; Please update your bank details in your supplier portal to receive payment.
                </p>
                `}
              </div>
              
              <!-- Bank Processing Times -->
              <div style="margin-top: 20px;">
                <p style="margin: 0 0 10px; color: #666; font-size: 11px; text-transform: uppercase;">Expected Arrival Times by Bank</p>
                <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9f9f9; border-radius: 8px; font-size: 11px;">
                  <tr style="background-color: #e5e5e5;">
                    <td style="padding: 8px 12px; font-weight: bold; color: #333;">Bank</td>
                    <td style="padding: 8px 12px; font-weight: bold; color: #333;">Processing Window</td>
                    <td style="padding: 8px 12px; font-weight: bold; color: #333;">Typical Arrival</td>
                  </tr>
                  <tr style="${supplier.bankName?.toLowerCase().includes('anz') ? 'background-color: #fef3c7;' : ''}">
                    <td style="padding: 6px 12px; color: #333;">ANZ</td>
                    <td style="padding: 6px 12px; color: #666;">24/7</td>
                    <td style="padding: 6px 12px; color: #22c55e; font-weight: bold;">Instant</td>
                  </tr>
                  <tr style="${supplier.bankName?.toLowerCase().includes('asb') ? 'background-color: #fef3c7;' : ''}">
                    <td style="padding: 6px 12px; color: #333;">ASB</td>
                    <td style="padding: 6px 12px; color: #666;">8:30am – 12:15am</td>
                    <td style="padding: 6px 12px; color: #666;">Within 1 hour</td>
                  </tr>
                  <tr style="${supplier.bankName?.toLowerCase().includes('bnz') ? 'background-color: #fef3c7;' : ''}">
                    <td style="padding: 6px 12px; color: #333;">BNZ</td>
                    <td style="padding: 6px 12px; color: #666;">9am – 11:55pm</td>
                    <td style="padding: 6px 12px; color: #666;">Within 1 hour</td>
                  </tr>
                  <tr style="${supplier.bankName?.toLowerCase().includes('westpac') ? 'background-color: #fef3c7;' : ''}">
                    <td style="padding: 6px 12px; color: #333;">Westpac</td>
                    <td style="padding: 6px 12px; color: #666;">9:30am – 10pm</td>
                    <td style="padding: 6px 12px; color: #666;">Within 1 hour</td>
                  </tr>
                  <tr style="${supplier.bankName?.toLowerCase().includes('kiwibank') ? 'background-color: #fef3c7;' : ''}">
                    <td style="padding: 6px 12px; color: #333;">Kiwibank</td>
                    <td style="padding: 6px 12px; color: #666;">9am – 12am</td>
                    <td style="padding: 6px 12px; color: #666;">Within 1 hour</td>
                  </tr>
                  <tr style="${supplier.bankName?.toLowerCase().includes('tsb') ? 'background-color: #fef3c7;' : ''}">
                    <td style="padding: 6px 12px; color: #333;">TSB</td>
                    <td style="padding: 6px 12px; color: #666;">9:30am – 10:45pm</td>
                    <td style="padding: 6px 12px; color: #666;">Within 2 hours</td>
                  </tr>
                  <tr style="${supplier.bankName?.toLowerCase().includes('sbs') ? 'background-color: #fef3c7;' : ''}">
                    <td style="padding: 6px 12px; color: #333;">SBS Bank</td>
                    <td style="padding: 6px 12px; color: #666;">9am – 10:45pm</td>
                    <td style="padding: 6px 12px; color: #666;">Within 1 hour</td>
                  </tr>
                  <tr style="${supplier.bankName?.toLowerCase().includes('co-op') || supplier.bankName?.toLowerCase().includes('cooperative') ? 'background-color: #fef3c7;' : ''}">
                    <td style="padding: 6px 12px; color: #333;">Co-operative Bank</td>
                    <td style="padding: 6px 12px; color: #666;">9am – 10pm</td>
                    <td style="padding: 6px 12px; color: #666;">Within 1 hour</td>
                  </tr>
                  <tr style="${supplier.bankName?.toLowerCase().includes('heartland') ? 'background-color: #fef3c7;' : ''}">
                    <td style="padding: 6px 12px; color: #333;">Heartland Bank</td>
                    <td style="padding: 6px 12px; color: #666;">Before 11am / 7pm</td>
                    <td style="padding: 6px 12px; color: #666;">Same day / Overnight</td>
                  </tr>
                  <tr style="${supplier.bankName?.toLowerCase().includes('rabobank') ? 'background-color: #fef3c7;' : ''}">
                    <td style="padding: 6px 12px; color: #333;">Rabobank</td>
                    <td style="padding: 6px 12px; color: #666;">Via agent bank</td>
                    <td style="padding: 6px 12px; color: #666;">Within 1–2 hours</td>
                  </tr>
                </table>
                <p style="margin: 8px 0 0; color: #999; font-size: 10px;">
                  All NZ banks process payments 7 days a week, 365 days a year. Times shown are for receiving incoming payments.
                </p>
              </div>
              
              <!-- Self-Billing Notice -->
              <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px; margin-top: 20px;">
                <p style="margin: 0; color: #92400e; font-size: 12px;">
                  <strong>Self-Billing Agreement:</strong> This is a buyer-created invoice issued under a self-billing arrangement. 
                  By accepting payment, you agree that this invoice accurately reflects the services provided and that you will not 
                  issue your own invoice for this transaction.
                </p>
              </div>
              
              <!-- Action Buttons -->
              <div style="margin-top: 30px; text-align: center;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center" style="padding-bottom: 15px;">
                      <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.eek.co.nz'}/supplier-invoice/${job.bookingId}" 
                         target="_blank" 
                         style="display: inline-block; background-color: #3b82f6; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px; margin: 0 5px;">
                        📄 View Invoice Online
                      </a>
                    </td>
                  </tr>
                  ${portalCode ? `
                  <tr>
                    <td align="center">
                      <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.eek.co.nz'}/portal/${portalCode}?job=${job.bookingId}&tab=invoice" 
                         target="_blank" 
                         style="display: inline-block; background-color: #f97316; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px; margin: 0 5px;">
                        📤 Upload Your Invoice
                      </a>
                    </td>
                  </tr>
                  ` : ''}
                </table>
                <p style="margin: 15px 0 0; color: #666; font-size: 12px;">
                  Click above to view this invoice online for printing, or upload your own invoice if you prefer.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #18181b; padding: 25px; text-align: center;">
              <p style="margin: 0; color: #f97316; font-size: 14px; font-weight: bold;">
                Eek Mechanical | Get Going
              </p>
              <p style="margin: 10px 0 0; color: #a1a1aa; font-size: 12px;">
                Auckland, New Zealand<br>
                &#128222; 0800 769 000
              </p>
              <p style="margin: 15px 0 0; color: #71717a; font-size: 11px;">
                This invoice was automatically generated. For queries, visit your supplier portal or call us.
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

async function sendInvoiceEmail(
  supplierEmail: string,
  supplierName: string,
  invoiceNumber: string,
  jobRego: string,
  htmlContent: string
): Promise<boolean> {
  const token = await getMicrosoftToken()
  if (!token) {
    console.log('No token - would send invoice email to:', supplierEmail)
    return false
  }

  try {
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
            subject: `${jobRego} - Buyer-Created Invoice ${invoiceNumber} | Eek Mechanical`,
            body: {
              contentType: 'HTML',
              content: htmlContent
            },
            toRecipients: [
              { emailAddress: { address: supplierEmail, name: supplierName } }
            ],
            from: {
              emailAddress: { address: MS_FROM_EMAIL, name: 'Eek Mechanical Accounts' }
            }
          }
        })
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Failed to send invoice email:', error)
      return false
    }

    console.log(`Buyer-created invoice ${invoiceNumber} sent to ${supplierEmail}`)
    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

// POST - Send buyer-created invoice for a specific job
export async function POST(request: NextRequest) {
  try {
    const { bookingId, rego } = await request.json()
    
    const jobRef = bookingId || rego
    if (!jobRef) {
      return NextResponse.json({
        success: false,
        error: 'Job reference required'
      }, { status: 400 })
    }
    
    // Get job
    const job = await kv.hgetall(`job:${jobRef}`) as JobRecord | null
    
    if (!job) {
      return NextResponse.json({
        success: false,
        error: 'Job not found'
      }, { status: 404 })
    }
    
    // Check if supplier already submitted invoice
    if (job.supplierInvoiceRef) {
      return NextResponse.json({
        success: false,
        error: 'Supplier has already submitted their own invoice',
        invoiceRef: job.supplierInvoiceRef
      }, { status: 400 })
    }
    
    if (!job.supplierName) {
      return NextResponse.json({
        success: false,
        error: 'No supplier assigned to this job'
      }, { status: 400 })
    }
    
    // Get supplier details
    const supplier = await kv.hgetall(`supplier:${job.supplierName}`) as SupplierRecord | null
    
    if (!supplier) {
      return NextResponse.json({
        success: false,
        error: 'Supplier not found'
      }, { status: 404 })
    }
    
    if (!supplier.email) {
      return NextResponse.json({
        success: false,
        error: 'Supplier has no email address'
      }, { status: 400 })
    }
    
    // Generate invoice
    const invoiceNumber = generateInvoiceNumber(job.bookingId)
    const invoiceHtml = generateBuyerCreatedInvoiceHtml(job, supplier, invoiceNumber, supplier.portalCode)
    
    // Send email
    const sent = await sendInvoiceEmail(
      supplier.email,
      supplier.legalName || supplier.name,
      invoiceNumber,
      job.rego,
      invoiceHtml
    )
    
    if (sent) {
      // Store the buyer-created invoice reference on the job
      await kv.hset(`job:${jobRef}`, {
        buyerInvoiceRef: invoiceNumber,
        buyerInvoiceSentAt: new Date().toISOString(),
        buyerInvoiceSentTo: supplier.email
      })
    }
    
    return NextResponse.json({
      success: sent,
      invoiceNumber,
      sentTo: supplier.email,
      message: sent ? 'Buyer-created invoice sent' : 'Failed to send email'
    })
  } catch (error) {
    console.error('Send supplier invoice error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to send invoice'
    }, { status: 500 })
  }
}
