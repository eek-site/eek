# User Guide

Complete user guide for customers, suppliers, and administrators.

## Customer Guide

### Booking a Service

1. **Visit Homepage**
   - Go to `www.eek.co.nz`
   - Click "Book Now" button

2. **Enter Vehicle Details**
   - Enter vehicle registration (rego)
   - System will auto-lookup vehicle details from CarJam
   - Confirm vehicle details match your vehicle
   - If incorrect, update rego and re-confirm
   - If vehicle not found, manually enter make, model, and color

3. **Enter Locations**
   - **Pickup Location**: Where your vehicle is currently located
   - **Drop-off Location**: Where you want the vehicle towed to
   - Use address autocomplete for accuracy

4. **Review Quote**
   - System calculates price based on distance
   - Review all details
   - Click "Continue to Payment"

5. **Make Payment**
   - Enter payment details securely via Stripe
   - Payment is processed instantly
   - You'll be redirected to your customer portal

### Customer Portal

**Access**: `www.eek.co.nz/customer/{bookingId}`

#### Features

1. **Job Details Tab**
   - View job timeline
   - See all job events (created, assigned, completed)
   - View vehicle and location details

2. **Messages Tab**
   - Chat with Eek Mechanical
   - Messages auto-update every 30 seconds
   - View full message history

3. **Invoice Tab**
   - View and print your invoice
   - See payment confirmation
   - Download invoice as PDF

#### Status Meanings

- **Awaiting Payment**: Complete payment to proceed
- **Payment Confirmed - Awaiting job allocation**: Payment received, waiting for towing company assignment
- **Towing Company Assigned**: Your towing company has been assigned
- **Job In Progress**: Your vehicle is being towed
- **Completed**: Job finished successfully

### Getting Help

- **Phone**: 0800 769 000 (24/7)
- **Message**: Use the Messages tab in your portal
- **Email**: Contact through the portal messaging system

## Supplier Guide

### Accessing Your Portal

1. **Get Your Portal Link**
   - Provided by Eek Mechanical when you're registered
   - Format: `www.eek.co.nz/portal/{your-code}`
   - Save this link - it's permanent

2. **Portal Features**
   - View all your open jobs
   - Accept/decline new job requests
   - Submit invoices
   - Complete jobs
   - Message Eek Mechanical
   - Manage payment details

### Job Flow

#### 1. Receiving a Job

When Eek Mechanical assigns you a job:
- You'll receive SMS and/or email notification
- Click the link to view job details
- Link opens your portal with job pre-selected

#### 2. Accepting a Job

1. Click "Accept Job" button
2. Job status changes to "in_progress"
3. Eek Mechanical is notified automatically

#### 3. Viewing Job Details

**Job Details Tab**:
- See pickup and drop-off locations
- View customer contact information
- See route and directions
- Click "Open Route in Maps" for Google Maps navigation

**Messages Tab**:
- Chat with Eek Mechanical
- Messages auto-update
- View full conversation history

**Get Paid Tab**:
- View payment status
- Submit invoice (optional)
- Complete job

#### 4. Route Planning

- Click "Open Route in Maps" button
- Opens Google Maps with 3-point route:
  - Your location (current GPS)
  - Pickup location
  - Drop-off location
- Works on mobile devices

#### 5. Completing a Job

