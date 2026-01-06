interface AdminNotificationOptions {
  title: string
  body: string
  url?: string
  tab?: string
  rego?: string
  tag?: string
}

/**
 * Send a push notification to all subscribed admins
 * @param options - Notification options
 */
export async function sendAdminNotification(
  options: AdminNotificationOptions
): Promise<{ sent: number; total: number }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.eek.co.nz'
    
    const response = await fetch(`${baseUrl}/api/admin-notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    })

    const result = await response.json()
    return { 
      sent: result.sent || 0, 
      total: result.total || 0 
    }
  } catch (error) {
    console.error('Failed to send admin notification:', error)
    return { sent: 0, total: 0 }
  }
}

/**
 * Notification templates for common admin events
 */
export const AdminNotifications = {
  newJob: (rego: string, location: string) => ({
    title: '🚗 New Job',
    body: `${rego} - ${location}`,
    tab: 'jobs',
    rego: rego,
    tag: `job-${rego}`
  }),

  newCustomerMessage: (rego: string, customerName: string, preview: string) => ({
    title: '💬 Customer Message',
    body: `${customerName}: ${preview}`,
    tab: 'comms',
    rego: rego,
    tag: `customer-msg-${rego}`
  }),

  newSupplierMessage: (rego: string, supplierName: string, preview: string) => ({
    title: '🏢 Supplier Message',
    body: `${supplierName}: ${preview}`,
    tab: 'comms',
    rego: rego,
    tag: `supplier-msg-${rego}`
  }),

  supplierDeclined: (rego: string, supplierName: string, reason?: string) => ({
    title: '❌ Job Declined',
    body: `${supplierName} declined ${rego}${reason ? `: ${reason}` : ''}`,
    tab: 'supplier',
    rego: rego,
    tag: `declined-${rego}`
  }),

  jobCompleted: (rego: string, supplierName: string) => ({
    title: '✅ Job Completed',
    body: `${supplierName} completed ${rego}`,
    tab: 'billing',
    rego: rego,
    tag: `completed-${rego}`
  }),

  paymentReceived: (rego: string, amount: number) => ({
    title: '💰 Payment Received',
    body: `$${(amount / 100).toFixed(2)} for ${rego}`,
    tab: 'billing',
    rego: rego,
    tag: `payment-${rego}`
  }),

  newVisitor: (location: string, referrer?: string) => ({
    title: '👀 New Visitor',
    body: `${location}${referrer ? ` from ${referrer}` : ''}`,
    tab: 'visitors',
    tag: 'visitor'
  })
}
