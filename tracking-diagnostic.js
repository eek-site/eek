/**
 * EEK TRACKING DIAGNOSTIC SCRIPT
 * Add this to your page to see what's working and what's broken
 * Cache busting: v20251020.7
 */

console.log('🔍 EEK TRACKING DIAGNOSTIC STARTING...');

// Test 1: Check if global objects exist
function testGlobalObjects() {
    console.log('=== TEST 1: GLOBAL OBJECTS ===');
    console.log('EEK_CONFIG exists:', typeof EEK_CONFIG !== 'undefined');
    console.log('EEK_STATE exists:', typeof EEK_STATE !== 'undefined');
    console.log('trackConversion exists:', typeof trackConversion !== 'undefined');
    console.log('buildTrackingPayload exists:', typeof buildTrackingPayload !== 'undefined');
    console.log('sendTrackingEvent exists:', typeof sendTrackingEvent !== 'undefined');
    
    if (typeof EEK_STATE !== 'undefined') {
        console.log('EEK_STATE contents:', EEK_STATE);
    }
}

// Test 2: Check API connectivity
async function testAPIConnectivity() {
    console.log('=== TEST 2: API CONNECTIVITY ===');
    
    if (typeof EEK_CONFIG === 'undefined') {
        console.error('❌ EEK_CONFIG not loaded - cannot test API');
        return;
    }
    
    const testPayload = {
        eventType: 'diagnostic_test',
        eventAction: 'api_test',
        timestamp: new Date().toISOString(),
        sessionId: 'diagnostic_session_' + Date.now()
    };
    
    try {
        console.log('📡 Testing API connectivity...');
        console.log('API URL:', EEK_CONFIG.TRACKING_API_URL);
        
        const response = await fetch(EEK_CONFIG.TRACKING_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testPayload),
            keepalive: true
        });
        
        console.log('📡 API Response Status:', response.status, response.statusText);
        
        if (response.ok) {
            console.log('✅ API is responding correctly');
            const responseText = await response.text();
            console.log('📡 Response body:', responseText);
        } else {
            console.error('❌ API returned error status:', response.status);
            const errorText = await response.text();
            console.error('❌ Error response:', errorText);
        }
        
    } catch (error) {
        console.error('❌ API connection failed:', error);
        console.error('❌ Error details:', error.message);
    }
}

// Test 3: Check Google Analytics
function testGoogleAnalytics() {
    console.log('=== TEST 3: GOOGLE ANALYTICS ===');
    console.log('gtag function exists:', typeof gtag !== 'undefined');
    console.log('dataLayer exists:', typeof dataLayer !== 'undefined');
    
    if (typeof dataLayer !== 'undefined') {
        console.log('dataLayer contents:', dataLayer);
    }
    
    if (typeof gtag !== 'undefined') {
        console.log('✅ Google Analytics is loaded');
        // Test GA tracking
        gtag('event', 'diagnostic_test', {
            'event_category': 'Diagnostic',
            'event_label': 'Tracking Test'
        });
        console.log('📊 Test event sent to Google Analytics');
    } else {
        console.error('❌ Google Analytics not loaded');
    }
}

// Test 4: Check Reddit Pixel
function testRedditPixel() {
    console.log('=== TEST 4: REDDIT PIXEL ===');
    console.log('rdt function exists:', typeof rdt !== 'undefined');
    
    if (typeof rdt !== 'undefined') {
        console.log('✅ Reddit Pixel is loaded');
        // Test Reddit tracking
        rdt('track', 'Custom', {
            'customEventName': 'diagnostic_test',
            'eventCategory': 'Diagnostic'
        });
        console.log('📊 Test event sent to Reddit Pixel');
    } else {
        console.error('❌ Reddit Pixel not loaded');
    }
}

// Test 5: Check click tracking
function testClickTracking() {
    console.log('=== TEST 5: CLICK TRACKING ===');
    
    const trackingElements = document.querySelectorAll('[data-track]');
    console.log('Elements with data-track:', trackingElements.length);
    
    const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
    console.log('Phone links found:', phoneLinks.length);
    
    trackingElements.forEach((el, index) => {
        console.log(`  Element ${index}:`, {
            tag: el.tagName,
            track: el.dataset.track,
            text: el.textContent.substring(0, 50)
        });
    });
}

// Test 6: Test actual tracking functions
function testTrackingFunctions() {
    console.log('=== TEST 6: TRACKING FUNCTIONS ===');
    
    if (typeof trackConversion !== 'undefined') {
        console.log('🧪 Testing trackConversion...');
        trackConversion('diagnostic_test', 'Diagnostic');
        console.log('✅ trackConversion executed (check console for details)');
    } else {
        console.error('❌ trackConversion function not found');
    }
    
    if (typeof buildTrackingPayload !== 'undefined') {
        console.log('🧪 Testing buildTrackingPayload...');
        const payload = buildTrackingPayload('diagnostic', 'test', { test: true });
        console.log('✅ buildTrackingPayload result:', payload);
    } else {
        console.error('❌ buildTrackingPayload function not found');
    }
}

// Test 7: Check URL parameters
function testURLParameters() {
    console.log('=== TEST 7: URL PARAMETERS ===');
    
    const urlParams = new URLSearchParams(window.location.search);
    console.log('Current URL:', window.location.href);
    console.log('GCLID:', urlParams.get('gclid'));
    console.log('Token:', urlParams.get('token'));
    console.log('UTM Source:', urlParams.get('utm_source'));
    console.log('UTM Medium:', urlParams.get('utm_medium'));
    console.log('UTM Campaign:', urlParams.get('utm_campaign'));
    
    // Check stored values
    console.log('Stored GCLID:', localStorage.getItem('eek_gclid'));
    console.log('Stored Session ID:', localStorage.getItem('eek_session_id'));
}

// Run all diagnostics
async function runFullDiagnostic() {
    console.log('🚀 STARTING FULL EEK TRACKING DIAGNOSTIC');
    console.log('Time:', new Date().toISOString());
    console.log('================================');
    
    testGlobalObjects();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    testURLParameters();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    testGoogleAnalytics();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    testRedditPixel();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    testClickTracking();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    testTrackingFunctions();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await testAPIConnectivity();
    
    console.log('================================');
    console.log('🏁 DIAGNOSTIC COMPLETE');
    console.log('Check the console output above for any ❌ errors');
}

// Auto-run after page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(runFullDiagnostic, 2000); // Wait 2 seconds for everything to load
    });
} else {
    setTimeout(runFullDiagnostic, 2000);
}

// Make functions available globally for manual testing
window.eekDiagnostic = {
    runFullDiagnostic,
    testAPIConnectivity,
    testGoogleAnalytics,
    testRedditPixel,
    testClickTracking,
    testTrackingFunctions
};

console.log('🔧 EEK Diagnostic loaded. Run window.eekDiagnostic.runFullDiagnostic() to test manually');
