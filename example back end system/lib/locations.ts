// All NZ locations with heavy Waikato coverage (home base)
// Case studies feature premium vehicles - no heavy truck recoveries

export interface Location {
  slug: string
  name: string
  region: string
  description: string
  keywords: string[]
  nearby: string[]
  caseStudy?: {
    title: string
    vehicle: string
    problem: string
    solution: string
    time: string
  }
}

// WAIKATO - Heavy coverage (home base)
export const waikatoLocations: Location[] = [
  {
    slug: 'hamilton',
    name: 'Hamilton',
    region: 'Waikato',
    description: 'Hamilton\'s trusted towing service - your neighbours in the heart of the Waikato. From Garden Place to The Base, Rototuna to Hillcrest, we know every street. Whether you\'re stuck near Waikato Stadium, broken down on Anglesea Street, or need help at Hamilton Gardens - we\'re there fast. Home base means fastest response times.',
    keywords: ['hamilton towing', 'tow truck hamilton', 'hamilton breakdown', 'waikato towing', 'hamilton cbd towing'],
    nearby: ['Cambridge', 'Te Awamutu', 'Ngaruawahia', 'Huntly', 'Morrinsville'],
    caseStudy: {
      title: 'CBD Underground Parking Recovery',
      vehicle: 'BMW X5',
      problem: 'BMW X5 broke down in level 3 underground parking on Victoria Street. Tight corners, low clearance.',
      solution: 'Compact flatbed navigated the parking structure. Vehicle extracted without a scratch, delivered to BMW Hamilton.',
      time: '45 minutes'
    }
  },
  {
    slug: 'cambridge',
    name: 'Cambridge',
    region: 'Waikato',
    description: 'Cambridge towing - the Town of Trees and Champions. From the historic Victoria Street to Lake Karapiro\'s rowing facilities, Leamington to St Peter\'s School. We know the equestrian country roads, the Avantidrome area, and every corner of this beautiful town. Perfect for horse float emergencies too.',
    keywords: ['cambridge towing', 'tow truck cambridge', 'cambridge nz towing', 'karapiro towing'],
    nearby: ['Hamilton', 'Te Awamutu', 'Morrinsville', 'Matamata', 'Tirau'],
    caseStudy: {
      title: 'Equestrian Event Recovery',
      vehicle: 'Toyota Land Cruiser 300',
      problem: 'Land Cruiser 300 with horse float got stuck on soft ground at Mystery Creek.',
      solution: 'Careful extraction to protect the vehicle. Float and horses safe. Owner back on road same day.',
      time: '55 minutes'
    }
  },
  {
    slug: 'te-awamutu',
    name: 'Te Awamutu',
    region: 'Waikato',
    description: 'Te Awamutu towing - the Rosetown. Home of the Finn brothers and some of the best dairy country in New Zealand. From the famous rose gardens to Kihikihi\'s historic racing club, Pirongia village to the rural back roads. We understand farming life and early morning callouts.',
    keywords: ['te awamutu towing', 'tow truck te awamutu', 'kihikihi towing', 'ta towing'],
    nearby: ['Hamilton', 'Cambridge', 'Otorohanga', 'Pirongia', 'Ohaupo'],
    caseStudy: {
      title: 'Rural Road Breakdown',
      vehicle: 'Toyota Prado',
      problem: 'Prado broke down on a rural road after water crossing damaged electrics.',
      solution: 'Located via GPS coordinates. Flatbed recovery to local Toyota dealer.',
      time: '40 minutes'
    }
  },
  {
    slug: 'morrinsville',
    name: 'Morrinsville',
    region: 'Waikato',
    description: 'Morrinsville towing - the heart of NZ\'s dairy industry. Home to more cows than people and proud of it. From the famous Mega Cow to Fonterra\'s headquarters area, the main street to the surrounding farms. We know the early morning farm runs and the rural roads like the back of our hand.',
    keywords: ['morrinsville towing', 'tow truck morrinsville', 'morrinsville breakdown'],
    nearby: ['Hamilton', 'Cambridge', 'Te Aroha', 'Matamata', 'Waitoa'],
    caseStudy: {
      title: 'Early Morning Farm Call',
      vehicle: 'Ford Ranger Wildtrak',
      problem: 'Ranger wouldn\'t start at 4am. Owner needed it for stock movement.',
      solution: 'Night callout. Vehicle towed to mechanic, ready by 9am.',
      time: '25 minutes response'
    }
  },
  {
    slug: 'matamata',
    name: 'Matamata',
    region: 'Waikato',
    description: 'Matamata towing - welcome to Hobbiton country. Where Middle-earth meets the Waikato. From the movie set tours to the thoroughbred studs, Waharoa village to the base of the Kaimai Ranges. Tourist breakdowns, film crew vehicles, and local farmers - we\'ve helped them all.',
    keywords: ['matamata towing', 'tow truck matamata', 'hobbiton towing', 'waharoa towing'],
    nearby: ['Cambridge', 'Morrinsville', 'Te Aroha', 'Tirau', 'Rotorua'],
    caseStudy: {
      title: 'Tourist Vehicle Breakdown',
      vehicle: 'Mercedes-Benz V-Class',
      problem: 'Tour operator\'s V-Class broke down near Hobbiton with guests aboard.',
      solution: 'Quick response. Arranged replacement vehicle for guests. Mercedes towed to dealer.',
      time: '22 minutes'
    }
  },
  {
    slug: 'huntly',
    name: 'Huntly',
    region: 'Waikato',
    description: 'Huntly towing - the coal town on the Waikato River. Strategic position on the Waikato Expressway means we\'re perfectly placed for highway emergencies. Covering Ohinewai, Te Kauwhata, Rangiriri, and Taupiri. From the power station to the expressway on-ramps, we\'ve got Huntly covered.',
    keywords: ['huntly towing', 'tow truck huntly', 'huntly breakdown', 'waikato expressway towing'],
    nearby: ['Hamilton', 'Ngaruawahia', 'Te Kauwhata', 'Rangiriri', 'Taupiri'],
    caseStudy: {
      title: 'Expressway Breakdown',
      vehicle: 'Audi Q7',
      problem: 'Q7 lost power on Waikato Expressway. Family stranded in breakdown lane.',
      solution: 'On scene in 15 minutes. Flatbed recovery to Audi dealer in Hamilton.',
      time: '15 minutes response'
    }
  },
  {
    slug: 'ngaruawahia',
    name: 'Ngaruawahia',
    region: 'Waikato',
    description: 'Ngaruawahia towing - where the Waikato and Waipa rivers meet. The home of the Māori King and Tūrangawaewae Marae. From the historic bridge to Horotiu\'s industrial area, the Huntly road to Taupiri Mountain. River town knowledge for tricky boat ramp situations.',
    keywords: ['ngaruawahia towing', 'tow truck ngaruawahia', 'horotiu towing', 'taupiri towing'],
    nearby: ['Hamilton', 'Huntly', 'Raglan', 'Te Kowhai', 'Whatawhata'],
    caseStudy: {
      title: 'Boat Ramp Recovery',
      vehicle: 'Toyota Hilux SR5',
      problem: 'Hilux slipped on wet boat ramp. Vehicle and boat in precarious position.',
      solution: 'Careful winch recovery. Vehicle and boat saved from water damage.',
      time: '35 minutes'
    }
  },
  {
    slug: 'raglan',
    name: 'Raglan',
    region: 'Waikato',
    description: 'Raglan towing - legendary surf, legendary service. From Manu Bay\'s world-class left-hander to Whale Bay, the harbour to Te Uku. We know the coastal roads, the beach parking challenges, and the winding route back to Hamilton. Surfboard-friendly recoveries our specialty.',
    keywords: ['raglan towing', 'tow truck raglan', 'raglan beach towing', 'raglan breakdown'],
    nearby: ['Hamilton', 'Ngaruawahia', 'Te Uku', 'Whatawhata', 'Kawhia'],
    caseStudy: {
      title: 'Beach Carpark Stuck',
      vehicle: 'Porsche Cayenne',
      problem: 'Cayenne stuck in soft sand at Manu Bay. Owner tried to get closer to the surf break.',
      solution: 'Beach recovery unit. Extracted before tide came in. No damage.',
      time: '28 minutes'
    }
  },
  {
    slug: 'te-aroha',
    name: 'Te Aroha',
    region: 'Waikato',
    description: 'Te Aroha towing - at the foot of the sacred mountain. Famous for its hot springs, the historic domain, and stunning Kaimai bush walks. From the main street to the mountain road, Waihou valley to the Karangahake Gorge side. Small town values, big city service.',
    keywords: ['te aroha towing', 'tow truck te aroha', 'te aroha breakdown'],
    nearby: ['Morrinsville', 'Matamata', 'Paeroa', 'Thames', 'Waihi'],
    caseStudy: {
      title: 'Mountain Road Recovery',
      vehicle: 'Lexus LX',
      problem: 'LX slid on gravel on Te Aroha Mountain road. Stuck against bank.',
      solution: 'Winch recovery. Vehicle brought back to road safely, no panel damage.',
      time: '45 minutes'
    }
  },
  {
    slug: 'tokoroa',
    name: 'Tokoroa',
    region: 'Waikato',
    description: 'Tokoroa towing - the timber town of South Waikato. Built on forestry and proud of its multicultural heritage. From the Talking Poles to the industrial forestry areas, Kinleith mill to the Mamaku Plateau edge. We understand remote forestry road recoveries.',
    keywords: ['tokoroa towing', 'tow truck tokoroa', 'south waikato towing', 'putaruru towing'],
    nearby: ['Putaruru', 'Tirau', 'Taupo', 'Rotorua', 'Mangakino'],
    caseStudy: {
      title: 'Forest Road Breakdown',
      vehicle: 'Mazda BT-50',
      problem: 'BT-50 timing belt failure on forestry road. No cell coverage.',
      solution: 'Located via last known position. Recovered to Tokoroa mechanic.',
      time: '1 hour'
    }
  },
  {
    slug: 'putaruru',
    name: 'Putaruru',
    region: 'Waikato',
    description: 'Putaruru towing - gateway to the Blue Spring and timber country. Home to some of New Zealand\'s purest water and the Te Waihou Walkway. From the main street to the forestry blocks, the blue spring carpark to the surrounding rural roads. Small town, reliable service.',
    keywords: ['putaruru towing', 'tow truck putaruru', 'putaruru breakdown'],
    nearby: ['Tokoroa', 'Tirau', 'Matamata', 'Rotorua', 'Taupo'],
  },
  {
    slug: 'tirau',
    name: 'Tirau',
    region: 'Waikato',
    description: 'Tirau towing - the corrugated iron capital of New Zealand. Famous for the sheep and dog buildings, antique shops, and the SH1/SH5 junction. Strategic position means we handle highway breakdowns from the Rotorua turn-off to the Taupo direction. Quick clearance, less disruption.',
    keywords: ['tirau towing', 'tow truck tirau', 'tirau breakdown', 'sh1 towing'],
    nearby: ['Cambridge', 'Matamata', 'Putaruru', 'Rotorua', 'Tokoroa'],
    caseStudy: {
      title: 'Highway Junction Breakdown',
      vehicle: 'Volkswagen Touareg',
      problem: 'Touareg broke down at SH1/SH5 intersection. Blocking traffic.',
      solution: 'Rapid response. Cleared intersection in under 20 minutes.',
      time: '18 minutes'
    }
  },
  {
    slug: 'otorohanga',
    name: 'Otorohanga',
    region: 'Waikato',
    description: 'Otorohanga towing - the Kiwiana capital of New Zealand. Home of the kiwi house and gateway to Waitomo Caves. From Ed Hillary Walkway to the famous corrugated iron kiwi, the caves road to the King Country beyond. Tourist-savvy service for visitors exploring the underground wonders.',
    keywords: ['otorohanga towing', 'tow truck otorohanga', 'waitomo towing', 'king country towing'],
    nearby: ['Te Awamutu', 'Te Kuiti', 'Waitomo', 'Kawhia', 'Piopio'],
    caseStudy: {
      title: 'Waitomo Caves Tourist',
      vehicle: 'Range Rover Sport',
      problem: 'Range Rover electrical fault on Waitomo Caves Road. Family missing glowworm tour.',
      solution: 'Fast response. Arranged taxi for family to make their tour. Vehicle to dealer.',
      time: '25 minutes'
    }
  },
  {
    slug: 'te-kuiti',
    name: 'Te Kuiti',
    region: 'Waikato',
    description: 'Te Kuiti towing - the shearing capital of the world. Home of the Great NZ Muster and the famous shearer statue. Gateway to the rugged King Country. From the main street to the limestone country, Waitomo to Piopio. Rural towing expertise for farming communities.',
    keywords: ['te kuiti towing', 'tow truck te kuiti', 'king country towing'],
    nearby: ['Otorohanga', 'Waitomo', 'Piopio', 'Benneydale', 'Taumarunui'],
  },
  {
    slug: 'thames',
    name: 'Thames',
    region: 'Waikato',
    description: 'Thames towing - gateway to the Coromandel Peninsula. Historic gold mining town with Victorian character. From Pollen Street to the Firth of Thames, the coastal road to Coromandel town. We know the winding 309 Road, the Kopu bridge, and every beachside breakdown spot.',
    keywords: ['thames towing', 'tow truck thames', 'thames breakdown', 'coromandel towing'],
    nearby: ['Paeroa', 'Te Aroha', 'Coromandel', 'Whitianga', 'Waihi'],
    caseStudy: {
      title: 'Coromandel Road Overheat',
      vehicle: 'Mercedes-Benz GLE',
      problem: 'GLE overheated on winding Thames-Coromandel road.',
      solution: 'Flatbed recovery to Thames. Coolant system repaired same day.',
      time: '30 minutes'
    }
  },
  {
    slug: 'paeroa',
    name: 'Paeroa',
    region: 'Waikato',
    description: 'Paeroa towing - home of the world famous L&P. From the giant bottle to the Karangahake Gorge cycling trail, the Ohinemuri River to the antique shops. Covering Waihi, the gorge walk carparks, and the historic mining areas. Cyclist-friendly breakdown service.',
    keywords: ['paeroa towing', 'tow truck paeroa', 'waihi towing', 'karangahake towing'],
    nearby: ['Thames', 'Te Aroha', 'Waihi', 'Katikati', 'Morrinsville'],
  },
  {
    slug: 'taupo',
    name: 'Taupo',
    region: 'Waikato',
    description: 'Taupo towing - beside the great lake. From the famous Hole in One to Huka Falls, the lakefront to the Desert Road. Adventure capital breakdowns - skydiving vans, bungy buses, fishing boats. We know the Turangi road, the thermal areas, and the mountain routes.',
    keywords: ['taupo towing', 'tow truck taupo', 'taupo breakdown', 'desert road towing', 'turangi towing'],
    nearby: ['Tokoroa', 'Rotorua', 'Turangi', 'Mangakino', 'Reporoa'],
    caseStudy: {
      title: 'Desert Road Snow Recovery',
      vehicle: 'BMW X3',
      problem: 'X3 slid off Desert Road in winter conditions. Family stranded in cold.',
      solution: 'Recovery in challenging conditions. Family warmed in cab during extraction.',
      time: '50 minutes'
    }
  },
]

