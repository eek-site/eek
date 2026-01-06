import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { uploadToSharePoint, SHAREPOINT_FOLDERS, generateInvoiceFilename } from '@/lib/sharepoint'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const bookingId = formData.get('bookingId') as string | null
    
    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 })
    }
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid file type. Please upload PDF, PNG, or JPG'
      }, { status: 400 })
    }
    
    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: 'File too large. Maximum size is 10MB'
      }, { status: 400 })
    }
    
    // Get additional metadata for filename
    const rego = formData.get('rego') as string || 'UNKNOWN'
    const supplierName = formData.get('supplierName') as string || 'Supplier'
    const amount = parseFloat(formData.get('amount') as string || '0')
    
    // Generate filename: {DATE}_{REGO}_{SupplierName}_${Amount}.{ext}
    const ext = file.name.split('.').pop() || 'pdf'
    const filename = generateInvoiceFilename(rego, supplierName, amount, ext)
    
    // Get file content as ArrayBuffer for SharePoint
    const fileBuffer = await file.arrayBuffer()
    
    // Upload to Vercel Blob
    let blobUrl: string | undefined
    try {
      const blob = await put(`invoices/${filename}`, file, {
        access: 'public',
        addRandomSuffix: false
      })
      blobUrl = blob.url
      console.log('Invoice uploaded to Vercel Blob:', blob.url)
    } catch (blobError) {
      console.error('Blob upload error:', blobError)
    }
    
    // Also upload to SharePoint
    let sharePointUrl: string | undefined
    try {
      const spResult = await uploadToSharePoint(
        SHAREPOINT_FOLDERS.SUPPLIER_INVOICES,
        filename,
        fileBuffer,
        file.type
      )
      if (spResult.success) {
        sharePointUrl = spResult.webUrl
        console.log('Invoice uploaded to SharePoint:', sharePointUrl)
      }
    } catch (spError) {
      console.error('SharePoint upload error:', spError)
    }
    
    // Return success if at least one upload succeeded
    if (!blobUrl && !sharePointUrl) {
      return NextResponse.json({
        success: false,
        error: 'Failed to upload file to any storage'
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      url: blobUrl || sharePointUrl,
      blobUrl,
      sharePointUrl,
      filename
    })
    
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to upload file'
    }, { status: 500 })
  }
}
