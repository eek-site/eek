// SURGICAL ANCHOR SCROLLING FIX - Add this after your existing JavaScript
// This overrides the problematic handleServiceSelection function

// Override the problematic function with anchor-friendly version
function handleServiceSelection() {
    document.querySelectorAll('.service-link').forEach(link => {
        link.addEventListener('click', function(e) {
            const service = this.dataset.service;
            
            // Keep analytics tracking (if trackInteraction function exists)
            if (service && typeof trackInteraction === 'function') {
                trackInteraction(this);
            }
            
            // ANCHOR FIX: Remove redirect logic, let browser handle anchors naturally
            // No more e.preventDefault() or window.location.href redirects
            console.log('Service card clicked, allowing natural anchor behavior to:', this.getAttribute('href'));
        });
    });
    
    console.log('Anchor scrolling restored for service selection cards');
}

// Re-run the fixed function after page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleServiceSelection);
} else {
    handleServiceSelection();
}

console.log('ANCHOR SCROLLING FIX APPLIED: Service cards will now scroll to anchors instead of redirecting');