// OTHER NZ REGIONS
export const aucklandLocations: Location[] = [
  {
    slug: 'auckland',
    name: 'Auckland',
    region: 'Auckland',
    description: 'Auckland towing - New Zealand\'s biggest city, fully covered. From Queen Street to the Sky Tower, Ponsonby to Parnell, Grey Lynn to Mt Eden. We navigate the motorway network, know the CBD parking buildings, and handle everything from the Harbour Bridge to the Airport. City of Sails, city of solutions.',
    keywords: ['auckland towing', 'tow truck auckland', 'auckland breakdown', 'north shore towing', 'south auckland towing'],
    nearby: ['North Shore', 'Manukau', 'Waitakere', 'Pukekohe', 'Papakura'],
    caseStudy: {
      title: 'Harbour Bridge Breakdown',
      vehicle: 'Tesla Model X',
      problem: 'Model X lost power on Auckland Harbour Bridge during morning commute.',
      solution: 'Rapid response coordinated with NZTA. Flatbed recovery to Tesla service.',
      time: '18 minutes'
    }
  },
  {
    slug: 'north-shore',
    name: 'North Shore',
    region: 'Auckland',
    description: 'North Shore towing - from the Harbour Bridge to the Hibiscus Coast. Takapuna\'s beaches, Albany\'s shopping centres, Devonport\'s historic charm, Browns Bay\'s cafes. We know the busway routes, the beach parking, and the best ways around Shore traffic. Northern motorway experts.',
    keywords: ['north shore towing', 'takapuna towing', 'albany towing', 'devonport towing'],
    nearby: ['Auckland CBD', 'Albany', 'Takapuna', 'Browns Bay', 'Orewa'],
    caseStudy: {
      title: 'Takapuna Beach Carpark',
      vehicle: 'Audi e-tron',
      problem: 'e-tron wouldn\'t start after beach day. Battery management system fault.',
      solution: 'Flatbed to Audi North Shore. Courtesy car arranged for owner.',
      time: '22 minutes'
    }
  },
  {
    slug: 'manukau',
    name: 'Manukau',
    region: 'Auckland',
    description: 'Manukau and South Auckland towing - the diverse heart of Auckland. Westfield Manukau, Rainbow\'s End, the airport corridor. Otara markets to Mangere Bridge, Papatoetoe to Flat Bush. We understand this community and provide fast, respectful service across all of South Auckland.',
    keywords: ['manukau towing', 'south auckland towing', 'otara towing', 'mangere towing'],
    nearby: ['Auckland', 'Papakura', 'Botany', 'Airport', 'Pukekohe'],
  },
  {
    slug: 'pukekohe',
    name: 'Pukekohe',
    region: 'Auckland',
    description: 'Pukekohe and Franklin towing - where Auckland meets the country. Famous for the motorsport park, market gardens, and growing community. From the racetrack to the farmland, Waiuku\'s coast to Pokeno\'s chocolate factory. Rural roads, track day recoveries, and everything in between.',
    keywords: ['pukekohe towing', 'franklin towing', 'waiuku towing', 'tuakau towing'],
    nearby: ['Manukau', 'Papakura', 'Huntly', 'Pokeno', 'Waiuku'],
    caseStudy: {
      title: 'Race Day Recovery',
      vehicle: 'Porsche 911 GT3',
      problem: 'GT3 broke down at Pukekohe Park after track day. Clutch failure.',
      solution: 'Enclosed flatbed transport to Porsche Auckland. Track day gear secured.',
      time: '35 minutes'
    }
  },
]

