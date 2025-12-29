/**
 * Road and Rescue - Messaging System
 * SMS via TNZ Gateway + Email
 * Version: 2.0 - Cloud implementation
 */

const messaging = {
    // ========================================================================
    // SMS VIA TNZ GATEWAY
    // ========================================================================
    
    /**
     * Send SMS via TNZ gateway (through email)
     * TNZ receives emails to +{countryCode}{number}@sms.tnz.co.nz and converts to SMS
     * 
     * @param {string} phone - Phone number (without country code leading 0)
     * @param {string} message - SMS message body
     * @param {string} countryCode - Country code (default '64' for NZ)
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async sendSms(phone, message, countryCode = '64') {
        const config = window.APP_CONFIG || {};
        
        if (!config.features?.enableSms) {
            console.log('SMS disabled - would send:', { phone, message });
            return { success: true, simulated: true };
        }
        
        // Build TNZ address
        let cleanPhone = phone.replace(/[^0-9]/g, '');
        if (cleanPhone.startsWith('0')) {
            cleanPhone = cleanPhone.substring(1);
        }
        const smsAddress = `+${countryCode}${cleanPhone}@${config.sms?.gateway || 'sms.tnz.co.nz'}`;
        
        // Clean message (remove special characters that cause issues)
        const cleanMessage = message
            .replace(/[""]/g, '"')
            .replace(/['']/g, "'")
            .replace(/[–—]/g, '-')
            .replace(/©/g, '(c)')
            .replace(/®/g, '(R)')
            .replace(/™/g, '(TM)');
        
        try {
            // Option 1: If we have a Power Automate flow for SMS
            if (config.flows?.sendSms) {
                const response = await fetch(config.flows.sendSms, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: smsAddress,
                        message: cleanMessage,
                        phone: cleanPhone,
                        countryCode: countryCode
                    })
                });
                
                if (response.ok) {
                    console.log('SMS sent via Power Automate:', smsAddress);
                    return { success: true };
                }
            }
            
            // Option 2: Open mailto link (fallback - user has to click send)
            // This works because TNZ accepts emails to SMS addresses
            const subject = 'SMS';
            const mailtoUrl = `mailto:${smsAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(cleanMessage)}`;
            
            // Try to open in new window
            const win = window.open(mailtoUrl, '_blank');
            if (win) {
                setTimeout(() => win.close(), 1000);
            }
            
            console.log('SMS initiated via mailto:', smsAddress);
            return { success: true, method: 'mailto' };
            
        } catch (error) {
            console.error('Error sending SMS:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Send SMS to multiple recipients
     */
    async sendSmsToMany(recipients, message, countryCode = '64') {
        const results = [];
        
        for (const phone of recipients) {
            const result = await this.sendSms(phone, message, countryCode);
            results.push({ phone, ...result });
            
            // Small delay between sends
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return results;
    },
    
    // ========================================================================
    // EMAIL
    // ========================================================================
    
    /**
     * Send email
     * 
     * @param {string} to - Recipient email
     * @param {string} subject - Email subject
     * @param {string} body - Email body (can be HTML)
     * @param {Object} options - Additional options (cc, bcc, attachments)
     */
    async sendEmail(to, subject, body, options = {}) {
        const config = window.APP_CONFIG || {};
        
        if (!config.features?.enableEmail) {
            console.log('Email disabled - would send:', { to, subject });
            return { success: true, simulated: true };
        }
        
        try {
            // Option 1: If we have a Power Automate flow for email
            if (config.flows?.sendEmail) {
                const response = await fetch(config.flows.sendEmail, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to,
                        subject,
                        body,
                        ...options
                    })
                });
                
                if (response.ok) {
                    console.log('Email sent via Power Automate:', to);
                    return { success: true };
                }
            }
            
            // Option 2: Open mailto link (fallback)
            let mailtoUrl = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            
            if (options.cc) {
                mailtoUrl += `&cc=${encodeURIComponent(options.cc)}`;
            }
            if (options.bcc) {
                mailtoUrl += `&bcc=${encodeURIComponent(options.bcc)}`;
            }
            
            window.open(mailtoUrl, '_blank');
            
            console.log('Email initiated via mailto:', to);
            return { success: true, method: 'mailto' };
            
        } catch (error) {
            console.error('Error sending email:', error);
            return { success: false, error: error.message };
        }
    },
    
    // ========================================================================
    // NOTIFICATION FUNCTIONS (matches VBA)
    // ========================================================================
    
    /**
     * Send message to customer
     * Sends both SMS and email
     */
    async notifyCustomer(customerData, message, emailSubject = null) {
        const results = { sms: null, email: null };
        
        // Send SMS if phone available
        if (customerData.phone || customerData.mobile) {
            results.sms = await this.sendSms(
                customerData.phone || customerData.mobile,
                message,
                customerData.countryCode || '64'
            );
        }
        
        // Send email if available
        if (customerData.email) {
            const subject = emailSubject || 'EEK Mechanical Update';
            results.email = await this.sendEmail(customerData.email, subject, message);
        }
        
        return results;
    },
    
    /**
     * Notify supplier - Vehicle Hold
     * Matches VBA NotifySupplierVehicleHold
     */
    async notifySupplierVehicleHold(supplierData, rego) {
        const message = `EEK Mechanical Update - Rego ${rego}\n\n` +
            `Final billing has been issued to the customer.\n\n` +
            `IMPORTANT: Please DO NOT release the vehicle until you receive confirmation from EEK Mechanical that payment has been received.\n\n` +
            `Thank you for your cooperation.`;
        
        const emailSubject = `EEK Mechanical - DO NOT RELEASE - ${rego}`;
        
        const results = { sms: null, email: null };
        
        if (supplierData.supplier_phone || supplierData.phone) {
            results.sms = await this.sendSms(
                supplierData.supplier_phone || supplierData.phone,
                message,
                '64'
            );
        }
        
        if (supplierData.supplier_email || supplierData.email) {
            results.email = await this.sendEmail(
                supplierData.supplier_email || supplierData.email,
                emailSubject,
                message
            );
        }
        
        return results;
    },
    
    /**
     * Notify supplier - Vehicle Release
     * Matches VBA NotifySupplierVehicleRelease
     */
    async notifySupplierVehicleRelease(supplierData, rego) {
        const message = `EEK Mechanical Update - Rego ${rego}\n\n` +
            `Payment has been received from the customer.\n\n` +
            `You may now RELEASE THE VEHICLE to the customer.\n\n` +
            `Thank you for your assistance with this job.`;
        
        const emailSubject = `EEK Mechanical - RELEASE VEHICLE - ${rego}`;
        
        const results = { sms: null, email: null };
        
        if (supplierData.supplier_phone || supplierData.phone) {
            results.sms = await this.sendSms(
                supplierData.supplier_phone || supplierData.phone,
                message,
                '64'
            );
        }
        
        if (supplierData.supplier_email || supplierData.email) {
            results.email = await this.sendEmail(
                supplierData.supplier_email || supplierData.email,
                emailSubject,
                message
            );
        }
        
        return results;
    },
    
    /**
     * Notify all suppliers for a rego
     */
    async notifyAllSuppliersForRego(rego, notificationType = 'hold') {
        // Get suppliers from database
        const suppliers = await db.buildNotes.getSuppliersForRego(rego);
        
        if (!suppliers || suppliers.length === 0) {
            console.log('No suppliers found for rego:', rego);
            return [];
        }
        
        const results = [];
        
        for (const supplier of suppliers) {
            let result;
            if (notificationType === 'hold') {
                result = await this.notifySupplierVehicleHold(supplier, rego);
            } else {
                result = await this.notifySupplierVehicleRelease(supplier, rego);
            }
            results.push({
                supplier: supplier.supplier_name,
                ...result
            });
        }
        
        return results;
    },
    
    /**
     * Driver en route notification
     * Matches VBA DriverEnRoute
     */
    async sendDriverEnRoute(customerData, rego, eta = null) {
        const etaText = eta ? `ETA: ${eta}. ` : '';
        const message = `Hi ${customerData.customerName || 'there'}, ` +
            `our driver is on the way to your location for ${rego}. ` +
            `${etaText}` +
            `EEK Mechanical - 0800 769 000`;
        
        return await this.notifyCustomer(customerData, message, 
            `EEK Mechanical - Driver En Route - ${rego}`);
    },
    
    /**
     * Revised ETA notification
     */
    async sendRevisedETA(customerData, rego, newEta) {
        const message = `Hi ${customerData.customerName || 'there'}, ` +
            `update for ${rego}: Our revised ETA is ${newEta}. ` +
            `We apologize for any inconvenience. ` +
            `EEK Mechanical - 0800 769 000`;
        
        return await this.notifyCustomer(customerData, message,
            `EEK Mechanical - Revised ETA - ${rego}`);
    },
    
    /**
     * Booking confirmation
     */
    async sendBookingConfirmation(customerData, rego, bookingDetails = {}) {
        const dateText = bookingDetails.date ? ` on ${bookingDetails.date}` : '';
        const message = `Hi ${customerData.customerName || 'there'}, ` +
            `your booking for ${rego} has been confirmed${dateText}. ` +
            `EEK Mechanical - 0800 769 000`;
        
        return await this.notifyCustomer(customerData, message,
            `EEK Mechanical - Booking Confirmed - ${rego}`);
    },
    
    /**
     * Send release payment link to customer
     * Matches VBA SendReleasePaymentLink
     */
    async sendReleasePaymentLink(customerData, rego, amount, paymentLink) {
        const message = `Hi ${customerData.customerName || 'there'}, ` +
            `your final invoice for ${rego} is $${parseFloat(amount).toFixed(2)}. ` +
            `Pay here: ${paymentLink} - ` +
            `EEK Mechanical`;
        
        const emailBody = `Dear ${customerData.customerName || 'Customer'},\n\n` +
            `Your final invoice for vehicle ${rego} is ready.\n\n` +
            `Amount Due: $${parseFloat(amount).toFixed(2)}\n\n` +
            `Click here to pay securely online:\n${paymentLink}\n\n` +
            `Or pay by bank transfer:\n` +
            `Bank: ANZ Chartwell\n` +
            `Account: EEK Mechanical\n` +
            `Number: 06-0313-0860749-00\n` +
            `Reference: ${rego}\n\n` +
            `Thank you for choosing EEK Mechanical.\n` +
            `0800 769 000 | www.eek.nz`;
        
        const results = { sms: null, email: null };
        
        // Send SMS
        if (customerData.phone || customerData.mobile) {
            results.sms = await this.sendSms(
                customerData.phone || customerData.mobile,
                message,
                customerData.countryCode || '64'
            );
        }
        
        // Send email
        if (customerData.email) {
            results.email = await this.sendEmail(
                customerData.email,
                `EEK Mechanical - Final Invoice - ${rego}`,
                emailBody
            );
        }
        
        return results;
    },
    
    /**
     * Send job details to supplier
     * Matches VBA SendJobToSupplier
     */
    async sendJobToSupplier(supplierData, jobData) {
        const message = `New job from EEK Mechanical\n\n` +
            `Rego: ${jobData.rego}\n` +
            `Customer: ${jobData.customer_name || 'See email'}\n` +
            `Phone: ${jobData.phone1 || 'N/A'}\n` +
            `Location: ${jobData.pickup_address || 'TBA'}\n` +
            `Fault: ${jobData.fault_description || 'See notes'}\n\n` +
            `Please confirm receipt. EEK - 0800 769 000`;
        
        const emailSubject = `EEK Mechanical - Job Dispatch - ${jobData.rego}`;
        
        const emailBody = `
            <h2>Job Dispatch from EEK Mechanical</h2>
            <table style="border-collapse: collapse; width: 100%;">
                <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Rego:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${jobData.rego}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Customer:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${jobData.customer_name || 'N/A'}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Phone:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${jobData.phone1 || 'N/A'}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${jobData.email || 'N/A'}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Pickup:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${jobData.pickup_address || 'TBA'}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Destination:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${jobData.destination_address || 'TBA'}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Vehicle:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${[jobData.year, jobData.make, jobData.model, jobData.colour].filter(Boolean).join(' ') || 'N/A'}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Fault:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${jobData.fault_description || 'N/A'}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Notes:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${jobData.internal_notes || 'N/A'}</td></tr>
            </table>
            <p style="margin-top: 20px;">Please confirm receipt of this job by replying to this email or calling 0800 769 000.</p>
            <p style="color: #666;">EEK Mechanical | www.eek.nz</p>
        `;
        
        const results = { sms: null, email: null };
        
        // Send SMS
        if (supplierData.supplier_phone || supplierData.phone || supplierData.mobile) {
            results.sms = await this.sendSms(
                supplierData.supplier_phone || supplierData.phone || supplierData.mobile,
                message,
                '64'
            );
        }
        
        // Send email
        if (supplierData.supplier_email || supplierData.email) {
            results.email = await this.sendEmail(
                supplierData.supplier_email || supplierData.email,
                emailSubject,
                emailBody
            );
        }
        
        return results;
    },
    
    // ========================================================================
    // TEMPLATE-BASED MESSAGING
    // ========================================================================
    
    /**
     * Send message using template
     */
    async sendFromTemplate(templateName, data, recipient) {
        // Get template from database
        const template = await db.templates.get(templateName);
        
        if (!template) {
            console.error('Template not found:', templateName);
            return { success: false, error: 'Template not found' };
        }
        
        // Render template
        const rendered = db.templates.render(template, data);
        
        // Send based on template type
        if (template.template_type === 'sms') {
            return await this.sendSms(
                recipient.phone,
                rendered.body,
                recipient.countryCode || '64'
            );
        } else {
            return await this.sendEmail(
                recipient.email,
                rendered.subject,
                rendered.body
            );
        }
    },
    
    // ========================================================================
    // STAFF NOTIFICATIONS
    // ========================================================================
    
    /**
     * Notify staff of important event
     */
    async notifyStaff(event, details) {
        // This would send to configured staff notification channels
        console.log('Staff notification:', event, details);
        
        // Could integrate with:
        // - Slack webhook
        // - Microsoft Teams
        // - Email to staff distribution list
        // - SMS to on-call staff
        
        return { success: true, logged: true };
    }
};

// ============================================================================
// EXPORT
// ============================================================================

window.messaging = messaging;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = messaging;
}

