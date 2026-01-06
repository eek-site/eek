'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Navigation, Loader2, X, Check, Search } from 'lucide-react'

// Declare Google Maps types inline
declare global {
  interface Window {
    google?: {
      maps: {
        Map: new (element: HTMLElement, options: MapOptions) => GoogleMap
        Marker: new (options: MarkerOptions) => GoogleMarker
        Geocoder: new () => GoogleGeocoder
        SymbolPath: { CIRCLE: number }
        Animation: { DROP: number }
        GeocoderStatus: { OK: string }
        places: {
          AutocompleteSessionToken: new () => AutocompleteSessionToken
          AutocompleteSuggestion: {
            fetchAutocompleteSuggestions: (request: AutocompleteRequest) => Promise<AutocompleteResponse>
          }
          // New Place API (recommended, replaces PlacesService)
          Place: new (options: { id: string }) => {
            displayName?: string
            formattedAddress?: string
            nationalPhoneNumber?: string
            internationalPhoneNumber?: string
            websiteURI?: string
            location?: { lat: () => number; lng: () => number }
            fetchFields: (options: { fields: string[] }) => Promise<void>
          }
        }
      }
    }
    initGoogleMaps?: () => void
  }
}

interface MapOptions {
  center: { lat: number; lng: number }
  zoom: number
  mapTypeControl?: boolean
  streetViewControl?: boolean
  fullscreenControl?: boolean
  styles?: Array<{ elementType?: string; featureType?: string; stylers: Array<{ color?: string }> }>
}

interface MarkerOptions {
  position: { lat: number; lng: number }
  map: GoogleMap
  draggable?: boolean
  animation?: number
  icon?: {
    path: number
    scale: number
    fillColor: string
    fillOpacity: number
    strokeColor: string
    strokeWeight: number
  }
}

interface GoogleMap {
  panTo: (location: { lat: number; lng: number }) => void
  setZoom: (zoom: number) => void
  addListener: (event: string, handler: (e: { latLng?: { lat: () => number; lng: () => number } }) => void) => void
}

interface GoogleMarker {
  setPosition: (pos: { lat: number; lng: number }) => void
  getPosition: () => { lat: () => number; lng: () => number } | null
  addListener: (event: string, handler: () => void) => void
}

interface GoogleGeocoder {
  geocode: (
    request: { location?: { lat: number; lng: number }; placeId?: string },
    callback: (results: GeocoderResult[] | null, status: string) => void
  ) => void
}

interface GeocoderResult {
  formatted_address: string
  geometry: { location: { lat: () => number; lng: () => number } }
}

interface AutocompleteSessionToken {
  // Opaque token
}

interface AutocompleteRequest {
  input: string
  sessionToken?: AutocompleteSessionToken
  includedRegionCodes?: string[]
}

interface AutocompleteSuggestion {
  placePrediction?: {
    placeId: string
    text: { text: string }
    structuredFormat?: {
      mainText: { text: string }
      secondaryText: { text: string }
    }
  }
}

interface AutocompleteResponse {
  suggestions: AutocompleteSuggestion[]
}

interface SearchByTextRequest {
  textQuery: string
  fields: string[]
  maxResultCount?: number
  regionCode?: string
}

interface SearchByTextResponse {
  places: Array<{
    displayName: string
    formattedAddress: string
    location: { lat: () => number; lng: () => number }
  }>
}

interface Suggestion {
  placeId: string
  mainText: string
  secondaryText: string
  fullText: string
}

interface AddressPickerProps {
  value: string
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void
  placeholder?: string
  label?: string
  required?: boolean
  error?: string
  className?: string
  showMap?: boolean
  defaultCenter?: { lat: number; lng: number }
}

// Default center: Hamilton, NZ
const DEFAULT_CENTER = { lat: -37.7870, lng: 175.2793 }

// Google Maps script loader
let googleMapsPromise: Promise<void> | null = null

