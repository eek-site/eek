/**
 * Service Selection Modal JavaScript
 * Handles the call modal functionality for service selection
 * Version: 2.3 - Simplified for wrong fuel rescue only
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

// Service Selection Modal Functions - Simplified for Wrong Fuel Rescue Only
function openServiceModal() {
  const modal = document.getElementById('serviceModal');
  if (modal) {
    // Track modal open event
    trackModalEvent('modal_opened', {
      action: 'open',
      trigger: 'user_click',
      modal_type: 'wrong_fuel_rescue',
      serviceType: 'wrong_fuel'
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

    // Get phone number directly - no service selection needed
    const { phoneData, phoneSource } = getFreshPhoneData();
    const phoneHref = phoneData.tel;
    const phoneNumber = phoneData.display;

    // Show phone number directly for wrong fuel rescue
    const modalContent = document.querySelector('.service-modal-content');
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
          <a href="${phoneHref}" class="cta-button" style="display: inline-block; background: var(--primary, #ff5500); color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-size: 1.2em; font-weight: bold; margin: 10px;" onclick="trackCallButtonClick('wrong_fuel', '${phoneHref}');">
            📞 Call Now
          </a>
        </div>
      </div>
    `;
    
    // Track service selection (automatically wrong_fuel)
    trackModalEvent('service_selected', {
      action: 'select_service',
      serviceType: 'wrong_fuel',
      serviceName: 'Wrong Fuel Emergency',
      trigger: 'auto_select',
      value: 1
    });
    
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

// Simplified - service is always wrong_fuel, so this function is no longer needed
// Keeping for backward compatibility but it will just show the phone number
function selectService(serviceType) {
  // Always treat as wrong_fuel emergency
  const serviceName = 'Wrong Fuel Emergency';
  
  // Track the service selection
  trackModalEvent('service_selected', {
    action: 'select_service',
    serviceType: 'wrong_fuel',
    serviceName: serviceName,
    trigger: 'service_button_click',
    value: 1
  });

  // Legacy tracking for backward compatibility
  if (window.trackingManager && typeof window.trackingManager.trackServiceSelection === 'function') {
    window.trackingManager.trackServiceSelection('wrong_fuel');
  } else if (window.unifiedTracking) {
    window.unifiedTracking.trackEvent('service_selection', {
      serviceType: 'wrong_fuel',
      category: 'Service Selection'
    });
  }
  
  // Get the phone number
  const { phoneData, phoneSource } = getFreshPhoneData();
  const phoneHref = phoneData.tel;
  const phoneNumber = phoneData.display;
  
  // Track phone number selection
  trackModalEvent('phone_number_selected', {
    action: 'select_phone_number',
    serviceType: 'wrong_fuel',
    phoneSource: phoneSource,
    phoneNumber: phoneData.display,
    phoneHref: phoneData.tel
  });
  
  // Update modal to show phone number
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
          <a href="${phoneHref}" class="cta-button" style="display: inline-block; background: var(--primary, #ff5500); color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-size: 1.2em; font-weight: bold; margin: 10px;" onclick="trackCallButtonClick('wrong_fuel', '${phoneHref}');">
            📞 Call Now
          </a>
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
    sendCallClick('modal_call_click', 'Wrong Fuel Rescue', null);
  } else {
    console.warn('sendCallClick function not available for call tracking');
  }
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

  console.log('Wrong fuel rescue modal v2.3 initialized - simplified for wrong fuel emergency only');
});
