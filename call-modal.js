/**
 * Service Selection Modal JavaScript
 * Handles the call modal functionality for service selection
 * Version: 2.3 - Wrong fuel rescue + contact options (removed non-fuel services)
 * Cache busting: v20251020.77
 */

// Tracking helper function
function trackModalEvent(eventName, data = {}) {
  const trackingData = {
    ...data,
    timestamp: new Date().toISOString(),
    page_url: window.location.href,
    page_path: window.location.pathname,
    user_agent: navigator.userAgent,
    modal_version: '2.2'
  };

  // Try multiple tracking systems
  if (window.trackingManager && typeof window.trackingManager.trackEvent === 'function') {
    window.trackingManager.trackEvent(eventName, trackingData);
  }
  
  if (window.unifiedTracking && typeof window.unifiedTracking.trackEvent === 'function') {
    window.unifiedTracking.trackEvent(eventName, trackingData);
  }

  // Google Analytics tracking
  if (typeof gtag === 'function') {
    gtag('event', eventName, {
      event_category: 'Modal Interaction',
      event_label: data.serviceType || data.action || 'Unknown',
      value: data.value || 0,
      custom_parameters: trackingData
    });
  }

  // Console logging for debugging
  console.log(`📊 Modal Event: ${eventName}`, trackingData);
}

// Service Selection Modal Functions - Wrong Fuel Rescue + Contact Options
function openServiceModal() {
  const modal = document.getElementById('serviceModal');
  if (modal) {
    // Track modal open event
    trackModalEvent('modal_opened', {
      action: 'open',
      trigger: 'user_click',
      modal_type: 'service_selection'
    });

    // Refresh phone numbers if phone manager is available
    if (window.phoneManager && typeof window.phoneManager.updateAllPhoneNumbers === 'function') {
      window.phoneManager.updateAllPhoneNumbers();
      
      // Track phone manager refresh
      trackModalEvent('phone_numbers_refreshed', {
        action: 'refresh_phone_numbers',
        trigger: 'modal_open',
        phoneManagerAvailable: true
      });
    }

    // Reset modal to service selection - only wrong fuel + contact options
    const modalContent = document.querySelector('.service-modal-content');
    modalContent.innerHTML = `
      <div class="service-modal-header">
        <h3>⛽ Wrong Fuel Emergency</h3>
        <p>Select your option below</p>
        <button class="service-modal-close" onclick="closeServiceModal()">&times;</button>
      </div>
      <div class="service-modal-body">
        <div class="service-options">
          <button class="service-option" onclick="selectService('wrong_fuel')" data-service="wrong_fuel">
            <span class="service-icon">⛽</span>
            <div class="service-details">
              <h4>Wrong Fuel Emergency</h4>
              <p>⚠️ DON'T START YOUR ENGINE - Petrol in diesel or diesel in petrol</p>
            </div>
          </button>
          
          <button class="service-option" onclick="selectService('post_job')" data-service="post_job">
            <span class="service-icon">📋</span>
            <div class="service-details">
              <h4>Post-Job Support</h4>
              <p>Customer escalation or supplier relations</p>
            </div>
          </button>
        </div>
      </div>
    `;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }
}

function closeServiceModal() {
  const modal = document.getElementById('serviceModal');
  if (modal) {
    // Track modal close event
    trackModalEvent('modal_closed', {
      action: 'close',
      trigger: 'user_click',
      modal_type: 'service_selection'
    });

    modal.style.display = 'none';
    document.body.style.overflow = ''; // Restore scrolling
  }
}

function showPhoneNumber() {
  const phoneDisplay = document.getElementById('phoneNumberDisplay');
  if (phoneDisplay) {
    // Update phone display with fresh data from phone manager
    updateModalPhoneDisplay();
    
    phoneDisplay.style.display = 'block';
    
    // Get fresh phone data for tracking
    const { phoneData, phoneSource } = getFreshPhoneData();
    
    // Track phone number reveal
    trackModalEvent('phone_number_revealed', {
      action: 'reveal_phone',
      trigger: 'call_button_click',
      phone_number: phoneData.display,
      phone_href: phoneData.tel,
      phone_source: phoneSource
    });
  }
}

