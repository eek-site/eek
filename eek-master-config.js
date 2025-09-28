/* Eek Mobile Mechanical - Site Script (corrected anchors)
   Notes:
   - The external loader for gtag (https://www.googletagmanager.com/gtag/js?id=AW-17084465163)
     is expected to be included separately in the HTML. This file keeps the inline logic.
*/

/* ========================= Reddit Pixel ========================= */
!function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js",t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}(window,document);

// Helper functions to extract user data if available
function getEmailFromForm() {
  const urlParams = new URLSearchParams(window.location.search);
  const emailParam = urlParams.get('email');
  if (emailParam) return emailParam;

  const emailInputs = document.querySelectorAll('input[type="email"], input[name*="email"], input[id*="email"]');
  for (let input of emailInputs) {
    if (input.value && input.value.includes('@')) {
      return input.value;
    }
  }
  return null;
}

function getPhoneFromForm() {
  const urlParams = new URLSearchParams(window.location.search);
  const phoneParam = urlParams.get('phone');
  if (phoneParam) return phoneParam;

  const phoneInputs = document.querySelectorAll('input[type="tel"], input[name*="phone"], input[id*="phone"]');
  for (let input of phoneInputs) {
    if (input.value) {
      return input.value;
    }
  }
  return null;
}

function getUserId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('uid') || urlParams.get('user_id') || urlParams.get('customer_id');
}

function getMobileIds() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    idfa: urlParams.get('idfa'),
    aaid: urlParams.get('aaid')
  };
}

const mobileIds = getMobileIds();
const initConfig = {};

const email = getEmailFromForm();
const phoneNumber = getPhoneFromForm();
const externalId = getUserId();

if (email) initConfig.email = email;
if (phoneNumber) initConfig.phoneNumber = phoneNumber;
if (externalId) initConfig.externalId = externalId;
if (mobileIds.idfa) initConfig.idfa = mobileIds.idfa;
if (mobileIds.aaid) initConfig.aaid = mobileIds.aaid;

rdt('init', 'a2_hf16791nsdhx', Object.keys(initConfig).length > 0 ? initConfig : undefined);
rdt('track', 'PageVisit');

/* ========================= Google tag (gtag.js) config ========================= */
// Loader for gtag must be included separately in HTML:
// <script async src="https://www.googletagmanager.com/gtag/js?id=AW-17084465163"></script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'AW-17084465163');
gtag('config', 'G-DQNKF1YLWR');

/* ========================= FIRST VISIT TRACKING ========================= */
(function() {
  const FIRST_VISIT_URL = "https://default61ffc6bcd9ce458b8120d32187c377.0d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/2f31c90260554c5a9d6dcffec47bc6c2/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Ou7iqzZ1YI2PzT_9X-M6PT5iVo2QRboWnFZrO3IBOL4";

  console.log('🔥 FIRST VISIT SCRIPT EXECUTING IMMEDIATELY');

  // Check if already sent this session
  if (sessionStorage.getItem("eek_first_visit_sent") === "1") {
    console.log('❌ First visit already sent this session');
    return;
  }

  // Get or create session ID
  let sessionId = localStorage.getItem("eek_session_id");
  if (!sessionId) {
    sessionId = "session_" + Date.now() + "_" + Math.random().toString(36).slice(2, 11);
    localStorage.setItem("eek_session_id", sessionId);
    console.log('✅ Created new session ID:', sessionId);
  } else {
    console.log('✅ Using existing session ID:', sessionId);
  }

  // Get GCLID
  const urlParams = new URLSearchParams(location.search);
  let gclid = urlParams.get("gclid");
  if (gclid) {
    localStorage.setItem("eek_gclid", gclid);
    localStorage.setItem("eek_gclid_timestamp", new Date().toISOString());
    console.log('✅ GCLID captured and stored:', gclid);
  } else {
    gclid = localStorage.getItem("eek_gclid");
    console.log('📋 Using stored GCLID:', gclid);
  }

  // Build payload
  const payload = {
    eventType: "session_started",
    timestamp: new Date().toISOString(),
    sessionId: sessionId,
    gclid: gclid,
    site: {
      domain: location.hostname,
      url: location.href,
      path: location.pathname,
      query: location.search ? location.search.slice(1) : "",
      title: document.title,
      referrer: document.referrer || null
    },
    utm: {
      source: urlParams.get("utm_source") || null,
      medium: urlParams.get("utm_medium") || null,
      campaign: urlParams.get("utm_campaign") || null,
      term: urlParams.get("utm_term") || null,
      content: urlParams.get("utm_content") || null,
      gclid: gclid,
      msclkid: urlParams.get("msclkid") || null,
      fbclid: urlParams.get("fbclid") || null,
      rdtclid: urlParams.get("rdtclid") || null
    },
    device: {
      userAgent: navigator.userAgent,
      platform: navigator.platform || null,
      language: navigator.language || null,
      mobile: /Mobi|Android/i.test(navigator.userAgent),
      screen: {
        width: (window.screen && window.screen.width) || null,
        height: (window.screen && window.screen.height) || null,
        pixelRatio: window.devicePixelRatio || 1
      }
    }
  };

  console.log('🚀 SENDING FIRST VISIT WEBHOOK NOW:', payload);

  // Send webhook immediately
  fetch(FIRST_VISIT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
    cache: "no-store"
  }).then(response => {
    console.log('✅ FIRST VISIT WEBHOOK SUCCESS:', response.status, response.statusText);
    if (response.ok) {
      sessionStorage.setItem("eek_first_visit_sent", "1");
      console.log('✅ Marked as sent for this session');
    } else {
      console.error('❌ FIRST VISIT WEBHOOK FAILED:', response.status);
    }
  }).catch(error => {
    console.error('❌ FIRST VISIT WEBHOOK ERROR:', error);
  });
})();