export const wellingtonLocations: Location[] = [
  {
    slug: 'wellington',
    name: 'Wellington',
    region: 'Wellington',
    description: 'Wellington towing - the coolest little capital in the world. From Cuba Street to Courtenay Place, the Beehive to Te Papa, Oriental Bay to the Cable Car. We handle the hills, the one-way streets, and the famous Wellington wind. Parliament to the waterfront, covered 24/7.',
    keywords: ['wellington towing', 'tow truck wellington', 'wellington breakdown', 'lower hutt towing', 'porirua towing'],
    nearby: ['Lower Hutt', 'Upper Hutt', 'Porirua', 'Kapiti', 'Petone'],
    caseStudy: {
      title: 'Thorndon Hill Recovery',
      vehicle: 'Jaguar F-PACE',
      problem: 'F-PACE lost brakes on The Terrace. Ended up against retaining wall.',
      solution: 'Specialist hill recovery. Vehicle winched safely. Towed to Jaguar dealer.',
      time: '1 hour'
    }
  },
  {
    slug: 'lower-hutt',
    name: 'Lower Hutt',
    region: 'Wellington',
    description: 'Lower Hutt towing - the heart of the Hutt Valley. From Queensgate to Petone\'s Jackson Street, the Dowse to Wainuiomata Hill. We know the valley roads, the Esplanade, and the Eastern Bays route. Hutt Hospital to the industrial areas, fully covered.',
    keywords: ['lower hutt towing', 'hutt valley towing', 'petone towing', 'wainuiomata towing'],
    nearby: ['Wellington', 'Upper Hutt', 'Petone', 'Eastbourne', 'Wainuiomata'],
  },
  {
    slug: 'upper-hutt',
    name: 'Upper Hutt',
    region: 'Wellington',
    description: 'Upper Hutt towing - gateway to the Wairarapa. From the Silverstream railway to the Remutaka Hill summit. We handle the tunnel approaches, the Rimutaka incline, and the upper valley communities. Birchville to Trentham, brown owl to Kaitoke.',
    keywords: ['upper hutt towing', 'rimutaka towing', 'silverstream towing'],
    nearby: ['Lower Hutt', 'Wellington', 'Masterton', 'Featherston'],
  },
  {
    slug: 'porirua',
    name: 'Porirua',
    region: 'Wellington',
    description: 'Porirua towing - harbour city on Wellington\'s doorstep. From the mega centre to Titahi Bay\'s beach, Plimmerton\'s village to the Pauatahanui inlet. Covering Tawa\'s valley, Cannons Creek, and the Transmission Gully approaches. Northern Wellington sorted.',
    keywords: ['porirua towing', 'tawa towing', 'titahi bay towing'],
    nearby: ['Wellington', 'Kapiti', 'Johnsonville', 'Tawa'],
  },
]