function selectService(serviceType) {
  const serviceNames = {
    'wrong_fuel': 'Wrong Fuel Emergency',
    'post_job': 'Post-Job Support'
  };
  
  const serviceName = serviceNames[serviceType] || 'Service';
  
  // Special handling for post-job service - redirect instead of showing phone
  if (serviceType === 'post_job') {
    handlePostJobRedirect();
    return;
  }
  
  // Track the service selection
  trackModalEvent('service_selected', {
    action: 'select_service',
    serviceType: serviceType,
    serviceName: serviceName,
    trigger: 'service_button_click',
    value: 1
  });

  // Legacy tracking for backward compatibility
  if (window.trackingManager && typeof window.trackingManager.trackServiceSelection === 'function') {
    window.trackingManager.trackServiceSelection(serviceType);
  } else if (window.unifiedTracking) {
    window.unifiedTracking.trackEvent('service_selection', {
      serviceType: serviceType,
      category: 'Service Selection'
    });
  }
  
  // Get the phone number
  let phoneData;
  let phoneSource = 'fallback';
  
  if (window.phoneManager && typeof window.phoneManager.getModalPhoneNumber === 'function') {
    phoneData = window.phoneManager.getModalPhoneNumber();
    phoneSource = 'phoneManager';
  } else if (window.unifiedTracking && typeof window.unifiedTracking.getModalPhoneNumber === 'function') {
    phoneData = window.unifiedTracking.getModalPhoneNumber();
    phoneSource = 'unifiedTracking';
  } else {
    phoneData = { tel: 'tel:0800769000', display: 'Call Now' };
    phoneSource = 'fallback';
  }
  
  const phoneHref = phoneData.tel;
  const phoneNumber = phoneData.display;
  
  // Track phone number selection
  trackModalEvent('phone_number_selected', {
    action: 'select_phone_number',
    serviceType: serviceType,
    phoneSource: phoneSource,
    phoneNumber: phoneData.display,
    phoneHref: phoneData.tel
  });
  
  // Update modal to show phone number and call option
  const modalContent = document.querySelector('.service-modal-content');
  
  if (phoneHref && phoneNumber) {
    modalContent.innerHTML = `
      <div class="service-modal-header">
        <h3>⛽ Wrong Fuel Emergency</h3>
        <p>⚠️ DON'T START YOUR ENGINE - Call us immediately</p>
        <button class="service-modal-close" onclick="closeServiceModal()">&times;</button>
      </div>
      <div class="service-modal-body">
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 1.2em; margin-bottom: 15px; color: #dc3545; font-weight: 600;">
            ⚠️ CRITICAL: Do not start your engine
          </div>
          <div id="phoneNumberDisplay" style="font-size: 2em; margin-bottom: 20px; color: var(--primary, #ff5500); font-weight: bold; display: block;">
            ${phoneNumber}
          </div>
          <p style="margin-bottom: 30px; color: #666; line-height: 1.6;">
            Our emergency fuel extraction team is ready to help.<br>
            We'll extract the wrong fuel and flush your system safely.
          </p>
          <a href="${phoneHref}" class="cta-button" style="display: inline-block; background: var(--primary, #ff5500); color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-size: 1.2em; font-weight: bold; margin: 10px;" onclick="trackCallButtonClick('${serviceType}', '${phoneHref}');">
            📞 Call Now
          </a>
          <button onclick="trackBackButtonClick('${serviceType}'); openServiceModal();" style="display: block; margin: 20px auto 0; background: none; border: 1px solid #ddd; padding: 10px 20px; border-radius: 6px; cursor: pointer; color: #666;">
            ← Back to Options
          </button>
        </div>
      </div>
    `;
  } else {
    // Fallback if no phone number available
    modalContent.innerHTML = `
      <div class="service-modal-header">
        <h3>⛽ Wrong Fuel Emergency</h3>
        <p>${serviceName} service selected</p>
        <button class="service-modal-close" onclick="closeServiceModal()">&times;</button>
      </div>
      <div class="service-modal-body">
        <div style="text-align: center; padding: 20px;">
          <p style="margin-bottom: 30px; color: #666;">
            Please use the main call button to contact us for ${serviceName.toLowerCase()} service
          </p>
          <button onclick="trackBackButtonClick('${serviceType}'); openServiceModal();" style="display: block; margin: 20px auto 0; background: none; border: 1px solid #ddd; padding: 10px 20px; border-radius: 6px; cursor: pointer; color: #666;">
            ← Back to Options
          </button>
        </div>
      </div>
    `;
  }
}

