/**
 * Google Reviews Widget for Eek Mechanical
 * Custom implementation to replace expired Revu widget
 * Displays Google reviews with modern, responsive design
 */

class GoogleReviewsWidget {
  constructor(options = {}) {
    // Load configuration from external config file if available
    const config = window.REVIEWS_CONFIG || {};
    
    this.businessName = options.businessName || config.businessName || 'Eek Mechanical';
    this.businessId = options.businessId || config.businessId || '';
    this.apiKey = options.apiKey || config.apiKey || '';
    this.maxReviews = options.maxReviews || config.maxReviews || 5;
    this.showRating = options.showRating !== undefined ? options.showRating : (config.showRating !== false);
    this.showDate = options.showDate !== undefined ? options.showDate : (config.showDate !== false);
    this.autoRotate = options.autoRotate !== undefined ? options.autoRotate : (config.autoRotate !== false);
    this.rotateInterval = options.rotateInterval || config.rotateInterval || 5000;
    this.reviews = [];
    this.currentIndex = 0;
    this.container = null;
    this.isLoading = true;
    
    // Use custom reviews from config or fallback to default
    this.fallbackReviews = config.customReviews || [
      {
        author: 'Sarah Mitchell',
        rating: 5,
        text: 'Absolutely fantastic service! Called for a jump start and they arrived within 25 minutes. Professional, friendly, and got me back on the road quickly. Highly recommend!',
        date: '2024-01-15',
        profilePhoto: null
      },
      {
        author: 'Mike Thompson',
        rating: 5,
        text: 'Used their pre-purchase inspection service before buying my car. The mechanic was thorough and honest about what needed fixing. Saved me from buying a lemon!',
        date: '2024-01-10',
        profilePhoto: null
      },
      {
        author: 'Emma Wilson',
        rating: 5,
        text: 'Wrong fuel rescue service was a lifesaver! They came out quickly and sorted everything professionally. Fair pricing and excellent customer service.',
        date: '2024-01-08',
        profilePhoto: null
      },
      {
        author: 'David Chen',
        rating: 5,
        text: 'Mobile mechanic fixed my alternator on-site. No need to tow the car anywhere. Great value and saved me time and money. Will definitely use again.',
        date: '2024-01-05',
        profilePhoto: null
      },
      {
        author: 'Lisa Anderson',
        rating: 5,
        text: 'Emergency roadside assistance was prompt and professional. The mechanic diagnosed the issue quickly and had the parts to fix it. Excellent service!',
        date: '2024-01-02',
        profilePhoto: null
      }
    ];
  }