function loadGoogleMaps(): Promise<void> {
  if (googleMapsPromise) return googleMapsPromise
  
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  if (!apiKey) {
    console.warn('Google Maps API key not configured')
    return Promise.resolve()
  }
  
  if (typeof window !== 'undefined' && window.google?.maps) {
    return Promise.resolve()
  }
  
  googleMapsPromise = new Promise((resolve, reject) => {
    window.initGoogleMaps = () => {
      resolve()
    }
    
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async&callback=initGoogleMaps`
    script.async = true
    script.onerror = () => reject(new Error('Failed to load Google Maps'))
    document.head.appendChild(script)
  })
  
  return googleMapsPromise
}

export default function AddressPicker({
  value,
  onChange,
  placeholder = 'Search address...',
  label,
  required = false,
  error,
  className = '',
  showMap = true,
  defaultCenter = DEFAULT_CENTER
}: AddressPickerProps) {
  const [inputValue, setInputValue] = useState(value)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [mapExpanded, setMapExpanded] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<GoogleMap | null>(null)
  const markerRef = useRef<GoogleMarker | null>(null)
  const geocoderRef = useRef<GoogleGeocoder | null>(null)
  const sessionTokenRef = useRef<AutocompleteSessionToken | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  
  // Load Google Maps
  useEffect(() => {
    loadGoogleMaps().then(() => {
      if (window.google?.maps) {
        setMapLoaded(true)
        geocoderRef.current = new window.google.maps.Geocoder()
        // Create session token for autocomplete
        if (window.google.maps.places?.AutocompleteSessionToken) {
          sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken()
        }
      }
    }).catch(console.error)
  }, [])
  
  // Fetch suggestions using the new API
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2 || !window.google?.maps?.places) {
      setSuggestions([])
      return
    }
    
    setIsLoading(true)
    
    try {
      // Try the new AutocompleteSuggestion API first
      if (window.google.maps.places.AutocompleteSuggestion?.fetchAutocompleteSuggestions) {
        const response = await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: query,
          sessionToken: sessionTokenRef.current || undefined,
          includedRegionCodes: ['nz']
        })
        
        const newSuggestions: Suggestion[] = response.suggestions
          .filter(s => s.placePrediction)
          .map(s => ({
            placeId: s.placePrediction!.placeId,
            mainText: s.placePrediction!.structuredFormat?.mainText?.text || s.placePrediction!.text.text,
            secondaryText: s.placePrediction!.structuredFormat?.secondaryText?.text || '',
            fullText: s.placePrediction!.text.text
          }))
        
        setSuggestions(newSuggestions)
      } else {
        // Fallback: use Geocoder for basic address search
        if (geocoderRef.current) {
          geocoderRef.current.geocode(
            { location: undefined }, // We'll search by address
            () => {} // Geocoder doesn't do autocomplete well, so just clear
          )
        }
        setSuggestions([])
      }
    } catch (e) {
      console.error('Autocomplete error:', e)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  // Debounced input handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setShowSuggestions(true)
    setSelectedIndex(-1)
    
    // Debounce API calls
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(newValue)
    }, 300)
  }
  
  // Handle suggestion selection
  const handleSelectSuggestion = async (suggestion: Suggestion) => {
    setInputValue(suggestion.fullText)
    setSuggestions([])
    setShowSuggestions(false)
    
    // Get place details using Geocoder (more reliable)
    if (geocoderRef.current) {
      geocoderRef.current.geocode(
        { placeId: suggestion.placeId },
        (results, status) => {
          if (status === window.google?.maps.GeocoderStatus.OK && results?.[0]) {
            const location = results[0].geometry.location
            const coords = { lat: location.lat(), lng: location.lng() }
            setCoordinates(coords)
            onChange(suggestion.fullText, coords)
            
            // Update map if visible
            if (mapInstanceRef.current && markerRef.current) {
              mapInstanceRef.current.panTo(coords)
              markerRef.current.setPosition(coords)
            }
            
            // Reset session token after place selection
            if (window.google?.maps.places?.AutocompleteSessionToken) {
              sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken()
            }
          } else {
            onChange(suggestion.fullText)
          }
        }
      )
    } else {
      onChange(suggestion.fullText)
    }
  }
  
  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        break
    }
  }
  
  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Initialize map when expanded
  useEffect(() => {
    if (!mapLoaded || !mapExpanded || !mapRef.current || mapInstanceRef.current) return
    if (!window.google?.maps) return
    
    const center = coordinates || defaultCenter
    
    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
        { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
      ]
    })
    
    markerRef.current = new window.google.maps.Marker({
      position: center,
      map: mapInstanceRef.current,
      draggable: true,
      animation: window.google.maps.Animation.DROP,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#ef4444',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      }
    })
    
    markerRef.current.addListener('dragend', () => {
      const position = markerRef.current?.getPosition()
      if (position) {
        const newCoords = { lat: position.lat(), lng: position.lng() }
        setCoordinates(newCoords)
        reverseGeocode(newCoords)
      }
    })
    
    mapInstanceRef.current.addListener('click', (e) => {
      if (e.latLng && markerRef.current) {
        markerRef.current.setPosition({ lat: e.latLng.lat(), lng: e.latLng.lng() })
        const newCoords = { lat: e.latLng.lat(), lng: e.latLng.lng() }
        setCoordinates(newCoords)
        reverseGeocode(newCoords)
      }
    })
  }, [mapLoaded, mapExpanded, coordinates, defaultCenter])
  
  // Update marker when coordinates change
  useEffect(() => {
    if (coordinates && markerRef.current && mapInstanceRef.current) {
      markerRef.current.setPosition(coordinates)
      mapInstanceRef.current.panTo(coordinates)
    }
  }, [coordinates])
  
  // Sync external value
  useEffect(() => {
    setInputValue(value)
  }, [value])
  
  // Reverse geocode
  const reverseGeocode = useCallback(async (coords: { lat: number; lng: number }) => {
    if (!geocoderRef.current || !window.google?.maps) return
    
    geocoderRef.current.geocode({ location: coords }, (results, status) => {
      if (status === window.google?.maps.GeocoderStatus.OK && results?.[0]) {
        const address = results[0].formatted_address
        setInputValue(address)
        onChange(address, coords)
      }
    })
  }, [onChange])
  
  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }
    
    setIsLocating(true)
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        setCoordinates(coords)
        setMapExpanded(true)
        await reverseGeocode(coords)
        
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.panTo(coords)
          mapInstanceRef.current.setZoom(17)
          markerRef.current.setPosition(coords)
        }
        
        setIsLocating(false)
      },
      (err) => {
        console.error('Geolocation error:', err)
        alert('Could not get your location. Please enter the address manually.')
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }
  
  const handleConfirmLocation = () => {
    setMapExpanded(false)
    if (coordinates) {
      onChange(inputValue, coordinates)
    }
  }
  
  const hasApiKey = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label} {required && <span className="text-red">*</span>}
        </label>
      )}
      
      <div className="relative">
        {/* Custom styled input with our own dropdown */}
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder={placeholder}
              className={`w-full bg-zinc-800/50 border rounded-xl pl-12 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red/50 transition-all ${error ? 'border-red' : 'border-zinc-700/50'}`}
            />
            
            {/* Loading indicator */}
            {isLoading && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 animate-spin" />
            )}
            
            {/* Suggestions dropdown - fully custom styled */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-50 w-full mt-2 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl overflow-hidden"
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.placeId}
                    type="button"
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className={`w-full px-4 py-3 text-left transition-colors flex items-start gap-3 ${
                      index === selectedIndex
                        ? 'bg-zinc-700'
                        : 'hover:bg-zinc-700/50'
                    }`}
                  >
                    <MapPin className="w-5 h-5 text-red mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-white font-medium truncate">
                        {suggestion.mainText}
                      </div>
                      {suggestion.secondaryText && (
                        <div className="text-zinc-400 text-sm truncate">
                          {suggestion.secondaryText}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
                {/* Google attribution */}
                <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-700">
                  <span className="text-zinc-500 text-xs">Powered by Google</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          {showMap && hasApiKey && (
            <button
              type="button"
              onClick={() => setMapExpanded(!mapExpanded)}
              className={`p-3 rounded-xl transition-colors ${mapExpanded ? 'bg-red text-white' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'}`}
              title="Show map"
            >
              <MapPin className="w-5 h-5" />
            </button>
          )}
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={isLocating}
            className="p-3 bg-zinc-700 text-zinc-300 hover:bg-zinc-600 rounded-xl transition-colors disabled:opacity-50"
            title="Use my location"
          >
            {isLocating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Navigation className="w-5 h-5" />
            )}
          </button>
        </div>
        
        {error && <p className="text-red text-sm mt-1">{error}</p>}
      </div>
      
      {/* Expandable map */}
      {showMap && mapExpanded && hasApiKey && (
        <div className="mt-3 rounded-xl overflow-hidden border border-zinc-700">
          <div ref={mapRef} className="w-full h-64" />
          <div className="bg-zinc-800 p-3 flex items-center justify-between">
            <p className="text-zinc-400 text-sm">
              {coordinates ? 'Drag pin or tap map to adjust' : 'Searching for location...'}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMapExpanded(false)}
                className="px-3 py-1.5 bg-zinc-700 text-zinc-300 rounded-lg text-sm hover:bg-zinc-600 transition-colors flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLocation}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
              >
                <Check className="w-4 h-4" />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      
      {!hasApiKey && showMap && (
        <p className="text-amber-500 text-xs mt-2">
          Map features disabled - add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        </p>
      )}
    </div>
  )
}
