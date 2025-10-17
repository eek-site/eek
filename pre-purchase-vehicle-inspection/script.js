/* Eek Mechanical - Pre Purchase Inspection JavaScript */
/* Clean, Mobile-First Booking System */

// Global variables
let currentStep = 1;
let selectedService = null;
let selectedServicePrice = 0;
let bookingData = {};

// Tracking variables
let sessionId = null;
let gclid = null;
let utmData = {};

// Service options
const services = {
  basic: {
    id: 'basic',
    name: 'Basic Mechanical Inspection',
    price: 299,
    features: [
      '44-point mechanical inspection by A-grade mechanic',
      'Full pre-purchase inspection standards',
      'Pass/fail assessment with detailed report',
      'Perfect for Dealer Inspections'
    ]
  },
  comprehensive: {
    id: 'comprehensive',
    name: 'Comprehensive Report',
    price: 599,
    features: [
      'Everything in Basic, PLUS:',
      'Finance owing check',
      'Insurance history verification',
      'Complete protection - RECOMMENDED'
    ]
  }
};

// Vehicle types
const vehicleTypes = [
  { id: 'car', name: 'Car', icon: '🚗' },
  { id: 'suv', name: 'SUV/4WD', icon: '🚙' },
  { id: 'ute', name: 'Ute/Pickup', icon: '🛻' },
  { id: 'van', name: 'Van', icon: '🚐' },
  { id: 'truck', name: 'Truck', icon: '🚛' },
  { id: 'other', name: 'Other', icon: '🚜' }
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  initializeTracking();
  initializeApp();
  setupEventListeners();
  updateContinueButton();
});

// Initialize tracking
function initializeTracking() {
  sessionId = getOrCreateSessionId();
  gclid = getGCLID();
  utmData = getUTMData();
  
  console.log('🔍 Tracking initialized - Session:', sessionId, 'GCLID:', gclid);
  console.log('🔍 UTM Data:', utmData);
  
  // Track page visit
  if (typeof gtag !== 'undefined') {
    gtag('event', 'page_view', {
      page_title: 'Pre Purchase Inspection',
      page_location: window.location.href,
      page_type: 'inspection',
      source_type: window.enhancedTracking?.getTrackingData()?.pageSource?.type || 'unknown'
    });
  }
  
  // Track inspection page visit with enhanced data
  if (window.enhancedTracking) {
    window.enhancedTracking.trackEvent('inspection_page_visit', 'Service', 'Pre Purchase Inspection', {
      service_type: 'inspection',
      page_type: 'inspection'
    });
  }
}

// Session management
function getOrCreateSessionId() {
  let sid = localStorage.getItem("eek_session_id");
  if (!sid) {
    sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("eek_session_id", sid);
  }
  return sid;
}

// GCLID extraction and storage
function getGCLID() {
  const urlParams = new URLSearchParams(window.location.search);
  let gclidValue = extractGCLID(urlParams);
  
  if (gclidValue) {
    localStorage.setItem("eek_gclid", gclidValue);
    localStorage.setItem("eek_gclid_timestamp", new Date().toISOString());
    return gclidValue;
  }
  
  const storedGclid = localStorage.getItem("eek_gclid");
  const storedTimestamp = localStorage.getItem("eek_gclid_timestamp");
  if (storedGclid && storedTimestamp) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    if (new Date(storedTimestamp) > thirtyDaysAgo) return storedGclid;
    localStorage.removeItem("eek_gclid");
    localStorage.removeItem("eek_gclid_timestamp");
  }
  return null;
}

function extractGCLID(urlParams) {
  return urlParams.get('gclid') || urlParams.get('gbraid') || urlParams.get('wbraid') || null;
}