export const christchurchLocations: Location[] = [
  {
    slug: 'christchurch',
    name: 'Christchurch',
    region: 'Canterbury',
    description: 'Christchurch towing - the Garden City rising. From the rebuilt CBD to the Port Hills summit, Riccarton to New Brighton beach. We know the red zone history, the new developments, and every corner of this resilient city. Hagley Park to the airport, Lyttelton tunnel to the plains.',
    keywords: ['christchurch towing', 'tow truck christchurch', 'christchurch breakdown', 'canterbury towing'],
    nearby: ['Rangiora', 'Rolleston', 'Lincoln', 'Kaiapoi', 'Lyttelton'],
    caseStudy: {
      title: 'Port Hills Night Recovery',
      vehicle: 'Land Rover Defender',
      problem: 'New Defender went off Summit Road at dusk. 30 meters down steep bank.',
      solution: 'Night recovery team with floodlights. Winched to road without further damage.',
      time: '2 hours'
    }
  },
  {
    slug: 'rangiora',
    name: 'Rangiora',
    region: 'Canterbury',
    description: 'Rangiora towing - the heart of North Canterbury. Historic town centre, Ashley River, and the growing Waimakariri district. From the Good Street shops to Kaiapoi\'s waterways, Woodend beach to Oxford\'s foothills. Rural Canterbury knowledge with urban speed.',
    keywords: ['rangiora towing', 'kaiapoi towing', 'north canterbury towing'],
    nearby: ['Christchurch', 'Kaiapoi', 'Woodend', 'Oxford', 'Amberley'],
  },
  {
    slug: 'rolleston',
    name: 'Rolleston',
    region: 'Canterbury',
    description: 'Rolleston towing - New Zealand\'s fastest growing town. From the Izone business hub to the new subdivisions, Lincoln University to the Selwyn sports facilities. We cover the plains, the lifestyle blocks, and the commuter routes back to Christchurch.',
    keywords: ['rolleston towing', 'selwyn towing', 'lincoln towing'],
    nearby: ['Christchurch', 'Lincoln', 'Prebbleton', 'Darfield', 'Leeston'],
  },
]

