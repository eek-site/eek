/**
 * More Info Modal
 * Provides detailed service information in a modal dialog
 * Version: 1.0
 * Cache busting: v20250125
 */

(function() {
  'use strict';

  // More Info Modal Functions
  window.openMoreModal = function(serviceType) {
    const modal = document.getElementById('moreInfoModal');
    const title = document.getElementById('moreInfoTitle');
    const body = document.getElementById('moreInfoBody');
    
    if (!modal || !title || !body) return;
    
    // Set title and content based on service type
    const serviceData = getServiceData(serviceType);
    title.textContent = serviceData.title;
    body.innerHTML = serviceData.content;
    
    // Update button text based on phone system status
    updateModalButtons();
    
    // Send unified tracking event for modal open
    if (window.unifiedTracking && typeof window.unifiedTracking.sendTrackingData === 'function') {
      const serviceMap = {
        'fuel': { service: 'fuel_extraction', serviceCode: 'FUEL', serviceTitle: 'Wrong Fuel Rescue', price: 399 }
      };
      const svc = serviceMap[serviceType] || { service: serviceType, serviceCode: serviceType, serviceTitle: serviceData.title || 'Service', price: undefined };
      window.unifiedTracking.sendTrackingData('more_info_open', {
        service: svc.service,
        serviceCode: svc.serviceCode,
        serviceTitle: svc.serviceTitle,
        price: svc.price,
        basePrice: svc.price,
        source: 'more_info_modal'
      });
    }
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };

  // Update modal buttons based on phone system status
  window.updateModalButtons = function() {
    const modalButtons = document.querySelectorAll('#moreInfoModal .cta-button');
    
    // Check if normal hours buttons are visible (indicates phones are on)
    const normalButtons = document.querySelectorAll('.normal-hours-btn');
    const isSystemActive = normalButtons.length > 0 && normalButtons[0].style.display !== 'none';
    
    modalButtons.forEach(button => {
      if (isSystemActive) {
        // Phones are on - show Call Now
        button.textContent = '📞 Call Now';
        button.style.display = 'inline-block';
      } else {
        // Phones are off - show Book Online
        button.textContent = '📅 Book Online';
        button.style.display = 'inline-block';
      }
    });
  };

  // Handle More Info modal action - either call or book based on phone status
  window.handleMoreInfoAction = async function(serviceType) {
    // Check if normal hours buttons are visible (indicates phones are on)
    const normalButtons = document.querySelectorAll('.normal-hours-btn');
    const isSystemActive = normalButtons.length > 0 && normalButtons[0].style.display !== 'none';
    
    // Close the modal first
    closeMoreModal();
    
    // Prepare unified tracking payload details
    const serviceMap = {
      'jumpstarts': { service: 'jump_start', serviceCode: 'JUMP', serviceTitle: 'Jump Start', price: 149 },
      'repairs': { service: 'mechanical_repair', serviceCode: 'REPAIR', serviceTitle: 'Mobile Mechanical Repair', price: 249 },
      'inspections': { service: 'inspection', serviceCode: 'INSP', serviceTitle: 'Pre-Purchase Inspection', price: 299 },
      'fuel': { service: 'fuel_extraction', serviceCode: 'FUEL', serviceTitle: 'Wrong Fuel Rescue', price: 399 }
    };
    const svc = serviceMap[serviceType] || { service: serviceType, serviceCode: serviceType, serviceTitle: serviceType, price: undefined };

    if (isSystemActive) {
      // Phones are on - open service modal for calling
      if (typeof openServiceModal === 'function') {
        openServiceModal();
      }
      
      // Track the action
      if (typeof gtag !== 'undefined') {
        gtag('event', 'more_info_call_click', {
          service_type: serviceType,
          action: 'call',
          source: 'more_info_modal',
          event_category: 'engagement'
        });
      }
      
      // Track with unified tracking (event + API payload)
      if (window.unifiedTracking) {
        window.unifiedTracking.trackEvent('more_info_call_click', 'Service', serviceType, { action: 'call', source: 'more_info_modal' });
        if (typeof window.unifiedTracking.sendTrackingData === 'function') {
          window.unifiedTracking.sendTrackingData('more_info_call_click', {
            service: svc.service,
            serviceCode: svc.serviceCode,
            serviceTitle: svc.serviceTitle,
            price: svc.price,
            basePrice: svc.price,
            bookingStatus: 'NEW',
            action: 'call',
            source: 'more_info_modal'
          });
        }
      }
      
      // Store call attempt data for return visit tracking
      if (typeof sendCallClick === 'function') {
        await sendCallClick('more_info_call_click', 'Service', null);
      }
    } else {
      // Phones are off - redirect to booking page
      const serviceSlugMap = {
        'fuel': 'fuel-extraction'
      };
      const bookingService = serviceSlugMap[serviceType] || 'fuel-extraction';
      const trackingParams = (typeof buildTrackingParams === 'function') ? buildTrackingParams() : '';
      const bookingUrl = trackingParams ? `/book-service/?service=${bookingService}&${trackingParams}` : `/book-service/?service=${bookingService}`;
      
      // Track the action
      if (typeof gtag !== 'undefined') {
        gtag('event', 'more_info_book_click', {
          service_type: serviceType,
          action: 'book',
          source: 'more_info_modal',
          event_category: 'conversion'
        });
      }
      
      // Track with unified tracking (event + API payload)
      if (window.unifiedTracking) {
        window.unifiedTracking.trackEvent('more_info_book_click', 'Service', serviceType, { action: 'book', source: 'more_info_modal' });
        if (typeof window.unifiedTracking.sendTrackingData === 'function') {
          window.unifiedTracking.sendTrackingData('more_info_book_click', {
            service: svc.service,
            serviceCode: svc.serviceCode,
            serviceTitle: svc.serviceTitle,
            price: svc.price,
            basePrice: svc.price,
            bookingStatus: 'NEW',
            action: 'book',
            source: 'more_info_modal'
          });
        }
      }
      
      // Redirect to booking
      window.location.href = bookingUrl;
    }
  };

  window.closeMoreModal = function() {
    const modal = document.getElementById('moreInfoModal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  };

  function getServiceData(serviceType) {
    const serviceData = {
      fuel: {
        title: '⛽ Wrong Fuel Rescue - Complete Information',
        content: `
          <div class="more-info-section">
            <h4>🚨 Why This is an Emergency</h4>
            <ul>
              <li><strong>Engine Damage Risk:</strong> Starting the engine can cause thousands in damage</li>
              <li><strong>Fuel System Contamination:</strong> Wrong fuel can damage injectors, pumps, and filters</li>
              <li><strong>Immediate Action Required:</strong> The longer you wait, the more damage occurs</li>
              <li><strong>Professional Equipment:</strong> We have specialized fuel removal equipment</li>
              <li><strong>Fully Insured Service:</strong> We're covered for any accidental damage</li>
            </ul>
          </div>
          
          <div class="more-info-section">
            <h4>⚡ What We Do</h4>
            <ul>
              <li><strong>Immediate Response:</strong> Priority dispatch for wrong fuel emergencies</li>
              <li><strong>Professional Assessment:</strong> We determine the extent of contamination</li>
              <li><strong>Complete Fuel Removal:</strong> Drain and flush the entire fuel system</li>
              <li><strong>System Cleaning:</strong> Clean fuel lines, injectors, and filters</li>
              <li><strong>Fresh Fuel Addition:</strong> Add the correct fuel and test the system</li>
            </ul>
          </div>
          
          <div class="more-info-section">
            <h4>🛡️ Why Choose Our Service</h4>
            <ul>
              <li><strong>Specialized Equipment:</strong> Professional fuel removal and flushing equipment</li>
              <li><strong>Experienced Technicians:</strong> We've handled hundreds of wrong fuel cases</li>
              <li><strong>No Towing Required:</strong> We fix it on-site - no expensive tow truck needed</li>
              <li><strong>Warranty on Work:</strong> 30-day warranty on our fuel system cleaning</li>
              <li><strong>Insurance Coverage:</strong> Fully insured service for your peace of mind</li>
            </ul>
          </div>
          
          <div class="more-info-section">
            <h4>🛡️ Insurance Coverage - Most Misfuels Are Covered</h4>
            <p><strong>✅ Most Wrong Fuel Incidents Are Covered by Insurance</strong></p>
            <p>Most vehicle insurance policies cover wrong fuel incidents. We work directly with your insurance company to handle the claim process.</p>
            <p><strong>📋 We Handle All The Paperwork</strong></p>
            <p>You don't need to worry about insurance forms or claims. We handle all the paperwork, documentation, and communication with your insurance provider. Just call us and we'll take care of everything.</p>
            <p><strong>Our service prevents thousands in engine damage and we make the insurance process simple and stress-free.</strong></p>
          </div>
          
          <div class="more-info-section">
            <h4>⚠️ What NOT to Do</h4>
            <ul>
              <li><strong>DON'T START THE ENGINE:</strong> This will circulate contaminated fuel through the system</li>
              <li><strong>DON'T DRIVE THE CAR:</strong> Even if it starts, you risk serious damage</li>
              <li><strong>DON'T WAIT:</strong> Call us immediately for the best outcome</li>
              <li><strong>DON'T TRY DIY:</strong> This requires professional equipment and expertise</li>
            </ul>
          </div>
          
          <div class="cta-section">
            <a href="javascript:void(0)" onclick="handleMoreInfoAction('fuel')" class="cta-button normal-hours-btn">📞 Call Now</a>
          </div>
        `
      }
    };
    
    return serviceData[serviceType] || { title: 'Service Information', content: 'No information available.' };
  }

  // Close modal when clicking outside
  document.addEventListener('click', function(event) {
    const modal = document.getElementById('moreInfoModal');
    if (event.target === modal) {
      closeMoreModal();
    }
  });

  // Close modal with Escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      closeMoreModal();
    }
  });

  console.log('✅ More Info Modal loaded');
})();