// UTM parameter extraction
function getUTMData() {
  const urlParams = new URLSearchParams(window.location.search);
  const utm = {};
  const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  
  utmParams.forEach(param => {
    const value = urlParams.get(param);
    if (value) {
      utm[param] = value;
      localStorage.setItem(`eek_${param}`, value);
    } else {
      const stored = localStorage.getItem(`eek_${param}`);
      if (stored) utm[param] = stored;
    }
  });
  
  return utm;
}

// Initialize application
function initializeApp() {
  // Show initial step
  showStep(1);
  
  // Initialize service selection
  renderServiceOptions();
  
  // Initialize vehicle types
  renderVehicleTypes();
  
  // Setup countdown timer
  setupCountdownTimer();
}

// Setup event listeners
function setupEventListeners() {
  // Service selection
  document.addEventListener('click', function(e) {
    try {
      const serviceOption = e.target?.closest('.service-option');
      if (serviceOption) {
        const serviceId = serviceOption.dataset?.service;
        if (serviceId) {
          selectService(serviceId);
        }
      }
    } catch (error) {
      console.warn('Service selection error:', error);
    }
  });
  
  // Vehicle type selection
  document.addEventListener('click', function(e) {
    try {
      const vehicleTypeOption = e.target?.closest('.vehicle-type-option');
      if (vehicleTypeOption) {
        const vehicleType = vehicleTypeOption.dataset?.type;
        if (vehicleType) {
          selectVehicleType(vehicleType);
        }
      }
    } catch (error) {
      console.warn('Vehicle type selection error:', error);
    }
  });
  
  // Form validation
  document.addEventListener('input', function(e) {
    try {
      if (e.target?.matches('.form-input, .form-select, .form-textarea')) {
        validateForm();
      }
    } catch (error) {
      console.warn('Form validation error:', error);
    }
  });
}

// Service selection functions
function selectService(serviceId) {
  selectedService = services[serviceId];
  selectedServicePrice = selectedService.price;
  
  // Update UI
  try {
    document.querySelectorAll('.service-option').forEach(option => {
      option.classList.remove('selected');
    });
    
    const selectedElement = document.querySelector(`[data-service="${serviceId}"]`);
    if (selectedElement) {
      selectedElement.classList.add('selected');
    }
  } catch (error) {
    console.warn('Service UI update error:', error);
  }
  
  updateSelectedServiceDisplay();
  updateContinueButton();
  
  // Track service selection
  if (typeof gtag !== 'undefined') {
    gtag('event', 'service_selection', {
      service_name: selectedService.name,
      service_id: serviceId,
      service_price: selectedServicePrice,
      event_category: 'pre_purchase_inspection',
      page_type: 'inspection',
      source_type: window.enhancedTracking?.getTrackingData()?.pageSource?.type || 'unknown'
    });
  }
  
  // Track with enhanced tracking system
  if (window.enhancedTracking) {
    window.enhancedTracking.trackEvent('inspection_service_selection', 'Service Selection', selectedService.name, {
      service_id: serviceId,
      service_price: selectedServicePrice,
      service_type: 'inspection'
    });
  }
  
  // Close modal and advance to next step
  closeServiceModal();
  setTimeout(() => {
    showStep(2);
  }, 300); // Small delay to allow modal close animation
}

function updateSelectedServiceDisplay() {
  const display = document.getElementById('selected-service-display');
  if (!display) return;
  
  if (selectedService) {
    display.style.display = 'block';
    display.innerHTML = `
      <h3>Selected Service</h3>
      <div class="selected-service-info">
        <h4>${selectedService.name}</h4>
        <p class="service-price">$${selectedService.price}</p>
        <ul class="service-features">
          ${selectedService.features.map(feature => `<li>${feature}</li>`).join('')}
        </ul>
      </div>
    `;
  } else {
    display.style.display = 'none';
  }
}

