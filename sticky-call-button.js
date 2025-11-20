/**
 * Sticky Call Button Manager
 * Handles showing/hiding sticky call button based on phone system status
 * Uses API calls to determine system state
 * Cache busting: v20251020.59
 */

(function() {
  'use strict';

  // API URLs
  const EEK_GCLID_STATE_URL = "https://default61ffc6bcd9ce458b8120d32187c377.0d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/5f20c5153e8a4de0be50a17e2dab4254/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Zw5-_6YSCNPb2cfjjfa0Oj_Fpc7N9rhHfc6fPZZhX7g";
  const EEK_CALLFLOW_STATE_URL = "https://default61ffc6bcd9ce458b8120d32187c377.0d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/17b1d2990e6f4082a2b0d9c2f1a29025/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=bPyoxJ24kuxJZOyLGAclGaEuH6BHwUTFaGmYOwHofa8";

  // Initialize state cache if not exists
  if (!window.eek_states) {
    window.eek_states = { gclidState: null, callflowState: null, lastFetched: 0 };
  }
  let eekStatesFetchPromise = null;

  /**
   * Extract GCLID from URL parameters
   */
  function extractGCLID(urlParams) {
    return urlParams.get('gclid') || urlParams.get('gbraid') || urlParams.get('wbraid') || null;
  }

  /**
   * Fetch states from API (with caching)
   */
  async function fetchStatesOnce(force = false) {
    const now = Date.now();
    if (!force && eekStatesFetchPromise) return eekStatesFetchPromise;
    if (!force && now - (window.eek_states.lastFetched || 0) < 30_000) {
      return window.eek_states;
    }

    eekStatesFetchPromise = (async () => {
      let gclidState = window.eek_states.gclidState;
      let callflowState = window.eek_states.callflowState;

      try {
        const [gclidResp, callflowResp] = await Promise.all([
          fetch(EEK_GCLID_STATE_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}), cache: "no-store" }),
          fetch(EEK_CALLFLOW_STATE_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}), cache: "no-store" })
        ]);

        if (gclidResp.ok) {
          const j = await gclidResp.json();
          gclidState = (j && (j.state ?? j)) || null;
        }
        if (callflowResp.ok) {
          const j = await callflowResp.json();
          callflowState = (j && (j.state ?? j)) || null;
        }
      } catch (error) {
        console.warn('⚠️ Error fetching states:', error);
        // Keep previous values on failure
      }

      window.eek_states = { gclidState, callflowState, lastFetched: Date.now() };
      eekStatesFetchPromise = null;
      return window.eek_states;
    })();

    return eekStatesFetchPromise;
  }

  /**
   * Check system status from API
   */
  async function checkSystemStatus() {
    const states = await fetchStatesOnce(false);
    const isActive = states.callflowState === 'Active' || states.callflowState === true;
    
    if (states.callflowState == null) {
      console.log('🔄 Sticky Call Button: Defaulting to ACTIVE due to missing callflow state');
      return true;
    }
    
    return isActive;
  }

  /**
   * Update sticky call button visibility
   */
  async function updateStickyCallButton() {
    const urlParams = new URLSearchParams(window.location.search);
    const hasPaymentToken = urlParams.get('token');
    const hasGclid = extractGCLID(urlParams);

    // Get states from API
    const states = await fetchStatesOnce(false);

    // Determine if system is active
    let systemActive;
    if ((hasGclid && states.gclidState === 'Active') || hasPaymentToken) {
      systemActive = true;
      console.log('🎯 Sticky Call Button: GCLID+Active or token detected — force ACTIVE');
    } else {
      systemActive = await checkSystemStatus();
    }

    // Get button elements
    const stickyCall = document.getElementById('stickyCallButton');
    const stickyClosed = document.getElementById('stickyClosedButton');
    const stickyPayment = document.getElementById('stripePaymentSticky');

    // If payment token exists, hide call buttons and show payment button
    if (hasPaymentToken) {
      console.log('💳 Sticky Call Button: Payment token detected, hiding call buttons');
      if (stickyCall) {
        stickyCall.style.display = 'none';
        stickyCall.style.visibility = 'hidden';
      }
      if (stickyClosed) {
        stickyClosed.style.display = 'none';
        stickyClosed.style.visibility = 'hidden';
      }
      if (stickyPayment) {
        stickyPayment.style.display = 'inline-block';
      }
      return;
    }

    // Hide payment button if no token
    if (stickyPayment) {
      stickyPayment.style.display = 'none';
    }

    // Update based on system status
    if (systemActive) {
      // PHONES ARE ON - Show call button, hide booking button
      if (stickyCall) {
        stickyCall.style.display = 'inline-block';
        stickyCall.style.visibility = 'visible';
      }
      if (stickyClosed) {
        stickyClosed.style.display = 'none';
        stickyClosed.style.visibility = 'hidden';
      }
      console.log('✅ Sticky Call Button: PHONES ON - Showing call button');
    } else {
      // PHONES ARE OFF - Show booking button, hide call button
      if (stickyCall) {
        stickyCall.style.display = 'none';
        stickyCall.style.visibility = 'hidden';
      }
      if (stickyClosed) {
        stickyClosed.style.display = 'inline-block';
        stickyClosed.style.visibility = 'visible';
        stickyClosed.innerHTML = '📅 Book Now';
      }
      console.log('📅 Sticky Call Button: PHONES OFF - Showing booking button');
    }
  }

  /**
   * Initialize sticky call button manager
   */
  function init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        updateStickyCallButton();
        // Listen for state updates
        document.addEventListener('eek:state:update', updateStickyCallButton);
      });
    } else {
      updateStickyCallButton();
      // Listen for state updates
      document.addEventListener('eek:state:update', updateStickyCallButton);
    }

    // Poll for updates every 5 minutes
    setInterval(() => {
      fetchStatesOnce(true).then(() => {
        updateStickyCallButton();
      });
    }, 300000); // 5 minutes
  }

  // Initialize
  init();

  // Export for manual updates if needed
  window.updateStickyCallButton = updateStickyCallButton;

  console.log('✅ Sticky Call Button Manager loaded');
})();

