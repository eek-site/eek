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
        'jumpstarts': { service: 'jump_start', serviceCode: 'JUMP', serviceTitle: 'Jump Start', price: 149 },
        'repairs': { service: 'mechanical_repair', serviceCode: 'REPAIR', serviceTitle: 'Mobile Mechanical Repair', price: 249 },
        'inspections': { service: 'inspection', serviceCode: 'INSP', serviceTitle: 'Pre-Purchase Inspection', price: 299 },
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
        'jumpstarts': 'jumpstart',
        'repairs': 'mechanic', 
        'inspections': 'inspection',
        'fuel': 'fuel-extraction'
      };
      const bookingService = serviceSlugMap[serviceType] || 'jumpstart';
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
      jumpstarts: {
        title: '🔋 Jump Start Service - Complete Information',
        content: `
          <div class="more-info-section">
            <h4>🚀 Why Choose Our Jump Start Service?</h4>
            <ul>
              <li><strong>Professional Equipment:</strong> We use commercial-grade jump start packs that work with all vehicle types</li>
              <li><strong>Battery Health Check:</strong> FREE battery voltage and condition assessment included</li>
              <li><strong>All Vehicle Types:</strong> Cars, SUVs, utes, motorcycles, boats, and more</li>
              <li><strong>Safe & Reliable:</strong> Our mechanics are trained in proper jump start procedures</li>
              <li><strong>No Damage Risk:</strong> We know how to safely connect to modern vehicles with sensitive electronics</li>
            </ul>
          </div>
          
          <div class="more-info-section">
            <h4>⚡ What Happens When You Call?</h4>
            <ul>
              <li><strong>Immediate Dispatch:</strong> We typically arrive within 10-30 minutes</li>
              <li><strong>Professional Assessment:</strong> We check your battery condition and charging system</li>
              <li><strong>Safe Jump Start:</strong> Proper connection and jump start procedure</li>
              <li><strong>Battery Advice:</strong> We'll tell you if your battery needs replacement</li>
              <li><strong>Follow-up:</strong> We ensure your vehicle starts reliably before leaving</li>
            </ul>
          </div>
          
          <div class="more-info-section">
            <h4>🛡️ Why This Service Matters</h4>
            <ul>
              <li><strong>Prevent Engine Damage:</strong> Improper jump starting can damage your vehicle's electronics</li>
              <li><strong>Battery Replacement Guidance:</strong> We'll tell you if you need a new battery and why</li>
              <li><strong>Peace of Mind:</strong> Professional service means no guesswork</li>
              <li><strong>Time Saving:</strong> Get back on the road quickly and safely</li>
            </ul>
          </div>
          
          <div class="cta-section">
            <a href="javascript:void(0)" onclick="handleMoreInfoAction('jumpstarts')" class="cta-button normal-hours-btn">📞 Call Now</a>
          </div>
        `
      },
      repairs: {
        title: '🛠️ Mobile Mechanical Repairs - Complete Information',
        content: `
          <div class="more-info-section">
            <h4>🚀 Why Choose Our Mobile Repair Service?</h4>
            <ul>
              <li><strong>Fully Equipped Workshop:</strong> Our mobile mechanics carry professional diagnostic tools and parts</li>
              <li><strong>On-Site Repairs:</strong> Most common issues fixed where you are - no towing needed</li>
              <li><strong>Professional Diagnostics:</strong> Computer scanning and fault detection capabilities</li>
              <li><strong>Quality Parts:</strong> We use quality replacement parts with warranties</li>
              <li><strong>Transparent Pricing:</strong> No hidden fees - you know the cost before we start</li>
            </ul>
          </div>
          
          <div class="more-info-section">
            <h4>🔧 What We Can Fix On-Site</h4>
            <ul>
              <li><strong>Engine Issues:</strong> Starting problems, rough idle, stalling</li>
              <li><strong>Electrical Problems:</strong> Battery, alternator, starter motor issues</li>
              <li><strong>Brake Repairs:</strong> Pad replacement, brake fluid service</li>
              <li><strong>Fluid Services:</strong> Oil changes, coolant, transmission fluid</li>
              <li><strong>Minor Repairs:</strong> Belts, hoses, filters, and more</li>
            </ul>
          </div>
          
          <div class="more-info-section">
            <h4>⚡ Our Process</h4>
            <ul>
              <li><strong>Diagnostic Scan:</strong> Computer diagnosis to identify the exact problem</li>
              <li><strong>Clear Explanation:</strong> We explain what's wrong and what needs fixing</li>
              <li><strong>Upfront Pricing:</strong> You approve the work before we start</li>
              <li><strong>Quality Repair:</strong> Professional repair using quality parts</li>
              <li><strong>Testing & Verification:</strong> We test the repair to ensure it works properly</li>
            </ul>
          </div>
          
          <div class="cta-section">
            <a href="javascript:void(0)" onclick="handleMoreInfoAction('repairs')" class="cta-button normal-hours-btn">📞 Call Now</a>
          </div>
        `
      },
      inspections: {
        title: '🔍 Pre-Purchase Inspections - Complete Information',
        content: `
          <div class="more-info-section">
            <h4>🚀 Why Our Inspection Service is Different</h4>
            <ul>
              <li><strong>Same-Day Service:</strong> Most competitors take 2-3 days - we inspect today</li>
              <li><strong>Workshop Hoist Inspection:</strong> Not driveway mobile - we use proper workshop facilities</li>
              <li><strong>45-Point Certified Check:</strong> Comprehensive inspection covering all major systems</li>
              <li><strong>Professional Valuation:</strong> We tell you what the car is actually worth</li>
              <li><strong>Detailed Report:</strong> Written report with photos and maintenance recommendations</li>
            </ul>
          </div>
          
          <div class="more-info-section">
            <h4>🔍 What We Inspect</h4>
            <ul>
              <li><strong>Engine & Transmission:</strong> Performance, leaks, wear indicators</li>
              <li><strong>Braking System:</strong> Pads, discs, fluid, ABS functionality</li>
              <li><strong>Electrical Systems:</strong> Battery, alternator, lights, electronics</li>
              <li><strong>Body & Chassis:</strong> Rust, accident damage, structural integrity</li>
              <li><strong>Safety Systems:</strong> Airbags, seatbelts, safety recalls</li>
            </ul>
          </div>
          
          <div class="more-info-section">
            <h4>💰 What You Get</h4>
            <ul>
              <li><strong>Detailed Written Report:</strong> Complete assessment with photos</li>
              <li><strong>Price Recommendation:</strong> Fair market value assessment</li>
              <li><strong>Maintenance Schedule:</strong> What needs fixing now vs later</li>
              <li><strong>Safety Assessment:</strong> Is this car safe to drive?</li>
              <li><strong>Negotiation Power:</strong> Use our report to negotiate a better price</li>
            </ul>
          </div>
          
          <div class="more-info-section">
            <h4>🛡️ Why This Inspection Matters</h4>
            <ul>
              <li><strong>1 in 5 Cars Rejected:</strong> 20% of vehicles we inspect have major hidden problems</li>
              <li><strong>Save Thousands:</strong> Avoid buying a car that needs expensive repairs</li>
              <li><strong>Peace of Mind:</strong> Know exactly what you're buying</li>
              <li><strong>Better Negotiation:</strong> Use our report to get a fair price</li>
            </ul>
          </div>
          
          <div class="cta-section">
            <a href="javascript:void(0)" onclick="handleMoreInfoAction('inspections')" class="cta-button normal-hours-btn">📞 Call Now</a>
          </div>
        `
      },
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

