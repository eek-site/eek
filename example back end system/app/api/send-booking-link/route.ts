import { NextRequest, NextResponse } from 'next/server'
import { sendInternalNotification } from '@/lib/internal-notifications'

/**
 * Send booking link to customer via SMS and/or Email
 * 
 * Uses:
 * - Microsoft Graph API for Email
 * - TNZ email-to-SMS gateway for SMS (via Microsoft Graph)
 */

// Microsoft Graph credentials
const MS_TENANT_ID = process.env.MS_TENANT_ID || ''
const MS_CLIENT_ID = process.env.MS_CLIENT_ID || ''
const MS_CLIENT_SECRET = process.env.MS_CLIENT_SECRET || ''
// Always use no-reply for transactional emails to customers
const MS_FROM_EMAIL = 'no-reply@eek.co.nz'

interface MessageHistoryItem {
  from: string
  message: string
  timestamp: string
}

interface SendRequest {
  link: string
  phone?: string
  email?: string
  customerName: string
  price: string
  eta: string
  method: 'sms' | 'email' | 'both'
  isComms?: boolean
  isInvoice?: boolean
  // Extended data for notifications
  bookingId?: string
  pickupLocation?: string
  dropoffLocation?: string
  vehicleRego?: string
  vehicleMake?: string
  vehicleModel?: string
  vehicleColour?: string
  createdBy?: string
  // Comms-specific
  commsTarget?: 'customer' | 'supplier'
  portalLink?: string
  messageHistory?: MessageHistoryItem[]
}

// Cache for access token
let cachedToken: { token: string; expires: number } | null = null

