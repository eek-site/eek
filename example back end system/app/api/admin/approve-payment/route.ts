import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { sendSupplierNotificationByName } from '@/lib/notifications'

/**
 * Approve supplier payment for a job
 * This is required before payment can be included in DLO generation
 * Sends payment confirmation email to supplier
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
  bankName?: string
  bankAccount?: string
  accountHolderName?: string
}

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

interface BankDetails {
  bankName: string
  bankAccount: string
  accountHolderName: string
}

function generatePaymentConfirmationEmail(
  supplierName: string,
  rego: string,
  amount: number,
  customerName: string,
  customerPhone: string,
  bankDetails: BankDetails
): string {
  const now = new Date()
  const today = now.toLocaleDateString('en-NZ', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  })
  const timeNow = now.toLocaleTimeString('en-NZ', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
  const amountFormatted = (amount / 100).toFixed(2)
  
  // Mask bank account for security (show last 4 digits)
  const maskedAccount = bankDetails.bankAccount 
    ? `****-****-****-${bankDetails.bankAccount.replace(/\D/g, '').slice(-4)}`
    : 'On file'

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
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 20px;">
                <tr>
                  <td width="50%" style="text-align: left; color: #a1a1aa; font-size: 12px; text-transform: uppercase;">Payment Confirmation</td>
                  <td width="50%" style="text-align: right;">
                    <span style="background-color: #22c55e; color: white; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: bold;">PAYMENT SENT</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 30px 20px;">
              <p style="margin: 0; color: #333; font-size: 16px;">
                Hi <strong>${supplierName}</strong>,
              </p>
              <p style="margin: 10px 0 0; color: #666; font-size: 14px;">
                We have processed payment for the job below. Funds have been sent via ANZ batch transfer to your nominated bank account.
              </p>
            </td>
          </tr>
          
          <!-- Payment Details Box -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9f9f9; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px; border-bottom: 1px solid #e5e5e5;">
                    <p style="margin: 0 0 5px; color: #999; font-size: 11px; text-transform: uppercase;">Payment Details</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="8">
                      <tr>
                        <td style="color: #666; font-size: 14px; width: 120px;">Date</td>
                        <td style="color: #333; font-size: 14px; font-weight: bold;">${today}</td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-size: 14px;">Time</td>
                        <td style="color: #333; font-size: 14px; font-weight: bold;">${timeNow}</td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-size: 14px;">Reference</td>
                        <td style="color: #333; font-size: 14px; font-weight: bold; font-family: monospace;">${rego}</td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-size: 14px;">Supplier</td>
                        <td style="color: #333; font-size: 14px; font-weight: bold;">${supplierName}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Bank Account Box -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px; color: #1e40af; font-size: 12px; text-transform: uppercase; font-weight: bold;">
                      &#127974; Paid To
                    </p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="4">
                      <tr>
                        <td style="color: #666; font-size: 13px; width: 100px;">Bank</td>
                        <td style="color: #1e40af; font-size: 14px; font-weight: bold;">${bankDetails.bankName || 'NZ Bank'}</td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-size: 13px;">Account</td>
                        <td style="color: #1e40af; font-size: 14px; font-family: monospace;">${maskedAccount}</td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-size: 13px;">Name</td>
                        <td style="color: #1e40af; font-size: 14px;">${bankDetails.accountHolderName || supplierName}</td>
                      </tr>
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
                  <td style="padding: 25px; text-align: center;">
                    <p style="margin: 0 0 5px; color: #166534; font-size: 12px; text-transform: uppercase;">Amount Paid</p>
                    <p style="margin: 0; color: #166534; font-size: 36px; font-weight: bold;">$${amountFormatted}</p>
                    <p style="margin: 10px 0 0; color: #22c55e; font-size: 12px;">&#10003; Paid in Full</p>
                    <p style="margin: 5px 0 0; color: #666; font-size: 11px;">Sent via ANZ batch transfer</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Vehicle Release -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px; color: #92400e; font-size: 14px; font-weight: bold;">
                      &#128663; Vehicle Release
                    </p>
                    <p style="margin: 0; color: #92400e; font-size: 13px;">
                      Please release vehicle <strong>${rego}</strong> to the customer. They have been notified that the vehicle is ready for collection.
                    </p>
                    <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top: 15px; background-color: #ffffff; border-radius: 6px; padding: 12px;">
                      <tr>
                        <td style="padding: 12px;">
                          <p style="margin: 0 0 3px; color: #999; font-size: 10px; text-transform: uppercase;">Customer Details</p>
                          <p style="margin: 0; color: #333; font-size: 14px; font-weight: bold;">${customerName}</p>
                          <p style="margin: 5px 0 0; color: #666; font-size: 13px;">Phone: <a href="tel:${customerPhone}" style="color: #f97316;">${customerPhone}</a></p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Bank Processing Times -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <p style="margin: 0 0 10px; color: #666; font-size: 11px; text-transform: uppercase;">Expected Arrival Times by Bank</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9f9f9; border-radius: 8px; font-size: 11px;">
                <tr style="background-color: #e5e5e5;">
                  <td style="padding: 8px 12px; font-weight: bold; color: #333;">Bank</td>
                  <td style="padding: 8px 12px; font-weight: bold; color: #333;">Processing Window</td>
                  <td style="padding: 8px 12px; font-weight: bold; color: #333;">Typical Arrival</td>
                </tr>
                <tr style="${bankDetails.bankName?.toLowerCase().includes('anz') ? 'background-color: #fef3c7;' : ''}">
                  <td style="padding: 6px 12px; color: #333;">ANZ</td>
                  <td style="padding: 6px 12px; color: #666;">24/7</td>
                  <td style="padding: 6px 12px; color: #22c55e; font-weight: bold;">Instant</td>
                </tr>
                <tr style="${bankDetails.bankName?.toLowerCase().includes('asb') ? 'background-color: #fef3c7;' : ''}">
                  <td style="padding: 6px 12px; color: #333;">ASB</td>
                  <td style="padding: 6px 12px; color: #666;">8:30am – 12:15am</td>
                  <td style="padding: 6px 12px; color: #666;">Within 1 hour</td>
                </tr>
                <tr style="${bankDetails.bankName?.toLowerCase().includes('bnz') ? 'background-color: #fef3c7;' : ''}">
                  <td style="padding: 6px 12px; color: #333;">BNZ</td>
                  <td style="padding: 6px 12px; color: #666;">9am – 11:55pm</td>
                  <td style="padding: 6px 12px; color: #666;">Within 1 hour</td>
                </tr>
                <tr style="${bankDetails.bankName?.toLowerCase().includes('westpac') ? 'background-color: #fef3c7;' : ''}">
                  <td style="padding: 6px 12px; color: #333;">Westpac</td>
                  <td style="padding: 6px 12px; color: #666;">9:30am – 10pm</td>
                  <td style="padding: 6px 12px; color: #666;">Within 1 hour</td>
                </tr>
                <tr style="${bankDetails.bankName?.toLowerCase().includes('kiwibank') ? 'background-color: #fef3c7;' : ''}">
                  <td style="padding: 6px 12px; color: #333;">Kiwibank</td>
                  <td style="padding: 6px 12px; color: #666;">9am – 12am</td>
                  <td style="padding: 6px 12px; color: #666;">Within 1 hour</td>
                </tr>
              </table>
              <p style="margin: 8px 0 0; color: #999; font-size: 10px;">
                All NZ banks process payments 7 days a week, 365 days a year.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #18181b; padding: 25px; text-align: center;">
              <p style="margin: 0; color: #f97316; font-size: 14px; font-weight: bold;">Eek Mechanical | Get Going</p>
              <p style="margin: 10px 0 0; color: #a1a1aa; font-size: 12px;">
                24/7 Towing Services | Nationwide New Zealand
              </p>
              <p style="margin: 10px 0 0; color: #71717a; font-size: 11px;">
                Questions? Call <a href="tel:0800769000" style="color: #f97316;">0800 769 000</a> or reply to this email.
              </p>
              <p style="margin: 15px 0 0; color: #52525b; font-size: 10px;">
                This is an automated payment confirmation. Funds typically arrive within 1 hour during banking hours.
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

async function sendPaymentConfirmationEmail(
  supplierEmail: string,
  supplierName: string,
  rego: string,
  htmlContent: string
): Promise<boolean> {
  const token = await getMicrosoftToken()
  if (!token) {
    console.log('No token - would send payment confirmation to:', supplierEmail)
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
            subject: `${rego} - Payment Sent | Eek Mechanical`,
            body: { contentType: 'HTML', content: htmlContent },
            toRecipients: [
              { emailAddress: { address: supplierEmail, name: supplierName } }
            ],
            from: {
              emailAddress: { address: MS_FROM_EMAIL, name: 'Eek Mechanical Payments' }
            }
          }
        })
      }
    )

    if (!response.ok) {
      console.error('Failed to send payment confirmation:', await response.text())
      return false
    }

    console.log(`Payment confirmation sent to ${supplierEmail} for ${rego}`)
    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const { bookingId, approvedAmount, notes } = await request.json()
    
    if (!bookingId) {
      return NextResponse.json({
        success: false,
        error: 'Booking ID required'
      }, { status: 400 })
    }
    
    // Get the job
    const job = await kv.hgetall(`job:${bookingId}`) as Record<string, unknown> | null
    
    if (!job) {
      return NextResponse.json({
        success: false,
        error: 'Job not found'
      }, { status: 404 })
    }
    
    if (!job.supplierName) {
      return NextResponse.json({
        success: false,
        error: 'No supplier assigned to this job'
      }, { status: 400 })
    }
    
    // Determine the payment amount
    // Priority: approvedAmount param > supplierInvoiceAmount > supplierPrice
    const paymentAmount = approvedAmount 
      || (job.supplierInvoiceAmount as number) 
      || (job.supplierPrice as number) 
      || 0
    
    if (paymentAmount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'No payment amount set'
      }, { status: 400 })
    }
    
    // Get supplier details for email
    const supplier = await kv.hgetall(`supplier:${job.supplierName}`) as SupplierRecord | null
    
    // Update job with approval
    // Also set supplierPrice so it shows as locked in supplier portal
    const timestamp = new Date().toISOString()
    await kv.hset(`job:${bookingId}`, {
      supplierPaymentApproved: true,
      supplierApprovedAmount: paymentAmount,
      supplierPrice: paymentAmount, // Set this so supplier portal shows locked amount
      supplierApprovedAt: timestamp,
      supplierApprovalNotes: notes || ''
    })
    
    // Add to history
    const history = (job.history as Array<Record<string, unknown>>) || []
    history.push({
      action: 'supplier_payment_approved',
      timestamp,
      data: { amount: paymentAmount, notes }
    })
    await kv.hset(`job:${bookingId}`, { history: JSON.stringify(history) })
    
    // Send payment confirmation email to supplier
    let emailSent = false
    if (supplier?.email) {
      const emailHtml = generatePaymentConfirmationEmail(
        supplier.legalName || supplier.name,
        job.rego as string,
        paymentAmount,
        job.customerName as string || 'Customer',
        job.customerPhone as string || '',
        {
          bankName: (supplier.bankName as string) || '',
          bankAccount: (supplier.bankAccount as string) || '',
          accountHolderName: (supplier.accountHolderName as string) || supplier.name
        }
      )
      emailSent = await sendPaymentConfirmationEmail(
        supplier.email,
        supplier.legalName || supplier.name,
        job.rego as string,
        emailHtml
      )
    }
    
    // Send push notification to supplier
    try {
      await sendSupplierNotificationByName(job.supplierName as string, {
        title: '💰 Payment Approved!',
        body: `$${(paymentAmount / 100).toFixed(2)} for ${job.rego} - funds being transferred`,
        jobId: bookingId,
        tab: 'invoice',
        tag: `payment-${job.rego}`
      })
    } catch (e) {
      console.error('Failed to send push notification:', e)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Payment approved and confirmation sent',
      approvedAmount: paymentAmount / 100,
      approvedAt: timestamp,
      emailSent,
      supplierEmail: supplier?.email
    })
  } catch (error) {
    console.error('Approve payment error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to approve payment'
    }, { status: 500 })
  }
}

// GET - Check payment approval status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')
    
    if (!bookingId) {
      return NextResponse.json({
        success: false,
        error: 'Booking ID required'
      }, { status: 400 })
    }
    
    const job = await kv.hgetall(`job:${bookingId}`) as Record<string, unknown> | null
    
    if (!job) {
      return NextResponse.json({
        success: false,
        error: 'Job not found'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      bookingId,
      supplierName: job.supplierName,
      supplierPrice: job.supplierPrice,
      supplierInvoiceRef: job.supplierInvoiceRef,
      supplierInvoiceAmount: job.supplierInvoiceAmount,
      supplierPaymentApproved: !!job.supplierPaymentApproved,
      supplierApprovedAmount: job.supplierApprovedAmount,
      supplierApprovedAt: job.supplierApprovedAt,
      supplierPaidAt: job.supplierPaidAt
    })
  } catch (error) {
    console.error('Get payment status error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get payment status'
    }, { status: 500 })
  }
}
