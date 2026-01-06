/**
 * Internal Notification System
 * Sends emails to no-reply@eek.co.nz for every step in the booking process
 */

// Microsoft Graph credentials
const MS_TENANT_ID = process.env.MS_TENANT_ID || ''
const MS_CLIENT_ID = process.env.MS_CLIENT_ID || ''
const MS_CLIENT_SECRET = process.env.MS_CLIENT_SECRET || ''
const INTERNAL_EMAIL = 'no-reply@eek.co.nz'

// Notification types
export type NotificationType = 
  | 'booking_link_created'
  | 'booking_link_sent'
  | 'payment_page_viewed'
  | 'payment_started'
  | 'payment_completed'
  | 'payment_failed'
  | 'vehicle_lookup'
  | 'job_added_to_stories'
  | 'customer_message'
  | 'supplier_message'
  | 'supplier_assigned'
  | 'supplier_confirmed'
  | 'supplier_invoice'
  | 'additional_charge'
  | 'visitor_arrived'

interface NotificationData {
  type: NotificationType
  bookingId?: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  vehicleRego?: string
  vehicleMake?: string
  vehicleModel?: string
  vehicleColour?: string
  vehicleYear?: string
  pickupLocation?: string
  dropoffLocation?: string
  price?: number | string
  eta?: string
  transactionId?: string
  error?: string
  createdBy?: string
  timestamp?: string
  // Vehicle details from CarJam
  vehicleVin?: string
  vehicleFuel?: string
  vehicleCc?: string
  vehicleTransmission?: string
  vehicleBody?: string
  vehicleSeats?: string
  vehicleWofExpiry?: string
  vehicleRegoExpiry?: string
  // Message data
  message?: string
  rego?: string
  // Supplier data
  supplierName?: string
  supplierPhone?: string
  supplierMobile?: string
  supplierEmail?: string
  // Any additional data
  [key: string]: unknown
}

// Cache for access token
let cachedToken: { token: string; expires: number } | null = null