// Service modal functions
function openServiceSelectionModal() {
  const modal = document.getElementById('serviceModal');
  if (modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
}

function closeServiceModal() {
  const modal = document.getElementById('serviceModal');
  if (modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }
}

// Render service options
function renderServiceOptions() {
  const container = document.getElementById('serviceOptions');
  if (!container) return;
  
  container.innerHTML = Object.values(services).map(service => `
    <div class="service-option" data-service="${service.id}">
      <h3 class="service-title">${service.name}</h3>
      <div class="service-price">$${service.price}</div>
      <ul class="service-features">
        ${service.features.map(feature => `<li>${feature}</li>`).join('')}
      </ul>
    </div>
  `).join('');
}

// Vehicle type functions
function selectVehicleType(type) {
  bookingData.vehicleType = type;
  
  // Update UI
  try {
    document.querySelectorAll('.vehicle-type-option').forEach(option => {
      option.classList.remove('selected');
    });
    
    const selectedElement = document.querySelector(`[data-type="${type}"]`);
    if (selectedElement) {
      selectedElement.classList.add('selected');
    }
  } catch (error) {
    console.warn('Vehicle type UI update error:', error);
  }
  
  updateContinueButton();
}

function renderVehicleTypes() {
  const container = document.getElementById('vehicleTypes');
  if (!container) return;
  
  container.innerHTML = vehicleTypes.map(type => `
    <div class="vehicle-type-option" data-type="${type.id}">
      <span class="vehicle-icon">${type.icon}</span>
      <span class="vehicle-name">${type.name}</span>
    </div>
  `).join('');
}

// Step navigation
function showStep(stepNum) {
  // Hide all steps
  try {
    document.querySelectorAll('.step').forEach(step => {
      step.classList.remove('active');
    });
  } catch (error) {
    console.warn('Step hiding error:', error);
  }
  
  // Show current step
  const currentStepElement = document.getElementById(`step${stepNum}`);
  if (currentStepElement) {
    currentStepElement.classList.add('active');
  }
  
  // Update progress bar
  updateProgressBar(stepNum);
  
  // Hide/show elements based on step
  if (stepNum > 1) {
    document.getElementById('mainBanner').style.display = 'none';
  } else {
    document.getElementById('mainBanner').style.display = 'block';
  }
  
  // Show/hide navigation buttons
  const continueBtn = document.getElementById('continueBtn');
  const prevBtn = document.getElementById('prevBtn');
  
  // Show/hide floating buttons
  const floatingServiceBtn = document.getElementById('floatingServiceBtn');
  const floatingContinueBtn = document.getElementById('floatingContinueBtn');
  const floatingPrevBtn = document.getElementById('floatingPrevBtn');
  
  if (stepNum === 1) {
    // Step 1: Show service selection floating button
    if (continueBtn) continueBtn.style.display = 'none';
    if (prevBtn) prevBtn.style.display = 'none';
    if (floatingServiceBtn) floatingServiceBtn.style.display = 'flex';
    if (floatingContinueBtn) floatingContinueBtn.style.display = 'none';
    if (floatingPrevBtn) floatingPrevBtn.style.display = 'none';
  } else {
    // Other steps: Show floating navigation buttons
    if (continueBtn) continueBtn.style.display = 'block';
    if (prevBtn) prevBtn.style.display = stepNum > 1 ? 'block' : 'none';
    if (floatingServiceBtn) floatingServiceBtn.style.display = 'none';
    if (floatingContinueBtn) floatingContinueBtn.style.display = 'flex';
    if (floatingPrevBtn) floatingPrevBtn.style.display = stepNum > 1 ? 'flex' : 'none';
  }
  
  currentStep = stepNum;
  updateContinueButton();
}

function updateProgressBar(stepNum) {
  try {
    document.querySelectorAll('.progress-step').forEach((step, index) => {
      step.classList.remove('active', 'completed');
      if (index + 1 < stepNum) {
        step.classList.add('completed');
      } else if (index + 1 === stepNum) {
        step.classList.add('active');
      }
    });
  } catch (error) {
    console.warn('Progress bar update error:', error);
  }
}

// Form validation
function validateForm() {
  const currentStepElement = document.getElementById(`step${currentStep}`);
  if (!currentStepElement) return true;
  
  const requiredFields = currentStepElement.querySelectorAll('[required]');
  let isValid = true;
  
  try {
    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        isValid = false;
        field.classList.add('error');
      } else {
        field.classList.remove('error');
      }
    });
  } catch (error) {
    console.warn('Form validation error:', error);
  }
  
  return isValid;
}

