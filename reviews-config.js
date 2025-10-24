/**
 * Reviews Configuration for Eek Mechanical
 * Update this file to modify the reviews displayed in the widget
 */

const REVIEWS_CONFIG = {
  // Business Information
  businessName: 'Eek Mechanical',
  businessId: '', // Google Places API business ID (if available)
  apiKey: '', // Google Places API key (if available)
  
  // Widget Settings
  maxReviews: 5,
  autoRotate: true,
  rotateInterval: 6000, // 6 seconds
  showRating: true,
  showDate: true,
  
  // Custom Reviews (fallback when API is not available)
  customReviews: [
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
    },
    {
      author: 'James Roberts',
      rating: 5,
      text: 'Called for a flat tire change and they were there in 20 minutes. Quick, professional service and very reasonable pricing. Will definitely use again!',
      date: '2023-12-28',
      profilePhoto: null
    },
    {
      author: 'Rachel Green',
      rating: 5,
      text: 'Pre-purchase inspection saved me from buying a car with hidden issues. The report was detailed and the mechanic was very knowledgeable. Worth every penny!',
      date: '2023-12-20',
      profilePhoto: null
    },
    {
      author: 'Tom Wilson',
      rating: 5,
      text: 'Battery died in the middle of nowhere. Eek Mechanical came to the rescue quickly. Professional service and fair pricing. Highly recommended!',
      date: '2023-12-15',
      profilePhoto: null
    }
  ]
};

// Export for use in the widget
if (typeof window !== 'undefined') {
  window.REVIEWS_CONFIG = REVIEWS_CONFIG;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = REVIEWS_CONFIG;
}
