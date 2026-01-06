export interface VehicleBrand {
  slug: string
  name: string
  title: string
  description: string
  keywords: string[]
  content: string
  country: string
}

export const vehicleBrands: VehicleBrand[] = [
  {
    slug: 'toyota',
    name: 'Toyota',
    title: 'Toyota Towing',
    description: 'New Zealand\'s most popular brand. From Corollas to Land Cruisers, Hiluxes to RAV4s - we tow them all.',
    keywords: ['toyota towing', 'hilux towing', 'rav4 towing', 'corolla towing', 'land cruiser towing'],
    content: `Toyota is New Zealand's best-selling vehicle brand, and we've towed just about every model in the range. From the humble Corolla to the mighty Land Cruiser, the reliable Hilux to the family-friendly RAV4 - we handle them all with care.

Our flatbed tow trucks ensure your Toyota is transported safely, whether it's a classic or brand new. We know these vehicles and understand how to handle them properly.`,
    country: 'Japan'
  },
  {
    slug: 'ford',
    name: 'Ford',
    title: 'Ford Towing',
    description: 'Rangers, Everests, Focuses, and more. We handle all Ford models with care.',
    keywords: ['ford towing', 'ranger towing', 'everest towing', 'focus towing', 'ford falcon towing'],
    content: `Ford is a Kiwi favourite, from the hardworking Ranger to the family-friendly Everest. We've towed plenty of Fords over the years and know how to handle them properly.

Whether it's a breakdown, accident, or you just need your Ford moved - we've got the equipment and experience to do it right.`,
    country: 'USA'
  },
  {
    slug: 'mazda',
    name: 'Mazda',
    title: 'Mazda Towing',
    description: 'From the iconic MX-5 to the family-friendly CX-9, we tow all Mazdas.',
    keywords: ['mazda towing', 'cx-5 towing', 'cx-9 towing', 'mx-5 towing', 'mazda3 towing'],
    content: `Mazda's beautiful designs and driving dynamics have made them popular in New Zealand. From the sporty MX-5 to the practical CX-5, we handle all Mazda models.

Lowered Mazdas? We've got flatbeds with low-angle ramps. Performance models? We treat them with the respect they deserve.`,
    country: 'Japan'
  },
  {
    slug: 'honda',
    name: 'Honda',
    title: 'Honda Towing',
    description: 'Civics, Accords, CR-Vs, and Jazz. Honda reliability deserves reliable towing.',
    keywords: ['honda towing', 'civic towing', 'accord towing', 'cr-v towing', 'jazz towing'],
    content: `Honda's reputation for reliability is well-earned, but even the most reliable car can have problems. When your Honda needs a tow, we're here to help.

From the zippy Jazz to the practical CR-V, the sporty Civic to the comfortable Accord - we tow all Honda models safely.`,
    country: 'Japan'
  },
  {
    slug: 'nissan',
    name: 'Nissan',
    title: 'Nissan Towing',
    description: 'X-Trails, Pathfinders, Leafs, and Navaras. We handle all Nissan models including EVs.',
    keywords: ['nissan towing', 'x-trail towing', 'navara towing', 'leaf towing', 'pathfinder towing'],
    content: `Nissan has a strong presence in New Zealand, from the reliable X-Trail to the hardworking Navara. We also handle the electric Leaf - yes, we can tow EVs safely!

Our drivers understand the different requirements for Nissan's diverse range, from SUVs to utes to electric vehicles.`,
    country: 'Japan'
  },
  {
    slug: 'subaru',
    name: 'Subaru',
    title: 'Subaru Towing',
    description: 'Foresters, Outbacks, Imprezas, and WRXs. AWD specialists - we know how to tow Subarus properly.',
    keywords: ['subaru towing', 'forester towing', 'outback towing', 'wrx towing', 'impreza towing'],
    content: `Subaru's all-wheel-drive system requires proper towing technique. We use flatbed trucks exclusively for Subarus to avoid any potential drivetrain damage that can occur with traditional towing.

From the family Forester to the sporty WRX, the adventure-ready Outback to the classic Impreza - we handle all Subarus with the care they deserve.`,
    country: 'Japan'
  },
  {
    slug: 'bmw',
    name: 'BMW',
    title: 'BMW Towing',
    description: 'The Ultimate Driving Machine deserves ultimate care. Flatbed towing for all BMW models.',
    keywords: ['bmw towing', '3 series towing', 'x5 towing', 'm3 towing', 'bmw breakdown'],
    content: `BMW's precision engineering demands careful handling. We exclusively use flatbed trucks for BMW towing to ensure your vehicle arrives exactly as we found it.

From the sporty 3 Series to the practical X5, the performance M cars to the electric i range - we have experience with the full BMW lineup.`,
    country: 'Germany'
  },
  {
    slug: 'mercedes',
    name: 'Mercedes-Benz',
    title: 'Mercedes-Benz Towing',
    description: 'Luxury demands luxury service. From A-Class to S-Class - we handle Mercedes with care.',
    keywords: ['mercedes towing', 'mercedes-benz towing', 'c class towing', 'e class towing', 'amg towing'],
    content: `Mercedes-Benz represents the pinnacle of automotive luxury, and we treat every Mercedes accordingly. Flatbed transport, careful handling, and professional service.

From the compact A-Class to the flagship S-Class, the practical GLC to the performance AMG models - your Mercedes is in safe hands.`,
    country: 'Germany'
  },
  {
    slug: 'audi',
    name: 'Audi',
    title: 'Audi Towing',
    description: 'Vorsprung durch Technik requires expert handling. Q5s, Q7s, A4s, and RS models.',
    keywords: ['audi towing', 'q5 towing', 'q7 towing', 'a4 towing', 'rs towing'],
    content: `Audi's quattro all-wheel-drive system and sophisticated electronics require proper care during towing. We use flatbed trucks exclusively to avoid any potential issues.

Whether it's a practical A4, a family Q5, a luxury Q7, or a high-performance RS model - we have the experience and equipment to handle your Audi safely.`,
    country: 'Germany'
  },
  {
    slug: 'volkswagen',
    name: 'Volkswagen',
    title: 'Volkswagen Towing',
    description: 'Golfs, Tiguans, Touaregs, and Transporters. German engineering deserves careful handling.',
    keywords: ['volkswagen towing', 'vw towing', 'golf towing', 'tiguan towing', 'touareg towing'],
    content: `Volkswagen has a loyal following in New Zealand, from the iconic Golf to the practical Tiguan. We tow all VW models with the care German engineering deserves.

From hatchbacks to SUVs, vans to performance GTI models - we've handled them all.`,
    country: 'Germany'
  },
  {
    slug: 'hyundai',
    name: 'Hyundai',
    title: 'Hyundai Towing',
    description: 'Tucson, Santa Fe, i30, Kona - including Hyundai\'s growing EV range.',
    keywords: ['hyundai towing', 'tucson towing', 'santa fe towing', 'i30 towing', 'ioniq towing'],
    content: `Hyundai has become a major player in New Zealand, with stylish designs and impressive value. From the popular Tucson to the electric Ioniq range, we handle all Hyundai models.

Our drivers are trained to handle Hyundai's electric and hybrid vehicles safely and correctly.`,
    country: 'Korea'
  },
  {
    slug: 'kia',
    name: 'Kia',
    title: 'Kia Towing',
    description: 'Sportage, Seltos, Sorento, Carnival - Kia\'s quality range deserves quality towing.',
    keywords: ['kia towing', 'sportage towing', 'seltos towing', 'sorento towing', 'carnival towing'],
    content: `Kia's transformation into a premium brand is reflected in their excellent warranty and quality vehicles. We treat every Kia with the same care regardless of age or model.

From the compact Seltos to the family Sorento, the sporty Stinger to the practical Carnival - we're here for all Kia owners.`,
    country: 'Korea'
  },
  {
    slug: 'mitsubishi',
    name: 'Mitsubishi',
    title: 'Mitsubishi Towing',
    description: 'Outlanders, Pajeros, Tritons, and ASX. Built for New Zealand conditions.',
    keywords: ['mitsubishi towing', 'outlander towing', 'pajero towing', 'triton towing', 'asx towing'],
    content: `Mitsubishi has a strong heritage in New Zealand, from the legendary Pajero to the practical Triton. These vehicles are built tough, and we handle them with respect.

Whether it's a farm Triton, a family Outlander, or a city ASX - we've got you covered.`,
    country: 'Japan'
  },
  {
    slug: 'holden',
    name: 'Holden',
    title: 'Holden Towing',
    description: 'Commodores, Colorados, Captivas - keeping Kiwi Holdens on the road.',
    keywords: ['holden towing', 'commodore towing', 'colorado towing', 'captiva towing'],
    content: `Though Holden has stopped production, there are plenty of Commodores, Colorados, and Captivas still on New Zealand roads. We're here to help keep them going.

From V8 Commodores to workhorse Colorados, we have experience with the full Holden range.`,
    country: 'Australia'
  },
  {
    slug: 'suzuki',
    name: 'Suzuki',
    title: 'Suzuki Towing',
    description: 'Swifts, Vitaras, Jimnys - compact to capable, we tow all Suzukis.',
    keywords: ['suzuki towing', 'swift towing', 'vitara towing', 'jimny towing'],
    content: `Suzuki makes everything from the zippy Swift to the cult-favourite Jimny. Whatever Suzuki you drive, we can help when things go wrong.

These nimble vehicles are easy to load and transport, and we take care of them like our own.`,
    country: 'Japan'
  },
  {
    slug: 'jeep',
    name: 'Jeep',
    title: 'Jeep Towing',
    description: 'Wranglers, Grand Cherokees, Compass - built for adventure, sometimes they need a hand.',
    keywords: ['jeep towing', 'wrangler towing', 'grand cherokee towing', 'compass towing'],
    content: `Jeeps are built for adventure, but sometimes adventures go sideways. When your Jeep needs rescue - whether from a beach, bush track, or just a breakdown - we're ready.

Our trucks can handle everything from the compact Compass to the iconic Wrangler and the luxury Grand Cherokee.`,
    country: 'USA'
  },
  {
    slug: 'lexus',
    name: 'Lexus',
    title: 'Lexus Towing',
    description: 'Toyota\'s luxury division demands premium service. RX, NX, IS, LS models.',
    keywords: ['lexus towing', 'rx towing', 'nx towing', 'is towing', 'ls towing'],
    content: `Lexus represents Japanese luxury at its finest, and we treat every Lexus accordingly. Flatbed transport, careful handling, and premium service.

From the popular RX to the sporty IS, the practical NX to the flagship LS - your Lexus will be handled with care.`,
    country: 'Japan'
  },
  {
    slug: 'isuzu',
    name: 'Isuzu',
    title: 'Isuzu Towing',
    description: 'D-Max and MU-X - hardworking vehicles that sometimes need a tow home.',
    keywords: ['isuzu towing', 'd-max towing', 'mu-x towing', 'isuzu truck towing'],
    content: `Isuzu makes tough, reliable vehicles - the D-Max and MU-X are favourites with Kiwi tradies and families. When they need help, we're here.

These robust vehicles are built to work hard, and we respect that when we handle them.`,
    country: 'Japan'
  },
]

export function getBrandBySlug(slug: string): VehicleBrand | undefined {
  return vehicleBrands.find(b => b.slug === slug)
}

export function getAllBrands(): VehicleBrand[] {
  return vehicleBrands
}