// Additional tracking functions
function trackCallButtonClick(serviceType, phoneHref) {
  trackModalEvent('call_button_clicked', {
    action: 'click_call_button',
    serviceType: serviceType || 'wrong_fuel',
    phoneHref: phoneHref,
    trigger: 'call_button_click',
    value: 1
  });
  
  // Store call attempt data for return visit tracking
  if (typeof sendCallClick === 'function') {
    sendCallClick('modal_call_click', 'Service', null);
  } else {
    console.warn('sendCallClick function not available for call tracking');
  }
}

function trackBackButtonClick(serviceType) {
  trackModalEvent('back_button_clicked', {
    action: 'click_back_button',
    serviceType: serviceType,
    trigger: 'back_button_click',
    value: 1
  });
}

// Post-job redirect handling
function handlePostJobRedirect() {
  // Track the post-job selection
  trackModalEvent('post_job_selected', {
    action: 'select_post_job',
    serviceType: 'post_job',
    serviceName: 'Post-Job Support',
    trigger: 'service_button_click',
    value: 1
  });
  
  // Show submenu with customer/supplier options
  const modalContent = document.querySelector('.service-modal-content');
  modalContent.innerHTML = `
    <div class="service-modal-header">
      <h3>📋 Post-Job Support</h3>
      <p>Are you a customer or supplier?</p>
      <button class="service-modal-close" onclick="closeServiceModal()">&times;</button>
    </div>
    <div class="service-modal-body">
      <div class="service-options">
        <button class="service-option" onclick="selectPostJobType('customer')" data-type="customer">
          <span class="service-icon">👤</span>
          <div class="service-details">
            <h4>Customer</h4>
            <p>Need help with a completed job or have a complaint?</p>
          </div>
        </button>
        
        <button class="service-option" onclick="selectPostJobType('supplier')" data-type="supplier">
          <span class="service-icon">🏢</span>
          <div class="service-details">
            <h4>Supplier</h4>
            <p>Need support with supplier relations or account issues?</p>
          </div>
        </button>
      </div>
      <div style="text-align: center; margin-top: 20px;">
        <button onclick="trackBackButtonClick('post_job'); openServiceModal();" style="display: inline-block; background: none; border: 1px solid #ddd; padding: 10px 20px; border-radius: 6px; cursor: pointer; color: #666;">
          ← Back to Options
        </button>
      </div>
    </div>
  `;
}

// Handle post-job type selection (customer or supplier)
function selectPostJobType(userType) {
  const redirectUrl = userType === 'supplier' ? '/contact.html?formType=supplier-relations' : '/contact.html?formType=customer-escalation';
  const pageName = userType === 'supplier' ? 'Supplier Relations' : 'Customer Escalation';
  
  // Track the user type selection
  trackModalEvent('post_job_type_selected', {
    action: 'select_user_type',
    serviceType: 'post_job',
    userType: userType,
    redirectUrl: redirectUrl,
    trigger: 'user_type_button_click',
    value: 1
  });
  
  // Show redirect confirmation
  const modalContent = document.querySelector('.service-modal-content');
  modalContent.innerHTML = `
    <div class="service-modal-header">
      <h3>📋 ${pageName}</h3>
      <p>Redirecting to ${pageName.toLowerCase()} page...</p>
      <button class="service-modal-close" onclick="closeServiceModal()">&times;</button>
    </div>
    <div class="service-modal-body">
      <div style="text-align: center; padding: 20px;">
        <div style="font-size: 3em; margin-bottom: 20px;">⏳</div>
        <p style="margin-bottom: 30px; color: #666; font-size: 1.1em;">
          Taking you to the ${pageName.toLowerCase()} page...
        </p>
        <div style="margin-bottom: 20px;">
          <a href="${redirectUrl}" class="cta-button" style="display: inline-block; background: var(--primary, #ff5500); color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-size: 1.2em; font-weight: bold; margin: 10px;" onclick="trackPostJobRedirect('${userType}')">
            Continue to ${pageName}
          </a>
        </div>
        <button onclick="trackBackButtonClick('post_job'); handlePostJobRedirect();" style="display: block; margin: 20px auto 0; background: none; border: 1px solid #ddd; padding: 10px 20px; border-radius: 6px; cursor: pointer; color: #666;">
          ← Back to User Type Selection
        </button>
      </div>
    </div>
  `;
  
  // Auto-redirect after 3 seconds
  setTimeout(() => {
    trackPostJobRedirect(userType);
    window.location.href = redirectUrl;
  }, 3000);
}

