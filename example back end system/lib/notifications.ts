import { kv } from '@vercel/kv'

interface NotificationOptions {
  title: string
  body: string
  url?: string
  jobId?: string
  tab?: string
  tag?: string
}

/**
 * Send a push notification to a supplier
 * @param portalCode - The supplier's portal code
 * @param options - Notification options
 */
export async function sendSupplierNotification(
  portalCode: string,
  options: NotificationOptions
): Promise<boolean> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.eek.co.nz'
    
    const response = await fetch(`${baseUrl}/api/supplier-notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        portalCode,
        ...options
      })
    })

    const result = await response.json()
    return result.success && result.sent
  } catch (error) {
    console.error('Failed to send supplier notification:', error)
    return false
  }
}

/**
 * Send a push notification to a supplier by their name
 * @param supplierName - The supplier's name
 * @param options - Notification options
 */
export async function sendSupplierNotificationByName(
  supplierName: string,
  options: NotificationOptions
): Promise<boolean> {
  try {
    // Get the supplier's portal code
    const supplier = await kv.get(`supplier:${supplierName}`) as { portalCode?: string } | null
    
    if (!supplier?.portalCode) {
      console.warn(`No portal code found for supplier: ${supplierName}`)
      return false
    }

    return sendSupplierNotification(supplier.portalCode, options)
  } catch (error) {
    console.error('Failed to send supplier notification by name:', error)
    return false
  }
}