export const otherLocations: Location[] = [
  {
    slug: 'tauranga',
    name: 'Tauranga',
    region: 'Bay of Plenty',
    description: 'Tauranga towing - the Bay\'s biggest city and NZ\'s busiest port. From Mount Maunganui\'s iconic peak to Papamoa\'s endless beach, the CBD to Te Puke\'s kiwifruit country. We know the harbour bridge, the Baypark events, and every beach access road. Summer rush? We\'re ready.',
    keywords: ['tauranga towing', 'mount maunganui towing', 'papamoa towing', 'bay of plenty towing'],
    nearby: ['Mount Maunganui', 'Papamoa', 'Te Puke', 'Rotorua', 'Whakatane'],
    caseStudy: {
      title: 'Beach Sand Recovery',
      vehicle: 'Mercedes-AMG G63',
      problem: 'G63 buried in soft sand at Papamoa Beach. Owner tried to drive on the beach.',
      solution: 'Specialist sand recovery. Extracted without damage. Beach cleaned.',
      time: '40 minutes'
    }
  },
  {
    slug: 'rotorua',
    name: 'Rotorua',
    region: 'Bay of Plenty',
    description: 'Rotorua towing - where the earth steams and adventure awaits. Geothermal wonderland from Whakarewarewa to the Redwoods, Government Gardens to the famous lakes. Mountain bike breakdowns, tourist vehicles, and locals alike. We navigate the sulfur and deliver results.',
    keywords: ['rotorua towing', 'tow truck rotorua', 'rotorua breakdown'],
    nearby: ['Tauranga', 'Taupo', 'Whakatane', 'Matamata', 'Putaruru'],
    caseStudy: {
      title: 'Redwoods Carpark',
      vehicle: 'Volvo XC90',
      problem: 'XC90 wouldn\'t start after mountain bike trip. Flat battery from lights left on.',
      solution: 'Jump start on site. Battery tested. Owner back on road in 15 minutes.',
      time: '20 minutes'
    }
  },
  {
    slug: 'dunedin',
    name: 'Dunedin',
    region: 'Otago',
    description: 'Dunedin towing - the Edinburgh of the South. Victorian architecture, student culture, and Otago\'s rugged coastline. From the Octagon to the stadium, Baldwin Street (world\'s steepest) to the Otago Peninsula. We handle the hills, the scarfie cars, and the weather.',
    keywords: ['dunedin towing', 'tow truck dunedin', 'otago towing'],
    nearby: ['Mosgiel', 'Port Chalmers', 'Oamaru', 'Balclutha'],
    caseStudy: {
      title: 'Baldwin Street Recovery',
      vehicle: 'Mini Cooper S',
      problem: 'Mini\'s handbrake failed on Baldwin Street. Rolled into fence at bottom.',
      solution: 'Specialist steep street recovery. Vehicle collected without further damage.',
      time: '35 minutes'
    }
  },
  {
    slug: 'queenstown',
    name: 'Queenstown',
    region: 'Otago',
    description: 'Queenstown towing - adventure capital of the world. From the Remarkables to the Shotover, Arrowtown\'s gold rush charm to Glenorchy\'s wilderness. We handle the Crown Range in winter, the summer tourist rush, and everything between. Bungy, jet boats, and breakdowns - we\'ve seen it all.',
    keywords: ['queenstown towing', 'wanaka towing', 'arrowtown towing'],
    nearby: ['Wanaka', 'Arrowtown', 'Cromwell', 'Glenorchy'],
    caseStudy: {
      title: 'Crown Range Ice Recovery',
      vehicle: 'Audi Q8',
      problem: 'Q8 slid off icy Crown Range road. Family from Australia, not used to conditions.',
      solution: 'Ice-capable recovery. Family warmed in cab. Vehicle recovered safely.',
      time: '55 minutes'
    }
  },
  {
    slug: 'napier',
    name: 'Napier',
    region: 'Hawkes Bay',
    description: 'Napier towing - Art Deco jewel of New Zealand. Rebuilt in the 1930s and proud of it. From Marine Parade to the Bluff Hill lookout, the port to the wineries of Hawkes Bay. Wine tours, classic car events, and everything in between. Vintage or modern, we treat every vehicle with care.',
    keywords: ['napier towing', 'hastings towing', 'hawkes bay towing'],
    nearby: ['Hastings', 'Havelock North', 'Waipukurau', 'Wairoa'],
    caseStudy: {
      title: 'Wine Tour Breakdown',
      vehicle: 'Mercedes-Benz S-Class',
      problem: 'S-Class broke down between wineries. Corporate clients stranded.',
      solution: 'Arranged replacement vehicle within 30 minutes. Original car to dealer.',
      time: '25 minutes'
    }
  },
  {
    slug: 'palmerston-north',
    name: 'Palmerston North',
    region: 'Manawatu',
    description: 'Palmerston North towing - the student city with a heart. Home to Massey University, the Manawatu Gorge (now bypassed), and the wind-swept plains. From The Square to the airport, Linton Army Camp to the Esplanade. Affordable, reliable, no-nonsense service.',
    keywords: ['palmerston north towing', 'palmy towing', 'manawatu towing'],
    nearby: ['Feilding', 'Levin', 'Whanganui', 'Masterton'],
  },
  {
    slug: 'new-plymouth',
    name: 'New Plymouth',
    region: 'Taranaki',
    description: 'New Plymouth towing - in the shadow of Taranaki. The mountain watches over everything we do. From Pukekura Park to the Coastal Walkway, Surf Highway 45 to the port. Oil and gas industry, surf culture, and mountain adventures. We know every road around the mountain.',
    keywords: ['new plymouth towing', 'taranaki towing', 'stratford towing'],
    nearby: ['Stratford', 'Hawera', 'Inglewood', 'Waitara'],
    caseStudy: {
      title: 'Surf Highway Breakdown',
      vehicle: 'Toyota Hilux Rogue',
      problem: 'Hilux broke down on Surf Highway 45 with surfboards on roof.',
      solution: 'Quick recovery. Surfboards secured. Vehicle to dealer in New Plymouth.',
      time: '30 minutes'
    }
  },
  {
    slug: 'whangarei',
    name: 'Whangarei',
    region: 'Northland',
    description: 'Whangarei towing - gateway to the Far North. From the Town Basin marina to the Whangarei Falls, the Tutukaka coast to the kauri forests. We handle the winding Northland roads, the boat ramp recoveries, and the tourist traffic heading to the Bay of Islands.',
    keywords: ['whangarei towing', 'northland towing', 'kerikeri towing'],
    nearby: ['Kerikeri', 'Paihia', 'Dargaville', 'Kaikohe'],
    caseStudy: {
      title: 'Tutukaka Coast',
      vehicle: 'Lexus RX',
      problem: 'RX broke down near Poor Knights dive site. Owners had dive gear.',
      solution: 'Flatbed recovery. Dive gear kept dry. Vehicle to Lexus in Whangarei.',
      time: '45 minutes'
    }
  },
  {
    slug: 'invercargill',
    name: 'Invercargill',
    region: 'Southland',
    description: 'Invercargill towing - the deep south\'s main city. From the famous water tower to Bluff\'s oysters, Queens Park to Oreti Beach. Gateway to Stewart Island and the Catlins. We handle the southern weather, the farming community, and the Stewart Island ferry runs.',
    keywords: ['invercargill towing', 'southland towing', 'gore towing'],
    nearby: ['Gore', 'Bluff', 'Te Anau', 'Winton'],
    caseStudy: {
      title: 'Stewart Island Ferry Rush',
      vehicle: 'BMW X5',
      problem: 'X5 broke down rushing to catch Stewart Island ferry. Would miss booking.',
      solution: 'Drove owners to ferry terminal in tow truck. Made the boat. Vehicle sorted later.',
      time: '15 minutes'
    }
  },
  {
    slug: 'nelson',
    name: 'Nelson',
    region: 'Nelson',
    description: 'Nelson towing - the sunny centre of New Zealand. Literally the geographic centre of NZ. From the cathedral steps to Tahunanui Beach, the Saturday market to the craft breweries. Art, wine, and sunshine - plus Abel Tasman access. Creative solutions for a creative city.',
    keywords: ['nelson towing', 'richmond towing', 'tasman towing'],
    nearby: ['Richmond', 'Motueka', 'Blenheim', 'Golden Bay'],
  },
  {
    slug: 'blenheim',
    name: 'Blenheim',
    region: 'Marlborough',
    description: 'Blenheim towing - heart of Marlborough wine country. Sauvignon Blanc capital of the world. From the Omaka Aviation Heritage Centre to endless vineyards, Picton ferry terminal to the Wairau Valley. Wine tours, ferry connections, and harvest season breakdowns - all covered.',
    keywords: ['blenheim towing', 'marlborough towing', 'picton towing'],
    nearby: ['Picton', 'Nelson', 'Kaikoura', 'Seddon'],
    caseStudy: {
      title: 'Ferry Connection',
      vehicle: 'Volkswagen Touareg',
      problem: 'Touareg broke down en route to Interislander. 30 minutes to departure.',
      solution: 'Taxi arranged to ferry. Owners made crossing. Vehicle collected after.',
      time: '12 minutes to get owners moving'
    }
  },
  {
    slug: 'hastings',
    name: 'Hastings',
    region: 'Hawkes Bay',
    description: 'Hastings towing - fruit bowl of New Zealand and proud of it. From the produce markets to Havelock North\'s village charm, the orchards to the wineries. Te Mata Peak overlooks our work. We handle harvest season, orchard access roads, and the rural community with care.',
    keywords: ['hastings towing', 'tow truck hastings', 'havelock north towing'],
    nearby: ['Napier', 'Havelock North', 'Waipukurau', 'Wairoa'],
    caseStudy: {
      title: 'Orchard Road Recovery',
      vehicle: 'Ford Ranger',
      problem: 'Ranger bogged in orchard after rain. Harvest crew needed it urgently.',
      solution: 'Winch recovery without damaging crop rows. Back to work in 40 minutes.',
      time: '35 minutes'
    }
  },
  {
    slug: 'ashburton',
    name: 'Ashburton',
    region: 'Canterbury',
    description: 'Ashburton towing - the big little town of Mid Canterbury. Farming heartland between Christchurch and Timaru. From the high country stations to the coastal plains, Methven ski fields to the Rakaia River. We understand farming schedules and rural road conditions.',
    keywords: ['ashburton towing', 'tow truck ashburton', 'mid canterbury towing'],
    nearby: ['Christchurch', 'Timaru', 'Methven', 'Rakaia'],
    caseStudy: {
      title: 'Farming District Call',
      vehicle: 'Toyota Prado',
      problem: 'Prado broke down on rural road during calving season. Farmer needed to get back.',
      solution: 'Quick response. Farmer dropped back to farm, vehicle to mechanic.',
      time: '25 minutes'
    }
  },
  {
    slug: 'greymouth',
    name: 'Greymouth',
    region: 'West Coast',
    description: 'Greymouth towing - wild West Coast covered. From the Tranz Alpine arrival point to the Grey River, Punakaiki\'s pancake rocks to Hokitika\'s jade shops. We know the coast road conditions, the rain, and the resilience of the West Coast community.',
    keywords: ['greymouth towing', 'west coast towing', 'hokitika towing'],
    nearby: ['Hokitika', 'Reefton', 'Westport', 'Franz Josef'],
    caseStudy: {
      title: 'Coast Road Recovery',
      vehicle: 'Subaru Outback',
      problem: 'Outback slid on wet coast road. Stuck on bank above river.',
      solution: 'Careful winch recovery. No damage to vehicle or environment.',
      time: '45 minutes'
    }
  },
  {
    slug: 'whanganui',
    name: 'Whanganui',
    region: 'Manawatu-Whanganui',
    description: 'Whanganui towing - the river city with 200km of navigable waterway. From the historic Sarjeant Gallery to the Durie Hill elevator, Virginia Lake to the famous river road journey. Artists, history, and a proud community. Remote river road recoveries our specialty.',
    keywords: ['whanganui towing', 'tow truck whanganui', 'wanganui towing'],
    nearby: ['Palmerston North', 'New Plymouth', 'Bulls', 'Marton'],
    caseStudy: {
      title: 'River Road Breakdown',
      vehicle: 'Mazda CX-5',
      problem: 'CX-5 broke down on scenic Whanganui River Road. Remote location.',
      solution: 'Located via GPS. Recovery to Whanganui mechanic same day.',
      time: '55 minutes'
    }
  },
]

// All locations combined
export const allLocations: Location[] = [
  ...waikatoLocations,
  ...aucklandLocations,
  ...wellingtonLocations,
  ...christchurchLocations,
  ...otherLocations,
]

export function getLocationBySlug(slug: string): Location | undefined {
  return allLocations.find(loc => loc.slug === slug)
}

export function getLocationsByRegion(region: string): Location[] {
  return allLocations.filter(loc => loc.region === region)
}

export function getWaikatoLocations(): Location[] {
  return waikatoLocations
}