function trackPostJobRedirect(userType) {
  trackModalEvent('post_job_redirect', {
    action: 'redirect_post_job',
    userType: userType,
    redirectUrl: userType === 'supplier' ? '/contact.html?formType=supplier-relations' : '/contact.html?formType=customer-escalation',
    trigger: 'redirect_click',
    value: 1
  });
}

// Phone manager integration functions
function getFreshPhoneData() {
  let phoneData;
  let phoneSource = 'fallback';
  
  if (window.phoneManager && typeof window.phoneManager.getModalPhoneNumber === 'function') {
    phoneData = window.phoneManager.getModalPhoneNumber();
    phoneSource = 'phoneManager';
  } else if (window.unifiedTracking && typeof window.unifiedTracking.getModalPhoneNumber === 'function') {
    phoneData = window.unifiedTracking.getModalPhoneNumber();
    phoneSource = 'unifiedTracking';
  } else {
    phoneData = { tel: 'tel:0800769000', display: 'Call Now' };
    phoneSource = 'fallback';
  }
  
  return { phoneData, phoneSource };
}

function updateModalPhoneDisplay() {
  const phoneDisplay = document.getElementById('phoneNumberDisplay');
  if (phoneDisplay && window.phoneManager) {
    // Use phone manager's update method if available
    if (typeof window.phoneManager.updateModalPhoneNumber === 'function') {
      window.phoneManager.updateModalPhoneNumber('phoneNumberDisplay');
    } else {
      // Fallback to manual update
      const { phoneData } = getFreshPhoneData();
      phoneDisplay.textContent = phoneData.display;
    }
  }
}

// Expose phone manager integration methods globally
window.callModalPhoneIntegration = {
  refreshPhoneData: function() {
    if (window.phoneManager && typeof window.phoneManager.updateAllPhoneNumbers === 'function') {
      window.phoneManager.updateAllPhoneNumbers();
      trackModalEvent('phone_data_refreshed', {
        action: 'refresh_phone_data',
        trigger: 'manual_refresh',
        phoneManagerAvailable: true
      });
    }
  },
  
  getCurrentPhoneData: function() {
    return getFreshPhoneData();
  },
  
  updateModalPhone: function() {
    updateModalPhoneDisplay();
  }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
  // Close modal when clicking outside
  document.addEventListener('click', function(event) {
    const modal = document.getElementById('serviceModal');
    if (event.target === modal) {
      // Track outside click close
      trackModalEvent('modal_closed', {
        action: 'close',
        trigger: 'outside_click',
        modal_type: 'service_selection'
      });
      closeServiceModal();
    }
  });

  // Close modal with Escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      // Track escape key close
      trackModalEvent('modal_closed', {
        action: 'close',
        trigger: 'escape_key',
        modal_type: 'service_selection'
      });
      closeServiceModal();
    }
  });

  // Track modal initialization
  trackModalEvent('modal_initialized', {
    action: 'initialize',
    modal_type: 'wrong_fuel_rescue',
    version: '2.3',
    phoneManagerAvailable: !!(window.phoneManager),
    unifiedTrackingAvailable: !!(window.unifiedTracking)
  });

  // Listen for phone manager updates
  if (window.phoneManager) {
    // Create a custom event listener for phone updates
    document.addEventListener('phoneManagerUpdated', function(event) {
      trackModalEvent('phone_manager_updated', {
        action: 'phone_manager_update',
        trigger: 'external_update',
        details: event.detail || {}
      });
      
      // Update modal phone display if modal is open
      const modal = document.getElementById('serviceModal');
      if (modal && modal.style.display !== 'none') {
        updateModalPhoneDisplay();
      }
    });
  }

  console.log('Service selection modal v2.3 initialized - wrong fuel rescue + contact options');
});
