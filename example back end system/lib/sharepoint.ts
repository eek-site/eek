// Microsoft Graph credentials for SharePoint upload
const MS_TENANT_ID = process.env.MS_TENANT_ID || ''
const MS_CLIENT_ID = process.env.MS_CLIENT_ID || ''
const MS_CLIENT_SECRET = process.env.MS_CLIENT_SECRET || ''

// SharePoint location
const SHAREPOINT_SITE = 'roadandrescue.sharepoint.com'
const SHAREPOINT_SITE_PATH = '/sites/rar'

async function getGraphAccessToken(): Promise<string> {
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
  
  const data = await response.json()
  if (!data.access_token) {
    console.error('Failed to get Graph token:', data)
    throw new Error('Failed to authenticate with Microsoft Graph')
  }
  return data.access_token
}

export interface SharePointUploadResult {
  success: boolean
  webUrl?: string
  error?: string
}

/**
 * Upload a file to SharePoint
 * @param folder - Folder path within the document library
 * @param filename - Name of the file
 * @param content - File content (string or ArrayBuffer)
 * @param contentType - MIME type of the file
 */
export async function uploadToSharePoint(
  folder: string,
  filename: string,
  content: string | ArrayBuffer,
  contentType: string = 'application/octet-stream'
): Promise<SharePointUploadResult> {
  // Skip if credentials not configured
  if (!MS_TENANT_ID || !MS_CLIENT_ID || !MS_CLIENT_SECRET) {
    console.log('SharePoint credentials not configured, skipping upload')
    return { success: false, error: 'SharePoint not configured' }
  }

  try {
    const accessToken = await getGraphAccessToken()
    
    // Get the site ID
    const siteResponse = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${SHAREPOINT_SITE}:${SHAREPOINT_SITE_PATH}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const siteData = await siteResponse.json()
    
    if (!siteData.id) {
      console.error('SharePoint site not found:', siteData)
      return { success: false, error: 'SharePoint site not found' }
    }
    
    // Get the default drive (document library)
    const driveResponse = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${siteData.id}/drive`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const driveData = await driveResponse.json()
    
    if (!driveData.id) {
      console.error('SharePoint drive not found:', driveData)
      return { success: false, error: 'SharePoint drive not found' }
    }
    
    // Upload the file to the specified folder
    const uploadUrl = `https://graph.microsoft.com/v1.0/sites/${siteData.id}/drives/${driveData.id}/root:/${folder}/${filename}:/content`
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': contentType
      },
      body: content
    })
    
    const uploadData = await uploadResponse.json()
    
    if (uploadData.id) {
      console.log('File uploaded to SharePoint:', uploadData.webUrl)
      return { success: true, webUrl: uploadData.webUrl }
    } else {
      console.error('SharePoint upload failed:', uploadData)
      return { success: false, error: uploadData.error?.message || 'Upload failed' }
    }
  } catch (error) {
    console.error('SharePoint upload error:', error)
    return { success: false, error: 'SharePoint upload failed' }
  }
}

// Folder paths matching OneDrive sync structure
export const SHAREPOINT_FOLDERS = {
  // DLO batch files: 9998 LOGS/BatchFiles
  DLO: '9998 LOGS/BatchFiles',
  // Supplier invoices: 1000 ACCOUNTING AND LEGAL/Eek Mechanical Ltd/1010 SUPPLIERS/SUPPLIER INVOICE RECORD
  SUPPLIER_INVOICES: '1000 ACCOUNTING AND LEGAL/Eek Mechanical Ltd/1010 SUPPLIERS/SUPPLIER INVOICE RECORD'
}

/**
 * Generate DLO filename: {REGO}_{SupplierName}.DLO
 */
export function generateDloFilename(rego: string, supplierName: string): string {
  // Clean supplier name - remove spaces and special chars
  const cleanSupplier = supplierName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 15)
  return `${rego}_${cleanSupplier}.DLO`
}

/**
 * Generate supplier invoice filename: {DATE}_{REGO}_{SupplierName}_${Amount}.pdf
 */
export function generateInvoiceFilename(
  rego: string, 
  supplierName: string, 
  amount: number,
  extension: string = 'pdf'
): string {
  const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const cleanSupplier = supplierName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 15)
  const amountStr = amount.toFixed(2)
  return `${date}_${rego}_${cleanSupplier}_$${amountStr}.${extension}`
}
