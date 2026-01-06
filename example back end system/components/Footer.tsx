'use client'

import Link from 'next/link'
import Logo from './Logo'

export default function Footer() {
  // Waikato - Core Coverage (Home Base)
  const waikatoCore = [
    { name: 'Hamilton', slug: 'hamilton' },
    { name: 'Cambridge', slug: 'cambridge' },
    { name: 'Te Awamutu', slug: 'te-awamutu' },
    { name: 'Morrinsville', slug: 'morrinsville' },
    { name: 'Matamata', slug: 'matamata' },
    { name: 'Huntly', slug: 'huntly' },
  ]

  const waikatoExtended = [
    { name: 'Ngaruawahia', slug: 'ngaruawahia' },
    { name: 'Raglan', slug: 'raglan' },
    { name: 'Te Aroha', slug: 'te-aroha' },
    { name: 'Tokoroa', slug: 'tokoroa' },
    { name: 'Putaruru', slug: 'putaruru' },
    { name: 'Tirau', slug: 'tirau' },
  ]

  const waikatoRural = [
    { name: 'Taupo', slug: 'taupo' },
    { name: 'Otorohanga', slug: 'otorohanga' },
    { name: 'Te Kuiti', slug: 'te-kuiti' },
    { name: 'Thames', slug: 'thames' },
    { name: 'Paeroa', slug: 'paeroa' },
  ]

  // Auckland Region
  const aucklandLocations = [
    { name: 'Auckland', slug: 'auckland' },
    { name: 'North Shore', slug: 'north-shore' },
    { name: 'Manukau', slug: 'manukau' },
    { name: 'Pukekohe', slug: 'pukekohe' },
  ]

  // Wellington Region
  const wellingtonLocations = [
    { name: 'Wellington', slug: 'wellington' },
    { name: 'Lower Hutt', slug: 'lower-hutt' },
    { name: 'Upper Hutt', slug: 'upper-hutt' },
    { name: 'Porirua', slug: 'porirua' },
  ]

  // Canterbury Region
  const canterburyLocations = [
    { name: 'Christchurch', slug: 'christchurch' },
    { name: 'Rangiora', slug: 'rangiora' },
    { name: 'Rolleston', slug: 'rolleston' },
    { name: 'Ashburton', slug: 'ashburton' },
  ]

  // Bay of Plenty & Rotorua
  const bayOfPlentyLocations = [
    { name: 'Tauranga', slug: 'tauranga' },
    { name: 'Rotorua', slug: 'rotorua' },
  ]

  // Hawkes Bay
  const hawkesBayLocations = [
    { name: 'Napier', slug: 'napier' },
    { name: 'Hastings', slug: 'hastings' },
  ]

  // Other North Island
  const otherNorthIsland = [
    { name: 'Palmerston North', slug: 'palmerston-north' },
    { name: 'Whanganui', slug: 'whanganui' },
    { name: 'New Plymouth', slug: 'new-plymouth' },
    { name: 'Whangarei', slug: 'whangarei' },
  ]

  // South Island (excluding Canterbury)
  const southIsland = [
    { name: 'Dunedin', slug: 'dunedin' },
    { name: 'Queenstown', slug: 'queenstown' },
    { name: 'Invercargill', slug: 'invercargill' },
    { name: 'Nelson', slug: 'nelson' },
    { name: 'Blenheim', slug: 'blenheim' },
    { name: 'Greymouth', slug: 'greymouth' },
  ]

  // Eek Mechanical Services
  const services = [
    { name: 'Wrong Fuel', slug: 'wrong-fuel' },
    { name: 'Misfuel Repair', slug: 'misfuel-repair' },
    { name: 'Fuel Extraction', slug: 'fuel-extraction' },
    { name: 'Flat Battery', slug: 'flat-battery' },
    { name: 'Breakdowns', slug: 'breakdowns' },
    { name: 'Mobile Mechanic', slug: 'mobile-mechanic' },
    { name: 'After Hours', slug: 'after-hours' },
    { name: 'Roadside Assist', slug: 'roadside-assist' },
  ]

  const vehicleBrands = [
    { name: 'Toyota', slug: 'toyota' },
    { name: 'Ford', slug: 'ford' },
    { name: 'Mazda', slug: 'mazda' },
    { name: 'Honda', slug: 'honda' },
    { name: 'Subaru', slug: 'subaru' },
    { name: 'BMW', slug: 'bmw' },
    { name: 'Mercedes', slug: 'mercedes' },
    { name: 'Audi', slug: 'audi' },
    { name: 'VW', slug: 'volkswagen' },
    { name: 'Hyundai', slug: 'hyundai' },
    { name: 'Kia', slug: 'kia' },
    { name: 'Nissan', slug: 'nissan' },
  ]

  const resources = [
    { name: 'Real Stories', href: '/stories' },
    { name: 'All Locations', href: '/locations' },
    { name: 'All Vehicles', href: '/vehicles' },
    { name: 'Help Articles', href: '/help' },
  ]

  return (
    <footer className="border-t border-zinc-900 py-16 mt-auto bg-black">
      <div className="max-w-7xl mx-auto px-6">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Logo className="w-6 h-6" animated={false} />
              <span className="font-display font-bold">Eek</span>
            </Link>
            <p className="text-zinc-600 text-sm mb-4">
              24/7 mobile mechanics across New Zealand.<br />
              NZIFDA Certified Misfuel Services Nationwide.
            </p>
            <a 
              href="tel:0800769000" 
              className="text-red font-semibold hover:underline text-lg"
            >
              0800 769 000
            </a>
          </div>

          {/* Waikato Core */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-zinc-400">Waikato</h4>
            <ul className="space-y-2">
              {waikatoCore.map(town => (
                <li key={town.slug}>
                  <Link 
                    href={`/${town.slug}`}
                    className="text-zinc-600 hover:text-white text-sm transition-colors"
                  >
                    {town.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Waikato Extended */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-zinc-400">More Waikato</h4>
            <ul className="space-y-2">
              {waikatoExtended.map(town => (
                <li key={town.slug}>
                  <Link 
                    href={`/${town.slug}`}
                    className="text-zinc-600 hover:text-white text-sm transition-colors"
                  >
                    {town.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Auckland */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-zinc-400">Auckland</h4>
            <ul className="space-y-2">
              {aucklandLocations.map(city => (
                <li key={city.slug}>
                  <Link 
                    href={`/${city.slug}`}
                    className="text-zinc-600 hover:text-white text-sm transition-colors"
                  >
                    {city.name}
                  </Link>
                </li>
              ))}
            </ul>
            <h4 className="font-semibold text-sm mb-3 mt-6 text-zinc-400">Bay of Plenty</h4>
            <ul className="space-y-2">
              {bayOfPlentyLocations.map(city => (
                <li key={city.slug}>
                  <Link 
                    href={`/${city.slug}`}
                    className="text-zinc-600 hover:text-white text-sm transition-colors"
                  >
                    {city.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Wellington & Canterbury */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-zinc-400">Wellington</h4>
            <ul className="space-y-2">
              {wellingtonLocations.map(city => (
                <li key={city.slug}>
                  <Link 
                    href={`/${city.slug}`}
                    className="text-zinc-600 hover:text-white text-sm transition-colors"
                  >
                    {city.name}
                  </Link>
                </li>
              ))}
            </ul>
            <h4 className="font-semibold text-sm mb-3 mt-6 text-zinc-400">Canterbury</h4>
            <ul className="space-y-2">
              {canterburyLocations.map(city => (
                <li key={city.slug}>
                  <Link 
                    href={`/${city.slug}`}
                    className="text-zinc-600 hover:text-white text-sm transition-colors"
                  >
                    {city.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Extended Locations Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-12 pt-8 border-t border-zinc-900">
          {/* Waikato Rural */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-zinc-400">King Country</h4>
            <ul className="space-y-2">
              {waikatoRural.map(town => (
                <li key={town.slug}>
                  <Link 
                    href={`/${town.slug}`}
                    className="text-zinc-600 hover:text-white text-sm transition-colors"
                  >
                    {town.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Hawkes Bay */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-zinc-400">Hawkes Bay</h4>
            <ul className="space-y-2">
              {hawkesBayLocations.map(city => (
                <li key={city.slug}>
                  <Link 
                    href={`/${city.slug}`}
                    className="text-zinc-600 hover:text-white text-sm transition-colors"
                  >
                    {city.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Other North Island */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-zinc-400">North Island</h4>
            <ul className="space-y-2">
              {otherNorthIsland.map(city => (
                <li key={city.slug}>
                  <Link 
                    href={`/${city.slug}`}
                    className="text-zinc-600 hover:text-white text-sm transition-colors"
                  >
                    {city.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* South Island */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-zinc-400">South Island</h4>
            <ul className="space-y-2">
              {southIsland.map(city => (
                <li key={city.slug}>
                  <Link 
                    href={`/${city.slug}`}
                    className="text-zinc-600 hover:text-white text-sm transition-colors"
                  >
                    {city.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-zinc-400">Services</h4>
            <ul className="space-y-2">
              {services.map(service => (
                <li key={service.slug}>
                  <Link 
                    href={`/services/${service.slug}`}
                    className="text-zinc-600 hover:text-white text-sm transition-colors"
                  >
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Vehicle Brands */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-zinc-400">Vehicle Brands</h4>
            <ul className="space-y-2">
              {vehicleBrands.slice(0, 6).map(brand => (
                <li key={brand.slug}>
                  <Link 
                    href={`/vehicles/${brand.slug}`}
                    className="text-zinc-600 hover:text-white text-sm transition-colors"
                  >
                    {brand.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link 
                  href="/vehicles"
                  className="text-red hover:text-red-light text-sm transition-colors"
                >
                  All Brands →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* More Vehicle Brands */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-12 pt-8 border-t border-zinc-900">
          {vehicleBrands.slice(6).map(brand => (
            <Link 
              key={brand.slug}
              href={`/vehicles/${brand.slug}`}
              className="text-zinc-600 hover:text-white text-sm transition-colors"
            >
              {brand.name}
            </Link>
          ))}
          <Link 
            href="/vehicles"
            className="text-red hover:text-red-light text-sm transition-colors"
          >
            View All →
          </Link>
        </div>

        {/* Resources Row */}
        <div className="flex flex-wrap gap-6 mb-12 pt-8 border-t border-zinc-900">
          {resources.map(resource => (
            <Link 
              key={resource.href}
              href={resource.href}
              className="text-zinc-500 hover:text-white text-sm transition-colors"
            >
              {resource.name}
            </Link>
          ))}
        </div>

        <div className="border-t border-zinc-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-zinc-700 text-xs" suppressHydrationWarning>
            © {new Date().getFullYear()} Eek Mobile Mechanical Ltd. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-zinc-700 hover:text-zinc-500 text-xs transition-colors">Privacy</Link>
            <Link href="/terms" className="text-zinc-700 hover:text-zinc-500 text-xs transition-colors">Terms</Link>
            <Link href="/supplier" className="text-zinc-700 hover:text-zinc-500 text-xs transition-colors">Become a Supplier</Link>
            <Link href="/login" className="text-zinc-700 hover:text-zinc-500 text-xs transition-colors">Supplier Login</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
