# Road and Rescue - SharePoint List Creation Script
# This script creates all required SharePoint lists for the Road and Rescue system
# Prerequisites: PnP PowerShell module (Install-Module -Name PnP.PowerShell)

param(
    [Parameter(Mandatory=$true)]
    [string]$SiteUrl,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipExisting
)

# Connect to SharePoint
Write-Host "Connecting to SharePoint: $SiteUrl" -ForegroundColor Cyan
Connect-PnPOnline -Url $SiteUrl -Interactive

# Function to create list if it doesn't exist
function New-ListIfNotExists {
    param(
        [string]$ListName,
        [string]$Template = "GenericList",
        [string]$Description = ""
    )
    
    $list = Get-PnPList -Identity $ListName -ErrorAction SilentlyContinue
    if ($list) {
        if ($SkipExisting) {
            Write-Host "List '$ListName' already exists, skipping..." -ForegroundColor Yellow
            return $true
        } else {
            Write-Host "List '$ListName' already exists!" -ForegroundColor Yellow
            return $false
        }
    }
    
    Write-Host "Creating list: $ListName" -ForegroundColor Green
    New-PnPList -Title $ListName -Template $Template -Description $Description
    return $true
}

# Function to add field to list
function Add-FieldToList {
    param(
        [string]$ListName,
        [string]$InternalName,
        [string]$DisplayName,
        [string]$Type,
        [bool]$Required = $false,
        [bool]$Indexed = $false,
        [string[]]$Choices = @(),
        [string]$DefaultValue = ""
    )
    
    $field = Get-PnPField -List $ListName -Identity $InternalName -ErrorAction SilentlyContinue
    if ($field) {
        Write-Host "  Field '$InternalName' already exists, skipping..." -ForegroundColor Gray
        return
    }
    
    Write-Host "  Adding field: $DisplayName ($Type)" -ForegroundColor Gray
    
    switch ($Type) {
        "Text" {
            Add-PnPField -List $ListName -Type Text -InternalName $InternalName -DisplayName $DisplayName -Required:$Required
        }
        "Note" {
            Add-PnPField -List $ListName -Type Note -InternalName $InternalName -DisplayName $DisplayName -Required:$Required
        }
        "Number" {
            Add-PnPField -List $ListName -Type Number -InternalName $InternalName -DisplayName $DisplayName -Required:$Required
        }
        "Currency" {
            Add-PnPField -List $ListName -Type Currency -InternalName $InternalName -DisplayName $DisplayName -Required:$Required
        }
        "DateTime" {
            Add-PnPField -List $ListName -Type DateTime -InternalName $InternalName -DisplayName $DisplayName -Required:$Required
        }
        "Boolean" {
            Add-PnPField -List $ListName -Type Boolean -InternalName $InternalName -DisplayName $DisplayName -Required:$Required
            if ($DefaultValue -ne "") {
                Set-PnPField -List $ListName -Identity $InternalName -Values @{DefaultValue = $DefaultValue}
            }
        }
        "Choice" {
            Add-PnPField -List $ListName -Type Choice -InternalName $InternalName -DisplayName $DisplayName -Choices $Choices -Required:$Required
            if ($DefaultValue -ne "") {
                Set-PnPField -List $ListName -Identity $InternalName -Values @{DefaultValue = $DefaultValue}
            }
        }
    }
    
    if ($Indexed) {
        Set-PnPField -List $ListName -Identity $InternalName -Indexed
    }
}