/* ========================= Phone Number Logic ========================= */
function getDisplayPhoneNumber() {
  const urlParams = new URLSearchParams(window.location.search);
  const gclid = urlParams.get('gclid');

  // If traffic comes from Google Ads, show tracking number and store preference
  if (gclid) {
    localStorage.setItem('eek_phone_preference', 'tracking');
    return {
      tel: 'tel:0800447153',
      display: '0800 447 153'
    };
  }

  // Default number for all other traffic
  localStorage.setItem('eek_phone_preference', 'default');
  return {
    tel: 'tel:0800769000',
    display: '0800 769 000'
  };
}

/* ========================= Tracking Param Builders ========================= */
function buildTrackingParams() {
  const params = new URLSearchParams();
  const urlParams = new URLSearchParams(window.location.search);

  // Preserve payment token if present
  const token = urlParams.get('token');
  if (token) {
    params.set('token', token);
  }

  // Preserve GCLID if present
  const gclid = urlParams.get('gclid');
  if (gclid) {
    params.set('gclid', gclid);
  }

  // Preserve UTM parameters
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
    const value = urlParams.get(param);
    if (value) {
      params.set(param, value);
    }
  });

  // Add session ID for tracking continuity
  const sessionId = localStorage.getItem("eek_session_id");
  if (sessionId) {
    params.set('session_id', sessionId);
  }

  return params.toString();
}

function updateServiceLinks() {
  const trackingParams = buildTrackingParams();

  document.querySelectorAll('.service-link').forEach(link => {
    const service = link.dataset.service;
    if (service) {
      const baseUrl = `/book-service?service=${service}`;
      const fullUrl = trackingParams ? `${baseUrl}&${trackingParams}` : baseUrl;

      // Convert to actual href for booking links
      if (link.classList.contains('after-hours-btn') || link.closest('#winz-assistance') || link.getAttribute('href') === '#service-selection') {
        link.href = fullUrl;
      } else {
        // For main service selection cards, keep the hash but store the booking URL
        link.dataset.bookingUrl = fullUrl;
      }
    }
  });

  // Update More Options link with tracking parameters
  const moreOptionsLink = document.querySelector('.more-options-link, a[href*="more-options"]');
  if (moreOptionsLink) {
    const baseUrl = '/more-options';
    const fullUrl = trackingParams ? `${baseUrl}?${trackingParams}` : baseUrl;
    moreOptionsLink.href = fullUrl;
    console.log('🔗 More Options link updated:', fullUrl);
  }

  console.log('🔗 Service links updated with tracking parameters:', trackingParams);
}