// Continue button functions
function updateContinueButton() {
  const button = document.getElementById('continueBtn');
  const floatingButton = document.getElementById('floatingContinueBtn');
  
  let canContinue = false;
  
  switch (currentStep) {
    case 1:
      canContinue = selectedService !== null;
      break;
    case 2:
      canContinue = validateForm();
      break;
    case 3:
      canContinue = bookingData.vehicleType && validateForm();
      break;
    case 4:
      canContinue = validateForm();
      break;
    case 5:
      canContinue = validateForm();
      break;
    case 6:
      canContinue = validateForm();
      break;
    case 7:
      canContinue = true;
      break;
  }
  
  const buttonText = currentStep === 7 ? 'Complete Booking' : 'Continue';
  
  if (button) {
    button.disabled = !canContinue;
    button.textContent = buttonText;
  }
  
  if (floatingButton) {
    floatingButton.disabled = !canContinue;
    floatingButton.textContent = buttonText;
  }
}

function goToNextStep() {
  if (currentStep < 7) {
    // Collect form data
    collectFormData();
    
    // Validate current step
    if (!validateForm()) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }
    
    showStep(currentStep + 1);
  } else {
    // Complete booking
    completeBooking();
  }
}

function goToPreviousStep() {
  if (currentStep > 1) {
    showStep(currentStep - 1);
  }
}

// Form data collection
function collectFormData() {
  const currentStepElement = document.getElementById(`step${currentStep}`);
  if (!currentStepElement) return;
  
  const formData = new FormData(currentStepElement);
  const data = Object.fromEntries(formData.entries());
  
  // Merge with existing booking data
  bookingData = { ...bookingData, ...data };
}

