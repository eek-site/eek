'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Building2, Phone, Mail, MapPin, Loader2, Search, Check, Smartphone } from 'lucide-react'

// Extended place details from Google
interface PlaceDetails {
  name: string
  address: string
  phone?: string
  website?: string
  coords?: { lat: number; lng: number }
}

export interface SupplierData {
  name: string
  phone: string
  phoneLandline: boolean
  mobile?: string
  email: string
  address: string
  coords?: { lat: number; lng: number }
  website?: string
  bankAccount?: string
  notes?: string
}

interface Props {
  value: SupplierData
  onChange: (supplier: SupplierData) => void
  onSupplierLoaded?: (isExisting: boolean) => void
  placeholder?: string
}

interface Suggestion {
  placeId: string
  mainText: string
  secondaryText: string
  fullText: string
}

// Google Maps types are declared in AddressPicker.tsx

// Sanitize supplier name for database key (remove special chars that cause URL issues)
const sanitizeSupplierName = (name: string): string => {
  return name
    .replace(/[''`]/g, "'")  // Normalize apostrophes
    .replace(/[^\w\s\-&']/g, '') // Remove special chars except alphanumeric, spaces, hyphens, ampersand, apostrophe
    .trim()
}

export default function SupplierPicker({ value, onChange, onSupplierLoaded, placeholder }: Props) {
  const [searchQuery, setSearchQuery] = useState(value.name || '')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [isExistingSupplier, setIsExistingSupplier] = useState(!!value.name)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const sessionTokenRef = useRef<object | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  
  // Fetch place details using new Place API (replaces deprecated PlacesService)
  const fetchPlaceDetails = useCallback(async (placeId: string) => {
    if (!window.google?.maps?.places?.Place) {
      console.warn('⚠️ Place API not available')
      return null
    }
    
    try {
      // Use new Place API
      const place = new window.google.maps.places.Place({ id: placeId })
      
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'nationalPhoneNumber', 'internationalPhoneNumber', 'websiteURI', 'location']
      })
      
      console.log('📍 Place API returned:', place)
      
      return {
        name: place.displayName || '',
        phone: place.nationalPhoneNumber || place.internationalPhoneNumber || '',
        website: place.websiteURI || '',
        address: place.formattedAddress || '',
        coords: place.location ? {
          lat: place.location.lat(),
          lng: place.location.lng()
        } : undefined
      }
    } catch (e) {
      console.error('Place API error:', e)
      return null
    }
  }, [])
  
  // Sync search query when value changes externally
  useEffect(() => {
    if (value.name && value.name !== searchQuery) {
      setSearchQuery(value.name)
      setIsExistingSupplier(true)
    }
  }, [value.name])

  // Check if supplier exists in database
  const checkExistingSupplier = async (name: string): Promise<SupplierData | null> => {
    try {
      const sanitizedName = sanitizeSupplierName(name)
      const response = await fetch(`/api/suppliers/${encodeURIComponent(sanitizedName)}`)
      const data = await response.json()
      if (data.success && data.supplier) {
        return {
          name: data.supplier.name,
          phone: data.supplier.phone || '',
          phoneLandline: data.supplier.phoneLandline || false,
          mobile: data.supplier.mobile || '',
          email: data.supplier.email || '',
          address: data.supplier.address || '',
          coords: data.supplier.coords,
          website: data.supplier.website || '',
          bankAccount: data.supplier.bankAccount || '',
          notes: data.supplier.notes || ''
        }
      }
    } catch (e) {
      console.error('Supplier lookup error:', e)
    }
    return null
  }

  // Save supplier to database
  const saveSupplier = async (supplier: SupplierData) => {
    try {
      // Sanitize the name for database key
      const sanitizedSupplier = {
        ...supplier,
        name: sanitizeSupplierName(supplier.name)
      }
      await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedSupplier)
      })
    } catch (e) {
      console.error('Failed to save supplier:', e)
    }
  }

  // Fetch autocomplete suggestions
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2 || !window.google?.maps?.places) {
      setSuggestions([])
      return
    }

    setIsSearching(true)

    try {
      // Create session token if needed
      if (!sessionTokenRef.current && window.google.maps.places.AutocompleteSessionToken) {
        sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken()
      }

      const response = await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: query + ' towing', // Bias towards towing companies
        sessionToken: sessionTokenRef.current || undefined,
        includedRegionCodes: ['nz']
      })

      const newSuggestions: Suggestion[] = response.suggestions
        .filter(s => s.placePrediction)
        .map(s => {
          // Get the business name - prefer structuredFormat, fallback to first part before comma
          const fullText = s.placePrediction!.text.text
          let businessName = s.placePrediction!.structuredFormat?.mainText?.text
          
          if (!businessName) {
            // Extract business name from full text (everything before first comma or the whole thing)
            businessName = fullText.split(',')[0].trim()
          }
          
          return {
            placeId: s.placePrediction!.placeId,
            mainText: businessName,
            secondaryText: s.placePrediction!.structuredFormat?.secondaryText?.text || fullText.substring(businessName.length + 1).trim(),
            fullText: fullText
          }
        })

      setSuggestions(newSuggestions)
    } catch (e) {
      console.error('Autocomplete error:', e)
      setSuggestions([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Get full place details including phone number
  const getPlaceDetails = async (placeId: string): Promise<PlaceDetails | null> => {
    if (!window.google?.maps?.places?.Place) {
      // Fallback: use Geocoder for basic info
      return new Promise((resolve) => {
        const geocoder = new window.google!.maps.Geocoder()
        geocoder.geocode({ placeId }, (results, status) => {
          if (status === window.google?.maps.GeocoderStatus.OK && results?.[0]) {
            resolve({
              name: '',
              address: results[0].formatted_address,
              coords: {
                lat: results[0].geometry.location.lat(),
                lng: results[0].geometry.location.lng()
              }
            })
          } else {
            resolve(null)
          }
        })
      })
    }

    // Use Geocoder to get address and coordinates from place ID
    // Note: Google Maps doesn't provide phone numbers via Geocoder
    // Phone numbers would require PlacesService which needs a map element
    return null
  }

  // Handle suggestion selection
  const handleSelectSuggestion = async (suggestion: Suggestion) => {
    setSearchQuery(suggestion.mainText)
    setSuggestions([])
    setShowSuggestions(false)
    setIsLoadingDetails(true)

    try {
      // FIRST: Fetch place details from Google to get proper business name and phone
      let placeDetails: {
        name?: string
        phone?: string
        website?: string
        address?: string
        coords?: { lat: number; lng: number }
      } = {}
      
      // Use new Place API to get details (phone, proper name, etc.)
      const details = await fetchPlaceDetails(suggestion.placeId)
      if (details) {
        placeDetails = details
      }
      
      // Use proper business name from Google, fallback to autocomplete text
      const businessName = placeDetails.name || suggestion.mainText
      console.log('📍 Business name:', businessName, 'Phone:', placeDetails.phone)
      
      // NOW check database with the PROPER business name
      const existing = await checkExistingSupplier(businessName)
      
      if (existing) {
        console.log('✅ Found existing supplier in database:', existing)
        
        // If existing record is missing phone/address, merge with Google data
        const needsUpdate = !existing.phone && placeDetails.phone
        if (needsUpdate) {
          console.log('📞 Updating existing supplier with Google data')
          const updated: SupplierData = {
            ...existing,
            phone: placeDetails.phone || existing.phone,
            address: existing.address || placeDetails.address || '',
            coords: existing.coords || placeDetails.coords,
            website: existing.website || placeDetails.website || ''
          }
          await saveSupplier(updated)
          setIsExistingSupplier(true)
          setSearchQuery(updated.name)
          onChange(updated)
          onSupplierLoaded?.(true)
          setIsLoadingDetails(false)
          return
        }
        
        setIsExistingSupplier(true)
        setSearchQuery(existing.name)
        onChange(existing)
        onSupplierLoaded?.(true)
        setIsLoadingDetails(false)
        return
      }
      
      // Fallback to Geocoder if PlacesService didn't get coords
      if (!placeDetails.coords && window.google?.maps?.Geocoder) {
        const geocoder = new window.google.maps.Geocoder()
        try {
          const result = await new Promise<{ lat: number; lng: number } | undefined>((resolve) => {
            geocoder.geocode({ placeId: suggestion.placeId }, (results, status) => {
              if (status === 'OK' && results?.[0]?.geometry?.location) {
                resolve({
                  lat: results[0].geometry.location.lat(),
                  lng: results[0].geometry.location.lng()
                })
              } else {
                resolve(undefined)
              }
            })
          })
          placeDetails.coords = result
        } catch {
          // Geocoding failed, continue without coords
        }
      }
      
      const newSupplier: SupplierData = {
        name: businessName,
        phone: placeDetails.phone || '',
        phoneLandline: false,
        mobile: '',
        email: '',
        address: placeDetails.address || suggestion.fullText,
        coords: placeDetails.coords,
        website: placeDetails.website || '',
        bankAccount: '',
        notes: ''
      }

      setIsExistingSupplier(false)
      setSearchQuery(businessName) // Update search field with proper name
      onChange(newSupplier)
      onSupplierLoaded?.(false)

      // Auto-save new supplier to database
      await saveSupplier(newSupplier)

      // Reset session token
      if (window.google?.maps.places?.AutocompleteSessionToken) {
        sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken()
      }
    } catch (e) {
      console.error('Selection error:', e)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  // Debounced input handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchQuery(newValue)
    setShowSuggestions(true)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(newValue)
    }, 300)
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

  // Update field
  const updateField = (field: keyof SupplierData, fieldValue: string | boolean) => {
    const updated = { ...value, [field]: fieldValue }
    onChange(updated)
    
    // Save updates to database if we have a name
    if (value.name) {
      saveSupplier(updated)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder={placeholder || "Search for towing company..."}
            className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl pl-12 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red/50"
          />
          {(isSearching || isLoadingDetails) && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 animate-spin" />
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-2 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl overflow-hidden"
          >
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.placeId}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-zinc-700/50 transition-colors flex items-start gap-3"
              >
                <Building2 className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-white font-medium truncate">{suggestion.mainText}</div>
                  {suggestion.secondaryText && (
                    <div className="text-zinc-400 text-sm truncate">{suggestion.secondaryText}</div>
                  )}
                </div>
              </button>
            ))}
            <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-700">
              <span className="text-zinc-500 text-xs">Powered by Google</span>
            </div>
          </div>
        )}
      </div>

      {/* Supplier Details Form */}
      {value.name && (
        <div className="bg-zinc-800/50 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-orange-500">
              <Building2 className="w-5 h-5" />
              <span className="font-medium">{value.name}</span>
            </div>
            {isExistingSupplier && (
              <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" />
                Existing Supplier
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Phone */}
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Phone</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="tel"
                    value={value.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white"
                    placeholder="Phone number"
                  />
                </div>
                <div 
                  onClick={() => updateField('phoneLandline', !value.phoneLandline)}
                  className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 cursor-pointer hover:bg-zinc-800 transition-colors"
                >
                  <div className={`relative w-8 h-4 rounded-full transition-colors ${value.phoneLandline ? 'bg-orange-500' : 'bg-zinc-600'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${value.phoneLandline ? 'left-4' : 'left-0.5'}`} />
                  </div>
                  <span className="text-xs text-zinc-400 whitespace-nowrap">Landline</span>
                </div>
              </div>
            </div>

            {/* Mobile (shown if landline is checked) */}
            {value.phoneLandline && (
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Mobile (for texts)</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="tel"
                    value={value.mobile || ''}
                    onChange={(e) => updateField('mobile', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white"
                    placeholder="Mobile for SMS"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  value={value.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white"
                  placeholder="Email address"
                />
              </div>
            </div>

            {/* Address */}
            <div className={value.phoneLandline ? 'md:col-span-2' : ''}>
              <label className="block text-xs text-zinc-500 mb-1">Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={value.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white"
                  placeholder="Address"
                />
              </div>
            </div>
          </div>

          {/* Website if available */}
          {value.website && (
            <div className="text-xs text-zinc-500">
              Website: <a href={value.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{value.website}</a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