/* ========================= CORRECTED Anchor-Friendly Handler ========================= */
function handleServiceSelection() {
  document.querySelectorAll('.service-link').forEach(link => {
    link.addEventListener('click', function (e) {
      const href = this.getAttribute('href') || '';
      const bookingUrl = this.dataset.bookingUrl;

      // If it's an anchor (starts with #), do NOTHING — allow natural scroll.
      if (href.startsWith('#')) {
        return; // no preventDefault, no redirect
      }

      // If it's not an anchor AND we have a booking URL, make the link go there.
      if (bookingUrl && !href.startsWith('#')) {
        this.setAttribute('href', bookingUrl); // no need to prevent default
      }
    }, { passive: true });
  });
}

/* ========================= Phone Number DOM Updates ========================= */
function updatePhoneNumbers() {
  const phoneData = getDisplayPhoneNumber();

  // Update all tel: links
  document.querySelectorAll('.phone-link').forEach(link => {
    link.href = phoneData.tel;
  });

  // Update displayed phone numbers in spans
  document.querySelectorAll('.phone-display').forEach(span => {
    if (span.textContent.includes('769 000') || span.textContent.includes('769000') || span.textContent === 'Eek Now') {
      if (span.textContent === 'Eek Now') {
        span.textContent = 'Eek Now'; // Keep this unchanged
      } else {
        span.textContent = phoneData.display;
      }
    }
  });
}

/* ========================= System Status ========================= */
async function checkSystemStatus() {
  const debugSystemStatus = document.getElementById('debugSystemStatus');

  try {
    console.log('🔄 Checking system status...');

    const response = await fetch("https://default61ffc6bcd9ce458b8120d32187c377.0d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/17b1d2990e6f4082a2b0d9c2f1a29025/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=bPyoxJ24kuxJZOyLGAclGaEuH6BHwUTFaGmYOwHofa8", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({}),
      cache: "no-store",
      timeout: 10000 // 10 second timeout
    });

    if (response.ok) {
      const data = await response.json();
      const isActive = data.state === 'Active';
      console.log('✅ System status check successful:', isActive ? 'ACTIVE' : 'INACTIVE');

      if (debugSystemStatus) {
        debugSystemStatus.textContent = isActive ? 'ACTIVE' : 'INACTIVE';
        debugSystemStatus.style.color = isActive ? '#0f0' : '#f00';
      }

      return isActive;
    } else {
      console.warn('⚠️ System status API returned non-OK status:', response.status);
      if (debugSystemStatus) {
        debugSystemStatus.textContent = `ERROR (${response.status})`;
        debugSystemStatus.style.color = '#ff0';
      }
    }
  } catch (error) {
    console.error('❌ Error checking system status:', error);
    if (debugSystemStatus) {
      debugSystemStatus.textContent = 'ERROR (Network)';
      debugSystemStatus.style.color = '#f00';
    }
  }

  // Default to active (phones visible) if check fails
  console.log('🔄 Defaulting to ACTIVE due to API failure');
  return true;
}

/* ========================= Hours Logic ========================= */
function isWithinBusinessHours() {
  // Get current time in New Zealand (Pacific/Auckland timezone)
  const nzTime = new Date().toLocaleString("en-US", {timeZone: "Pacific/Auckland"});
  const now = new Date(nzTime);
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = now.getHours();
  const minutes = now.getMinutes();
  const time = hour + minutes / 60;

  let isOpen = false;

  // Monday-Friday: 7:00 AM - 5:00 PM (NZ time)
  if (day >= 1 && day <= 5) {
    isOpen = time >= 7 && time < 17;
  }

  // Saturday-Sunday: 7:00 AM - 12:00 PM (NZ time)
  if (day === 0 || day === 6) {
    isOpen = time >= 7 && time < 12;
  }

  // Update debug info
  const debugBusinessHours = document.getElementById('debugBusinessHours');
  const debugCurrentTime = document.getElementById('debugCurrentTime');

  if (debugBusinessHours) {
    debugBusinessHours.textContent = isOpen ? 'OPEN' : 'CLOSED';
    debugBusinessHours.style.color = isOpen ? '#0f0' : '#f00';
  }

  if (debugCurrentTime) {
    debugCurrentTime.textContent = now.toLocaleString() + ' (NZ Time)';
  }

  console.log('🕒 Business hours check:', isOpen ? 'OPEN' : 'CLOSED', `(${now.toLocaleString()} NZ Time)`);

  return isOpen;
}

