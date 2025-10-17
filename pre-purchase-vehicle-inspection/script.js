/* Eek Mechanical - Pre Purchase Inspection JavaScript */
/* Clean, Mobile-First Booking System */

// Global variables
let currentStep = 1;
let selectedService = null;
let selectedServicePrice = 0;
let bookingData = {};

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
  initializeApp();
  setupEventListeners();
  updateContinueButton();
});

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
    if (e.target.closest('.service-option')) {
      const serviceId = e.target.closest('.service-option').dataset.service;
      selectService(serviceId);
    }
  });
  
  // Vehicle type selection
  document.addEventListener('click', function(e) {
    if (e.target.closest('.vehicle-type-option')) {
      const vehicleType = e.target.closest('.vehicle-type-option').dataset.type;
      selectVehicleType(vehicleType);
    }
  });
  
  // Form validation
  document.addEventListener('input', function(e) {
    if (e.target.matches('.form-input, .form-select, .form-textarea')) {
      validateForm();
    }
  });
}

// Service selection functions
function selectService(serviceId) {
  selectedService = services[serviceId];
  selectedServicePrice = selectedService.price;
  
  // Update UI
  document.querySelectorAll('.service-option').forEach(option => {
    option.classList.remove('selected');
  });
  
  document.querySelector(`[data-service="${serviceId}"]`).classList.add('selected');
  
  updateSelectedServiceDisplay();
  updateContinueButton();
  
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
  document.querySelectorAll('.vehicle-type-option').forEach(option => {
    option.classList.remove('selected');
  });
  
  document.querySelector(`[data-type="${type}"]`).classList.add('selected');
  
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
  document.querySelectorAll('.step').forEach(step => {
    step.classList.remove('active');
  });
  
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
  
  if (stepNum === 1) {
    // Step 1: Hide continue button, service selection handles progression
    if (continueBtn) continueBtn.style.display = 'none';
    if (prevBtn) prevBtn.style.display = 'none';
  } else {
    // Other steps: Show navigation buttons
    if (continueBtn) continueBtn.style.display = 'block';
    if (prevBtn) prevBtn.style.display = stepNum > 1 ? 'block' : 'none';
  }
  
  currentStep = stepNum;
  updateContinueButton();
}

function updateProgressBar(stepNum) {
  document.querySelectorAll('.progress-step').forEach((step, index) => {
    step.classList.remove('active', 'completed');
    if (index + 1 < stepNum) {
      step.classList.add('completed');
    } else if (index + 1 === stepNum) {
      step.classList.add('active');
    }
  });
}

// Form validation
function validateForm() {
  const currentStepElement = document.getElementById(`step${currentStep}`);
  if (!currentStepElement) return true;
  
  const requiredFields = currentStepElement.querySelectorAll('[required]');
  let isValid = true;
  
  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      isValid = false;
      field.classList.add('error');
    } else {
      field.classList.remove('error');
    }
  });
  
  return isValid;
}

// Continue button functions
function updateContinueButton() {
  const button = document.getElementById('continueBtn');
  if (!button) return;
  
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
  
  button.disabled = !canContinue;
  button.textContent = currentStep === 7 ? 'Complete Booking' : 'Continue';
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
  
  // Prepare booking data
  const finalBookingData = {
    ...bookingData,
    service: selectedService,
    price: selectedServicePrice,
    timestamp: new Date().toISOString(),
    location: {
      // Basic location info
      country: geo.country || 'Unknown',
      countryCode: geo.countryCode || geo.country || 'Unknown',
      region: geo.region || 'Unknown',
      regionCode: geo.regionCode || 'Unknown',
      city: geo.city || 'Unknown',
      postalCode: geo.postalCode || 'Unknown',
      continent: geo.continent || 'Unknown',
      
      // Coordinates
      coordinates: {
        latitude: geo.latitude || null,
        longitude: geo.longitude || null,
        accuracy: geo.latitude && geo.longitude ? 'IP-based' : null
      },
      
      // Timezone
      timezone: geo.timezone || 'Unknown',
      
      // Raw CF_GEO data for debugging
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
  const POWER_AUTOMATE_URL = 'https://default61ffc6bcd9ce458b8120d32187c377.0d.environment.api.powerplatform.com/api/data/v9.2/contacts';
  
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