// Complete booking
async function completeBooking() {
  const button = document.getElementById('continueBtn');
  if (!button) return;
  
  // Collect final form data
  collectFormData();
  
  // 🆕 ENHANCED GEOLOCATION DATA - ALL AVAILABLE FIELDS
  const geo = window.CF_GEO || {
    country: 'Unknown',
    city: 'Unknown', 
    region: 'Unknown',
    postalCode: 'Unknown',
    latitude: null,
    longitude: null,
    timezone: 'Unknown',
    continent: 'Unknown',
    regionCode: 'Unknown',
    countryCode: 'Unknown'
  };
  
  // Get comprehensive tracking data
  const trackingData = window.enhancedTracking ? window.enhancedTracking.getTrackingData() : {};
  
  // Prepare booking data in the format expected by the original API
  const finalBookingData = {
    // Customer information
    name: `${bookingData.firstName || ''} ${bookingData.lastName || ''}`.trim(),
    phone: bookingData.phone || '',
    email: bookingData.email || '',
    location: bookingData.address || '',
    
    // Service information
    service: selectedService.id === 'basic' ? 'inspection_basic' : 'inspection_comprehensive',
    serviceCode: selectedService.id === 'basic' ? 'INSP_BASIC' : 'INSP_COMP',
    serviceTitle: selectedService.id === 'basic' ? 'Basic Mechanical Inspection' : 'Comprehensive Pre-Purchase Report',
    serviceTier: selectedService.id,
    basePrice: selectedServicePrice,
    
    // Vehicle information
    vehicleMake: bookingData.make || '',
    vehicleModel: bookingData.model || '',
    vehicleYear: bookingData.year || '',
    vehicleType: bookingData.vehicleType || '',
    odometer: bookingData.odometer || '',
    vehicleRego: bookingData.vehicleRego || '',
    
    // Seller information
    sellerName: bookingData.sellerName || '',
    sellerPhone: bookingData.sellerPhone || '',
    suburb: bookingData.suburb || '',
    city: bookingData.city || '',
    
    // Scheduling
    preferredDate: bookingData.preferredDate || '',
    preferredTime: bookingData.preferredTime || '',
    specialInstructions: bookingData.specialInstructions || '',
    inspectionType: bookingData.inspectionType || '',
    
    // Terms and marketing
    termsAccepted: bookingData.termsAccepted || false,
    marketingConsent: bookingData.marketingConsent || false,
    
    // Booking status
    bookingStatus: 'NEW',
    eventType: 'inspection_booking_completed',
    
    // Page source data
    pageSource: {
      type: trackingData.pageSource?.type || 'direct',
      detail: trackingData.pageSource?.detail || 'Direct visit',
      referrer: trackingData.pageSource?.referrer || '',
      utm: {
        source: trackingData.pageSource?.utm?.source || '',
        medium: trackingData.pageSource?.utm?.medium || '',
        campaign: trackingData.pageSource?.utm?.campaign || '',
        term: trackingData.pageSource?.utm?.term || '',
        content: trackingData.pageSource?.utm?.content || ''
      },
      clickIds: {
        gclid: trackingData.pageSource?.clickIds?.gclid || '',
        fbclid: trackingData.pageSource?.clickIds?.fbclid || '',
        msclkid: trackingData.pageSource?.clickIds?.msclkid || ''
      }
    },
    
    // Device and engagement data
    device: {
      userAgent: trackingData.userAgent || navigator.userAgent || '',
      screenResolution: trackingData.screenResolution || `${screen.width}x${screen.height}`,
      viewportSize: trackingData.viewportSize || `${window.innerWidth}x${window.innerHeight}`,
      language: trackingData.language || navigator.language || '',
      timezone: trackingData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    },
    
    engagement: {
      timeOnPage: trackingData.engagement?.timeOnPage || 0,
      scrollDepth: trackingData.engagement?.scrollDepth || 0,
      clicks: trackingData.engagement?.clicks || 0,
      formInteractions: trackingData.engagement?.formInteractions || 0,
      buttonClicks: trackingData.engagement?.buttonClicks || 0
    },
    
    // User journey data
    userJourney: {
      pageHistory: trackingData.userJourney?.pageHistory || [],
      totalPages: trackingData.userJourney?.totalPages || 1,
      sessionDuration: trackingData.userJourney?.sessionDuration || 0,
      entryPage: trackingData.userJourney?.entryPage || window.location.href,
      previousPage: trackingData.userJourney?.previousPage || ''
    },
    
    // Tracking data
    sessionId: sessionId,
    gclid: gclid,
    utm: {
      source: utmData.utm_source || '',
      medium: utmData.utm_medium || '',
      campaign: utmData.utm_campaign || '',
      term: utmData.utm_term || '',
      content: utmData.utm_content || '',
      gclid: gclid || ''
    },
    
    // Page data
    pageUrl: trackingData.pageUrl || window.location.href,
    pagePath: trackingData.pagePath || window.location.pathname,
    pageTitle: trackingData.pageTitle || document.title,
    pageType: trackingData.pageType || 'inspection',
    
    // Timestamps
    timestamp: new Date().toISOString(),
    scheduledDate: new Date().toISOString(),
    scheduledDateISO: new Date().toISOString(),
    
    // Geolocation data
    location: {
      country: geo.country || 'Unknown',
      countryCode: geo.countryCode || geo.country || 'Unknown',
      region: geo.region || 'Unknown',
      regionCode: geo.regionCode || 'Unknown',
      city: geo.city || 'Unknown',
      postalCode: geo.postalCode || 'Unknown',
      continent: geo.continent || 'Unknown',
      coordinates: {
        latitude: geo.latitude || null,
        longitude: geo.longitude || null,
        accuracy: geo.latitude && geo.longitude ? 'IP-based' : null
      },
      timezone: geo.timezone || 'Unknown',
      raw: geo
    }
  };
  
  // Show loading state
  button.disabled = true;
  button.textContent = 'Processing...';
  
  try {
    // Submit booking
    const response = await submitBooking(finalBookingData);
    
    if (response.success) {
      // Track successful booking completion
      if (typeof gtag !== 'undefined') {
        gtag('event', 'booking_completed', {
          service_name: selectedService.name,
          service_price: selectedServicePrice,
          event_category: 'pre_purchase_inspection',
          value: selectedServicePrice,
          currency: 'NZD',
          page_type: 'inspection',
          source_type: window.enhancedTracking?.getTrackingData()?.pageSource?.type || 'unknown'
        });
      }
      
      // Track with enhanced tracking system
      if (window.enhancedTracking) {
        window.enhancedTracking.trackEvent('inspection_booking_completed', 'Conversion', selectedService.name, {
          service_id: selectedService.id,
          service_price: selectedServicePrice,
          service_type: 'inspection',
          conversion_value: selectedServicePrice,
          currency: 'NZD'
        });
        
        // Send comprehensive booking data to API
        window.enhancedTracking.sendTrackingData('inspection_booking_completed', {
          service: selectedService,
          price: selectedServicePrice,
          bookingData: finalBookingData
        });
      }
      
      showNotification('Booking submitted successfully!', 'success');
      
      // Redirect to payment or confirmation
      if (response.paymentUrl) {
        window.location.href = response.paymentUrl;
      }
    } else {
      throw new Error(response.message || 'Booking failed');
    }
  } catch (error) {
    console.error('Booking error:', error);
    showNotification('Booking failed. Please try again.', 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Complete Booking';
  }
}

// Submit booking to API
async function submitBooking(data) {
  const POWER_AUTOMATE_URL = 'https://default61ffc6bcd9ce458b8120d32187c377.0d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/dbc93a177083499caf5a06eeac87683c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=vXidGdo8qErY4QVv03JeNaGbA79eWEoiOxuDocljL6Q';
  
  try {
    const response = await fetch(POWER_AUTOMATE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, message: error.message };
  }
}

// Notification system
function showNotification(message, type = 'success') {
  // Remove existing notifications
  const existing = document.querySelector('.notification');
  if (existing) {
    existing.remove();
  }
  
  // Create notification
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Show notification
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 5000);
}