async function updateHoursDisplay() {
  console.log('🔄 Starting updateHoursDisplay...');

  // Check if payment token or gclid exists
  const urlParams = new URLSearchParams(window.location.search);
  const hasPaymentToken = urlParams.get('token');
  const hasGclid = urlParams.get('gclid');

  // Update debug info
  const debugPaymentToken = document.getElementById('debugPaymentToken');
  if (debugPaymentToken) {
    debugPaymentToken.textContent = hasPaymentToken ? 'YES' : 'NO';
  }

  // For gclid or token users, always treat as system active (open for business)
  let systemActive;
  if (hasGclid || hasPaymentToken) {
    systemActive = true;
    console.log('🎯 GCLID or Token detected - forcing system active (always open)');
  } else {
    systemActive = await checkSystemStatus();
  }

  const duringBusinessHours = isWithinBusinessHours();

  console.log('📊 Status Summary:', {
    systemActive,
    duringBusinessHours,
    hasPaymentToken: !!hasPaymentToken,
    hasGclid: !!hasGclid
  });

  // Banner logic - hide for payment token or gclid users
  const closedBanner = document.getElementById('closedBanner');
  const closedTitle = document.getElementById('closedTitle');
  const afterHoursMessage = document.getElementById('afterHoursMessage');
  const tempUnavailableMessage = document.getElementById('tempUnavailableMessage');

  if (hasPaymentToken || hasGclid) {
    // Hide closed banner for payment flow or gclid traffic
    if (closedBanner) {
      closedBanner.style.display = 'none';
    }
    console.log('💳🎯 Payment token or GCLID detected - hiding closed banner');
  } else {
    // Normal banner logic for direct visitors
    if (closedBanner) {
      if (!systemActive) {
        closedBanner.style.display = 'block';

        if (duringBusinessHours) {
          closedTitle.innerHTML = '🚧 PHONE LINES BUSY';
          closedBanner.style.background = 'linear-gradient(135deg, #ff8c00, #ff6b00)';
          afterHoursMessage.style.display = 'none';
          tempUnavailableMessage.style.display = 'block';
          console.log('🚧 Showing \"BUSY\" banner (system inactive during business hours)');
        } else {
          closedTitle.innerHTML = '🕐 CURRENTLY CLOSED';
          closedBanner.style.background = 'linear-gradient(135deg, #666, #888)';
          afterHoursMessage.style.display = 'block';
          tempUnavailableMessage.style.display = 'none';
          console.log('🕐 Showing \"CLOSED\" banner (system inactive outside business hours)');
        }
      } else {
        closedBanner.style.display = 'none';
        console.log('✅ Hiding banner (system active)');
      }
    }
  }

  // Update header call button (hide if system inactive AND no payment token AND no gclid)
  const headerButton = document.querySelector('header .cta-button');
  if (headerButton) {
    const shouldShow = systemActive;
    headerButton.style.display = shouldShow ? 'inline-block' : 'none';
    console.log('📞 Header button:', shouldShow ? 'VISIBLE' : 'HIDDEN');
  }

  // Update service buttons
  const normalButtons = document.querySelectorAll('.normal-hours-btn');
  const afterHoursButtons = document.querySelectorAll('.after-hours-btn');

  // Show normal buttons if system is active (which includes gclid/token users)
  const showNormalButtons = systemActive;
  const showAfterHoursButtons = !systemActive;

  normalButtons.forEach(btn => {
    btn.style.display = showNormalButtons ? 'inline-block' : 'none';
  });

  afterHoursButtons.forEach(btn => {
    btn.style.display = showAfterHoursButtons ? 'inline-block' : 'none';
  });

  console.log('🔘 Service buttons - Normal:', showNormalButtons ? 'VISIBLE' : 'HIDDEN',
              'After-hours:', showAfterHoursButtons ? 'VISIBLE' : 'HIDDEN');

  // Update sticky buttons
  const stickyCall = document.getElementById('stickyCallButton');
  const stickyClosed = document.getElementById('stickyClosedButton');

  if (stickyCall) {
    // For token users, ALWAYS hide the sticky call button
    if (hasPaymentToken) {
      stickyCall.style.display = 'none';
      console.log('📱 Sticky call button: HIDDEN (payment token detected)');
    } else {
      // For non-token users, show based on system status
      const shouldShowSticky = systemActive;
      stickyCall.style.display = shouldShowSticky ? 'inline-block' : 'none';
      console.log('📱 Sticky call button:', shouldShowSticky ? 'VISIBLE' : 'HIDDEN');
    }
  }

  if (stickyClosed) {
    // Only show closed button for direct visitors when system is inactive
    if (!systemActive && !hasPaymentToken && !hasGclid) {
      stickyClosed.style.display = 'inline-block';
      if (duringBusinessHours) {
        stickyClosed.innerHTML = '📅 Book Online';
        stickyClosed.style.background = '#ff8c00';
        stickyClosed.href = '#service-selection';
      } else {
        stickyClosed.innerHTML = '🕐 View Hours';
        stickyClosed.style.background = '#666';
        stickyClosed.href = '#closedBanner';
      }
      console.log('🔲 Sticky closed button: VISIBLE (' +
                  (duringBusinessHours ? 'Book Online' : 'View Hours') + ')');
    } else {
      stickyClosed.style.display = 'none';
      console.log('🔲 Sticky closed button: HIDDEN');
    }
  }

  console.log('✅ updateHoursDisplay completed');
}

