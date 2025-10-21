/* Eek Mechanical - Pre Purchase Inspection JavaScript */
/* Clean, Mobile-First Booking System */
/* Cache busting: v20251020.7 */

// Global variables
let currentStep = 1;
let selectedService = null;
let selectedServicePrice = 0;
let selectedDay = null;
let selectedDayString = '';
let selectedVehicleType = 'standard';
let vehicleTypeAddon = 0;
let bookingData = {};

// Tracking variables
let sessionId = null;
let gclid = null;
let utmData = {};

// Enhanced visitor data persistence
function storeVisitorData(data) {
  const visitorData = JSON.parse(localStorage.getItem('eek_visitor_data') || '{}');
  
  // Merge new data with existing data
  Object.assign(visitorData, data);
  
  // Add timestamp for data freshness
  visitorData.lastUpdated = new Date().toISOString();
  
  localStorage.setItem('eek_visitor_data', JSON.stringify(visitorData));
  
  console.log('✅ Visitor data stored:', data);
  return visitorData;
}

function getVisitorData() {
  return JSON.parse(localStorage.getItem('eek_visitor_data') || '{}');
}

function clearVisitorData() {
  localStorage.removeItem('eek_visitor_data');
  console.log('🗑️ Visitor data cleared');
}

// Enhanced visitor journey tracking
function trackVisitorJourney(action, data = {}) {
  const journey = JSON.parse(localStorage.getItem('eek_visitor_journey') || '[]');
  const sessionId = localStorage.getItem("eek_session_id");
  const gclid = localStorage.getItem("eek_gclid");
  const visitorData = getVisitorData();
  
  const journeyEntry = {
    timestamp: new Date().toISOString(),
    sessionId: sessionId,
    gclid: gclid,
    action: action,
    page: {
      url: window.location.href,
      path: window.location.pathname,
      title: document.title,
      referrer: document.referrer
    },
    data: data,
    visitorData: visitorData // Include current visitor data
  };
  
  journey.push(journeyEntry);
  
  // Keep last 20 journey entries
  if (journey.length > 20) {
    journey.splice(0, journey.length - 20);
  }
  
  localStorage.setItem('eek_visitor_journey', JSON.stringify(journey));
  
  // Send to tracking API
  sendJourneyTracking(journeyEntry);
  
  return journeyEntry;
}

async function sendJourneyTracking(journeyEntry) {
  try {
    const payload = {
      eventType: "visitor_journey",
      eventAction: journeyEntry.action,
      timestamp: journeyEntry.timestamp,
      sessionId: journeyEntry.sessionId,
      gclid: journeyEntry.gclid,
      page: journeyEntry.page,
      journeyData: journeyEntry.data,
      source: 'journey_tracking'
    };
    
    await fetch(API_ENDPOINTS.tracking, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true
    });
    
    console.log('✅ Journey tracking sent:', journeyEntry.action);
  } catch (error) {
    console.error('❌ Journey tracking failed:', error);
  }
}

// Check for return visit from booking link
async function checkReturnVisit() {
  const urlParams = new URLSearchParams(window.location.search);
  const callAttemptId = urlParams.get('call_attempt_id');
  const callTimestamp = urlParams.get('call_timestamp');
  const sessionId = urlParams.get('session_id');
  
  if (callAttemptId && callTimestamp) {
    // This is a return visit from a booking link
    const returnVisitData = {
      callAttemptId: callAttemptId,
      callTimestamp: callTimestamp,
      returnTimestamp: new Date().toISOString(),
      timeBetweenCallAndReturn: new Date() - new Date(callTimestamp),
      source: 'booking_link_return',
      page: 'pre_purchase_inspection'
    };
    
    // Track the return visit
    trackVisitorJourney('booking_link_return_visit', returnVisitData);
    
    // Send return visit tracking event to Power Automate API
    const returnVisitPayload = {
      eventType: 'return_visit',
      eventAction: 'return_visit',
      callAttemptId: callAttemptId,
      callTimestamp: callTimestamp,
      returnTimestamp: returnVisitData.returnTimestamp,
      timeBetweenCallAndReturn: returnVisitData.timeBetweenCallAndReturn,
      returnSource: 'booking_link',
      page: 'pre_purchase_inspection',
      sessionId: localStorage.getItem("eek_session_id"),
      gclid: localStorage.getItem("eek_gclid"),
      timestamp: new Date().toISOString()
    };
    
    try {
      await fetch(API_ENDPOINTS.tracking, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(returnVisitPayload),
        keepalive: true
      });
      console.log('✅ Return visit tracking sent to API');
    } catch (error) {
      console.error('❌ Return visit tracking failed:', error);
    }
    
    console.log('✅ Return visit detected from booking link:', returnVisitData);
  }
  
  // Check if this is a return visit with session continuity
  const storedSessionId = localStorage.getItem("eek_session_id");
  if (sessionId && storedSessionId && sessionId === storedSessionId) {
    trackVisitorJourney('session_continuity_return', {
      sessionId: sessionId,
      returnSource: 'session_continuity'
    });
  }
}

// API Configuration - Separate endpoints for tracking vs payment
const API_ENDPOINTS = {
    tracking: 'https://default61ffc6bcd9ce458b8120d32187c377.0d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/2f31c90260554c5a9d6dcffec47bc6c2/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Ou7iqzZ1YI2PzT_9X-M6PT5iVo2QRboWnFZrO3IBOL4',
    payment: 'https://default61ffc6bcd9ce458b8120d32187c377.0d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/dbc93a177083499caf5a06eeac87683c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=vXidGdo8qErY4QVv03JeNaGbA79eWEoiOxuDocljL6Q'
};

// Backward compatibility
const POWER_AUTOMATE_URL = API_ENDPOINTS.payment;

// === BOOKING STATUS CONSTANTS ===
const BOOKING_STATUS = {
  INITIAL: 'inspection_page_loaded',
  SERVICE_SELECTED: 'service_selected',
  CUSTOMER_INFO: 'customer_info_complete',
  VEHICLE_INFO: 'vehicle_info_complete',
  SELLER_INFO: 'seller_info_complete',
  TIME_SELECTED: 'time_selected',
  INSPECTION_TYPE: 'inspection_type_selected',
  BOOKING_COMPLETE: 'inspection_booking_completed'
};