1. After delivering vehicle, go to **Get Paid** tab
2. Click **"Click to Complete Job ✓"** button
3. System automatically:
   - Marks job as completed
   - Notifies Eek Mechanical
   - Sends customer invoice
   - Sends you buyer-created invoice (if you haven't submitted one)

**Note**: You can complete a job even if price isn't set yet - sort out payment details later.

#### 6. Submitting Invoice (Optional)

You can submit your invoice:
- **Immediately** after completing job
- **Later** from your office
- **Never** (use buyer-created invoice)

**To Submit Invoice**:

1. Go to **Get Paid** tab
2. Fill in:
   - **Invoice Reference**: Your invoice number (required)
   - **Amount**: Auto-filled if price is set, or enter manually
   - **Attach Invoice**: 
     - Upload PDF/image file, OR
     - Paste Xero/Google Drive/Dropbox link
3. Click "Submit Invoice"

**Invoice Requirements**:
- Invoice reference is required
- Amount is required (unless already set by Eek Mechanical)
- File upload or link is optional

### Payment Details

#### Setting Up Payment Details

1. Go to **Get Paid** tab
2. Scroll to "Set Up Payment Details"
3. Enter:
   - **Legal Company Name**: For invoicing
   - **Bank Name**: e.g., ANZ, Westpac, BNZ
   - **Bank Account Number**: Format XX-XXXX-XXXXXXX-XX
   - **Account Holder Name**: Name on bank account
   - **GST Number**: Optional
4. Click "Save Payment Details"

#### Payment Status

- **No Price Set**: Price to be confirmed with Eek Mechanical
- **Quoted Amount - Pending payment approval**: Price set, awaiting admin approval
- **Payment Approved - Funds being transferred**: Payment approved, processing
- **Payment Sent**: Funds transferred to your account

### Getting Help

- **Phone**: 0800 769 000
- **Message**: Use Messages tab in portal
- **Email**: Contact through portal messaging

## Admin Guide

### Accessing Admin Dashboard

1. Go to `www.eek.co.nz/admin`
2. Log in with credentials
3. Dashboard shows:
   - Quick stats
   - Recent jobs
   - Pending actions

### Managing Jobs

#### Viewing Jobs

1. Go to **Jobs** tab
2. Filter by status:
   - **Open**: All active jobs
   - **Pending**: Awaiting payment
   - **Assigned**: Supplier assigned
   - **In Progress**: Currently being worked on
   - **Closed**: Completed or cancelled
3. Click job to view details

#### Assigning Suppliers

1. Go to **Supplier** tab
2. Search for job by rego or booking ID
3. Select supplier from list
4. Enter:
   - **Pay Supplier**: Amount to pay supplier
   - **Customer Price**: Total customer pays (includes margin)
   - **Additional Charge**: Optional extra charge
5. Choose notification method (SMS/Email)
6. Click "Assign Supplier"

#### Updating Job Status

1. Go to **Jobs** tab
2. Find job
3. Update status manually if needed
4. Add notes for internal tracking

### Billing & Payments

#### Customer Invoicing

1. Go to **Billing** tab
2. Search for job by rego
3. View customer payment status
4. Generate customer invoice if needed
5. Send invoice email to customer

#### Supplier Payment Approval

1. Go to **Billing** tab
2. Search for job
3. Review supplier invoice (if submitted)
4. **Approve Payment**:
   - Enter payment amount (editable)
   - Click "Approve Payment"
   - Supplier receives confirmation email
5. **Edit Approved Amount**:
   - Click "Edit Amount" on approved payment
   - Update amount
   - Click "Update"

#### Generating DLO Files

1. Go to **Billing** tab
2. Click "Generate DLO" button
3. System:
   - Finds all approved, unpaid supplier payments
   - Generates DLO file for ANZ bank
   - Uploads to Vercel Blob and SharePoint
   - Downloads file to your computer
4. Process DLO file through ANZ bank
5. Mark payments as processed

#### Adding Additional Charges

1. Go to **Billing** tab
2. Find job
3. Click "Add Additional Charge"
4. Enter:
   - **Amount**: Additional charge amount
   - **Reason**: e.g., "Location change", "Supplier swap"
   - **Send Payment Link**: Check to send payment link to customer
5. Click "Add Charge"
6. Customer receives payment link if selected

### Communication

#### Customer Messages

1. Go to **Comms** tab
2. View all open jobs
3. Click job to expand
4. See message history:
   - **Left side (blue)**: Your messages to customer
   - **Right side**: Customer replies
5. Type message and click "Send"
6. Customer receives email/SMS notification

#### Supplier Messages

1. Go to **Comms** tab
2. View all open jobs
3. Click job to expand
4. See message history:
   - **Left side (orange)**: Your messages to supplier
   - **Right side**: Supplier replies
5. Type message and click "Send"
6. Supplier receives email/SMS notification

#### Forwarding Messages

To forward customer message to supplier:
1. View customer message
2. Click "Forward to Supplier"
3. Add your notes
4. Send

### Closing Jobs

1. Go to **Billing** tab
2. Find completed job
3. Click "Close Job" button
4. System automatically:
   - Updates job status to "completed"
   - Sends customer invoice email
   - Sends buyer-created invoice to supplier (if no invoice submitted)

### Quick Actions

From any job view:
- **📞 Call**: Opens phone dialer
- **💬 Text**: Opens SMS composer
- **💼 Comms**: Opens communication tab
- **📋 View Job**: Opens job details

### Internal Notifications

Admin dashboard shows notifications for:
- New bookings
- Supplier job acceptances
- Job completions
- Payment approvals
- Messages from customers/suppliers

Click notification for quick action.

## Tips & Best Practices

### For Customers

- **Save Your Portal Link**: Bookmark it for easy access
- **Check Messages Regularly**: Eek Mechanical may send updates
- **Confirm Vehicle Details**: Ensure rego is correct before payment
- **Contact Early**: Message if you have questions or need changes

### For Suppliers

- **Complete Jobs Promptly**: Click "Job Completed" as soon as vehicle is delivered
- **Submit Invoices Early**: Get paid faster by submitting invoices quickly
- **Keep Payment Details Updated**: Ensure bank details are current
- **Use Route Planning**: Use Google Maps integration for efficient routing
- **Message for Changes**: Contact Eek Mechanical if job details need updating

### For Administrators

- **Approve Payments Daily**: Keep cash flow moving
- **Generate DLO Files Regularly**: Batch process payments efficiently
- **Monitor Messages**: Respond to customer/supplier messages promptly
- **Review Job Status**: Keep job statuses up to date
- **Use Additional Charges**: Add charges for changes or extras
- **Close Jobs Promptly**: Close completed jobs to trigger automated workflows

## Troubleshooting

### Customer Issues

**Can't access portal?**
- Check booking ID is correct
- Contact Eek Mechanical for new link

**Payment not showing?**
- Check email for confirmation
- Refresh portal page
- Contact Eek Mechanical if issue persists

**Messages not updating?**
- Refresh page
- Check internet connection
- Messages auto-update every 30 seconds

### Supplier Issues

**Can't access portal?**
- Check portal code is correct
- Contact Eek Mechanical for your portal link

**Job not showing?**
- Refresh page
- Check if job was assigned to you
- Contact Eek Mechanical

**Can't submit invoice?**
- Ensure invoice reference is filled
- Check amount is entered (if not set by Eek Mechanical)
- Try uploading file instead of link

**Payment not received?**
- Check payment status in portal
- Verify bank details are correct
- Contact Eek Mechanical if approved but not received

### Admin Issues

**Can't generate DLO?**
- Check suppliers have approved payments
- Verify bank details are set
- Check SharePoint credentials

**Emails not sending?**
- Verify Microsoft Graph API credentials
- Check API permissions in Azure AD
- Review error logs

**Jobs not updating?**
- Refresh page
- Check database connection
- Verify job ID is correct

## Support

For all users:
- **Phone**: 0800 769 000 (24/7)
- **Portal Messages**: Use messaging system in portal
- **Email**: Contact through portal (no direct email addresses shown)

---

**Last Updated**: January 2026