async function getToken(): Promise<string | null> {
  if (cachedToken && cachedToken.expires > Date.now() + 300000) {
    return cachedToken.token
  }

  if (!MS_TENANT_ID || !MS_CLIENT_ID || !MS_CLIENT_SECRET) {
    return null
  }

  try {
    const response = await fetch(`https://login.microsoftonline.com/${MS_TENANT_ID}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: MS_CLIENT_ID,
        client_secret: MS_CLIENT_SECRET,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials'
      })
    })

    if (!response.ok) return null

    const data = await response.json()
    cachedToken = {
      token: data.access_token,
      expires: Date.now() + (data.expires_in * 1000)
    }
    
    return data.access_token
  } catch {
    return null
  }
}

function getNotificationTitle(type: NotificationType): string {
  const titles: Record<NotificationType, string> = {
    booking_link_created: 'Booking Link Created',
    booking_link_sent: 'Booking Link Sent to Customer',
    payment_page_viewed: 'Customer Viewing Payment Page',
    payment_started: 'Payment Processing Started',
    payment_completed: 'Payment Completed',
    payment_failed: 'Payment Failed',
    vehicle_lookup: 'Vehicle Lookup Performed',
    job_added_to_stories: 'Job Added to Stories',
    customer_message: 'New Message from Customer',
    supplier_message: 'New Message from Supplier',
    supplier_assigned: 'Supplier Assigned to Job',
    supplier_confirmed: 'Supplier Confirmed Job',
    supplier_invoice: 'Supplier Invoice Submitted',
    additional_charge: 'Additional Charge Added',
    visitor_arrived: 'New Website Visitor'
  }
  return titles[type] || 'Eek Mechanical Notification'
}

function getNotificationEmoji(type: NotificationType): string {
  const emojis: Record<NotificationType, string> = {
    booking_link_created: '🔗',
    booking_link_sent: '📤',
    payment_page_viewed: '👀',
    payment_started: '⏳',
    payment_completed: '✅',
    payment_failed: '❌',
    vehicle_lookup: '🚗',
    job_added_to_stories: '📸',
    customer_message: '💬',
    supplier_message: '🏢',
    supplier_assigned: '🤝',
    supplier_confirmed: '✔️',
    supplier_invoice: '🧾',
    additional_charge: '💰',
    visitor_arrived: '👤'
  }
  return emojis[type] || '📌'
}

function formatDataRows(data: NotificationData): string {
  const rows: string[] = []
  
  // Visitor tracking info (if visitor_arrived type)
  if (data.visitorId) {
    rows.push(`<tr><td style="color:#71717a;padding:4px 12px 4px 0;">Visitor ID</td><td style="color:#fff;font-family:monospace;font-size:11px;">${data.visitorId}</td></tr>`)
    if (data.sourceLabel) rows.push(`<tr><td style="color:#71717a;padding:4px 12px 4px 0;">Source</td><td style="color:#3b82f6;font-weight:bold;">${data.sourceEmoji || '🎯'} ${data.sourceLabel}</td></tr>`)
    if (data.landingPage) rows.push(`<tr><td style="color:#71717a;padding:4px 12px 4px 0;">Landing Page</td><td style="color:#fff;">${data.landingPage}</td></tr>`)
    if (data.referrer && data.referrer !== 'Direct') rows.push(`<tr><td style="color:#71717a;padding:4px 12px 4px 0;">Referrer</td><td style="color:#a855f7;">${data.referrer}</td></tr>`)
    if (data.utmCampaign) rows.push(`<tr><td style="color:#71717a;padding:4px 12px 4px 0;">Campaign</td><td style="color:#f97316;">${data.utmCampaign}</td></tr>`)
    if (data.gclid) rows.push(`<tr><td style="color:#71717a;padding:4px 12px 4px 0;">Google Click ID</td><td style="color:#22c55e;font-family:monospace;font-size:10px;">${data.gclid}</td></tr>`)
    if (data.devicePlatform) rows.push(`<tr><td style="color:#71717a;padding:4px 12px 4px 0;">Platform</td><td style="color:#fff;">${data.devicePlatform} ${data.isMobile === 'Yes' ? '📱' : '💻'}</td></tr>`)
    if (data.visitorLocation) rows.push(`<tr><td style="color:#71717a;padding:4px 12px 4px 0;">Location</td><td style="color:#22c55e;">📍 ${data.visitorLocation}</td></tr>`)
    if (data.adminUrl) rows.push(`<tr><td colspan="2" style="padding:16px 0;"><a href="${data.adminUrl}" style="display:inline-block;background:#ef4444;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">👁️ Observe This Visitor</a></td></tr>`)
    return rows.join('')
  }
  
  // Core booking info
  if (data.bookingId) rows.push(`<tr><td style="color:#71717a;padding:4px 12px 4px 0;">Booking ID</td><td style="color:#fff;font-family:monospace;">${data.bookingId}</td></tr>`)
  if (data.createdBy) rows.push(`<tr><td style="color:#71717a;padding:4px 12px 4px 0;">Created By</td><td style="color:#fff;">${data.createdBy}</td></tr>`)
  
  // Customer info
  if (data.customerName) rows.push(`<tr><td style="color:#71717a;padding:4px 12px 4px 0;">Customer</td><td style="color:#fff;">${data.customerName}</td></tr>`)
  if (data.customerPhone) rows.push(`<tr><td style="color:#71717a;padding:4px 12px 4px 0;">Phone</td><td style="color:#fff;">${data.customerPhone}</td></tr>`)
  if (data.customerEmail) rows.push(`<tr><td style="color:#71717a;padding:4px 12px 4px 0;">Email</td><td style="color:#fff;">${data.customerEmail}</td></tr>`)
  
  // Location info
  if (data.pickupLocation) rows.push(`<tr><td style="color:#71717a;padding:4px 12px 4px 0;">Pickup</td><td style="color:#fff;">${data.pickupLocation}</td></tr>`)
  if (data.dropoffLocation) rows.push(`<tr><td style="color:#71717a;padding:4px 12px 4px 0;">Drop-off</td><td style="color:#fff;">${data.dropoffLocation}</td></tr>`)
  
  // Pricing
  if (data.price) {
    const priceStr = typeof data.price === 'number' ? `$${(data.price / 100).toFixed(2)}` : data.price
    rows.push(`<tr><td style="color:#71717a;padding:4px 12px 4px 0;">Price</td><td style="color:#22c55e;font-weight:bold;">${priceStr}</td></tr>`)
  }
  if (data.eta) rows.push(`<tr><td style="color:#71717a;padding:4px 12px 4px 0;">ETA</td><td style="color:#fff;">${data.eta}</td></tr>`)
  
  // Vehicle - Basic
  if (data.vehicleRego) rows.push(`<tr><td style="color:#71717a;padding:4px 12px 4px 0;">Rego</td><td style="color:#ef4444;font-family:monospace;font-weight:bold;">${data.vehicleRego}</td></tr>`)
  if (data.vehicleMake) rows.push(`<tr><td style="color:#71717a;padding:4px 12px 4px 0;">Make</td><td style="color:#fff;">${data.vehicleMake}</td></tr>`)
  if (data.vehicleModel) rows.push(`<tr><td style="color:#71717a;padding:4px 12px 4px 0;">Model</td><td style="color:#fff;">${data.vehicleModel}</td></tr>`)
  if (data.vehicleYear) rows.push(`<tr><td style="color:#71717a;padding:4px 12px 4px 0;">Year</td><td style="color:#fff;">${data.vehicleYear}</td></tr>`)
  if (data.vehicleColour) rows.push(`<tr><td style="color:#71717a;padding:4px 12px 4px 0;">Colour</td><td style="color:#fff;">${data.vehicleColour}</td></tr>`)
  
  // Vehicle - Extended from CarJam
  if (data.vehicleVin) rows.push(`<tr><td style="color:#71717a;padding:4px 12px 4px 0;">VIN</td><td style="color:#fff;font-family:monospace;font-size:11px;">${data.vehicleVin}</td></tr>`)
  if (data.vehicleBody) rows.push(`<tr><td style="color:#71717a;padding:4px 12px 4px 0;">Body</td><td style="color:#fff;">${data.vehicleBody}</td></tr>`)
  if (data.vehicleFuel) rows.push(`<tr><td style="color:#71717a;padding:4px 12px 4px 0;">Fuel</td><td style="color:#fff;">${data.vehicleFuel}</td></tr>`)
  if (data.vehicleCc) rows.push(`<tr><td style="color:#71717a;padding:4px 12px 4px 0;">CC</td><td style="color:#fff;">${data.vehicleCc}</td></tr>`)
  if (data.vehicleTransmission) rows.push(`<tr><td style="color:#71717a;padding:4px 12px 4px 0;">Trans</td><td style="color:#fff;">${data.vehicleTransmission}</td></tr>`)
  if (data.vehicleSeats) rows.push(`<tr><td style="color:#71717a;padding:4px 12px 4px 0;">Seats</td><td style="color:#fff;">${data.vehicleSeats}</td></tr>`)
  if (data.vehicleWofExpiry) rows.push(`<tr><td style="color:#71717a;padding:4px 12px 4px 0;">WOF Expiry</td><td style="color:#fff;">${data.vehicleWofExpiry}</td></tr>`)
  if (data.vehicleRegoExpiry) rows.push(`<tr><td style="color:#71717a;padding:4px 12px 4px 0;">Rego Expiry</td><td style="color:#fff;">${data.vehicleRegoExpiry}</td></tr>`)
  
  // Transaction info
  if (data.transactionId) rows.push(`<tr><td style="color:#71717a;padding:4px 12px 4px 0;">Transaction</td><td style="color:#fff;font-family:monospace;">${data.transactionId}</td></tr>`)
  
  // Supplier info
  if (data.supplierName) rows.push(`<tr><td style="color:#71717a;padding:4px 12px 4px 0;">Supplier</td><td style="color:#f97316;font-weight:bold;">${data.supplierName}</td></tr>`)
  if (data.rego && !data.vehicleRego) rows.push(`<tr><td style="color:#71717a;padding:4px 12px 4px 0;">Rego</td><td style="color:#ef4444;font-family:monospace;font-weight:bold;">${data.rego}</td></tr>`)
  
  // Message
  if (data.message) rows.push(`<tr><td colspan="2" style="padding:12px 0;"><div style="background:#27272a;padding:16px;border-radius:8px;color:#fff;white-space:pre-wrap;">${data.message}</div></td></tr>`)
  
  // Error
  if (data.error) rows.push(`<tr><td style="color:#71717a;padding:4px 12px 4px 0;">Error</td><td style="color:#ef4444;">${data.error}</td></tr>`)
  
  // Admin action buttons for booking_link_sent (customer)
  if (data.type === 'booking_link_sent' && (data.customerPhone || data.customerEmail || data.bookingId)) {
    const cleanPhone = data.customerPhone?.replace(/[\s\-()]/g, '').replace(/^\+?64/, '64') || ''
    const smsSubject = data.vehicleRego || data.rego || data.bookingId || 'Eek Mechanical'
    rows.push(`<tr><td colspan="2" style="padding:20px 0 8px 0;border-top:1px solid #27272a;margin-top:16px;">
      <div style="font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Quick Actions - Customer</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${data.customerPhone ? `<a href="tel:${cleanPhone}" style="display:inline-block;background:#22c55e;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">📞 Call</a>` : ''}
        ${data.customerPhone ? `<a href="mailto:${cleanPhone}@sms.tnz.co.nz?subject=${encodeURIComponent(smsSubject)}" style="display:inline-block;background:#3b82f6;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">💬 Text</a>` : ''}
        ${data.customerEmail ? `<a href="mailto:${data.customerEmail}?subject=${encodeURIComponent(smsSubject + ' - Eek Mechanical')}" style="display:inline-block;background:#8b5cf6;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">✉️ Email</a>` : ''}
        ${data.bookingId ? `<a href="https://www.eek.co.nz/admin?tab=comms&job=${data.bookingId}" style="display:inline-block;background:#f97316;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">💼 Comms</a>` : ''}
        ${data.bookingId ? `<a href="https://www.eek.co.nz/admin?tab=jobs&job=${data.bookingId}" style="display:inline-block;background:#ef4444;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">📋 View Job</a>` : ''}
      </div>
    </td></tr>`)
  }
  
  // Admin action buttons for supplier notifications
  if ((data.type === 'supplier_assigned' || data.type === 'supplier_confirmed' || data.type === 'supplier_message') && (data.supplierPhone || data.supplierEmail || data.supplierName || data.bookingId || data.rego)) {
    const supplierPhone = data.supplierPhone || data.supplierMobile
    const cleanSupplierPhone = supplierPhone?.replace(/[\s\-()]/g, '').replace(/^\+?64/, '64') || ''
    const jobRef = data.bookingId || data.rego
    const smsSubject = data.vehicleRego || data.rego || data.bookingId || 'Eek Mechanical'
    rows.push(`<tr><td colspan="2" style="padding:20px 0 8px 0;border-top:1px solid #27272a;margin-top:16px;">
      <div style="font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Quick Actions - Supplier</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${supplierPhone ? `<a href="tel:${cleanSupplierPhone}" style="display:inline-block;background:#22c55e;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">📞 Call Supplier</a>` : ''}
        ${supplierPhone ? `<a href="mailto:${cleanSupplierPhone}@sms.tnz.co.nz?subject=${encodeURIComponent(smsSubject)}" style="display:inline-block;background:#3b82f6;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">💬 Text Supplier</a>` : ''}
        ${data.supplierEmail ? `<a href="mailto:${data.supplierEmail}?subject=${encodeURIComponent(smsSubject + ' - Eek Mechanical')}" style="display:inline-block;background:#8b5cf6;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">✉️ Email Supplier</a>` : ''}
        ${jobRef ? `<a href="https://www.eek.co.nz/admin?tab=comms&job=${jobRef}" style="display:inline-block;background:#f97316;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">💼 Comms</a>` : ''}
        ${jobRef ? `<a href="https://www.eek.co.nz/admin?tab=jobs&job=${jobRef}" style="display:inline-block;background:#ef4444;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">📋 View Job</a>` : ''}
      </div>
    </td></tr>`)
  }
  
  // Admin action buttons for customer_message
  if (data.type === 'customer_message' && (data.customerPhone || data.customerEmail || data.rego)) {
    const cleanCustPhone = data.customerPhone?.replace(/[\s\-()]/g, '').replace(/^\+?64/, '64') || ''
    const jobRef = data.bookingId || data.rego
    const smsSubject = data.vehicleRego || data.rego || data.bookingId || 'Eek Mechanical'
    rows.push(`<tr><td colspan="2" style="padding:20px 0 8px 0;border-top:1px solid #27272a;margin-top:16px;">
      <div style="font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Quick Actions - Reply to Customer</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${data.customerPhone ? `<a href="tel:${cleanCustPhone}" style="display:inline-block;background:#22c55e;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">📞 Call</a>` : ''}
        ${data.customerPhone ? `<a href="mailto:${cleanCustPhone}@sms.tnz.co.nz?subject=${encodeURIComponent(smsSubject)}" style="display:inline-block;background:#3b82f6;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">💬 Text</a>` : ''}
        ${data.customerEmail ? `<a href="mailto:${data.customerEmail}?subject=${encodeURIComponent(smsSubject + ' - Eek Mechanical')}" style="display:inline-block;background:#8b5cf6;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">✉️ Email</a>` : ''}
        ${jobRef ? `<a href="https://www.eek.co.nz/admin?tab=comms&job=${jobRef}" style="display:inline-block;background:#f97316;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">💼 Comms</a>` : ''}
        ${jobRef ? `<a href="https://www.eek.co.nz/admin?tab=jobs&job=${jobRef}" style="display:inline-block;background:#ef4444;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">📋 View Job</a>` : ''}
      </div>
    </td></tr>`)
  }
  
  return rows.join('')
}

export async function sendInternalNotification(data: NotificationData): Promise<boolean> {
  const token = await getToken()
  
  const timestamp = data.timestamp || new Date().toISOString()
  const title = getNotificationTitle(data.type)
  const emoji = getNotificationEmoji(data.type)
  
  // Build the email content
  const subject = `${emoji} ${title} - ${data.bookingId || 'Eek Mechanical'}`
  
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:32px 16px;">
    <tr>
      <td>
        <table width="100%" style="max-width:600px;margin:0 auto;background-color:#18181b;border-radius:16px;border:1px solid #27272a;">
          <!-- Header -->
          <tr>
            <td style="padding:24px 24px 16px 24px;border-bottom:1px solid #27272a;">
              <table width="100%">
                <tr>
                  <td>
                    <span style="font-size:20px;font-weight:700;color:#fff;">${emoji} ${title}</span>
                  </td>
                  <td style="text-align:right;">
                    <span style="font-size:12px;color:#71717a;">${new Date(timestamp).toLocaleString('en-NZ')}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Data Table -->
          <tr>
            <td style="padding:20px 24px;">
              <table width="100%" style="font-size:14px;">
                ${formatDataRows(data)}
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding:16px 24px;border-top:1px solid #27272a;text-align:center;">
              <span style="font-size:11px;color:#52525b;">Eek Mechanical | Get Going - Internal Notification</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  if (!token) {
    // Demo mode - just log
    console.log('INTERNAL NOTIFICATION (demo):', { type: data.type, bookingId: data.bookingId })
    return true
  }

  try {
    const response = await fetch(`https://graph.microsoft.com/v1.0/users/${INTERNAL_EMAIL}/sendMail`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: {
          subject,
          body: { contentType: 'HTML', content: htmlContent },
          toRecipients: [{ emailAddress: { address: INTERNAL_EMAIL } }]
        },
        saveToSentItems: false // Don't clutter sent items with internal notifications
      })
    })

    if (!response.ok) {
      console.error('Internal notification failed:', await response.text())
      return false
    }

    console.log('Internal notification sent:', data.type, data.bookingId || '')
    return true

  } catch (e) {
    console.error('Internal notification error:', e)
    return false
  }
}