# Create Jobs List
if (New-ListIfNotExists -ListName "Jobs" -Description "Main job registry - replaces 'Book a Job' worksheet") {
    Add-FieldToList -ListName "Jobs" -InternalName "Rego" -DisplayName "Rego" -Type "Text" -Required $true -Indexed $true
    Add-FieldToList -ListName "Jobs" -InternalName "CustomerName" -DisplayName "Customer Name" -Type "Text" -Required $true
    Add-FieldToList -ListName "Jobs" -InternalName "InvoiceName" -DisplayName "Invoice Name" -Type "Text"
    Add-FieldToList -ListName "Jobs" -InternalName "Phone1" -DisplayName "Phone 1" -Type "Text"
    Add-FieldToList -ListName "Jobs" -InternalName "Phone2" -DisplayName "Phone 2" -Type "Text"
    Add-FieldToList -ListName "Jobs" -InternalName "Email" -DisplayName "Email" -Type "Text"
    Add-FieldToList -ListName "Jobs" -InternalName "Address" -DisplayName "Address" -Type "Note"
    Add-FieldToList -ListName "Jobs" -InternalName "JobType" -DisplayName "Job Type" -Type "Choice" -Choices @("Roadside Assistance", "Pre Purchase Vehicle Inspection", "Fuel Extraction", "Other")
    Add-FieldToList -ListName "Jobs" -InternalName "JobRego" -DisplayName "Job Rego" -Type "Text"
    Add-FieldToList -ListName "Jobs" -InternalName "SellerData" -DisplayName "Seller Data" -Type "Note"
    Add-FieldToList -ListName "Jobs" -InternalName "ETAMinutes" -DisplayName "ETA Minutes" -Type "Number"
    Add-FieldToList -ListName "Jobs" -InternalName "BookingID" -DisplayName "Booking ID" -Type "Text" -Indexed $true
    Add-FieldToList -ListName "Jobs" -InternalName "Status" -DisplayName "Status" -Type "Choice" -Choices @("New", "In Progress", "Completed", "Cancelled", "DNC") -DefaultValue "New"
    Add-FieldToList -ListName "Jobs" -InternalName "IsYellowHighlighted" -DisplayName "Is Yellow Highlighted" -Type "Boolean" -DefaultValue "false"
    Write-Host "Jobs list created successfully!" -ForegroundColor Green
}

# Create JobBuildNotes List
if (New-ListIfNotExists -ListName "JobBuildNotes" -Description "Supplier and job build details - replaces 'Job Build Notes' worksheet") {
    Add-FieldToList -ListName "JobBuildNotes" -InternalName "Rego" -DisplayName "Rego" -Type "Text" -Required $true -Indexed $true
    Add-FieldToList -ListName "JobBuildNotes" -InternalName "RecordType" -DisplayName "Record Type" -Type "Choice" -Choices @("Supplier", "Customer", "Job") -Required $true
    Add-FieldToList -ListName "JobBuildNotes" -InternalName "Supplier" -DisplayName "Supplier" -Type "Text"
    Add-FieldToList -ListName "JobBuildNotes" -InternalName "Costings" -DisplayName "Costings" -Type "Currency"
    Add-FieldToList -ListName "JobBuildNotes" -InternalName "BankAccount" -DisplayName "Bank Account" -Type "Text"
    Add-FieldToList -ListName "JobBuildNotes" -InternalName "Supp_Email" -DisplayName "Supplier Email" -Type "Text"
    Add-FieldToList -ListName "JobBuildNotes" -InternalName "Supp_Phone" -DisplayName "Supplier Phone" -Type "Text"
    Write-Host "JobBuildNotes list created successfully!" -ForegroundColor Green
}

# Create WhiteList List
if (New-ListIfNotExists -ListName "WhiteList" -Description "Configuration and lookup tables - replaces 'White_List' worksheet") {
    Add-FieldToList -ListName "WhiteList" -InternalName "Category" -DisplayName "Category" -Type "Choice" -Choices @("API_Extn_Change_List", "Colour_Header", "Colour_Code", "Header_Name", "Sheet_Name", "Other") -Required $true
    Add-FieldToList -ListName "WhiteList" -InternalName "Value1" -DisplayName "Value 1" -Type "Text"
    Add-FieldToList -ListName "WhiteList" -InternalName "Value2" -DisplayName "Value 2" -Type "Text"
    Add-FieldToList -ListName "WhiteList" -InternalName "Value3" -DisplayName "Value 3" -Type "Text"
    Add-FieldToList -ListName "WhiteList" -InternalName "NumericValue" -DisplayName "Numeric Value" -Type "Number"
    Write-Host "WhiteList list created successfully!" -ForegroundColor Green
}

# Create Receipts List
if (New-ListIfNotExists -ListName "Receipts" -Description "Receipt records - replaces 'Receipts_List' worksheet") {
    Add-FieldToList -ListName "Receipts" -InternalName "ReceiptNumber" -DisplayName "Receipt Number" -Type "Text" -Required $true -Indexed $true
    Add-FieldToList -ListName "Receipts" -InternalName "Amount" -DisplayName "Amount" -Type "Currency" -Required $true
    Add-FieldToList -ListName "Receipts" -InternalName "ReceiptDate" -DisplayName "Receipt Date" -Type "DateTime" -Required $true
    Add-FieldToList -ListName "Receipts" -InternalName "Status" -DisplayName "Status" -Type "Choice" -Choices @("Pending", "Processed", "Void")
    Write-Host "Receipts list created successfully!" -ForegroundColor Green
}

