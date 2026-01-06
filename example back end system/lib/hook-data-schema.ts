/**
 * Eek Mechanical Data Schema
 * Standardized data structures for jobs, billing, and communications
 */

// Job status options
export const JOB_STATUS = ['Open', 'Dispatched', 'En Route', 'On Site', 'Completed', 'Cancelled'] as const
export type JobStatus = typeof JOB_STATUS[number]

// Job priority options
export const JOB_PRIORITY = ['Normal', 'Urgent'] as const
export type JobPriority = typeof JOB_PRIORITY[number]

// Issue types - why the vehicle needs towing
export const ISSUE_TYPES = [
  'Breakdown',
  'Accident',
  'Flat Battery',
  'Flat Tyre',
  'Locked Out',
  'Won\'t Start',
  'Overheating',
  'Fuel Issue',
  'Other'
] as const
export type IssueType = typeof ISSUE_TYPES[number]

// Tow purpose - where the vehicle is going / outcome
export const TOW_PURPOSES = [
  'Mechanical Repair',
  'Panel & Paint',
  'Insurance Assessment',
  'Dealer / Auction',
  'Home / Residence',
  'Storage Yard',
  'Wreckers / Scrap',
  'WOF / Inspection',
  'Pre-Purchase Inspection',
  'Other'
] as const
export type TowPurpose = typeof TOW_PURPOSES[number]

// Vehicle condition options
export const VEHICLE_CONDITIONS = [
  'Runs and drives',
  'Runs but won\'t move',
  'Won\'t start - wheels roll',
  'Won\'t start - wheels locked',
  'Accident damage - driveable',
  'Accident damage - not driveable',
  'Unknown'
] as const
export type VehicleCondition = typeof VEHICLE_CONDITIONS[number]

// Drivetrain options (affects towing method)
export const DRIVETRAINS = [
  'Front Wheel Drive',
  'Rear Wheel Drive',
  'All Wheel Drive (AWD)',
  '4WD',
  'Unknown'
] as const
export type Drivetrain = typeof DRIVETRAINS[number]

// Pet types
export const PET_TYPES = ['Dog', 'Cat', 'Bird', 'Other'] as const
export type PetType = typeof PET_TYPES[number]

// Job data structure
export interface Job {
  id: string
  createdAt: string
  status: JobStatus
  priority: JobPriority
  
  // Customer details
  customerName: string
  customerPhone: string
  customerEmail?: string
  
  // Location
  pickupLocation: string
  dropoffLocation?: string
  
  // Vehicle
  vehicleRego?: string
  vehicleMake?: string
  vehicleModel?: string
  vehicleColor?: string
  
  // Job details
  issueType: IssueType
  description?: string
  notes?: string
  
  // Assignment
  operatorId?: string
  operatorName?: string
  operatorPhone?: string
  
  // Billing
  quotedPrice?: number
  finalPrice?: number
  invoiceSent?: boolean
  paid?: boolean
  
  // Timestamps
  dispatchedAt?: string
  arrivedAt?: string
  completedAt?: string
  
  // Audit
  createdBy: string
  modifiedAt?: string
  modifiedBy?: string
}

// Passenger information
export interface Passenger {
  name: string
  phone?: string
  needsTransport: boolean
}

// Pet information
export interface Pet {
  type: PetType
  name?: string
  notes?: string
}

// Extended customer booking data (what comes from the customer payment page)
export interface CustomerBookingData {
  // Customer details
  customerName: string
  customerPhone: string
  customerEmail: string
  
  // Location
  pickupLocation: string
  dropoffLocation?: string
  
  // Vehicle
  vehicleRego: string
  vehicleMake: string
  vehicleModel: string
  vehicleColor: string
  vehicleYear?: string
  vehicleVin?: string
  vehicleFuel?: string
  vehicleCc?: string
  vehicleBody?: string
  
  // Issue & Purpose
  issueType: IssueType
  towPurpose: TowPurpose
  description?: string
  
  // Vehicle condition (important for towing method)
  vehicleCondition: VehicleCondition
  drivetrain?: Drivetrain
  keysAvailable: boolean
  wheelsRoll: boolean
  isModified: boolean
  modificationNotes?: string
  
  // Passengers
  passengerCount: number  // 0 = just the driver
  passengers: Passenger[]  // Additional passengers needing transport
  
  // Health & Safety
  hasHealthConcerns: boolean
  healthNotes?: string
  
  // Pets
  hasPets: boolean
  pets: Pet[]
  
  // Terms
  termsAccepted: boolean
  termsAcceptedAt?: string
  
  // Special instructions
  specialInstructions?: string
}

// Booking form data (what comes from the booking form)
export interface BookingFormData {
  customerName: string
  customerPhone: string
  customerEmail?: string
  pickupLocation: string
  dropoffLocation?: string
  vehicleRego?: string
  vehicleMake?: string
  vehicleModel?: string
  vehicleColor?: string
  issueType: IssueType
  description?: string
  priority: JobPriority
}

// Billing form data
export interface BillingFormData {
  jobId: string
  amount: number
  description?: string
  sendToCustomer: boolean
}

// Communication types
export const COMM_TYPES = ['To Customer', 'To Supplier'] as const
export type CommType = typeof COMM_TYPES[number]

// Communication form data
export interface CommsFormData {
  jobId: string
  commType: CommType
  recipientPhone: string
  recipientEmail?: string
  message: string
  includeJobDetails: boolean
}

// Operator data
export interface Operator {
  id: string
  name: string
  phone: string
  email?: string
  region: string
  available: boolean
  currentJobId?: string
}

// Validation helpers
export const VALIDATION = {
  isValidPhone: (phone: string): boolean => {
    const cleaned = phone.replace(/[\s\-()]/g, '')
    return /^\+?[\d]{7,15}$/.test(cleaned)
  },
  
  isValidEmail: (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  },
  
  isValidRego: (rego: string): boolean => {
    return rego.length >= 2 && rego.length <= 10
  }
}

// Format helpers
export const FORMATTERS = {
  currency: (value: number): string => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD'
    }).format(value)
  },
  
  date: (value: string): string => {
    return new Date(value).toLocaleDateString('en-NZ')
  },
  
  datetime: (value: string): string => {
    return new Date(value).toLocaleString('en-NZ')
  },
  
  phone: (value: string): string => {
    const cleaned = value.replace(/[\s\-()]/g, '')
    if (cleaned.startsWith('0800')) {
      return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')
    }
    if (cleaned.startsWith('02')) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')
    }
    return value
  }
}

// Webhook payload for external integrations
export interface FlowPayload {
  action: string
  formType: 'Booking' | 'Billing' | 'Comms' | 'StatusUpdate'
  data: Record<string, unknown>
  submittedBy: string
  submittedAt: string
}
