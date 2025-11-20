/**
 * Misfuel Calculator Modal
 * Provides a calculator to help users determine if they need professional fuel extraction service
 * Version: 1.0
 * Cache busting: v20250125
 */

(function() {
  'use strict';

  // Track calculator events
  function trackCalculatorEvent(eventName, data = {}) {
    const trackingData = {
      ...data,
      timestamp: new Date().toISOString(),
      page_url: window.location.href,
      page_path: window.location.pathname,
      user_agent: navigator.userAgent,
      calculator_version: '1.0'
    };

    // Unified tracking
    if (window.unifiedTracking && typeof window.unifiedTracking.trackEvent === 'function') {
      window.unifiedTracking.trackEvent(eventName, trackingData);
    }

    // Google Analytics
    if (typeof gtag === 'function') {
      gtag('event', eventName, {
        event_category: 'Misfuel Calculator',
        event_label: data.type || data.severity || 'Unknown',
        value: data.needsService ? 1 : 0,
        custom_parameters: trackingData
      });
    }

    // Reddit tracking
    if (typeof rdt !== 'undefined') {
      rdt('track', 'Custom', {
        'customEventName': 'Misfuel_Calculator_' + eventName,
        ...trackingData
      });
    }

    console.log(`📊 Calculator Event: ${eventName}`, trackingData);
  }

  // Open calculator modal
  window.openMisfuelCalculator = function(type) {
    const modal = document.getElementById('misfuelCalculatorModal');
    const body = document.getElementById('misfuelCalculatorBody');
    
    if (!modal || !body) {
      console.error('Calculator modal elements not found');
      return;
    }
    
    const isPetrolInDiesel = type === 'petrol-in-diesel';
    const isDieselInPetrol = type === 'diesel-in-petrol';
    const isGeneral = !isPetrolInDiesel && !isDieselInPetrol;
    
    // Track modal open
    trackCalculatorEvent('calculator_opened', {
      type: type || 'general',
      source: 'button_click'
    });
    
    body.innerHTML = `
      <form id="misfuelCalculatorForm" onsubmit="misfuelCalculator.calculate(event, '${type || 'general'}'); return false;">
        ${isGeneral ? `
        <div class="calculator-form-group">
          <label>What type of wrong fuel did you put in?</label>
          <select id="misfuelType" name="misfuelType" required>
            <option value="">Select type...</option>
            <option value="petrol-in-diesel">Petrol in Diesel Vehicle</option>
            <option value="diesel-in-petrol">Diesel in Petrol Vehicle</option>
          </select>
        </div>
        ` : ''}
        <div class="calculator-form-group">
          <label id="litresLabel">How many litres of ${isPetrolInDiesel ? 'petrol' : isDieselInPetrol ? 'diesel' : 'wrong fuel'} did you put in?</label>
          <input type="number" id="litres" name="litres" min="0" max="200" step="0.5" required placeholder="e.g. 5">
        </div>
        
        <div class="calculator-form-group">
          <label>Vehicle Make</label>
          <input type="text" id="make" name="make" placeholder="e.g. Toyota" required>
        </div>
        
        <div class="calculator-form-group">
          <label>Vehicle Model</label>
          <input type="text" id="model" name="model" placeholder="e.g. ${isPetrolInDiesel ? 'Hilux' : isDieselInPetrol ? 'Corolla' : 'Vehicle Model'}" required>
        </div>
        
        <div class="calculator-form-group">
          <label>Vehicle Year</label>
          <select id="year" name="year" required>
            <option value="">Select Year</option>
            ${Array.from({length: 30}, (_, i) => {
              const year = new Date().getFullYear() - i;
              return `<option value="${year}">${year}</option>`;
            }).join('')}
          </select>
          <small id="yearNote" style="color: #6c757d; display: block; margin-top: 5px;">${isPetrolInDiesel ? 'Important: Common rail diesel engines (2000+) are more sensitive' : isDieselInPetrol ? 'Important: Newer petrol engines may be more sensitive' : 'Select fuel type above to see specific guidance'}</small>
        </div>
        
        <div class="calculator-form-group">
          <label>Did you start the engine?</label>
          <select id="started" name="started" required>
            <option value="">Select...</option>
            <option value="no">No - I haven't started it</option>
            <option value="yes">Yes - I started the engine</option>
          </select>
        </div>
        
        <div class="calculator-form-group" id="distanceGroup" style="display: none;">
          <label>How many kilometres did you drive?</label>
          <input type="number" id="distance" name="distance" min="0" max="1000" step="0.1" placeholder="e.g. 2.5">
        </div>
        
        <div class="calculator-form-group" id="stalledGroup" style="display: none;">
          <div class="calculator-checkbox-group">
            <input type="checkbox" id="stalled" name="stalled">
            <label for="stalled" style="margin: 0; font-weight: normal;">The vehicle stalled or stopped running</label>
          </div>
        </div>
        
        <button type="submit" class="cta-button" style="width: 100%; margin-top: 20px;">
          Calculate Result
        </button>
      </form>
      
      <div id="calculatorResult" class="calculator-result"></div>
    `;
    
  // Show/hide distance and stalled fields based on started selection
  const startedSelect = body.querySelector('#started');
  const distanceGroup = body.querySelector('#distanceGroup');
  const stalledGroup = body.querySelector('#stalledGroup');
  
  startedSelect.addEventListener('change', function() {
    if (this.value === 'yes') {
      distanceGroup.style.display = 'block';
      stalledGroup.style.display = 'block';
    } else {
      distanceGroup.style.display = 'none';
      stalledGroup.style.display = 'none';
    }
  });
  
  // Update label and note when type is selected (for general pages)
  if (isGeneral) {
    const typeSelect = body.querySelector('#misfuelType');
    const litresLabel = body.querySelector('#litresLabel');
    const yearNote = body.querySelector('#yearNote');
    
    typeSelect.addEventListener('change', function() {
      const selectedType = this.value;
      if (selectedType === 'petrol-in-diesel') {
        litresLabel.textContent = 'How many litres of petrol did you put in?';
        yearNote.textContent = 'Important: Common rail diesel engines (2000+) are more sensitive';
      } else if (selectedType === 'diesel-in-petrol') {
        litresLabel.textContent = 'How many litres of diesel did you put in?';
        yearNote.textContent = 'Important: Newer petrol engines may be more sensitive';
      }
    });
  }
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };

  // Close calculator modal
  window.closeMisfuelCalculator = function() {
    const modal = document.getElementById('misfuelCalculatorModal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
      
      // Track modal close
      trackCalculatorEvent('calculator_closed', {
        source: 'close_button'
      });
    }
  };

  // Calculate misfuel result
  window.misfuelCalculator = {
    calculate: function(event, type) {
      event.preventDefault();
      
      // If general type, get the selected type from the form
      if (type === 'general' || !type) {
        const typeSelect = document.getElementById('misfuelType');
        if (typeSelect && typeSelect.value) {
          type = typeSelect.value;
        } else {
          alert('Please select the type of wrong fuel first.');
          return;
        }
      }
      
      const isPetrolInDiesel = type === 'petrol-in-diesel';
      const litres = parseFloat(document.getElementById('litres').value);
      const year = parseInt(document.getElementById('year').value);
      const started = document.getElementById('started').value;
      const distance = started === 'yes' ? parseFloat(document.getElementById('distance').value) || 0 : 0;
      const stalled = started === 'yes' && document.getElementById('stalled').checked;
      const make = document.getElementById('make').value;
      const model = document.getElementById('model').value;
      
      const resultDiv = document.getElementById('calculatorResult');
      resultDiv.style.display = 'block';
      resultDiv.className = 'calculator-result';
      
      let result = '';
      let severity = '';
      let needsService = true;
      
      if (isPetrolInDiesel) {
        // Petrol in Diesel calculation
        const isCommonRail = year >= 2000;
        const isModernDiesel = year >= 2010;
        
        if (!started || started === 'no') {
          // Engine not started
          if (litres <= 2 && isCommonRail) {
            // Small amount in common rail - might be okay if tank is mostly empty
            result = `
              <h4>⚠️ Moderate Risk - Professional Assessment Recommended</h4>
              <p><strong>Your situation:</strong> You put ${litres}L of petrol in your ${year} ${make} ${model} (${isCommonRail ? 'common rail' : 'older'} diesel engine) and haven't started it.</p>
              <p><strong>Risk level:</strong> ${isCommonRail ? 'Common rail diesel engines are very sensitive to petrol contamination. Even small amounts can damage expensive injectors.' : 'Older diesel engines are more tolerant, but still at risk.'}</p>
              <p><strong>Recommendation:</strong> If your tank is mostly empty (less than 20L remaining), you might be able to fill up with diesel and dilute it. However, we strongly recommend professional extraction to be safe, especially for common rail engines.</p>
              <p><strong>Why it matters:</strong> ${isCommonRail ? 'Common rail injectors can cost $500-$2000+ each to replace. Prevention is much cheaper than repair.' : 'Fuel pump and injector damage can still occur.'}</p>
            `;
            severity = 'moderate';
            needsService = true; // Still recommend service for safety
          } else if (litres <= 1 && !isCommonRail) {
            // Very small amount in older diesel
            result = `
              <h4>✅ Low Risk - May Be Safe to Dilute</h4>
              <p><strong>Your situation:</strong> You put ${litres}L of petrol in your ${year} ${make} ${model} (older diesel engine) and haven't started it.</p>
              <p><strong>Risk level:</strong> Older diesel engines are more tolerant of small amounts of petrol contamination.</p>
              <p><strong>Recommendation:</strong> If your tank is mostly empty, you can fill up with diesel to dilute the petrol. However, monitor for any unusual engine behavior. For peace of mind, professional extraction is still recommended.</p>
              <p><strong>Important:</strong> Do NOT start the engine until you've either diluted with diesel or had professional extraction.</p>
            `;
            severity = 'safe';
            needsService = false;
          } else {
            // Larger amount or common rail
            result = `
              <h4>🚨 URGENT - Professional Extraction Required</h4>
              <p><strong>Your situation:</strong> You put ${litres}L of petrol in your ${year} ${make} ${model} (${isCommonRail ? 'common rail' : 'diesel'} engine) and haven't started it.</p>
              <p><strong>Risk level:</strong> ${isCommonRail ? 'CRITICAL - Common rail diesel engines are extremely sensitive to petrol. Even ${litres}L can cause severe damage to injectors and fuel pumps.' : 'HIGH - Petrol contamination will damage your fuel system.'}</p>
              <p><strong>Why extraction is essential:</strong></p>
              <ul style="text-align: left; margin: 15px 0;">
                <li>Petrol strips lubrication from fuel pumps and injectors</li>
                <li>${isCommonRail ? 'Common rail injectors operate at 20,000+ PSI and are easily damaged' : 'Fuel system components will be damaged'}</li>
                <li>Starting the engine will circulate contaminated fuel</li>
                <li>Repair costs can be $5,000-$15,000+ if damage occurs</li>
              </ul>
              <p><strong>Action required:</strong> Call us immediately for professional extraction. DO NOT start your engine.</p>
            `;
            severity = 'urgent';
            needsService = true;
          }
        } else {
          // Engine was started
          if (stalled) {
            result = `
              <h4>🚨 CRITICAL - Immediate Service Required</h4>
              <p><strong>Your situation:</strong> You put ${litres}L of petrol in your ${year} ${make} ${model}, started the engine, drove ${distance}km, and it stalled.</p>
              <p><strong>Risk level:</strong> EXTREME - Stalling indicates severe fuel system damage has likely occurred.</p>
              <p><strong>What's happening:</strong> The stalling means contaminated fuel has circulated through your entire fuel system. Your injectors, fuel pump, and possibly engine components are at risk of severe damage.</p>
              <p><strong>Immediate action:</strong> Call us NOW for emergency service. Do not attempt to restart the engine. Professional extraction and system cleaning is essential to prevent further damage.</p>
              <p><strong>Potential damage:</strong> Fuel injectors ($500-$2000 each), fuel pump ($800-$3000), and possible engine damage. Total repair costs can exceed $10,000.</p>
            `;
            severity = 'urgent';
            needsService = true;
          } else if (distance > 5) {
            result = `
              <h4>🚨 URGENT - Service Required Immediately</h4>
              <p><strong>Your situation:</strong> You put ${litres}L of petrol in your ${year} ${make} ${model}, started the engine, and drove ${distance}km.</p>
              <p><strong>Risk level:</strong> HIGH - Contaminated fuel has circulated extensively through your fuel system.</p>
              <p><strong>What's happening:</strong> Petrol has been pumped through your fuel lines, filters, and injectors. ${isCommonRail ? 'Common rail injectors are likely damaged or at high risk of failure.' : 'Your fuel system components are at risk.'}</p>
              <p><strong>Action required:</strong> Stop driving immediately and call us for professional extraction and system cleaning. Continuing to drive will cause more damage.</p>
              <p><strong>Why it's urgent:</strong> The longer contaminated fuel circulates, the more damage occurs. Early intervention can save thousands in repair costs.</p>
            `;
            severity = 'urgent';
            needsService = true;
          } else {
            result = `
              <h4>⚠️ HIGH RISK - Professional Service Required</h4>
              <p><strong>Your situation:</strong> You put ${litres}L of petrol in your ${year} ${make} ${model}, started the engine, and drove ${distance}km.</p>
              <p><strong>Risk level:</strong> HIGH - Even though you didn't drive far, contaminated fuel has entered your fuel system.</p>
              <p><strong>What's happening:</strong> Petrol has been pumped through your fuel lines and may have reached your injectors. ${isCommonRail ? 'Common rail injectors are sensitive and may be damaged.' : 'Fuel system components are at risk.'}</p>
              <p><strong>Action required:</strong> Stop driving and call us for professional extraction and system cleaning. Early intervention can prevent expensive damage.</p>
              <p><strong>Why service is needed:</strong> Professional cleaning can remove contaminated fuel before it causes permanent damage to expensive components.</p>
            `;
            severity = 'urgent';
            needsService = true;
          }
        }
      } else {
        // Diesel in Petrol calculation
        if (!started || started === 'no') {
          if (litres <= 5) {
            result = `
              <h4>✅ Low Risk - May Be Safe to Dilute</h4>
              <p><strong>Your situation:</strong> You put ${litres}L of diesel in your ${year} ${make} ${model} (petrol engine) and haven't started it.</p>
              <p><strong>Risk level:</strong> Low - Diesel in petrol is generally less critical than petrol in diesel, especially in small amounts.</p>
              <p><strong>Recommendation:</strong> If your tank is mostly empty, you can fill up with petrol to dilute the diesel. Diesel in small amounts (up to 5L) mixed with a full tank of petrol is usually safe for most petrol engines.</p>
              <p><strong>Important:</strong> Fill the tank completely with petrol before starting. Monitor for any unusual engine behavior. If you're unsure or want peace of mind, professional extraction is available.</p>
            `;
            severity = 'safe';
            needsService = false;
          } else {
            result = `
              <h4>⚠️ Moderate Risk - Professional Assessment Recommended</h4>
              <p><strong>Your situation:</strong> You put ${litres}L of diesel in your ${year} ${make} ${model} (petrol engine) and haven't started it.</p>
              <p><strong>Risk level:</strong> Moderate - Larger amounts of diesel can cause issues with spark plugs, catalytic converter, and engine performance.</p>
              <p><strong>Recommendation:</strong> Professional extraction is recommended for amounts over 5L. Diesel is heavier and won't mix well with petrol, and can cause engine misfires and damage to spark plugs and the catalytic converter.</p>
              <p><strong>Why it matters:</strong> Diesel contamination can cause rough running, misfires, and damage to expensive catalytic converters ($500-$2000+ to replace).</p>
            `;
            severity = 'moderate';
            needsService = true;
          }
        } else {
          // Engine was started
          if (stalled) {
            result = `
              <h4>🚨 URGENT - Service Required</h4>
              <p><strong>Your situation:</strong> You put ${litres}L of diesel in your ${year} ${make} ${model}, started the engine, drove ${distance}km, and it stalled.</p>
              <p><strong>Risk level:</strong> HIGH - Stalling indicates the diesel has caused significant issues with engine operation.</p>
              <p><strong>What's happening:</strong> Diesel contamination has likely caused spark plug fouling, misfires, and possible catalytic converter damage. The stalling indicates severe engine performance issues.</p>
              <p><strong>Action required:</strong> Call us for professional extraction and system cleaning. Do not attempt to restart until the fuel system is cleaned.</p>
            `;
            severity = 'urgent';
            needsService = true;
          } else {
            result = `
              <h4>⚠️ Service Recommended</h4>
              <p><strong>Your situation:</strong> You put ${litres}L of diesel in your ${year} ${make} ${model}, started the engine, and drove ${distance}km.</p>
              <p><strong>Risk level:</strong> Moderate to High - Diesel contamination can cause ongoing issues with engine performance and emissions systems.</p>
              <p><strong>What's happening:</strong> Diesel has circulated through your fuel system and may be causing rough running, misfires, or damage to spark plugs and the catalytic converter.</p>
              <p><strong>Recommendation:</strong> Professional extraction and system cleaning is recommended to prevent ongoing issues and potential damage to expensive components like the catalytic converter.</p>
            `;
            severity = 'moderate';
            needsService = true;
          }
        }
      }
      
      resultDiv.innerHTML = result;
      resultDiv.classList.add(severity);
      
      if (needsService) {
        resultDiv.innerHTML += `
          <div class="calculator-cta">
            <a href="javascript:void(0)" onclick="misfuelCalculator.callNow('${type}')" class="cta-button">
              📞 Call Now for Professional Service
            </a>
          </div>
        `;
      }
      
      // Track calculation result
      trackCalculatorEvent('calculator_result', {
        type: type,
        litres: litres,
        year: year,
        make: make,
        model: model,
        started: started,
        distance: distance,
        stalled: stalled,
        needsService: needsService,
        severity: severity
      });
    },

    callNow: function(type) {
      // Close calculator
      closeMisfuelCalculator();
      
      // Track call button click
      trackCalculatorEvent('calculator_call_clicked', {
        type: type,
        source: 'calculator_result'
      });
      
      // Open service modal or track conversion
      if (window.openServiceModal) {
        window.openServiceModal();
      } else if (window.trackConversion) {
        window.trackConversion('calculator_call', 'Contact');
        // Fallback to booking page
        setTimeout(() => {
          window.location.href = '/book-service?service=fuel-extraction';
        }, 500);
      } else {
        window.location.href = '/book-service?service=fuel-extraction';
      }
    }
  };

  // Close modal when clicking outside
  document.addEventListener('click', function(event) {
    const modal = document.getElementById('misfuelCalculatorModal');
    if (event.target === modal) {
      closeMisfuelCalculator();
    }
  });

  // Close modal with Escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      const modal = document.getElementById('misfuelCalculatorModal');
      if (modal && modal.style.display === 'flex') {
        closeMisfuelCalculator();
      }
    }
  });

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      console.log('✅ Misfuel Calculator loaded');
    });
  } else {
    console.log('✅ Misfuel Calculator loaded');
  }
})();