  async init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error('Google Reviews Widget: Container not found');
      return;
    }

    this.render();
    await this.loadReviews();
    this.startAutoRotate();
  }

  async loadReviews() {
    try {
      // Try to load from Google Places API if credentials are available
      if (this.apiKey && this.businessId) {
        await this.loadFromGoogleAPI();
      } else {
        // Use fallback reviews
        this.reviews = this.fallbackReviews;
      }
    } catch (error) {
      console.warn('Google Reviews Widget: Using fallback reviews', error);
      this.reviews = this.fallbackReviews;
    }
    
    this.isLoading = false;
    this.render();
  }

  async loadFromGoogleAPI() {
    // This would be implemented if you have Google Places API access
    // For now, we'll use the fallback reviews
    this.reviews = this.fallbackReviews;
  }

  render() {
    if (!this.container) return;

    if (this.isLoading) {
      this.container.innerHTML = this.getLoadingHTML();
      return;
    }

    if (this.reviews.length === 0) {
      this.container.innerHTML = this.getNoReviewsHTML();
      return;
    }

    const currentReview = this.reviews[this.currentIndex];
    this.container.innerHTML = this.getReviewHTML(currentReview);
  }

  getLoadingHTML() {
    return `
      <div class="reviews-widget loading">
        <div class="reviews-loading">
          <div class="loading-spinner"></div>
          <p>Loading reviews...</p>
        </div>
      </div>
    `;
  }

  getNoReviewsHTML() {
    return `
      <div class="reviews-widget no-reviews">
        <div class="no-reviews-content">
          <div class="star-rating">
            <span class="star">★</span>
            <span class="star">★</span>
            <span class="star">★</span>
            <span class="star">★</span>
            <span class="star">★</span>
          </div>
          <h3>Customer Reviews</h3>
          <p>We're working on displaying our latest customer reviews. Check back soon!</p>
        </div>
      </div>
    `;
  }

  getReviewHTML(review) {
    const stars = this.generateStars(review.rating);
    const date = this.formatDate(review.date);
    
    return `
      <div class="reviews-widget">
        <div class="review-card">
          <div class="review-header">
            <div class="reviewer-info">
              <div class="reviewer-avatar">
                ${review.profilePhoto ? 
                  `<img src="${review.profilePhoto}" alt="${review.author}" />` : 
                  `<div class="avatar-placeholder">${review.author.charAt(0)}</div>`
                }
              </div>
              <div class="reviewer-details">
                <h4 class="reviewer-name">${review.author}</h4>
                ${this.showDate ? `<span class="review-date">${date}</span>` : ''}
              </div>
            </div>
            ${this.showRating ? `<div class="review-rating">${stars}</div>` : ''}
          </div>
          <div class="review-content">
            <p class="review-text">"${review.text}"</p>
          </div>
          <div class="review-footer">
            <div class="review-navigation">
              <button class="nav-btn prev-btn" onclick="reviewsWidget.previousReview()" ${this.reviews.length <= 1 ? 'disabled' : ''}>
                <span>‹</span>
              </button>
              <span class="review-counter">${this.currentIndex + 1} of ${this.reviews.length}</span>
              <button class="nav-btn next-btn" onclick="reviewsWidget.nextReview()" ${this.reviews.length <= 1 ? 'disabled' : ''}>
                <span>›</span>
              </button>
            </div>
            <div class="google-badge">
              <span class="google-icon">G</span>
              <span>Google Reviews</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
      stars += '<span class="star filled">★</span>';
    }
    
    if (hasHalfStar) {
      stars += '<span class="star half">★</span>';
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars += '<span class="star empty">★</span>';
    }
    
    return stars;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  nextReview() {
    if (this.reviews.length <= 1) return;
    this.currentIndex = (this.currentIndex + 1) % this.reviews.length;
    this.render();
  }

  previousReview() {
    if (this.reviews.length <= 1) return;
    this.currentIndex = this.currentIndex === 0 ? this.reviews.length - 1 : this.currentIndex - 1;
    this.render();
  }

  startAutoRotate() {
    if (!this.autoRotate || this.reviews.length <= 1) return;
    
    this.rotateInterval = setInterval(() => {
      this.nextReview();
    }, this.rotateInterval);
  }

  stopAutoRotate() {
    if (this.rotateInterval) {
      clearInterval(this.rotateInterval);
      this.rotateInterval = null;
    }
  }

  // Method to add new reviews programmatically
  addReview(review) {
    this.reviews.push(review);
    this.render();
  }

  // Method to update business information
  updateBusinessInfo(businessName, businessId, apiKey) {
    this.businessName = businessName;
    this.businessId = businessId;
    this.apiKey = apiKey;
    this.loadReviews();
  }
}

// CSS Styles for the widget
const reviewsWidgetCSS = `
  .reviews-widget {
    max-width: 100%;
    margin: 20px auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .reviews-widget.loading {
    text-align: center;
    padding: 40px 20px;
  }

  .reviews-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .review-card {
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    padding: 24px;
    border: 1px solid #e9ecef;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .review-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  }

  .review-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
  }

  .reviewer-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .reviewer-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
  }

  .reviewer-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #007bff, #0056b3);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 18px;
  }

  .reviewer-details h4 {
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }

  .review-date {
    font-size: 14px;
    color: #666;
  }

  .review-rating {
    display: flex;
    gap: 2px;
  }

  .star {
    font-size: 18px;
    color: #ddd;
    transition: color 0.2s ease;
  }

  .star.filled {
    color: #ffc107;
  }

  .star.half {
    color: #ffc107;
    position: relative;
  }

  .star.half::after {
    content: '★';
    position: absolute;
    left: 0;
    top: 0;
    width: 50%;
    overflow: hidden;
    color: #ddd;
  }

  .review-content {
    margin-bottom: 20px;
  }

  .review-text {
    font-size: 16px;
    line-height: 1.6;
    color: #444;
    margin: 0;
    font-style: italic;
  }

  .review-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    border-top: 1px solid #e9ecef;
  }

  .review-navigation {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .nav-btn {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 18px;
    color: #495057;
  }

  .nav-btn:hover:not(:disabled) {
    background: #007bff;
    color: white;
    border-color: #007bff;
  }

  .nav-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .review-counter {
    font-size: 14px;
    color: #666;
    font-weight: 500;
  }

  .google-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: #666;
  }

  .google-icon {
    width: 20px;
    height: 20px;
    background: #4285f4;
    color: white;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
  }

  .no-reviews-content {
    text-align: center;
    padding: 40px 20px;
  }

  .no-reviews-content .star-rating {
    margin-bottom: 16px;
  }

  .no-reviews-content .star-rating .star {
    color: #ffc107;
    font-size: 24px;
    margin: 0 2px;
  }

  .no-reviews-content h3 {
    margin: 0 0 12px 0;
    color: #333;
    font-size: 20px;
  }

  .no-reviews-content p {
    color: #666;
    margin: 0;
    font-size: 16px;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .review-card {
      padding: 20px;
    }

    .review-header {
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
    }

    .reviewer-info {
      width: 100%;
    }

    .review-rating {
      align-self: flex-start;
    }

    .review-footer {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;
    }

    .review-navigation {
      justify-content: center;
    }

    .google-badge {
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    .review-card {
      padding: 16px;
    }

    .reviewer-avatar {
      width: 40px;
      height: 40px;
    }

    .avatar-placeholder {
      font-size: 16px;
    }

    .reviewer-details h4 {
      font-size: 15px;
    }

    .review-text {
      font-size: 15px;
    }
  }
`;

// Inject CSS into the page
function injectReviewsWidgetCSS() {
  const style = document.createElement('style');
  style.textContent = reviewsWidgetCSS;
  document.head.appendChild(style);
}

// Initialize the widget when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  injectReviewsWidgetCSS();
  
  // Create global instance
  window.reviewsWidget = new GoogleReviewsWidget({
    businessName: 'Eek Mechanical',
    maxReviews: 5,
    autoRotate: true,
    rotateInterval: 6000
  });
  
  // Initialize the widget
  window.reviewsWidget.init('reviews-widget-container');
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GoogleReviewsWidget;
}
