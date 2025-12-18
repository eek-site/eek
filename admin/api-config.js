// Road and Rescue API Configuration
// All API endpoints and Power Automate flow URLs

const API_CONFIG = {
    // Power Automate Flow Endpoints
    flows: {
        // API Management Flow (existing)
        apiManagement: "https://prod-50.australiasoutheast.logic.azure.com:443/workflows/209524261efe4bf584ad77cd745fc58d/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=21khH6fPcAWT-BzK0J11GCOBTO0EWinYErKPqfBdaXI",
        
        // Stripe Payment Link Creation (existing)
        stripePaymentLink: "https://prod-22.australiasoutheast.logic.azure.com:443/workflows/e902e35b4e574defb0af836b4259602c/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=4DuJt4Ol0Z75ZXD6m4XEtbtGoPlhCnPhor0FsW8ncog",
        
        // New flows to be created (placeholders - update with actual URLs after creation)
        jobOperations: "YOUR_POWER_AUTOMATE_FLOW_URL_HERE/job-operations",
        supplierOperations: "YOUR_POWER_AUTOMATE_FLOW_URL_HERE/supplier-operations",
        customerOperations: "YOUR_POWER_AUTOMATE_FLOW_URL_HERE/customer-operations",
        invoiceOperations: "YOUR_POWER_AUTOMATE_FLOW_URL_HERE/invoice-operations",
        receiptOperations: "YOUR_POWER_AUTOMATE_FLOW_URL_HERE/receipt-operations",
        notificationOperations: "YOUR_POWER_AUTOMATE_FLOW_URL_HERE/notification-operations",
        bookingDataOperations: "YOUR_POWER_AUTOMATE_FLOW_URL_HERE/booking-data-operations"
    },
    
    // SharePoint REST API Base URL (update with your SharePoint site URL)
    sharepoint: {
        baseUrl: "https://YOUR_TENANT.sharepoint.com/sites/YOUR_SITE",
        siteUrl: "/sites/YOUR_SITE",
        lists: {
            jobs: "/Lists/Jobs",
            jobBuildNotes: "/Lists/JobBuildNotes",
            whiteList: "/Lists/WhiteList",
            receipts: "/Lists/Receipts",
            invoices: "/Lists/Invoices",
            transactions: "/Lists/Transactions",
            contractors: "/Lists/Contractors",
            apiNumbers: "/Lists/APINumbers",
            apiExtensionList: "/Lists/APIExtensionList"
        }
    },
    
    // External APIs
    external: {
        carJam: {
            baseUrl: "https://www.carjam.co.nz",
            apiVehicle: "/api/car/",
            apiAvailability: "/api/availability/",
            apiValuation: "/a/vehicle:valuation",
            apiJapan: "/a/vehicle:japan_lookup"
        }
    },
    
    // Action mappings - maps VBA function names to API endpoints
    actionMappings: {
        // Job Operations
        "UpdateInvoiceName": { flow: "jobOperations", action: "updateInvoiceName" },
        "UpdateJobAddressByRego": { flow: "jobOperations", action: "updateJobAddress" },
        "OpenJobRegister": { flow: "jobOperations", action: "getJobs" },
        "JobComplete": { flow: "jobOperations", action: "completeJob" },
        "CloseJob": { flow: "jobOperations", action: "closeJob" },
        "Cancellation": { flow: "jobOperations", action: "cancelJob" },
        
        // Supplier Operations
        "UpdateSupplierDetails": { flow: "supplierOperations", action: "updateSupplier" },
        "SendJobToSupplier": { flow: "supplierOperations", action: "sendJob" },
        "SendMessageToSupplier": { flow: "supplierOperations", action: "sendMessage" },
        "CallSupplier": { flow: "supplierOperations", action: "callSupplier" },
        
        // Customer Operations
        "CustomerReply": { flow: "customerOperations", action: "processReply" },
        "CallCustomer": { flow: "customerOperations", action: "callCustomer" },
        "SendManualText": { flow: "customerOperations", action: "sendText" },
        "DriverEnRoute": { flow: "customerOperations", action: "driverEnRoute" },
        "RevisedETA": { flow: "customerOperations", action: "revisedETA" },
        
        // Invoice Operations
        "AutomateInvoicing": { flow: "invoiceOperations", action: "createInvoice" },
        "SendInvoice": { flow: "invoiceOperations", action: "sendInvoice" },
        
        // API Management
        "AddAPINumber": { flow: "apiManagement", action: "add" },
        "UpdateAPIExtension": { flow: "apiManagement", action: "update" },
        "DeleteAPINumber": { flow: "apiManagement", action: "delete" },
        
        // Booking Data
        "AddRecordToBookingData": { flow: "bookingDataOperations", action: "addRecord" },
        
        // Notifications
        "NotifyCustomerOfChange": { flow: "notificationOperations", action: "notifyCustomer" },
        "NotifySupplierOfChange": { flow: "notificationOperations", action: "notifySupplier" },
        
        // Payment
        "SendManualPaymentGateway": { flow: "stripePaymentLink", action: "createLink" },
        
        // Special Services
        "CreateInsuranceFolder": { flow: "jobOperations", action: "createInsuranceFolder" },
        "GeneratePrepurchaseReport": { flow: "jobOperations", action: "generatePPIReport" },
        "GenerateWordReportFromTable": { flow: "jobOperations", action: "generateWordReport" },
        "SendInsuranceReport": { flow: "notificationOperations", action: "sendInsuranceReport" }
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_CONFIG;
}