// Service options
const services = {
  basic: {
    id: 'basic',
    name: 'Basic Inspection',
    price: 299,
    features: [
      '44-point mechanical inspection by A-grade mechanic',
      'Full pre-purchase inspection standards',
      'Pass/fail assessment with detailed report',
      'Engine & transmission check',
      'Brake system inspection',
      'Steering & suspension check',
      'Electrical system basic test',
      'Exhaust system check',
      'Fluid levels inspection',
      'Basic safety assessment',
      'Report delivered immediately',
      'Perfect for Dealer Inspections'
    ]
  },
  comprehensive: {
    id: 'comprehensive',
    name: 'Comprehensive Inspection',
    price: 599,
    features: [
      'Everything in Basic, PLUS:',
      'BUY/DON\'T BUY recommendation',
      'Professional vehicle valuation',
      'Complete ownership history analysis',
      'WOF inspection history review',
      'Odometer verification & usage patterns',
      'Road User Charges compliance check',
      'Insurance write-off & stolen vehicle status',
      'Finance owing verification',
      'Service history & maintenance records',
      'Running costs analysis',
      'Safety features & ratings verification',
      'Model-specific known issues research',
      'Immediate cost estimates',
      'Seller & mechanic interviews',
      'Online research & market analysis',
      '25+ page comprehensive report',
      'Digital report delivery',
      '30-day support included',
      'Complete data protection - RECOMMENDED'
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

// Mobile-First Modal Functions - Define early for immediate availability
function openServiceSelectionModal() {
  console.log('🔧 Opening mobile-first service selection modal...');
  const modal = document.getElementById('serviceModal');
  const serviceOptions = document.getElementById('serviceOptions');
  
  if (!modal) {
    console.error('❌ Modal element not found!');
    return;
  }
  
  // Ensure service options are rendered
  if (serviceOptions && serviceOptions.children.length === 0) {
    console.log('🔧 Rendering mobile service options...');
    renderMobileServiceOptions();
  }
  
  // Show modal with mobile-first animation
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
  
  // Add escape key listener
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      closeServiceModal();
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);
  
  console.log('✅ Mobile modal opened successfully');
}

function closeServiceModal() {
  console.log('🔧 Closing mobile service selection modal...');
  const modal = document.getElementById('serviceModal');
  if (modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
    console.log('✅ Mobile modal closed successfully');
  }
}

// Export functions for global access immediately
window.openServiceSelectionModal = openServiceSelectionModal;
window.closeServiceModal = closeServiceModal;
window.goToNextStep = goToNextStep;
window.goToPreviousStep = goToPreviousStep;
window.selectDay = selectDay;
window.initializeDaySelector = initializeDaySelector;
window.selectVehicleType = selectVehicleType;
window.toggleBookingButton = toggleBookingButton;
window.buildInspectionData = buildInspectionData;
window.generatePaymentLink = generatePaymentLink;
window.closeExitIntent = closeExitIntent;
window.applyDiscount = applyDiscount;
window.testModal = function() {
  console.log('🧪 Testing modal functionality...');
  console.log('Modal element:', document.getElementById('serviceModal'));
  console.log('Service options container:', document.getElementById('serviceOptions'));
  console.log('Services object:', services);
  console.log('Opening modal...');
  openServiceSelectionModal();
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀🚀🚀 PRE-PURCHASE INSPECTION SCRIPT v3.0 - MOBILE-FIRST REDESIGN 🚀🚀🚀');
  console.log('📱 MOBILE-FIRST MODAL - Beautiful, modern design!');
  console.log('📅 Script loaded at:', new Date().toISOString());
  console.log('🔧 openServiceSelectionModal available:', typeof window.openServiceSelectionModal);
  
  initializeTracking();
  initializeDaySelector();
  initializeApp();
  setupEventListeners();
  setupExitIntent();
  updateContinueButton();
  
  // Check for return visit from booking link
  checkReturnVisit();
  
  // Send initial page load tracking
  sendStepTracking(BOOKING_STATUS.INITIAL);
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
      source_type: window.unifiedTracking?.getTrackingData()?.pageSource?.type || 'unknown'
    });
  }
  
  // Track inspection page visit with enhanced data
  if (window.unifiedTracking) {
    window.unifiedTracking.trackEvent('inspection_page_visit', 'Service', 'Pre Purchase Inspection', {
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
  
  // Debug: Check floating button visibility
  console.log('🔍 DEBUG: Checking floating button visibility on init');
  const floatingContinueBtn = document.getElementById('floatingContinueBtn');
  const floatingPrevBtn = document.getElementById('floatingPrevBtn');
  console.log('🔍 floatingContinueBtn:', floatingContinueBtn);
  console.log('🔍 floatingPrevBtn:', floatingPrevBtn);
  if (floatingContinueBtn) {
    console.log('🔍 floatingContinueBtn display:', floatingContinueBtn.style.display);
  }
  if (floatingPrevBtn) {
    console.log('🔍 floatingPrevBtn display:', floatingPrevBtn.style.display);
  }
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
          selectInspectionService(serviceId);
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
  
  // Simple form validation with debounce to prevent excessive validation calls
  let validationTimeout;
  document.addEventListener('input', function(e) {
    try {
      if (e.target?.matches('.form-input, .form-select, .form-textarea') && currentStep === 2) {
        console.log(`🔍 INPUT CHANGE - Field: ${e.target.name || e.target.id}, Value: "${e.target.value}"`);
        
        // Clear previous timeout
        if (validationTimeout) {
          clearTimeout(validationTimeout);
        }
        
        // Debounce validation to prevent excessive calls while typing
        validationTimeout = setTimeout(() => {
          updateContinueButton();
        }, 500); // Wait 500ms after user stops typing (increased from 300ms)
      }
    } catch (error) {
      console.warn('Form validation error:', error);
    }
  });

  // Enter-to-continue (ignore Shift+Enter and textareas)
  document.addEventListener('keydown', function(e) {
    try {
      const target = e.target;
      const isTextarea = target && target.tagName === 'TEXTAREA';
      if (e.key === 'Enter' && !e.shiftKey && !isTextarea) {
        e.preventDefault();
        // Only attempt to continue if not on step 1
        if (currentStep > 1) {
          goToNextStep();
        }
      }
    } catch (error) {
      console.warn('Enter-to-continue error:', error);
    }
  });

  // Mobile swipe navigation (left = next, right = back)
  (function initSwipeNavigation() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    const container = document.querySelector('.booking-container') || document.body;
    const horizontalThreshold = 60; // px
    const verticalTolerance = 50; // px

    function onTouchStart(ev) {
      const t = ev.changedTouches && ev.changedTouches[0];
      if (!t) return;
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      touchEndX = touchStartX;
      touchEndY = touchStartY;
    }
    function onTouchMove(ev) {
      const t = ev.changedTouches && ev.changedTouches[0];
      if (!t) return;
      touchEndX = t.clientX;
      touchEndY = t.clientY;
    }
    function onTouchEnd() {
      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;
      if (Math.abs(dy) > verticalTolerance) return; // ignore vertical scrolls

      // Ignore if focused element is typing (to avoid interfering with form input)
      const active = document.activeElement;
      const isTyping = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
      if (isTyping) return;

      if (dx <= -horizontalThreshold) {
        // swipe left → next
        if (currentStep < 7) goToNextStep();
      } else if (dx >= horizontalThreshold) {
        // swipe right → back
        if (currentStep > 1) goToPreviousStep();
      }
    }

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('touchend', onTouchEnd, { passive: true });
  })();
}

// Service selection functions
function selectInspectionService(serviceId) {
  selectedService = services[serviceId];
  selectedServicePrice = selectedService.price;
  
  // Update UI for mobile design
  try {
    document.querySelectorAll('.service-card-mobile').forEach(option => {
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
  
  console.log(`🔘 SERVICE SELECTED - ${selectedService.name}, Price: $${selectedServicePrice}`);
  console.log(`🔘 Current step: ${currentStep}, About to call showStep(2)`);
  
  // Move to Step 2 after service selection
  showStep(2);
  
  // Track service selection
  if (typeof gtag !== 'undefined') {
    gtag('event', 'service_selection', {
      service_name: selectedService.name,
      service_id: serviceId,
      service_price: selectedServicePrice,
      event_category: 'pre_purchase_inspection',
      page_type: 'inspection',
      source_type: window.unifiedTracking?.getTrackingData()?.pageSource?.type || 'unknown'
    });
  }
  
  // Track with unified tracking system
  if (window.unifiedTracking) {
    // Update tracking data with service selection
    window.unifiedTracking.batchUpdateTrackingData({
      'serviceType': selectedService.id === 'basic' ? 'inspection_basic' : 'inspection_comprehensive',
      'serviceTitle': selectedService.name,
      'serviceCode': selectedService.id === 'basic' ? 'INSP_BASIC' : 'INSP_COMP',
      'price': selectedServicePrice,
      'basePrice': selectedServicePrice,
      'bookingStatus': 'SERVICE_SELECTED',
      'eventType': 'service_selection'
    }, 'inspection_service_selection');
    
    // Also track as an event
    window.unifiedTracking.trackEvent('inspection_service_selection', 'Service Selection', selectedService.name, {
      service_id: serviceId,
      service_price: selectedServicePrice,
      service_type: 'inspection'
    });
  }
  
  // Close modal and advance to step 2
  closeServiceModal();
  setTimeout(() => {
    // Advance to step 2 after service selection
    showStep(2);
    // Send step tracking
    sendStepTracking(BOOKING_STATUS.SERVICE_SELECTED);
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


// Render mobile-first service options
function renderMobileServiceOptions() {
  const container = document.getElementById('serviceOptions');
  if (!container) {
    console.error('❌ Service options container not found!');
    return;
  }
  
  console.log('🔧 Rendering mobile service options...', Object.keys(services));
  
  container.innerHTML = Object.values(services).map(service => `
    <div class="service-card-mobile ${service.id === 'comprehensive' ? 'recommended' : ''}" data-service="${service.id}">
      <div class="service-header-mobile">
        <h3 class="service-name-mobile">${service.name}</h3>
        <div class="service-price-mobile">$${service.price}</div>
      </div>
      
      <div class="service-description-mobile">
        ${service.id === 'basic' 
          ? 'Perfect for most vehicles. Includes all essential safety and mechanical checks.' 
          : 'Complete analysis with professional valuation, history check, and detailed recommendations.'}
      </div>
      
      <ul class="service-features-mobile">
        ${service.features.slice(0, 4).map(feature => `<li>${feature}</li>`).join('')}
        ${service.features.length > 4 ? `<li><strong>+ ${service.features.length - 4} more features included</strong></li>` : ''}
      </ul>
      
      <div class="service-action-mobile">
        <button class="btn btn-primary" onclick="selectInspectionService('${service.id}')">
          <span>Choose ${service.name}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
  
  console.log('✅ Mobile service options rendered successfully');
}

// Legacy function for backward compatibility
function renderServiceOptions() {
  renderMobileServiceOptions();
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
  
  // Show/hide navigation buttons
  const stepNav = document.getElementById('stepNavigation');
  const navContinueBtn = document.querySelector('.nav-continue');
  const navBackBtn = document.querySelector('.nav-back');
  
  if (stepNum === 1) {
    // Step 1: Hide navigation, show service selection
    if (stepNav) stepNav.style.display = 'none';
    if (continueBtn) continueBtn.style.display = 'none';
    if (prevBtn) prevBtn.style.display = 'none';
  } else {
    // Other steps: Show navigation buttons
    if (stepNav) stepNav.style.display = 'flex';
    if (continueBtn) continueBtn.style.display = 'block';
    if (prevBtn) prevBtn.style.display = stepNum > 1 ? 'block' : 'none';
    
    // Show/hide back button
    if (navBackBtn) {
      navBackBtn.style.display = stepNum > 1 ? 'block' : 'none';
    }
    
    // Update continue button text for final step
    if (navContinueBtn) {
      if (stepNum === 7) {
        navContinueBtn.textContent = 'Complete Booking →';
      } else {
        navContinueBtn.textContent = 'Continue →';
      }
    }
  }
  
  currentStep = stepNum;
  updateContinueButton();
  
  // Update summary if on step 7
  if (stepNum === 7) {
    updateSummary();
  }
  
  // Update navigation button text based on step
  updateNavigationButtonText(stepNum);

  // Mobile UX: scroll to top of the container and focus first field
  try {
    const bookingContainer = document.querySelector('.booking-container');
    if (bookingContainer) {
      bookingContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Focus the first enabled input/select/textarea in the step (only if no field is currently focused)
    const activeStep = document.getElementById(`step${stepNum}`);
    const currentlyFocused = document.activeElement;
    const isFormField = currentlyFocused && (currentlyFocused.tagName === 'INPUT' || currentlyFocused.tagName === 'SELECT' || currentlyFocused.tagName === 'TEXTAREA');
    
    // Only auto-focus if no form field is currently focused (to avoid interrupting user typing)
    if (!isFormField) {
      const firstFocusable = activeStep?.querySelector('[autofocus], input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled])');
      if (firstFocusable && typeof firstFocusable.focus === 'function') {
        setTimeout(() => firstFocusable.focus(), 100);
      }
    }
  } catch (e) {
    console.warn('Focus/scroll error:', e);
  }

  // Ensure inline step controls are present for easier reach on mobile
  ensureInlineControls(stepNum);
}

// Inject inline Continue/Back buttons inside the active step for easier mobile reach
function ensureInlineControls(stepNum) {
  const stepEl = document.getElementById(`step${stepNum}`);
  if (!stepEl) return;
  let controls = stepEl.querySelector('.inline-step-controls');
  if (!controls) {
    controls = document.createElement('div');
    controls.className = 'inline-step-controls';
    controls.innerHTML = `
      <div class="inline-controls-buttons">
        <button type="button" class="btn btn-secondary inline-back" onclick="goToPreviousStep()">← Back</button>
        <button type="button" class="btn btn-primary inline-continue" onclick="goToNextStep()">Continue →</button>
      </div>
    `;
    stepEl.appendChild(controls);
  }
  // Hide back on first step
  const backBtn = controls.querySelector('.inline-back');
  if (backBtn) backBtn.style.display = stepNum > 1 ? 'inline-block' : 'none';
  // Update continue label on final step
  const continueBtn = controls.querySelector('.inline-continue');
  if (continueBtn) continueBtn.textContent = stepNum === 7 ? 'Secure My Inspection Now →' : 'Continue →';
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
  
  console.log(`🔍 VALIDATE FORM - Step: ${currentStep}, Required fields: ${requiredFields.length}`);
  
  try {
    requiredFields.forEach(field => {
      console.log(`🔍 Field: ${field.name || field.id}, Value: "${field.value}", Required: ${field.required}`);
      if (!field.value.trim()) {
        isValid = false;
        field.classList.add('error');
        console.log(`🔍 Field ${field.name || field.id} is empty - marking as invalid`);
      } else {
        field.classList.remove('error');
        console.log(`🔍 Field ${field.name || field.id} is valid`);
      }
    });
  } catch (error) {
    console.warn('Form validation error:', error);
  }
  
  console.log(`🔍 VALIDATE FORM RESULT - Step: ${currentStep}, IsValid: ${isValid}`);
  
  // Simple warning message update - no complex logic
  if (currentStep === 2) {
    const warningElement = document.getElementById('form-warning');
    if (warningElement) {
      if (isValid) {
        warningElement.style.display = 'none';
      } else {
        warningElement.style.display = 'block';
      }
    }
  }

  // Mobile UX: scroll to first invalid field (but don't auto-focus to avoid interrupting typing)
  if (!isValid) {
    const firstInvalid = currentStepElement.querySelector('[required].error, [required]:invalid');
    if (firstInvalid) {
      try {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Removed auto-focus to prevent interrupting user typing
      } catch (e) {}
    }
  }
  
  return isValid;
}

// Continue button functions
function updateContinueButton() {
  const button = document.getElementById('continueBtn');
  const navButton = document.querySelector('.nav-continue');
  
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
      // Disable button initially on step 7 until terms are accepted
      if (navButton) {
        navButton.disabled = true;
        navButton.style.opacity = '0.5';
        navButton.style.cursor = 'not-allowed';
      }
      // Call toggleBookingButton to set up the terms checkbox listener
      setTimeout(() => toggleBookingButton(), 100);
      break;
  }
  
  const buttonText = currentStep === 7 ? 'Complete Booking' : 'Continue';
  
  console.log(`🔘 UPDATE CONTINUE BUTTON - Step: ${currentStep}, CanContinue: ${canContinue}, SelectedService: ${selectedService?.name || 'null'}`);
  console.log(`🔘 Button elements - Regular: ${!!button}, Navigation: ${!!navButton}`);
  console.log(`🔘 Navigation button disabled state: ${navButton?.disabled}, display: ${navButton?.style.display}`);
  
  if (button) {
    button.disabled = !canContinue;
    button.textContent = buttonText;
    console.log(`🔘 Regular button updated - Disabled: ${button.disabled}, Text: ${button.textContent}`);
  }
  
  if (navButton) {
    // Always enable the button - no more disabling
    navButton.disabled = false;
    navButton.textContent = buttonText;
    
    // For step 1, always hide the continue button
    if (currentStep === 1) {
      navButton.style.display = 'none';
    }
    
    console.log(`🔘 Navigation button updated - Disabled: ${navButton.disabled}, Text: ${navButton.textContent}, Display: ${navButton.style.display}`);
  }
}

function goToNextStep() {
  if (currentStep < 7) {
    // Collect form data
    collectFormData();
    
    // Validate current step - simple validation
    if (!validateForm()) {
      // Show simple warning message
      if (currentStep === 2) {
        const warningElement = document.getElementById('form-warning');
        if (warningElement) {
          warningElement.style.display = 'block';
          warningElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      showNotification('Please fill in all required fields', 'error');
      return;
    }
    
    // Send step tracking based on current step
    let stepStatus;
    switch (currentStep) {
      case 2:
        stepStatus = BOOKING_STATUS.CUSTOMER_INFO;
        break;
      case 3:
        stepStatus = BOOKING_STATUS.VEHICLE_INFO;
        break;
      case 4:
        stepStatus = BOOKING_STATUS.SELLER_INFO;
        break;
      case 5:
        stepStatus = BOOKING_STATUS.TIME_SELECTED;
        break;
      case 6:
        stepStatus = BOOKING_STATUS.INSPECTION_TYPE;
        break;
    }
    
    if (stepStatus) {
      sendStepTracking(stepStatus);
    }
    
    showStep(currentStep + 1);
  } else {
    // Generate payment link for step 7
    generatePaymentLink();
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
  if (!currentStepElement) {
    console.warn('⚠️ No current step element found for data collection');
    return;
  }
  
  // Collect form data safely
  let data = {};
  try {
    if (currentStepElement && currentStepElement.tagName === 'FORM') {
      const formData = new FormData(currentStepElement);
      data = Object.fromEntries(formData.entries());
    } else {
      // If not a form, collect data manually from input elements
      const inputs = currentStepElement?.querySelectorAll('input, select, textarea');
      if (inputs) {
        inputs.forEach(input => {
          if (input.name && input.value) {
            data[input.name] = input.value;
          }
        });
      }
    }
  } catch (error) {
    console.warn('Form data collection error:', error);
  }
  
  console.log('📝 Collecting form data from step', currentStep, ':', data);
  
  // Merge with existing booking data
  bookingData = { ...bookingData, ...data };
  
  console.log('📋 Updated booking data:', bookingData);
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
  const trackingData = window.unifiedTracking ? window.unifiedTracking.getTrackingData() : {};
  
  // Prepare booking data in the format expected by the Power Automate flow
  const finalBookingData = {
    // Customer information
    name: `${bookingData.firstName || ''} ${bookingData.lastName || ''}`.trim(),
    phone: bookingData.phone || '',
    email: bookingData.email || '',
    location: bookingData.address || '',
    
    // Service information
    service: selectedService.id === 'basic' ? 'inspection_basic' : 'inspection_comprehensive',
    serviceCode: selectedService.id === 'basic' ? 'INSP_BASIC' : 'INSP_COMP',
    serviceTitle: selectedService.id === 'basic' ? 'Basic Inspection' : 'Comprehensive Inspection',
    serviceTier: selectedService.id,
    basePrice: selectedServicePrice,
    price: selectedServicePrice, // Add price field for compatibility
    
    // Vehicle information
    vehicleMake: bookingData.vehicleMake || '',
    vehicleModel: bookingData.vehicleModel || '',
    vehicleYear: bookingData.vehicleYear || '',
    vehicleType: bookingData.vehicleType || '',
    vehicleRego: bookingData.vehicleRego || '',
    make: bookingData.vehicleMake || '', // Add make field for compatibility
    model: bookingData.vehicleModel || '', // Add model field for compatibility
    year: bookingData.vehicleYear || '', // Add year field for compatibility
    rego: bookingData.vehicleRego || '', // Add rego field for compatibility
    
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
    // Send final step tracking
    await sendStepTracking(BOOKING_STATUS.BOOKING_COMPLETE);
    // Mirror to unified tracking API
    try {
      if (window.unifiedTracking && typeof window.unifiedTracking.sendTrackingData === 'function') {
        window.unifiedTracking.sendTrackingData('inspection_booking_completed', {
          ...finalBookingData,
          eventType: 'inspection_booking_completed'
        });
      }
    } catch (e) {}
    
    // Debug: Log the data being sent
    console.log('🚀 SENDING BOOKING DATA TO API:', finalBookingData);
    console.log('📊 Data size:', JSON.stringify(finalBookingData).length, 'characters');
    
    // Submit booking
    const response = await submitBooking(finalBookingData);
    
    console.log('📥 API Response:', response);
    
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
          source_type: window.unifiedTracking?.getTrackingData()?.pageSource?.type || 'unknown'
        });
      }
      
      // Track with unified tracking system
      if (window.unifiedTracking) {
        window.unifiedTracking.trackEvent('inspection_booking_completed', 'Conversion', selectedService.name, {
          service_id: selectedService.id,
          service_price: selectedServicePrice,
          service_type: 'inspection',
          conversion_value: selectedServicePrice,
          currency: 'NZD'
        });
        
        // Send comprehensive booking data to API
        window.unifiedTracking.sendTrackingData('inspection_booking_completed', {
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
  console.log('🌐 API URL:', API_ENDPOINTS.payment);
  console.log('📤 Request Headers:', {
    'Content-Type': 'application/json',
    'User-Agent': navigator.userAgent
  });
  
  try {
    const response = await fetch(API_ENDPOINTS.payment, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': navigator.userAgent
      },
      body: JSON.stringify(data)
    });
    
    console.log('📡 Response Status:', response.status, response.statusText);
    console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ API Success Response:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ API Error Details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
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
    const modal = document.getElementById('serviceModal');
    if (modal && modal.classList.contains('show')) {
      closeServiceModal();
    }
  }
});

// Test function for API debugging
window.testAPI = async function() {
  console.log('🧪 Testing API connection...');
  
  const testData = {
    name: 'Test User',
    phone: '0211234567',
    email: 'test@example.com',
    service: 'inspection_basic',
    serviceTitle: 'Basic Mechanical Inspection',
    basePrice: 299,
    eventType: 'test_booking',
    sessionId: 'test_' + Date.now(),
    timestamp: new Date().toISOString()
  };
  
  console.log('📤 Sending test data:', testData);
  
  try {
    const response = await submitBooking(testData);
    console.log('✅ Test API Response:', response);
    return response;
  } catch (error) {
    console.error('❌ Test API Error:', error);
    return { success: false, error: error.message };
  }
};

// Test function to simulate a booking completion
window.testBooking = async function() {
  console.log('🧪 Testing booking completion...');
  
  // Set up test data
  selectedService = services.basic;
  selectedServicePrice = 299;
  bookingData = {
    firstName: 'Test',
    lastName: 'User',
    phone: '0211234567',
    email: 'test@example.com',
    make: 'Toyota',
    model: 'Corolla',
    year: '2020',
    vehicleType: 'car',
    sellerName: 'Test Seller',
    sellerPhone: '0219876543',
    address: '123 Test Street',
    suburb: 'Test Suburb',
    city: 'Auckland',
    preferredDate: 'today',
    preferredTime: 'morning',
    inspectionType: 'standard',
    termsAccepted: true
  };
  
  console.log('📋 Test booking data:', bookingData);
  console.log('🔧 Selected service:', selectedService);
  
  // Call complete booking
  await completeBooking();
};

// === STEP TRACKING SYSTEM ===
async function sendStepTracking(status) {
  const data = buildStepData(status);
  
  console.log(`📡 INSPECTION STEP UPDATE: ${status.toUpperCase()}`);
  console.log('📊 Step data:', data);
  
  try {
    // Use TRACKING API for step updates, not payment API
    const response = await fetch(API_ENDPOINTS.tracking, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': navigator.userAgent
      },
      body: JSON.stringify(data)
    });
    
    console.log(`✅ Step API Response: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Step API Error Response:', errorText);
    }
    
    return response;
  } catch (error) {
    console.error('❌ Step API Error:', error);
    return null;
  }
}

function buildStepData(status) {
  const trackingData = window.unifiedTracking ? window.unifiedTracking.getTrackingData() : {};
  const geo = window.CF_GEO || {};
  
  return {
    // Basic info - EXACT field names from Power Automate template
    sessionId: sessionId,
    gclid: gclid,
    gclidState: gclid ? 'Active' : 'Inactive',
    bookingStatus: status,
    eventType: status,
    timestamp: new Date().toISOString(),
    pageType: 'inspection',
    
    // Customer information - EXACT field names from template
    name: `${bookingData.firstName || ''} ${bookingData.lastName || ''}`.trim(),
    phone: bookingData.phone || '',
    email: bookingData.email || '',
    location: bookingData.address || bookingData.city || '',
    
    // Service information - EXACT field names from template
    service: selectedService ? (selectedService.id === 'basic' ? 'inspection_basic' : 'inspection_comprehensive') : '',
    serviceCode: selectedService ? (selectedService.id === 'basic' ? 'INSP_BASIC' : 'INSP_COMP') : '',
    serviceTitle: selectedService ? selectedService.name : '',
    serviceTier: selectedService ? selectedService.id : '',
    basePrice: selectedServicePrice || 0,
    price: selectedServicePrice || 0,
    
    // Vehicle information - EXACT field names from template (both formats)
    vehicleMake: bookingData.make || '',
    make: bookingData.make || '', // Template expects both
    vehicleModel: bookingData.model || '',
    model: bookingData.model || '', // Template expects both
    vehicleYear: bookingData.year || '',
    year: bookingData.year || '', // Template expects both
    vehicleType: bookingData.vehicleType || '',
    vehicleRego: bookingData.vehicleRego || '',
    rego: bookingData.vehicleRego || '', // Template expects both
    batteryVoltage: bookingData.batteryVoltage || '',
    selectedVoltage: bookingData.batteryVoltage || '', // Template expects both
    urgencyLevel: bookingData.urgencyLevel || 'standard',
    urgencyTitle: getUrgencyTitle(bookingData.urgencyLevel || 'standard'),
    timeWindow: getTimeWindow(bookingData.urgencyLevel || 'standard'),
    emergencyType: getEmergencyType(bookingData.urgencyLevel || 'standard'),
    quoteReference: bookingData.quoteReference || '',
    isWinzService: bookingData.isWinzService === 'true' || false,
    
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
    
    // Terms and marketing - EXACT field names from template
    termsAccepted: bookingData.termsAccepted || false,
    marketingConsent: bookingData.marketingConsent || false,
    
    // Step information - EXACT field names from template
    currentStep: currentStep,
    totalSteps: 7,
    stepProgress: Math.round((currentStep / 7) * 100),
    
    // Page source data - EXACT structure from template
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
    
    // Device and engagement data - EXACT structure from template
    device: {
      userAgent: trackingData.userAgent || navigator.userAgent || '',
      screenResolution: trackingData.screenResolution || `${screen.width}x${screen.height}`,
      viewportSize: trackingData.viewportSize || `${window.innerWidth}x${window.innerHeight}`,
      language: trackingData.language || navigator.language || '',
      timezone: trackingData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      platform: trackingData.device?.platform || 'Unknown'
    },
    
    engagement: {
      timeOnPage: trackingData.engagement?.timeOnPage || 0,
      scrollDepth: trackingData.engagement?.scrollDepth || 0,
      clicks: trackingData.engagement?.clicks || 0,
      formInteractions: trackingData.engagement?.formInteractions || 0,
      buttonClicks: trackingData.engagement?.buttonClicks || 0
    },
    
    // User journey data - EXACT structure from template
    userJourney: {
      pageHistory: trackingData.userJourney?.pageHistory || [],
      totalPages: trackingData.userJourney?.totalPages || 1,
      sessionDuration: trackingData.userJourney?.sessionDuration || 0,
      entryPage: trackingData.userJourney?.entryPage || window.location.href,
      previousPage: trackingData.userJourney?.previousPage || ''
    },
    
    // UTM data - EXACT structure from template
    utm: {
      source: utmData.utm_source || '',
      medium: utmData.utm_medium || '',
      campaign: utmData.utm_campaign || '',
      term: utmData.utm_term || '',
      content: utmData.utm_content || '',
      gclid: gclid || ''
    },
    
    // Page data - EXACT field names from template
    pageUrl: trackingData.pageUrl || window.location.href,
    pagePath: trackingData.pagePath || window.location.pathname,
    pageTitle: trackingData.pageTitle || document.title,
    
    // Geolocation data - EXACT structure from template
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
    },
    
    // Source tracking
    source: 'inspection_form',
    formVersion: '1.0'
  };
}

// === DAY SELECTION FUNCTIONS ===
function initializeDaySelector() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const container = document.getElementById('daySelector');
  if (!container) return;
  
  let options = [];
  
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    // Weekday - show today, Saturday, Sunday
    const todayDate = new Date(today);
    options.push({
      day: todayDate, 
      title: 'Today', 
      subtitle: getDayName(todayDate), 
      description: 'Same day service', 
      featured: true
    });
    
    const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
    const saturdayDate = new Date(today);
    saturdayDate.setDate(saturdayDate.getDate() + daysUntilSaturday);
    options.push({
      day: saturdayDate, 
      title: 'Saturday', 
      subtitle: saturdayDate.toLocaleDateString('en-NZ', {timeZone: 'Pacific/Auckland', month: 'long', day: 'numeric'}), 
      description: 'Weekend inspection', 
      featured: false
    });
    
    const daysUntilSunday = (7 - dayOfWeek + 7) % 7 || 7;
    const sundayDate = new Date(today);
    sundayDate.setDate(sundayDate.getDate() + daysUntilSunday);
    options.push({
      day: sundayDate, 
      title: 'Sunday', 
      subtitle: sundayDate.toLocaleDateString('en-NZ', {timeZone: 'Pacific/Auckland', month: 'long', day: 'numeric'}), 
      description: 'Weekend inspection', 
      featured: false
    });
  } else if (dayOfWeek === 6) {
    // Saturday - show today (Saturday), tomorrow (Sunday)
    const todayDate = new Date(today);
    options.push({
      day: todayDate, 
      title: 'Today', 
      subtitle: 'Saturday', 
      description: 'Weekend inspection', 
      featured: true
    });
    const sundayDate = new Date(today);
    sundayDate.setDate(sundayDate.getDate() + 1);
    options.push({
      day: sundayDate, 
      title: 'Tomorrow', 
      subtitle: 'Sunday', 
      description: 'Weekend inspection', 
      featured: false
    });
  } else {
    // Sunday - show today (Sunday), tomorrow (Monday)
    const todayDate = new Date(today);
    options.push({
      day: todayDate, 
      title: 'Today', 
      subtitle: 'Sunday', 
      description: 'Weekend inspection', 
      featured: true
    });
    const mondayDate = new Date(today);
    mondayDate.setDate(mondayDate.getDate() + 1);
    options.push({
      day: mondayDate, 
      title: 'Tomorrow', 
      subtitle: 'Monday', 
      description: 'Next available weekday inspection', 
      featured: false
    });
  }
  
  container.innerHTML = options.map((opt, idx) => {
    const featuredClass = opt.featured ? 'featured' : '';
    const selectedClass = idx === 0 ? 'selected' : '';
    return `<div class="day-option ${featuredClass} ${selectedClass}" data-day="${opt.day.toISOString()}" data-string="${formatDate(opt.day)}" onclick="selectDay('${opt.day.toISOString()}', '${formatDate(opt.day)}', this)">
      <div class="day-title">${opt.title}</div>
      <div class="day-subtitle">${opt.subtitle}</div>
      <div class="day-description">${opt.description}</div>
    </div>`;
  }).join('');
  
  if (options.length > 0) {
    selectedDay = options[0].day;
    selectedDayString = formatDate(options[0].day);
    const confirmBtn = document.getElementById('confirmDayBtn');
    if (confirmBtn) confirmBtn.disabled = false;
  }
}

function selectDay(dayISO, dayString, element) {
  document.querySelectorAll('.day-option.selected').forEach(el => el.classList.remove('selected'));
  element.classList.add('selected');
  selectedDay = new Date(dayISO);
  selectedDayString = dayString;
  const confirmBtn = document.getElementById('confirmDayBtn');
  if (confirmBtn) confirmBtn.disabled = false;
}

function getDayName(date) {
  return date.toLocaleDateString('en-NZ', { timeZone: 'Pacific/Auckland', weekday: 'long' });
}

// === VEHICLE TYPE SELECTION ===
function selectVehicleType(type, addon, element) {
  document.querySelectorAll('.vehicle-type.selected').forEach(el => el.classList.remove('selected'));
  element.classList.add('selected');
  selectedVehicleType = type;
  vehicleTypeAddon = addon;
  updateSummary();
}

// === SUMMARY UPDATES ===
function updateSummary() {
  if (currentStep !== 7) return;
  
  // Update service
  const serviceElement = document.getElementById('summaryService');
  if (serviceElement && selectedService) {
    serviceElement.textContent = selectedService.name;
  }
  
  // Update phone
  const phoneElement = document.getElementById('summaryPhone');
  if (phoneElement) {
    const phone = document.getElementById('phone')?.value || '';
    phoneElement.textContent = phone || 'Not provided';
  }
  
  // Update location
  const locationElement = document.getElementById('summaryLocation');
  if (locationElement) {
    const location = document.getElementById('location')?.value || '';
    locationElement.textContent = location || 'Not provided';
  }
  
  // Update date
  const dateElement = document.getElementById('summaryDate');
  if (dateElement) {
    dateElement.textContent = selectedDayString || 'Not selected';
  }
  
  // Update vehicle type
  const vehicleElement = document.getElementById('summaryVehicle');
  if (vehicleElement) {
    const vehicleTypeText = selectedVehicleType === 'specialty' ? 'Classic/Specialty (+$129)' : 'Standard Vehicle';
    vehicleElement.textContent = vehicleTypeText;
  }
  
  // Update price
  const priceElement = document.getElementById('summaryPrice');
  const dynamicPriceElement = document.getElementById('dynamicPrice');
  if (priceElement && selectedService) {
    const totalPrice = selectedService.price + vehicleTypeAddon;
    priceElement.textContent = `$${totalPrice}`;
    if (dynamicPriceElement) {
      dynamicPriceElement.textContent = `$${totalPrice}`;
    }
  }
}

// === BOOKING BUTTON TOGGLE ===
function toggleBookingButton() {
  const termsCheckbox = document.getElementById('termsAgree');
  const navButton = document.querySelector('.nav-continue');
  
  if (termsCheckbox && navButton) {
    navButton.disabled = !termsCheckbox.checked;
    if (termsCheckbox.checked) {
      navButton.style.opacity = '1';
      navButton.style.cursor = 'pointer';
    } else {
      navButton.style.opacity = '0.5';
      navButton.style.cursor = 'not-allowed';
    }
  }
}

// === HELPER FUNCTIONS FOR FIELD MAPPING ===
function getUrgencyTitle(urgencyLevel) {
  const titles = {
    'standard': 'Standard',
    'urgent': 'Urgent',
    'emergency': 'Emergency'
  };
  return titles[urgencyLevel] || 'Standard';
}

function getTimeWindow(urgencyLevel) {
  const windows = {
    'standard': 'flexible',
    'urgent': 'same-day',
    'emergency': 'asap'
  };
  return windows[urgencyLevel] || 'flexible';
}

function getEmergencyType(urgencyLevel) {
  const types = {
    'standard': '',
    'urgent': 'urgent_inspection',
    'emergency': 'emergency_inspection'
  };
  return types[urgencyLevel] || '';
}

// === DATA COLLECTION FOR PAYMENT ===
function buildInspectionData(status) {
  const trackingData = window.unifiedTracking ? window.unifiedTracking.getTrackingData() : {};
  const geo = window.CF_GEO || {};
  
  // Calculate amount in cents for Stripe
  const amountInCents = Math.round((selectedServicePrice || 0) * 100);
  
  // Build vehicle description
  const vehicleDescription = `${bookingData.year || ''} ${bookingData.make || ''} ${bookingData.model || ''}`.trim();
  
  // Store visitor data for persistence
  storeVisitorData({
    name: `${bookingData.firstName || ''} ${bookingData.lastName || ''}`.trim(),
    phone: bookingData.phone || '',
    email: bookingData.email || '',
    service: 'pre_purchase_inspection',
    serviceCode: selectedService?.id || 'inspection',
    vehicleRego: bookingData.vehicleRego || '',
    vehicleYear: bookingData.year || '',
    vehicleMake: bookingData.make || '',
    vehicleModel: bookingData.model || '',
    location: bookingData.address || bookingData.city || ''
  });
  
  return {
    // Top-level Stripe fields - EXACT format for payment API
    amount: amountInCents,
    currency: 'nzd',
    description: `Pre-Purchase Inspection - ${selectedService ? selectedService.name : 'Vehicle Inspection'}`,
    redirectUrl: `${window.location.origin}/pre-purchase-vehicle-inspection/confirmation?session=${sessionId}`,
    rego: bookingData.vehicleRego || '', // Top-level rego field
    
    // Nested customerData object - EXACT structure for payment API
    customerData: {
      // Basic customer info - EXACT field names from payment API
      name: `${bookingData.firstName || ''} ${bookingData.lastName || ''}`.trim(),
      phone: bookingData.phone || '',
      email: bookingData.email || '',
      location: bookingData.address || bookingData.city || '',
      
      // Vehicle information - EXACT field names from payment API
      vehicleRego: bookingData.vehicleRego || '',
      vehicleYear: bookingData.year || '',
      vehicleMake: bookingData.make || '',
      vehicleModel: bookingData.model || '',
      vehicleDescription: vehicleDescription,
      vehicleType: bookingData.vehicleType || '',
      
      // Seller information - EXACT field names from payment API
      sellerName: bookingData.sellerName || '',
      sellerPhone: bookingData.sellerPhone || '',
      
      // Service information - EXACT field names from payment API
      service: selectedService ? (selectedService.id === 'basic' ? 'inspection_basic' : 'inspection_comprehensive') : '',
      serviceCode: selectedService ? (selectedService.id === 'basic' ? 'INSP_BASIC' : 'INSP_COMP') : '',
      serviceTitle: selectedService ? selectedService.name : '',
      details: bookingData.specialInstructions || '',
      price: selectedServicePrice || 0,
      basePrice: selectedServicePrice || 0,
      
      // Scheduling - EXACT field names from payment API
      bookingDateTime: new Date().toISOString(),
      scheduledDate: bookingData.preferredDate || '',
      scheduledTime: bookingData.preferredTime || '',
      scheduledDateISO: bookingData.preferredDate ? new Date(bookingData.preferredDate).toISOString() : '',
      
      // Additional fields - EXACT field names from payment API
      urgencyLevel: bookingData.urgencyLevel || 'standard',
      urgencyTitle: getUrgencyTitle(bookingData.urgencyLevel || 'standard'),
      timeWindow: getTimeWindow(bookingData.urgencyLevel || 'standard'),
      batteryVoltage: bookingData.batteryVoltage || '',
      emergencyType: getEmergencyType(bookingData.urgencyLevel || 'standard'),
      quoteReference: bookingData.quoteReference || '',
      isWinzService: bookingData.isWinzService === 'true' || false,
      vehicleTypeAddon: vehicleTypeAddon || 0,
      
      // Tracking - EXACT field names from payment API
      sessionId: sessionId,
      bookingSource: 'inspection_form',
      formVersion: '1.0'
    },
    
    // Enhanced tracking data for complete attribution
    trackingData: {
      gclid: gclid,
      gclidState: gclid ? 'Active' : 'Inactive',
      utm: utmData,
      pageSource: trackingData?.pageSource || {
        type: 'direct',
        detail: 'Direct visit',
        referrer: document.referrer || '',
        utm: utmData,
        clickIds: {
          gclid: gclid,
          fbclid: null,
          msclkid: null
        }
      },
      device: {
        userAgent: navigator.userAgent,
        platform: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
        language: navigator.language || 'en-NZ',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Pacific/Auckland',
        screenResolution: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
        viewportSize: `${window.innerWidth || 0}x${window.innerHeight || 0}`
      },
      location: {
        country: geo?.country || 'New Zealand',
        region: geo?.region || 'Unknown',
        city: geo?.city || 'Unknown',
        postalCode: geo?.postalCode || 'Unknown',
        coordinates: {
          latitude: geo?.latitude || null,
          longitude: geo?.longitude || null,
          accuracy: geo?.latitude && geo?.longitude ? 'IP-based' : null
        }
      },
      engagement: {
        timeOnPage: Math.round((Date.now() - (window.pageLoadTime || Date.now())) / 1000),
        scrollDepth: 0, // Could be enhanced with scroll tracking
        clicks: 0, // Could be enhanced with click tracking
        formInteractions: 0, // Could be enhanced with form tracking
        buttonClicks: 0 // Could be enhanced with button tracking
      },
      userJourney: {
        pageHistory: JSON.parse(localStorage.getItem('eek_user_journey') || '[]'),
        totalPages: JSON.parse(localStorage.getItem('eek_user_journey') || '[]').length || 1,
        sessionDuration: Date.now() - (window.sessionStartTime || Date.now()),
        entryPage: JSON.parse(localStorage.getItem('eek_user_journey') || '[]')[0]?.url || window.location.href,
        previousPage: JSON.parse(localStorage.getItem('eek_user_journey') || '[]').slice(-2, -1)[0]?.url || ''
      },
      visitorData: getVisitorData(),
      journeyData: {
        callAttemptId: localStorage.getItem('eek_last_call_attempt_id') || null,
        callTimestamp: localStorage.getItem('eek_last_call_timestamp') || null,
        returnTimestamp: null, // Will be set if this is a return visit
        timeBetweenCallAndReturn: null, // Will be calculated if this is a return visit
        source: 'inspection_booking'
      },
      eventType: 'payment_generation',
      eventAction: 'inspection_payment_link_created',
      timestamp: new Date().toISOString()
    }
  };
}

// === PAYMENT GENERATION ===
async function generatePaymentLink() {
  // Check if terms are accepted
  const termsCheckbox = document.getElementById('termsAgree');
  if (!termsCheckbox || !termsCheckbox.checked) {
    alert('Please accept the terms and conditions before proceeding');
    return;
  }

  const navButton = document.querySelector('.nav-continue');
  if (navButton) {
    navButton.disabled = true;
    navButton.textContent = 'Generating Payment...';
  }
  
  try {
    // Collect all form data
    const formData = buildInspectionData('inspection_booking_completed');
    
    // Send to Power Automate PAYMENT API for final booking
    const response = await fetch(API_ENDPOINTS.payment, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });
    
      if (response.ok) {
        const responseText = await response.text();
        console.log('🔍 Payment API Response:', responseText);
        
        if (responseText.trim()) {
          try {
            const result = JSON.parse(responseText);
            if (result.url) {
              // Redirect to payment
              window.location.href = result.url;
            } else {
              showNotification('Payment link generated successfully!', 'success');
            }
          } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            throw new Error('Invalid response format from payment API');
          }
        } else {
          throw new Error('Empty response from payment API');
        }
      } else {
        const errorText = await response.text();
        console.error('Payment API Error Response:', errorText);
        throw new Error(`Payment API error: ${response.status} - ${errorText}`);
      }
  } catch (error) {
    console.error('Payment generation error:', error);
    showNotification('Error generating payment link. Please try again.', 'error');
    
    if (navButton) {
      navButton.disabled = false;
      navButton.textContent = 'Secure My Inspection Now →';
      navButton.style.opacity = '1';
      navButton.style.cursor = 'pointer';
    }
  }
}

// === EXIT INTENT FUNCTIONS ===
function closeExitIntent() {
  const modal = document.getElementById('exitIntentModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function applyDiscount() {
  // Apply 10% discount
  if (selectedService) {
    const originalPrice = selectedService.price;
    const discountedPrice = Math.round(originalPrice * 0.9);
    
    // Update price display
    const priceElement = document.getElementById('summaryPrice');
    const dynamicPriceElement = document.getElementById('dynamicPrice');
    if (priceElement) {
      priceElement.textContent = `$${discountedPrice} (10% off)`;
    }
    if (dynamicPriceElement) {
      dynamicPriceElement.textContent = `$${discountedPrice}`;
    }
    
    showNotification('10% discount applied!', 'success');
  }
  
  closeExitIntent();
}

// === NAVIGATION BUTTON TEXT UPDATES ===
function updateNavigationButtonText(stepNum) {
  const continueBtn = document.querySelector('.nav-continue');
  
  if (continueBtn) {
    switch(stepNum) {
      case 2:
        continueBtn.textContent = 'Continue →';
        break;
      case 3:
        continueBtn.textContent = 'Continue →';
        break;
      case 4:
        continueBtn.textContent = 'Continue →';
        break;
      case 5:
        continueBtn.textContent = 'Continue to Vehicle Type →';
        break;
      case 6:
        continueBtn.textContent = 'Continue →';
        break;
      case 7:
        continueBtn.textContent = 'Secure My Inspection Now →';
        break;
      default:
        continueBtn.textContent = 'Continue →';
    }
  }
}

// === EXIT INTENT DETECTION ===
function setupExitIntent() {
  let exitIntentShown = false;
  
  document.addEventListener('mouseleave', function(e) {
    if (e.clientY <= 0 && !exitIntentShown && currentStep > 1) {
      exitIntentShown = true;
      const modal = document.getElementById('exitIntentModal');
      if (modal) {
        modal.style.display = 'flex';
      }
    }
  });
}


