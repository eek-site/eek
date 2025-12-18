# SharePoint List Import Guide

This guide explains how to create the SharePoint lists needed for the Road and Rescue system.

## Method 1: Using SharePoint List Templates (Recommended)

### Step 1: Export List Schema

Use the provided `sharepoint-lists-schema.json` file as a reference.

### Step 2: Create Lists via PowerShell

```powershell
# Connect to SharePoint Online
Connect-PnPOnline -Url "https://YOUR_TENANT.sharepoint.com/sites/YOUR_SITE" -Interactive

# Create Jobs List
New-PnPList -Title "Jobs" -Template GenericList
Add-PnPField -List "Jobs" -Type Text -InternalName "Rego" -DisplayName "Rego" -Required
Add-PnPField -List "Jobs" -Type Text -InternalName "CustomerName" -DisplayName "Customer Name" -Required
Add-PnPField -List "Jobs" -Type Text -InternalName "InvoiceName" -DisplayName "Invoice Name"
Add-PnPField -List "Jobs" -Type Note -InternalName "Address" -DisplayName "Address"
Add-PnPField -List "Jobs" -Type Choice -InternalName "JobType" -DisplayName "Job Type" -Choices "Roadside Assistance","Pre Purchase Vehicle Inspection","Fuel Extraction","Other"
Add-PnPField -List "Jobs" -Type Choice -InternalName "Status" -DisplayName "Status" -Choices "New","In Progress","Completed","Cancelled","DNC" -Default "New"
Add-PnPField -List "Jobs" -Type Boolean -InternalName "IsYellowHighlighted" -DisplayName "Is Yellow Highlighted"
Add-PnPField -List "Jobs" -Type Text -InternalName "BookingID" -DisplayName "Booking ID"
Set-PnPField -List "Jobs" -Identity "Rego" -Indexed
Set-PnPField -List "Jobs" -Identity "BookingID" -Indexed

# Create JobBuildNotes List
New-PnPList -Title "JobBuildNotes" -Template GenericList
Add-PnPField -List "JobBuildNotes" -Type Text -InternalName "Rego" -DisplayName "Rego" -Required
Add-PnPField -List "JobBuildNotes" -Type Choice -InternalName "RecordType" -DisplayName "Record Type" -Choices "Supplier","Customer","Job" -Required
Add-PnPField -List "JobBuildNotes" -Type Text -InternalName "Supplier" -DisplayName "Supplier"
Add-PnPField -List "JobBuildNotes" -Type Currency -InternalName "Costings" -DisplayName "Costings"
Add-PnPField -List "JobBuildNotes" -Type Text -InternalName "BankAccount" -DisplayName "Bank Account"
Add-PnPField -List "JobBuildNotes" -Type Text -InternalName "Supp_Email" -DisplayName "Supplier Email"
Add-PnPField -List "JobBuildNotes" -Type Text -InternalName "Supp_Phone" -DisplayName "Supplier Phone"
Set-PnPField -List "JobBuildNotes" -Identity "Rego" -Indexed

# Create APINumbers List
New-PnPList -Title "APINumbers" -Template GenericList
Add-PnPField -List "APINumbers" -Type Text -InternalName "APINumber" -DisplayName "API Number" -Required
Add-PnPField -List "APINumbers" -Type Text -InternalName "Extension" -DisplayName "Extension"
Add-PnPField -List "APINumbers" -Type Text -InternalName "State" -DisplayName "State"
Add-PnPField -List "APINumbers" -Type Boolean -InternalName "IsActive" -DisplayName "Is Active" -Default $true
Set-PnPField -List "APINumbers" -Identity "APINumber" -Indexed -EnforceUniqueValues

# Create APIExtensionList List
New-PnPList -Title "APIExtensionList" -Template GenericList
Add-PnPField -List "APIExtensionList" -Type Text -InternalName "API_State" -DisplayName "API State" -Required
Add-PnPField -List "APIExtensionList" -Type Text -InternalName "API_Set_Extn" -DisplayName "API Set Extension" -Required

# Create other lists similarly...
```

## Method 2: Manual Creation via SharePoint UI

### For Each List:

1. Go to your SharePoint site
2. Click "New" → "List"
3. Choose "Blank list"
4. Enter list name
5. Add columns one by one:
   - Click "Add column"
   - Choose column type
   - Enter display name and internal name
   - Set required/optional
   - For Choice columns, enter choices separated by semicolons
6. Set indexed fields:
   - Go to List Settings
   - Click on column name
   - Check "Indexed" checkbox
   - For unique columns, also check "Enforce unique values"

## Method 3: Using PnP Provisioning Templates

Create a provisioning template XML file and apply it:

```xml
<pnp:Provisioning xmlns:pnp="http://schemas.dev.office.com/PnP/2021/03/ProvisioningSchema">
  <pnp:Templates>
    <pnp:ProvisioningTemplate ID="RoadAndRescueLists">
      <pnp:Lists>
        <pnp:ListInstance Title="Jobs" TemplateType="100" Url="Lists/Jobs">
          <pnp:Fields>
            <pnp:Field Type="Text" DisplayName="Rego" Required="true" Indexed="true" />
            <pnp:Field Type="Text" DisplayName="CustomerName" Required="true" />
            <!-- Add more fields -->
          </pnp:Fields>
        </pnp:ListInstance>
      </pnp:Lists>
    </pnp:ProvisioningTemplate>
  </pnp:Templates>
</pnp:Provisioning>
```

## Required Lists Summary

1. **Jobs** - Main job registry (replaces "Book a Job")
2. **JobBuildNotes** - Supplier/job details (replaces "Job Build Notes")
3. **WhiteList** - Configuration tables (replaces "White_List")
4. **Receipts** - Receipt records (replaces "Receipts_List")
5. **Invoices** - Invoice records (replaces "Invoice_List")
6. **Transactions** - Transaction records (replaces "Transaction_Record")
7. **Contractors** - Contractor details (replaces "Contractor_Details")
8. **APINumbers** - API number management (replaces "API" worksheet)
9. **APIExtensionList** - API extension lookup (from "White_List")

## Column Type Mappings

| Excel Type | SharePoint Type |
|------------|----------------|
| Text | Single line of text |
| Long text | Multiple lines of text |
| Number | Number |
| Currency | Currency |
| Date | Date and Time |
| Yes/No | Yes/No |
| Dropdown | Choice |
| Lookup | Lookup |

## Permissions

Ensure the following permissions are set:
- **Read**: All authenticated users who need to view jobs
- **Contribute**: Users who need to create/update jobs
- **Full Control**: Administrators and Power Automate service account

## Next Steps

After creating lists:
1. Test creating/updating items manually
2. Set up Power Automate flows to interact with lists
3. Update `api-config.js` with your SharePoint site URL
4. Test API calls from the HTML interface