/* ========================= Incoming Call Correlation ========================= */
(function(){
  const INCOMING_CALL_URL = "https://default61ffc6bcd9ce458b8120d32187c377.0d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/659e20267a7740aea22340e2f63e12fd/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=sa4qKODOby6WgW80SBuxvUxmRljASZfVTYTA-6vgPZo";

  // Expose global function for PBX to call
  window.correlateIncomingCall = function(callerID, internalNumber) {
    const sessionId = localStorage.getItem("eek_session_id");
    const lastCallAttemptId = localStorage.getItem("eek_last_call_attempt_id");
    const lastCallTimestamp = localStorage.getItem("eek_last_call_timestamp");
    const gclid = localStorage.getItem("eek_last_gclid"); // Enhanced: Include stored GCLID

    if (!sessionId) return; // No session to correlate

    const payload = {
      eventType: "incoming_call_correlation",
      timestamp: new Date().toISOString(),
      sessionId: sessionId,
      callerID: callerID,
      internalNumber: internalNumber,
      lastCallAttemptId: lastCallAttemptId,
      lastCallTimestamp: lastCallTimestamp,
      gclid: gclid, // Enhanced: Include GCLID for correlation
      correlationSuccess: true
    };

    fetch(INCOMING_CALL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      keepalive: true,
      mode: "no-cors"
    }).then(() => {
      console.log('Call correlated with GCLID:', gclid);
    }).catch(() => {});
  };
})();

