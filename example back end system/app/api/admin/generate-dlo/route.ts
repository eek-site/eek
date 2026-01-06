import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { put } from '@vercel/blob'
import { uploadToSharePoint, SHAREPOINT_FOLDERS, generateDloFilename } from '@/lib/sharepoint'

interface JobForPayment {
  bookingId: string
  rego: string
  supplierName: string
  supplierPrice: number
  supplierInvoiceRef?: string // Optional - not required for payment
  supplierInvoiceAmount?: number
  supplierPaidAt?: string
  status: string
}

interface SupplierRecord {
  name: string
  legalName?: string
  bankAccount?: string
  bankAccountName?: string
  bankName?: string
}

// GET - Generate DLO file for pending supplier payments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const preview = searchParams.get('preview') === 'true'
    const includeAll = searchParams.get('all') === 'true' // Include all unpaid, not just completed
    
    // Get all jobs that need payment:
    // - Has supplier assigned with bank details
    // - Has agreed price (supplierPrice)
    // - Not yet paid (no supplierPaidAt)
    // - Optionally filter by status (completed jobs only by default)
    const allJobIds = await kv.lrange('jobs:list', 0, 500) as string[]
    const pendingPayments: Array<JobForPayment & { supplier: SupplierRecord }> = []
    
    for (const jobId of allJobIds) {
      const job = await kv.hgetall(`job:${jobId}`) as Record<string, unknown> | null
      
      if (!job) continue
      
      // Must have: supplier, approved payment, not paid
      const hasSupplier = !!job.supplierName
      const hasApprovedPayment = !!job.supplierPaymentApproved
      const notPaid = !job.supplierPaidAt
      const status = job.status as string || ''
      
      // By default only pay completed jobs, unless ?all=true
      const statusOk = includeAll || ['completed', 'closed'].includes(status)
      
      // Only include jobs where payment has been APPROVED by admin
      if (hasSupplier && hasApprovedPayment && notPaid && statusOk) {
        // Get supplier details
        const supplier = await kv.hgetall(`supplier:${job.supplierName}`) as SupplierRecord | null
        
        if (supplier && supplier.bankAccount) {
          pendingPayments.push({
            bookingId: job.bookingId as string || jobId,
            rego: job.rego as string || '',
            supplierName: job.supplierName as string,
            // Use admin-approved amount, fallback to supplier invoice, then supplier price
            supplierPrice: (job.supplierApprovedAmount as number) || (job.supplierInvoiceAmount as number) || (job.supplierPrice as number) || 0,
            supplierInvoiceRef: job.supplierInvoiceRef as string | undefined,
            supplierInvoiceAmount: job.supplierInvoiceAmount as number | undefined,
            status,
            supplier
          })
        }
      }
    }
    
    if (pendingPayments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending supplier payments',
        count: 0,
        payments: []
      })
    }
    
    // Calculate payment amount (invoice amount if set, otherwise supplier price)
    const getPaymentAmount = (p: typeof pendingPayments[0]) => 
      p.supplierInvoiceAmount || p.supplierPrice || 0
    
    // If preview mode, just return the data
    if (preview) {
      return NextResponse.json({
        success: true,
        count: pendingPayments.length,
        totalAmount: pendingPayments.reduce((sum, p) => sum + getPaymentAmount(p), 0) / 100,
        payments: pendingPayments.map(p => ({
          supplierName: p.supplierName,
          legalName: p.supplier.legalName || p.supplier.name,
          rego: p.rego,
          bookingId: p.bookingId,
          invoiceRef: p.supplierInvoiceRef || '(no invoice)',
          amount: (getPaymentAmount(p) / 100).toFixed(2),
          bankAccount: p.supplier.bankAccount,
          status: p.status
        }))
      })
    }
    
    // Generate individual DLO files for each payment
    // Format: Amount,BankAccount,CompanyName,Ref1,Ref2,Particulars,Code,Reference,Name
    // Filename format: {REGO}_{SupplierName}.DLO
    
    const uploadResults: Array<{ rego: string; supplier: string; blobUrl?: string; sharePointUrl?: string }> = []
    
    for (const payment of pendingPayments) {
      const amount = (getPaymentAmount(payment) / 100).toFixed(2)
      const bankAccount = payment.supplier.bankAccount || ''
      const companyName = (payment.supplier.legalName || payment.supplier.name || '').substring(0, 20)
      const ref1 = payment.rego.substring(0, 12)
      const ref2 = 'HOOK'
      const particulars = (payment.supplierInvoiceRef || payment.rego).substring(0, 12)
      const code = payment.rego.substring(0, 12)
      const reference = 'HOOK'
      const name = companyName
      
      const dloContent = `${amount},${bankAccount},${companyName},${ref1},${ref2},${particulars},${code},${reference},${name}`
      const filename = generateDloFilename(payment.rego, payment.supplierName)
      
      let blobUrl: string | undefined
      let sharePointUrl: string | undefined
      
      // Upload to Vercel Blob
      try {
        const blob = await put(`dlo-files/${filename}`, dloContent, {
          access: 'public',
          addRandomSuffix: false,
          contentType: 'text/plain'
        })
        blobUrl = blob.url
      } catch (uploadError) {
        console.error('Blob upload error:', uploadError)
      }
      
      // Upload to SharePoint
      try {
        const spResult = await uploadToSharePoint(
          SHAREPOINT_FOLDERS.DLO,
          filename,
          dloContent,
          'text/plain'
        )
        if (spResult.success) {
          sharePointUrl = spResult.webUrl
        }
      } catch (spError) {
        console.error('SharePoint upload error:', spError)
      }
      
      uploadResults.push({ rego: payment.rego, supplier: payment.supplierName, blobUrl, sharePointUrl })
    }
    
    // Generate combined DLO content for download
    const combinedDloContent = pendingPayments.map(payment => {
      const amount = (getPaymentAmount(payment) / 100).toFixed(2)
      const bankAccount = payment.supplier.bankAccount || ''
      const companyName = (payment.supplier.legalName || payment.supplier.name || '').substring(0, 20)
      const ref1 = payment.rego.substring(0, 12)
      const ref2 = 'HOOK'
      const particulars = (payment.supplierInvoiceRef || payment.rego).substring(0, 12)
      const code = payment.rego.substring(0, 12)
      const reference = 'HOOK'
      const name = companyName
      return `${amount},${bankAccount},${companyName},${ref1},${ref2},${particulars},${code},${reference},${name}`
    }).join('\n')
    
    const combinedFilename = `HOOK_BATCH_${new Date().toISOString().split('T')[0]}.DLO`
    
    // Check upload success
    const blobSuccessCount = uploadResults.filter(r => r.blobUrl).length
    const sharePointSuccessCount = uploadResults.filter(r => r.sharePointUrl).length
    
    // Return the combined DLO file as a downloadable response
    const response = new NextResponse(combinedDloContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${combinedFilename}"`,
        'X-Blob-Upload-Success': blobSuccessCount === pendingPayments.length ? 'true' : 'false',
        'X-Blob-Upload-Count': blobSuccessCount.toString(),
        'X-SharePoint-Upload-Success': sharePointSuccessCount === pendingPayments.length ? 'true' : 'false',
        'X-SharePoint-Upload-Count': sharePointSuccessCount.toString(),
        'X-Payment-Count': pendingPayments.length.toString(),
        'X-Total-Amount': (pendingPayments.reduce((sum, p) => sum + getPaymentAmount(p), 0) / 100).toFixed(2)
      }
    })
    
    return response
  } catch (error) {
    console.error('DLO generation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate DLO file'
    }, { status: 500 })
  }
}