async function getMicrosoftToken(): Promise<string | null> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && cachedToken.expires > Date.now() + 300000) {
    return cachedToken.token
  }

  if (!MS_TENANT_ID || !MS_CLIENT_ID || !MS_CLIENT_SECRET) {
    console.log('Microsoft Graph not configured - using demo mode')
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
      const error = await response.text()
      console.error('Failed to get Microsoft token:', error)
      return null
    }

    const data = await response.json()
    cachedToken = {
      token: data.access_token,
      expires: Date.now() + (data.expires_in * 1000)
    }
    
    return data.access_token
  } catch (e) {
    console.error('Microsoft token error:', e)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SendRequest = await request.json()
    
    const { 
      link, phone, email, customerName, price, eta, method, isComms, isInvoice,
      bookingId, pickupLocation, dropoffLocation, vehicleRego, vehicleMake, vehicleModel, vehicleColour, createdBy,
      commsTarget, portalLink: requestPortalLink, messageHistory
    } = body

    if (!link && !isComms) {
      return NextResponse.json({ error: 'Link is required' }, { status: 400 })
    }

    const results: { sms?: boolean; email?: boolean } = {}

    // Generate customer portal link using booking ID (simple, clean URL)
    let portalLink: string | undefined
    if (bookingId && !isComms && !isInvoice) {
      // Use short booking ID in URL - much cleaner than base64
      portalLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.eek.co.nz'}/customer/${bookingId}`
    }

    // Send SMS via TNZ gateway (using Microsoft Graph to send email)
    if ((method === 'sms' || method === 'both') && phone) {
      const smsResult = await sendSMSviaTNZ({
        phone,
        name: customerName,
        price,
        eta,
        link,
        isComms,
        portalLink: requestPortalLink || portalLink,
        vehicleRego,
        vehicleMake,
        vehicleModel,
        vehicleColour,
        pickupLocation,
        dropoffLocation,
        commsTarget
      })
      results.sms = smsResult
    }

    // Send Email via Microsoft Graph
    if ((method === 'email' || method === 'both') && email) {
      const emailResult = await sendEmail({
        email,
        name: customerName,
        price,
        eta,
        link,
        isComms,
        isInvoice,
        portalLink: requestPortalLink || portalLink,
        vehicleRego,
        vehicleMake,
        vehicleModel,
        vehicleColour,
        pickupLocation,
        dropoffLocation,
        commsTarget,
        messageHistory
      })
      results.email = emailResult
    }

    console.log('MESSAGE SENT:', {
      method,
      phone: phone ? phone.replace(/\d(?=\d{4})/g, '*') : null,
      email: email ? email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : null,
      results
    })

    // Check if any sends actually failed
    const smsFailed = (method === 'sms' || method === 'both') && phone && results.sms === false
    const emailFailed = (method === 'email' || method === 'both') && email && results.email === false
    
    if (smsFailed && emailFailed) {
      return NextResponse.json({
        success: false,
        results,
        error: 'Failed to send SMS and email. Please check configuration.'
      }, { status: 500 })
    }
    
    if (smsFailed) {
      return NextResponse.json({
        success: false,
        results,
        error: 'Failed to send SMS. Please check configuration.'
      }, { status: 500 })
    }
    
    if (emailFailed) {
      return NextResponse.json({
        success: false,
        results,
        error: 'Failed to send email. Please check configuration.'
      }, { status: 500 })
    }

    // Send internal notification
    sendInternalNotification({
      type: 'booking_link_sent',
      bookingId,
      customerName,
      customerPhone: phone,
      customerEmail: email,
      pickupLocation,
      dropoffLocation,
      price,
      eta,
      vehicleRego,
      vehicleMake,
      vehicleModel,
      vehicleColour,
      createdBy
    }).catch(() => {}) // Don't block on notification failure

    return NextResponse.json({
      success: true,
      results,
      message: 'Message sent successfully'
    })

  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

async function sendViaMicrosoftGraph(toEmail: string, subject: string, htmlContent: string, textContent?: string): Promise<boolean> {
  const token = await getMicrosoftToken()
  
  if (!token) {
    // Demo mode
    console.log('📧 DEMO EMAIL:', { to: toEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3'), subject })
    return true
  }

  try {
    const graphUrl = `https://graph.microsoft.com/v1.0/users/${MS_FROM_EMAIL}/sendMail`
    
    const emailPayload = {
      message: {
        subject,
        body: {
          contentType: textContent ? 'Text' : 'HTML',
          content: textContent || htmlContent
        },
        toRecipients: [
          { emailAddress: { address: toEmail } }
        ]
      },
      saveToSentItems: true
    }

    const response = await fetch(graphUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Microsoft Graph send failed:', error)
      return false
    }

    console.log('📧 Email sent via Microsoft Graph to:', toEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3'))
    return true

  } catch (e) {
    console.error('Microsoft Graph error:', e)
    return false
  }
}

interface SMSData {
  phone: string
  name: string
  price: string
  eta: string
  link: string
  isComms?: boolean
  portalLink?: string
  vehicleRego?: string
  vehicleMake?: string
  vehicleModel?: string
  vehicleColour?: string
  pickupLocation?: string
  dropoffLocation?: string
  commsTarget?: 'customer' | 'supplier'
}

async function sendSMSviaTNZ(data: SMSData): Promise<boolean> {
  const { phone, name, price, eta, link, isComms, portalLink, vehicleRego, vehicleMake, vehicleModel, vehicleColour, pickupLocation, dropoffLocation, commsTarget } = data
  
  // Format phone number for TNZ gateway: 21123456@sms.tnz.co.nz
  let formattedPhone = phone.replace(/[\s\-()]/g, '')
  if (formattedPhone.startsWith('+64')) {
    formattedPhone = formattedPhone.substring(3)
  }
  if (formattedPhone.startsWith('0')) {
    formattedPhone = formattedPhone.substring(1)
  }
  
  const tnzEmail = `${formattedPhone}@sms.tnz.co.nz`
  
  // Build SMS message - GSM-7 compatible (no unicode = cheaper SMS), concise but informative
  let message: string
  if (isComms) {
    // Format comms message with context - link goes to messages tab
    const parts: string[] = []
    parts.push('Eek Mechanical | Get Going')
    if (vehicleRego) {
      parts.push(`Re: ${vehicleRego}`)
    }
    parts.push('')
    parts.push(link) // The actual message content
    parts.push('')
    if (portalLink) {
      // Direct link to messages tab
      const messagesLink = `${portalLink}?tab=messages`
      parts.push(`Reply: ${messagesLink}`)
    } else {
      parts.push('Reply: 0800 769 000')
    }
    message = parts.join('\n')
  } else {
    // Build vehicle description - only if we have data
    const vehicleDesc = [vehicleColour, vehicleMake, vehicleModel].filter(Boolean).join(' ')
    const vehicleLine = vehicleRego 
      ? (vehicleDesc ? `${vehicleRego} - ${vehicleDesc}` : vehicleRego)
      : vehicleDesc // No rego and no desc = empty string
    
    // Shorten locations for SMS (take first part before comma)
    const shortPickup = pickupLocation ? pickupLocation.split(',')[0].trim() : ''
    const shortDropoff = dropoffLocation ? dropoffLocation.split(',')[0].trim() : ''
    
    // Build message parts - only include lines with actual data
    const parts: string[] = []
    parts.push(`Eek Mechanical | Get Going - ${price}`)
    parts.push('') // blank line after header
    
    if (vehicleLine) parts.push(`Vehicle: ${vehicleLine}`)
    if (shortPickup) parts.push(`From: ${shortPickup}`)
    if (shortDropoff) parts.push(`To: ${shortDropoff}`)
    parts.push(`ETA: ${eta}`)
    
    parts.push('') // blank line before link
    parts.push(`Book & pay: ${link}`)
    parts.push('')
    parts.push(`Questions? Reply or call 0800 769 000`)
    
    message = parts.join('\n')
    
    // Clean up any double newlines from empty parts
    message = message.replace(/\n\n\n+/g, '\n\n')
  }

  // Send via Microsoft Graph to TNZ gateway
  const result = await sendViaMicrosoftGraph(tnzEmail, 'SMS', '', message)
  
  if (result) {
    console.log('📱 SMS sent via TNZ to:', formattedPhone.replace(/\d(?=\d{4})/g, '*'))
  }
  
  return result
}

interface EmailData {
  email: string
  name: string
  price: string
  eta: string
  link: string
  isComms?: boolean
  isInvoice?: boolean
  portalLink?: string
  vehicleRego?: string
  vehicleMake?: string
  vehicleModel?: string
  vehicleColour?: string
  pickupLocation?: string
  dropoffLocation?: string
  commsTarget?: 'customer' | 'supplier'
  messageHistory?: MessageHistoryItem[]
}

async function sendEmail(data: EmailData): Promise<boolean> {
  const { email, name, price, eta, link, isComms, isInvoice, portalLink, vehicleRego, vehicleMake, vehicleModel, vehicleColour, pickupLocation, dropoffLocation, commsTarget, messageHistory } = data
  
  let subject: string
  let htmlContent: string
  
  // Build vehicle description for display
  const vehicleDesc = [vehicleColour, vehicleMake, vehicleModel].filter(Boolean).join(' ')
  const vehicleDisplay = vehicleRego 
    ? (vehicleDesc ? `${vehicleRego} - ${vehicleDesc}` : vehicleRego)
    : (vehicleDesc || '')
  
  // Helper to format message sender
  const formatSender = (from: string) => {
    if (from === 'customer') return 'Customer'
    if (from.includes('supplier')) return 'Supplier'
    if (from.includes('hook') || from.includes('to_')) return 'Eek Mechanical'
    return 'Unknown'
  }
  
  // Helper to format time
  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleString('en-NZ', { 
        day: 'numeric', 
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } catch {
      return ''
    }
  }
  
  // Modern corporate email template - table-based, 600px width, email-client compatible
  const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Eek Mechanical | Get Going</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <style>
    table { border-collapse: collapse; }
    td { font-family: Arial, sans-serif; }
  </style>
  <![endif]-->
  <style>
    /* Reset */
    body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .dark-bg { background-color: #09090b !important; }
      .dark-text { color: #ffffff !important; }
    }
    
    /* Mobile responsive */
    @media screen and (max-width: 600px) {
      .mobile-full { width: 100% !important; }
      .mobile-padding { padding: 20px !important; }
      .mobile-center { text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: Arial, Helvetica, sans-serif;">
  <!-- Preheader -->
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    Eek Mechanical | Get Going — New Zealand's fastest towing service&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  
  <!-- Wrapper Table -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #09090b;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        
        <!-- Container 600px -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="mobile-full" style="max-width: 600px; width: 100%;">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <!-- Text-based logo for maximum compatibility -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="font-family: Arial, Helvetica, sans-serif; font-size: 26px; font-weight: bold; color: #ffffff; letter-spacing: -0.5px;">
                          Eek Mechanical<span style="color: #71717a; font-weight: normal;"> | </span><span style="color: #ef4444;">Get Going</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content Card -->
          <tr>
            <td>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #18181b; border-radius: 16px; border: 1px solid #27272a;">
                <tr>
                  <td class="mobile-padding" style="padding: 32px;">
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <!-- Phone Button -->
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="background-color: #27272a; border-radius: 8px;">
                          <a href="tel:0800769000" style="display: inline-block; padding: 14px 28px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: bold; color: #ffffff; text-decoration: none;">
                            &#128222; 0800 769 000
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ${portalLink ? `
                <!-- Portal Link -->
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <a href="${portalLink}" style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #ef4444; text-decoration: none;">
                      &#128172; Message us directly
                    </a>
                  </td>
                </tr>
                ` : ''}
                <!-- Trust Badges -->
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <span style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #52525b;">
                      &#128274; Secure &nbsp;&bull;&nbsp; &#127464;&#127475; 100% Kiwi Owned
                    </span>
                  </td>
                </tr>
                <!-- Company Info -->
                <tr>
                  <td align="center">
                    <p style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #3f3f46; margin: 0; line-height: 1.6;">
                      Eek Mechanical | Get Going<br>
                      <a href="https://www.eek.co.nz" style="color: #52525b; text-decoration: none;">www.eek.co.nz</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  
  if (isComms) {
    // Build subject with rego for traceability
    subject = vehicleRego 
      ? `${vehicleRego} — Message from Eek Mechanical`
      : `Message from Eek Mechanical`
    
    // Filter messages based on target
    const filteredHistory = (messageHistory || []).filter(msg => {
      if (commsTarget === 'customer') {
        if (msg.from === 'customer') return true
        if (msg.from === 'hook_towing_to_customer') return true
        return false
      } else if (commsTarget === 'supplier') {
        if (msg.from.includes('supplier')) return true
        if (msg.from === 'hook_towing_to_supplier') return true
        return false
      }
      return true
    })
    
    // Build all messages: history + new message, sorted oldest to newest
    const allMessages = [
      ...filteredHistory,
      { from: commsTarget === 'supplier' ? 'hook_towing_to_supplier' : 'hook_towing_to_customer', message: link, timestamp: new Date().toISOString(), isNew: true }
    ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    
    // Build chat HTML with table-based left/right layout
    const chatRowsHtml = allMessages.map(msg => {
      const isHook = msg.from.includes('hook') || msg.from.includes('to_')
      const isCustomer = msg.from === 'customer'
      const isSupplier = msg.from.includes('supplier')
      const isNew = (msg as any).isNew
      
      // Eek Mechanical = left (gray), Customer/Supplier = right (red/orange)
      const alignLeft = isHook
      
      // Different colors for customer vs supplier emails
      let bgColor, borderColor, senderLabel, senderColor
      if (commsTarget === 'supplier') {
        // Supplier email: Hook on left (gray), Supplier on right (orange)
        bgColor = isSupplier ? '#3d2a1a' : '#27272a'
        borderColor = isNew ? '#f97316' : (isSupplier ? '#7c4a1a' : '#3f3f46')
        senderLabel = isSupplier ? 'You' : 'Eek Mechanical | Get Going'
        senderColor = isSupplier ? '#fdba74' : '#a1a1aa'
      } else {
        // Customer email: Hook on left (gray), Customer on right (red)
        bgColor = isCustomer ? '#3b1c1c' : '#27272a'
        borderColor = isNew ? '#ef4444' : (isCustomer ? '#5c2626' : '#3f3f46')
        senderLabel = isCustomer ? 'You' : 'Eek Mechanical | Get Going'
        senderColor = isCustomer ? '#fca5a5' : '#a1a1aa'
      }
      
      const accentColor = commsTarget === 'supplier' ? '#f97316' : '#ef4444'
      const newBadge = isNew ? `<span style="background-color: ${accentColor}; color: #ffffff; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 3px; margin-left: 8px; text-transform: uppercase;">New</span>` : ''
      
      // Single row with align left or right - simpler and more reliable
      return `
        <tr>
          <td align="${alignLeft ? 'left' : 'right'}" style="padding: 6px 0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="max-width: 85%; ${alignLeft ? '' : 'margin-left: auto;'}">
              <tr>
                <td style="background-color: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 12px; ${alignLeft ? 'border-bottom-left-radius: 4px;' : 'border-bottom-right-radius: 4px;'} padding: 12px 16px;">
                  <p style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: ${senderColor}; margin: 0 0 6px 0; ${alignLeft ? '' : 'text-align: right;'}">${senderLabel} &bull; ${formatTime(msg.timestamp)}${newBadge}</p>
                  <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #ffffff; margin: 0; line-height: 1.5; ${alignLeft ? '' : 'text-align: right;'}">${msg.message}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `
    }).join('')
    
    // Portal link to messages
    const messagesLink = portalLink ? `${portalLink}?tab=messages` : ''
    
    const content = `
      <!-- Vehicle Badge -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
        <tr>
          <td style="background-color: #27272a; border-radius: 12px; padding: 16px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td>
                  ${vehicleRego ? `<p style="font-family: 'Courier New', monospace; font-size: 22px; font-weight: bold; color: #ef4444; margin: 0;">${vehicleRego}</p>` : ''}
                  ${vehicleDisplay ? `<p style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #a1a1aa; margin: 4px 0 0 0;">${vehicleDisplay}</p>` : ''}
                </td>
                <td style="text-align: right; vertical-align: top;">
                  ${pickupLocation ? `<p style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #71717a; margin: 0;">&#128205; ${pickupLocation.split(',')[0]}</p>` : ''}
                  ${dropoffLocation ? `<p style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #71717a; margin: 4px 0 0 0;">&#127937; ${dropoffLocation.split(',')[0]}</p>` : ''}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      
      <!-- Chat Conversation -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
        <tr>
          <td style="background-color: #0c0c0c; border-radius: 12px; padding: 16px;">
            <!-- Chat Header -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 16px; border-bottom: 1px solid #27272a; padding-bottom: 12px;">
              <tr>
                <td>
                  <p style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: bold; color: #ffffff; margin: 0;">&#128172; Conversation</p>
                </td>
                <td style="text-align: right;">
                  <p style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #71717a; margin: 0;">${allMessages.length} messages</p>
                </td>
              </tr>
            </table>
            <!-- Chat Messages -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              ${chatRowsHtml}
            </table>
          </td>
        </tr>
      </table>
      
      <!-- Reply Button -->
      ${messagesLink ? `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td align="center">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="background-color: ${commsTarget === 'supplier' ? '#f97316' : '#ef4444'}; border-radius: 10px; text-align: center;">
                  <a href="${messagesLink}" style="display: block; padding: 18px 24px; font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none;">
                    &#128172; Reply to this conversation
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      ` : ''}
    `
    htmlContent = emailWrapper(content)
    
  } else if (isInvoice) {
    // Use rego in subject for traceability
    subject = vehicleRego 
      ? `${vehicleRego} — Invoice ${price} | Eek Mechanical`
      : `Invoice ${price} — Eek Mechanical | Get Going`
    const content = `
      <!-- Invoice Badge -->
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; background-color: rgba(239, 68, 68, 0.15); color: #ef4444; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; padding: 6px 16px; border-radius: 100px; text-transform: uppercase;">
          Invoice
        </span>
      </div>
      
      <h2 style="font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 8px 0; text-align: center; letter-spacing: -0.5px;">
        Hi there,
      </h2>
      <p style="color: #71717a; font-size: 14px; text-align: center; margin: 0 0 28px 0;">
        Here's your invoice from Eek Mechanical
      </p>
      
      <!-- Amount Card -->
      <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 16px; padding: 28px; text-align: center; margin-bottom: 24px;">
        <div style="color: rgba(255,255,255,0.7); font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;">
          Amount Due
        </div>
        <div style="color: #ffffff; font-size: 42px; font-weight: 800; letter-spacing: -1px;">
          ${price}
        </div>
      </div>
      
      <!-- Details -->
      <div style="background-color: #27272a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <div style="color: #a1a1aa; font-size: 14px; line-height: 1.7;">
          ${link}
        </div>
      </div>
      
      <!-- Pay Button -->
      <a href="${link}" style="display: block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; padding: 18px 32px; border-radius: 14px; text-align: center; font-weight: 700; font-size: 16px; letter-spacing: -0.3px; box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4);">
        Pay Now →
      </a>
    `
    htmlContent = emailWrapper(content)
    
  } else {
    // Main booking email - the hero!
    // Use rego in subject for traceability
    subject = vehicleRego 
      ? `${vehicleRego} — Tow Booking ${price} | Eek Mechanical`
      : `Your Booking ${price} — Eek Mechanical | Get Going`
    
    const content = `
      <!-- Status Badge -->
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; background-color: rgba(34, 197, 94, 0.15); color: #22c55e; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; padding: 6px 16px; border-radius: 100px; text-transform: uppercase;">
          ✓ Booking Ready
        </span>
      </div>
      
      <!-- Greeting -->
      <h2 style="font-size: 26px; font-weight: 700; color: #ffffff; margin: 0 0 12px 0; text-align: center; letter-spacing: -0.5px;">
        Hi there 👋
      </h2>
      <p style="color: #a1a1aa; font-size: 15px; text-align: center; margin: 0 0 28px 0; line-height: 1.6;">
        Thanks for calling! Your tow truck booking is ready.<br>
        Complete your payment to confirm.
      </p>
      
      <!-- Vehicle Details Card -->
      ${vehicleDisplay ? `
      <div style="background-color: #27272a; border-radius: 14px; padding: 20px; margin-bottom: 16px;">
        <div style="color: #71717a; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;">
          🚗 Vehicle
        </div>
        <div style="color: #ffffff; font-size: 18px; font-weight: 700; letter-spacing: -0.5px;">
          ${vehicleDisplay}
        </div>
      </div>
      ` : ''}
      
      <!-- Locations Card -->
      ${(pickupLocation || dropoffLocation) ? `
      <div style="background-color: #27272a; border-radius: 14px; padding: 20px; margin-bottom: 16px;">
        ${pickupLocation ? `
        <div style="margin-bottom: ${dropoffLocation ? '16px' : '0'};">
          <div style="color: #ef4444; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px;">
            📍 Pickup
          </div>
          <div style="color: #ffffff; font-size: 14px; line-height: 1.5;">
            ${pickupLocation}
          </div>
        </div>
        ` : ''}
        ${dropoffLocation ? `
        <div>
          <div style="color: #22c55e; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px;">
            📍 Drop-off
          </div>
          <div style="color: #ffffff; font-size: 14px; line-height: 1.5;">
            ${dropoffLocation}
          </div>
        </div>
        ` : ''}
      </div>
      ` : ''}
      
      <!-- Price & ETA Cards -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="width: 50%; padding-right: 8px;">
            <div style="background-color: #27272a; border-radius: 14px; padding: 20px; text-align: center;">
              <div style="color: #71717a; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px;">
                Total
              </div>
              <div style="color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -1px;">
                ${price}
              </div>
            </div>
          </td>
          <td style="width: 50%; padding-left: 8px;">
            <div style="background-color: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 14px; padding: 20px; text-align: center;">
              <div style="color: #22c55e; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px;">
                ETA
              </div>
              <div style="color: #22c55e; font-size: 28px; font-weight: 800; letter-spacing: -1px;">
                ${eta}
              </div>
            </div>
          </td>
        </tr>
      </table>
      
      <!-- Pay Button -->
      <a href="${link}" style="display: block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; padding: 20px 32px; border-radius: 14px; text-align: center; font-weight: 700; font-size: 18px; letter-spacing: -0.3px; box-shadow: 0 4px 24px rgba(239, 68, 68, 0.5); margin-bottom: 20px;">
        Pay & Confirm Booking →
      </a>
      
      <!-- Reassurance -->
      <p style="color: #71717a; font-size: 13px; text-align: center; margin: 0; line-height: 1.6;">
        Nothing is charged until you confirm payment online.<br>
        Your details are pre-loaded on the booking page.
      </p>
      
      ${portalLink ? `
      <!-- Contact Us Section -->
      <div style="background-color: #27272a; border-radius: 12px; padding: 16px; margin: 24px 0; text-align: center;">
        <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 12px 0;">
          Need to change something or have questions?
        </p>
        <a href="${portalLink}" style="display: inline-block; background-color: #3f3f46; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600;">
          💬 Message Us
        </a>
      </div>
      ` : ''}
      
      <!-- Divider -->
      <div style="border-top: 1px solid #27272a; margin: 28px 0;"></div>
      
      <!-- What happens next -->
      <h3 style="font-size: 14px; font-weight: 700; color: #ffffff; margin: 0 0 16px 0; letter-spacing: -0.3px;">
        What happens next?
      </h3>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding-bottom: 12px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="vertical-align: top; padding-right: 12px;">
                  <div style="width: 24px; height: 24px; background-color: #27272a; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; color: #ffffff; font-weight: 700;">1</div>
                </td>
                <td style="color: #a1a1aa; font-size: 14px; line-height: 1.5;">
                  <strong style="color: #ffffff;">Pay online</strong> — takes 2 minutes
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: 12px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="vertical-align: top; padding-right: 12px;">
                  <div style="width: 24px; height: 24px; background-color: #27272a; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; color: #ffffff; font-weight: 700;">2</div>
                </td>
                <td style="color: #a1a1aa; font-size: 14px; line-height: 1.5;">
                  <strong style="color: #ffffff;">Booking confirmed</strong> instantly
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="vertical-align: top; padding-right: 12px;">
                  <div style="width: 24px; height: 24px; background-color: #22c55e; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; color: #ffffff; font-weight: 700;">3</div>
                </td>
                <td style="color: #a1a1aa; font-size: 14px; line-height: 1.5;">
                  <strong style="color: #22c55e;">Driver on the way!</strong>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `
    htmlContent = emailWrapper(content)
  }

  return sendViaMicrosoftGraph(email, subject, htmlContent)
}

// Legacy function signature for backwards compatibility - no longer used
// async function sendSMSviaTNZLegacy(phone: string, name: string, price: string, eta: string, link: string, isComms?: boolean, portalLink?: string): Promise<boolean> {
//   return sendSMSviaTNZ({ phone, name, price, eta, link, isComms, portalLink })
// }