/* ========================= Enhanced Call-Click Webhook ========================= */
(function(){
  const CALL_CLICK_URL = "https://default61ffc6bcd9ce458b8120d32187c377.0d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/659e20267a7740aea22340e2f63e12fd/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=sa4qKODOby6WgW80SBuxvUxmRljASZfVTYTA-6vgPZo";

  function getOrCreateSessionId(){
    let sid = localStorage.getItem("eek_session_id");
    if (!sid){
      sid = "session_" + Date.now() + "_" + Math.random().toString(36).slice(2,11);
      localStorage.setItem("eek_session_id", sid);
    }
    return sid;
  }

  function getUTM(){
    const q = new URLSearchParams(location.search);
    return {
      source: q.get("utm_source") || null,
      medium: q.get("utm_medium") || null,
      campaign: q.get("utm_campaign") || null,
      term: q.get("utm_term") || null,
      content: q.get("utm_content") || null,
      gclid: q.get("gclid") || null,
      msclkid: q.get("msclkid") || null,
      fbclid: q.get("fbclid") || null,
      rdtclid: q.get("rdtclid") || null
    };
  }

  // Enhanced: Extract and persist GCLID for cross-session tracking
  function getAndStoreGCLID(){
    const urlParams = new URLSearchParams(location.search);
    let gclid = urlParams.get("gclid");

    // If GCLID in URL, store it for persistent tracking
    if (gclid) {
      localStorage.setItem("eek_gclid", gclid);
      localStorage.setItem("eek_gclid_timestamp", new Date().toISOString());
      return gclid;
    }

    // Otherwise, retrieve stored GCLID if available and not too old (30 days)
    const storedGclid = localStorage.getItem("eek_gclid");
    const storedTimestamp = localStorage.getItem("eek_gclid_timestamp");

    if (storedGclid && storedTimestamp) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      if (new Date(storedTimestamp) > thirtyDaysAgo) {
        return storedGclid;
      } else {
        // GCLID too old, remove it
        localStorage.removeItem("eek_gclid");
        localStorage.removeItem("eek_gclid_timestamp");
      }
    }

    return null;
  }

  function closestPlacement(el){
    if (!el) return null;
    if (el.id) return "#" + el.id;
    const withId = el.closest("[id]");
    return withId ? ("#" + withId.id) : null;
  }

  function sendCallClick(eventAction, eventCategory, anchorEl){
    const callAttemptId = "call_" + Date.now() + "_" + Math.random().toString(36).slice(2,10);
    const sessionId = getOrCreateSessionId();
    const gclid = getAndStoreGCLID(); // Enhanced: Get persistent GCLID

    const payload = {
      eventType: "call_click",
      timestamp: new Date().toISOString(),
      sessionId: sessionId,
      callAttemptId: callAttemptId,
      gclid: gclid, // Enhanced: Include GCLID in payload
      phoneTarget: (anchorEl && anchorEl.getAttribute("href")) || "tel:0800769000",
      button: {
        eventAction: eventAction || "phone_call",
        eventCategory: eventCategory || "Contact",
        serviceType: (typeof getServiceType === "function") ? getServiceType(eventAction) : undefined,
        placement: anchorEl ? closestPlacement(anchorEl) : null,
        text: anchorEl ? (anchorEl.textContent || "").trim() : null
      },
      site: {
        domain: location.hostname,
        url: location.href,
        path: location.pathname,
        title: document.title,
        referrer: document.referrer || null
      },
      utm: getUTM(),
      device: {
        userAgent: navigator.userAgent,
        platform: navigator.platform || null,
        language: navigator.language || null,
        mobile: /Mobi|Android/i.test(navigator.userAgent),
        screen: {
          width: (window.screen && window.screen.width) || null,
          height: (window.screen && window.screen.height) || null,
          pixelRatio: window.devicePixelRatio || 1
        }
      },
      status: "pending"
    };

    // Save for PBX correlation if needed
    try {
      localStorage.setItem("eek_last_call_attempt_id", callAttemptId);
      localStorage.setItem("eek_last_call_timestamp", payload.timestamp);
      // Enhanced: Store GCLID for correlation
      if (gclid) {
        localStorage.setItem("eek_last_gclid", gclid);
      }
    } catch (_) {}

    // Use POST with JSON to match Power Automate configuration
    fetch(CALL_CLICK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      keepalive: true
    }).then(response => {
      console.log('Call click tracked with GCLID:', gclid, 'Status:', response.status);
    }).catch(error => {
      console.error('Call click failed:', error);
    });
  }

  // Capture which <a href="tel:..."> was clicked BEFORE inline onclick runs
  document.addEventListener("click", function(ev){
    const a = ev.target && ev.target.closest && ev.target.closest('a[href^=\"tel:\"]');
    if (a) window.__eek_last_tel_anchor = a;
  }, true);

  // Wrap your existing trackConversion so call clicks also hit the webhook
  const _origTrack = window.trackConversion || function(){};
  window.trackConversion = function(eventAction, eventCategory){
    try {
      if (eventAction && /call/i.test(eventAction)){
        sendCallClick(eventAction, eventCategory, window.__eek_last_tel_anchor || null);
      }
    } catch(_) {}
    return _origTrack.apply(this, arguments);
  };

  // Enhanced: Track GCLID on page load for session correlation
  window.addEventListener('load', function() {
    const gclid = getAndStoreGCLID();
    if (gclid) {
      console.log('GCLID detected and stored for persistent tracking:', gclid);
    }
  });
})();