// POST - Mark payments as processed
export async function POST(request: NextRequest) {
  try {
    const { jobIds } = await request.json()
    
    if (!jobIds || !Array.isArray(jobIds)) {
      return NextResponse.json({
        success: false,
        error: 'Job IDs required'
      }, { status: 400 })
    }
    
    const timestamp = new Date().toISOString()
    let totalPaid = 0
    
    for (const jobId of jobIds) {
      const job = await kv.hgetall(`job:${jobId}`) as Record<string, unknown> | null
      
      if (job && job.supplierName) {
        // Payment amount is invoice amount if set, otherwise supplier price
        const paymentAmount = (job.supplierInvoiceAmount as number) || (job.supplierPrice as number) || 0
        
        await kv.hset(`job:${jobId}`, {
          supplierPaidAt: timestamp,
          supplierPaidAmount: paymentAmount
        })
        
        // Update supplier total paid
        if (paymentAmount > 0) {
          await kv.hincrby(`supplier:${job.supplierName}`, 'totalPaid', paymentAmount)
          totalPaid += paymentAmount
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Marked ${jobIds.length} payments as processed`,
      totalPaid: totalPaid / 100,
      processedAt: timestamp
    })
  } catch (error) {
    console.error('Mark paid error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to mark payments'
    }, { status: 500 })
  }
}