// Countdown timer
function setupCountdownTimer() {
  const hoursElement = document.getElementById('countdown-hours');
  const minutesElement = document.getElementById('countdown-minutes');
  const secondsElement = document.getElementById('countdown-seconds');
  
  if (!hoursElement || !minutesElement || !secondsElement) return;
  
  // Set countdown to 3 hours from now
  const countdownTime = new Date().getTime() + (3 * 60 * 60 * 1000);
  
  function updateCountdown() {
    const now = new Date().getTime();
    const distance = countdownTime - now;
    
    if (distance < 0) {
      // Countdown finished
      hoursElement.textContent = '00';
      minutesElement.textContent = '00';
      secondsElement.textContent = '00';
      return;
    }
    
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    hoursElement.textContent = hours.toString().padStart(2, '0');
    minutesElement.textContent = minutes.toString().padStart(2, '0');
    secondsElement.textContent = seconds.toString().padStart(2, '0');
  }
  
  // Update immediately
  updateCountdown();
  
  // Update every second
  setInterval(updateCountdown, 1000);
}

// Utility functions
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD'
  }).format(amount);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-NZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal')) {
    closeServiceModal();
  }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeServiceModal();
  }
});

// Export functions for global access
window.openServiceSelectionModal = openServiceSelectionModal;
window.closeServiceModal = closeServiceModal;
window.goToNextStep = goToNextStep;
window.goToPreviousStep = goToPreviousStep;