# Create Invoices List
if (New-ListIfNotExists -ListName "Invoices" -Description "Invoice records - replaces 'Invoice_List' worksheet") {
    Add-FieldToList -ListName "Invoices" -InternalName "InvoiceNumber" -DisplayName "Invoice Number" -Type "Text" -Required $true -Indexed $true
    Add-FieldToList -ListName "Invoices" -InternalName "Amount" -DisplayName "Amount" -Type "Currency" -Required $true
    Add-FieldToList -ListName "Invoices" -InternalName "InvoiceDate" -DisplayName "Invoice Date" -Type "DateTime" -Required $true
    Add-FieldToList -ListName "Invoices" -InternalName "Status" -DisplayName "Status" -Type "Choice" -Choices @("Draft", "Sent", "Paid", "Overdue", "Cancelled")
    Write-Host "Invoices list created successfully!" -ForegroundColor Green
}

# Create Transactions List
if (New-ListIfNotExists -ListName "Transactions" -Description "Transaction records - replaces 'Transaction_Record' worksheet") {
    Add-FieldToList -ListName "Transactions" -InternalName "TransactionType" -DisplayName "Transaction Type" -Type "Choice" -Choices @("Payment", "Refund", "Adjustment") -Required $true
    Add-FieldToList -ListName "Transactions" -InternalName "Amount" -DisplayName "Amount" -Type "Currency" -Required $true
    Add-FieldToList -ListName "Transactions" -InternalName "TransactionDate" -DisplayName "Transaction Date" -Type "DateTime" -Required $true
    Add-FieldToList -ListName "Transactions" -InternalName "PaymentMethod" -DisplayName "Payment Method" -Type "Choice" -Choices @("Stripe", "Bank Transfer", "Cash", "Other")
    Write-Host "Transactions list created successfully!" -ForegroundColor Green
}

# Create Contractors List
if (New-ListIfNotExists -ListName "Contractors" -Description "Contractor/Supplier details - replaces 'Contractor_Details' worksheet") {
    Add-FieldToList -ListName "Contractors" -InternalName "SupplierName" -DisplayName "Supplier Name" -Type "Text" -Required $true
    Add-FieldToList -ListName "Contractors" -InternalName "Email" -DisplayName "Email" -Type "Text"
    Add-FieldToList -ListName "Contractors" -InternalName "Phone" -DisplayName "Phone" -Type "Text"
    Add-FieldToList -ListName "Contractors" -InternalName "BankAccount" -DisplayName "Bank Account" -Type "Text"
    Add-FieldToList -ListName "Contractors" -InternalName "IsActive" -DisplayName "Is Active" -Type "Boolean" -DefaultValue "true"
    Write-Host "Contractors list created successfully!" -ForegroundColor Green
}

# Create APINumbers List
if (New-ListIfNotExists -ListName "APINumbers" -Description "API number management - replaces API worksheet") {
    Add-FieldToList -ListName "APINumbers" -InternalName "APINumber" -DisplayName "API Number" -Type "Text" -Required $true -Indexed $true
    Add-FieldToList -ListName "APINumbers" -InternalName "Extension" -DisplayName "Extension" -Type "Text"
    Add-FieldToList -ListName "APINumbers" -InternalName "State" -DisplayName "State" -Type "Text"
    Add-FieldToList -ListName "APINumbers" -InternalName "IsActive" -DisplayName "Is Active" -Type "Boolean" -DefaultValue "true"
    Write-Host "APINumbers list created successfully!" -ForegroundColor Green
}

# Create APIExtensionList List
if (New-ListIfNotExists -ListName "APIExtensionList" -Description "API Extension change list - lookup table") {
    Add-FieldToList -ListName "APIExtensionList" -InternalName "API_State" -DisplayName "API State" -Type "Text" -Required $true
    Add-FieldToList -ListName "APIExtensionList" -InternalName "API_Set_Extn" -DisplayName "API Set Extension" -Type "Text" -Required $true
    Write-Host "APIExtensionList list created successfully!" -ForegroundColor Green
}

Write-Host "`nAll lists created successfully!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Review the lists in SharePoint" -ForegroundColor White
Write-Host "2. Set up Power Automate flows (see power-automate-flows.md)" -ForegroundColor White
Write-Host "3. Update api-config.js with your SharePoint site URL" -ForegroundColor White
Write-Host "4. Test the integration" -ForegroundColor White

