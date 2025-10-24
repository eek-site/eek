# How to Add Real Google Reviews to Your Widget

## Quick Setup Guide

### Method 1: Manual Collection (Recommended - Free)

1. **Find Your Google Business Profile:**
   - Go to [Google Maps](https://maps.google.com)
   - Search for "Eek Mechanical" or your business name
   - Click on your business listing

2. **Collect Your Reviews:**
   - Scroll down to the "Reviews" section
   - Copy the following information for each review:
     - Customer name
     - Star rating (1-5)
     - Review text
     - Date of review
     - (Optional) Customer profile photo URL

3. **Update the Widget:**
   - Open `reviews-config.js`
   - Replace the `customReviews` array with your real reviews
   - Use this format:

```javascript
customReviews: [
  {
    author: 'Real Customer Name',
    rating: 5,
    text: 'Actual review text from Google...',
    date: '2024-01-15', // Use the actual review date
    profilePhoto: null // Leave as null unless you have photo URLs
  },
  // Add more real reviews here...
]
```

### Method 2: Google Places API (Advanced - Requires Setup)

If you want automatic updates, you can set up the Google Places API:

1. **Get Google Places API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable the "Places API"
   - Create an API key

2. **Find Your Business ID:**
   - Use the [Google Places API Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id)
   - Search for your business to get the Place ID

3. **Update Configuration:**
   - Open `reviews-config.js`
   - Add your API key and business ID:

```javascript
const REVIEWS_CONFIG = {
  businessName: 'Eek Mechanical',
  businessId: 'your-google-place-id-here',
  apiKey: 'your-google-places-api-key-here',
  // ... rest of config
};
```

### Method 3: Third-Party Services (Paid Options)

If you prefer a managed solution:

1. **Elfsight Google Reviews Widget:**
   - Visit [elfsight.com](https://elfsight.com)
   - Create account and connect your Google Business Profile
   - Get embed code and replace our widget

2. **Trustmary:**
   - Visit [trustmary.com](https://trustmary.com)
   - Import reviews using your Google Maps URL
   - Customize and embed

## Current Status

Your widget currently shows **placeholder reviews** for demonstration. To show real reviews:

1. **Immediate:** Use Method 1 to manually add your real reviews
2. **Long-term:** Consider Method 2 or 3 for automatic updates

## Need Help?

If you need assistance collecting your real reviews or setting up the API, I can help you:
1. Find your Google Business Profile
2. Extract your real reviews
3. Format them for the widget
4. Set up automatic updates

Just let me know which method you'd prefer!