/* ========================= Conversion Tracking Wrapper ========================= */
function trackConversion(eventAction, eventCategory) {
  const conversionId = 'eek_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

  const serviceValues = {
    'inspection_call': 19900,
    'breakdown_call': 28900,
    'battery_call': 14900,
    'fuel_drain_call': 39900,
    'header_call': 25000,
    'sticky_call': 25000,
    'more_options_call': 25000,
    'after_hours_emergency': 35000,
    'breakdown_after_hours': 35000,
    'battery_after_hours': 20000,
    'fuel_drain_after_hours': 45000,
    'inspection_after_hours': 25000
  };

  const eventValue = serviceValues[eventAction] || 25000;

  if (typeof gtag !== 'undefined') {
    gtag('event', eventAction, {
      'event_category': eventCategory,
      'event_label': 'Phone Call Click',
      'value': eventValue / 100
    });
    gtag('event', 'conversion', {
      'send_to': 'AW-17084465163/7Mh8CKFRydsaEIuAwJI_'
    });
  }

  if (typeof rdt !== 'undefined') {
    rdt('track', 'Lead', {
      'customEventName': 'Phone_Call_Click',
      'conversionId': conversionId,
      'value': eventValue,
      'currency': 'NZD',
      'itemCount': 1,
      'eventSource': eventAction,
      'eventCategory': eventCategory,
      'serviceType': getServiceType(eventAction)
    });
  }
}

function getServiceType(eventAction) {
  const serviceMap = {
    'inspection_call': 'Pre-Purchase Inspection',
    'breakdown_call': 'Emergency Breakdown',
    'battery_call': 'Battery Jump Start',
    'fuel_drain_call': 'Wrong Fuel Rescue',
    'header_call': 'General Inquiry',
    'sticky_call': 'General Inquiry',
    'more_options_call': 'General Inquiry',
    'after_hours_emergency': 'After Hours Emergency',
    'breakdown_after_hours': 'After Hours Breakdown',
    'battery_after_hours': 'After Hours Battery',
    'fuel_drain_after_hours': 'After Hours Fuel Drain',
    'inspection_after_hours': 'After Hours Inspection'
  };
  return serviceMap[eventAction] || 'General Service';
}

/* ========================= Page Init ========================= */
window.addEventListener('load', function() {
  console.log('🚀 Page loaded - initializing...');

  updatePhoneNumbers(); // Apply dynamic phone numbers first
  updateServiceLinks(); // Add tracking parameters to booking links
  handleServiceSelection(); // Set up click handlers for service cards
  updateHoursDisplay(); // Initial check

  // Set up periodic checks every 5 minutes
  setInterval(updateHoursDisplay, 5 * 60 * 1000);

  if (typeof gtag !== 'undefined') {
    gtag('event', 'page_view', {
      'page_title': document.title,
      'page_location': window.location.href
    });
  }

  console.log('✅ Initialization complete');
});

let scrollTracked = false;
window.addEventListener('scroll', function() {
  if (!scrollTracked && window.scrollY > document.body.scrollHeight * 0.5) {
    scrollTracked = true;
    if (typeof gtag !== 'undefined') {
      gtag('event', 'scroll_50_percent', {
        'event_category': 'Engagement',
        'event_label': 'Scrolled 50% of page'
      });
    }
  }
});

/* ========================= Token Payment Flow ========================= */
(function () {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  const box = document.getElementById('stripePaymentBlock');
  const checkbox = document.getElementById('termsCheckbox');
  const button = document.getElementById('payNowButton');
  const sticky = document.getElementById('stripePaymentSticky');
  const stickyCall = document.getElementById('stickyCallButton');
  const stickyClosedButton = document.getElementById('stickyClosedButton');

  if (token && box && checkbox && button && sticky) {
    console.log('💳 Payment token detected, setting up payment UI');

    box.style.display = 'block';
    sticky.style.display = 'inline-block';

    // Hide sticky call button for payment token users
    if (stickyCall) {
      stickyCall.style.display = 'none';
    }
    if (stickyClosedButton) {
      stickyClosedButton.style.display = 'none';
    }

    // Hide normal service buttons to force payment flow
    const normalButtons = document.querySelectorAll('.normal-hours-btn');
    normalButtons.forEach(btn => {
      btn.style.display = 'none';
    });

    sticky.href = '#stripePaymentBlock';

    checkbox.addEventListener('change', () => {
      button.style.display = checkbox.checked ? 'inline-block' : 'none';
    });

    button.addEventListener('click', () => {
      window.location.href = `https://buy.stripe.com/${token}`;
    });

    console.log('💳 Payment UI setup complete');
  }
})();

// Debug panel is hidden by default. Uncomment to show:
// document.querySelector('.debug-info')?.style?.display = 'block';
