export interface Service {
  slug: string
  title: string
  description: string
  keywords: string[]
  content: string
  issueMatch?: string // Maps to story issue type for filtering
  caseStudies: {
    title: string
    location: string
    problem: string
    solution: string
    time: string
  }[]
}

export const services: Service[] = [
  {
    slug: 'car-towing',
    title: 'Car Towing',
    description: '24/7 car towing across New Zealand. Sedans, hatchbacks, SUVs, utes - we tow them all safely.',
    keywords: ['car towing', 'vehicle towing', 'sedan towing', 'hatchback towing', 'suv towing', 'ute towing'],
    content: `Whether your car has broken down, been in an accident, or just won't start - we'll get it where it needs to go. Our flatbed tow trucks ensure your vehicle is transported safely without any additional damage.

We tow all makes and models including lowered vehicles, modified cars, and luxury vehicles that need extra care.`,
    caseStudies: [
      {
        title: 'BMW Breakdown on Motorway',
        location: 'Hamilton',
        problem: 'BMW 3 Series broke down during morning commute on Waikato Expressway.',
        solution: 'Flatbed dispatched, vehicle loaded safely, delivered to preferred BMW specialist.',
        time: '22 minutes response'
      },
      {
        title: 'Lowered Car Transport',
        location: 'Auckland',
        problem: 'Modified Honda with very low suspension needed transport to car show.',
        solution: 'Flatbed with low-angle ramps used, vehicle loaded without scraping.',
        time: 'Scheduled pickup'
      }
    ]
  },
  {
    slug: 'accident-towing',
    title: 'Accident Towing',
    description: '24/7 accident recovery. We work with police and insurance to clear accident scenes quickly and safely.',
    keywords: ['accident towing', 'crash towing', 'accident recovery', 'collision towing', 'wreck removal'],
    issueMatch: 'Accident',
    content: `After an accident, the last thing you need is to worry about your vehicle. We coordinate with police, insurance companies, and repair shops to make the process as smooth as possible.

Our operators are experienced in accident scenes and know how to safely recover vehicles while respecting the situation.`,
    caseStudies: [
      {
        title: 'Multi-Vehicle Accident Clearance',
        location: 'Cambridge',
        problem: 'Three-car collision blocking two lanes during peak traffic.',
        solution: 'Two tow trucks dispatched, scene cleared in coordination with police.',
        time: 'All vehicles cleared within 45 minutes'
      },
      {
        title: 'Single Vehicle Off-Road',
        location: 'Te Awamutu',
        problem: 'Vehicle left road and ended up in paddock after losing control.',
        solution: 'Off-road recovery, vehicle winched back to road and towed to panel shop.',
        time: '1 hour'
      }
    ]
  },
  {
    slug: 'breakdown-towing',
    title: 'Breakdown Towing',
    description: 'Broken down? We\'ll get you going. Fast response to breakdowns across NZ.',
    keywords: ['breakdown towing', 'roadside breakdown', 'car broke down', 'vehicle breakdown', 'stranded'],
    issueMatch: 'Breakdown',
    content: `When your car decides to stop working, we're the call you make. Whether it's a dead battery situation that can't be jumped, a major mechanical failure, or something you just can't diagnose - we'll get your vehicle to wherever it needs to go.

No judgment, no questions - just fast, professional service to get you unstuck.`,
    caseStudies: [
      {
        title: 'Family Stranded on Holiday',
        location: 'Taupo',
        problem: 'Family car broke down on Desert Road, no cell coverage, kids in car.',
        solution: 'Located via emergency beacon, towed to Taupo, helped arrange rental for family.',
        time: '40 minutes from first contact'
      },
      {
        title: 'Work Van Dead',
        location: 'Hamilton CBD',
        problem: 'Tradie\'s van wouldn\'t start, full of tools needed for job.',
        solution: 'Towed to mechanic, arranged for tools to be taken to job site.',
        time: '18 minutes'
      }
    ]
  },
  {
    slug: 'flat-battery',
    title: 'Flat Battery Service',
    description: 'Flat battery? We\'ll jump start you on the spot or tow you to get a new battery fitted. Fast response.',
    keywords: ['flat battery', 'dead battery', 'battery jump start', 'car wont start', 'battery service'],
    issueMatch: 'Flat Battery',
    content: `Left your lights on? Battery decided to give up? It happens to everyone. We'll come to you and try a jump start first - often that's all you need to get going again.

If your battery is truly dead, we'll tow you to your preferred mechanic or battery shop to get a replacement fitted. No fuss, no drama.`,
    caseStudies: [
      {
        title: 'Airport Carpark Rescue',
        location: 'Auckland',
        problem: 'Family returned from holiday to find car with flat battery in airport carpark.',
        solution: 'Jump start on site, battery tested and found to be okay - just drained from interior light left on.',
        time: '25 minutes'
      },
      {
        title: 'Early Morning Work Crisis',
        location: 'Hamilton',
        problem: 'Tradie\'s ute wouldn\'t start at 5:30am, needed to get to job site.',
        solution: 'Early morning callout, jump start successful, owner recommended battery replacement.',
        time: '18 minutes'
      }
    ]
  },
  {
    slug: 'flat-tyre',
    title: 'Flat Tyre Assistance',
    description: 'Got a flat? We\'ll change it roadside or tow you to a tyre shop. No spare? No problem.',
    keywords: ['flat tyre', 'flat tire', 'puncture', 'tyre blowout', 'tyre change'],
    issueMatch: 'Flat Tyre',
    content: `Punctures and blowouts don't care where you are or what you're doing. If you've got a spare, we'll change it for you roadside - no need to get dirty or fight with a jack on the side of the road.

No spare? Many modern cars don't come with one. We'll tow you to a tyre shop to get you sorted properly.`,
    caseStudies: [
      {
        title: 'Motorway Blowout',
        location: 'Waikato Expressway',
        problem: 'SUV had tyre blowout at highway speed, stopped safely on hard shoulder.',
        solution: 'Spare fitted roadside, damaged tyre disposed of, owner continued journey.',
        time: '30 minutes'
      },
      {
        title: 'No Spare Situation',
        location: 'Cambridge',
        problem: 'Modern BMW with run-flat tyres - tyre completely destroyed, no spare.',
        solution: 'Flatbed tow to tyre specialist, owner arranged pickup later.',
        time: '20 minutes to load'
      }
    ]
  },
  {
    slug: 'lockout',
    title: 'Car Lockout Service',
    description: 'Locked your keys in the car? We coordinate with locksmiths to get you back in fast.',
    keywords: ['car lockout', 'locked out of car', 'keys locked in car', 'lost car keys', 'locksmith'],
    issueMatch: 'Lockout',
    content: `It's that sinking feeling - you can see your keys sitting on the seat and the doors won't open. We coordinate with trusted locksmiths across New Zealand to get you back into your vehicle without damage.

For newer vehicles with electronic keys, we can arrange specialist auto electricians who can help.`,
    caseStudies: [
      {
        title: 'Shopping Centre Lockout',
        location: 'Hamilton',
        problem: 'Mum locked keys in car with shopping, groceries getting warm.',
        solution: 'Locksmith coordinated, vehicle opened within 20 minutes of call.',
        time: '20 minutes'
      }
    ]
  },
  {
    slug: 'after-hours-towing',
    title: 'After Hours Towing',
    description: 'Night, weekend, public holiday - we\'re always available. 24/7 means 24/7.',
    keywords: ['after hours towing', 'night towing', 'weekend towing', '24 hour towing', 'emergency towing'],
    content: `Breakdowns don't check the clock and neither do we. Our operators work around the clock so there's always someone ready to help, no matter what time you call.

Same fast service at 3am as at 3pm. No extra waiting, no excuses.`,
    caseStudies: [
      {
        title: '2am Hospital Run',
        location: 'Morrinsville',
        problem: 'Car broke down while rushing to hospital for family emergency.',
        solution: 'Night crew dispatched, driver given ride to hospital while car was towed.',
        time: '15 minutes'
      }
    ]
  },
  {
    slug: 'winch-out',
    title: 'Winch Out Recovery',
    description: 'Stuck in a ditch, bog, or off the road? Our winch trucks will pull you out safely.',
    keywords: ['winch out', 'stuck car', 'bogged vehicle', 'off road recovery', 'vehicle recovery'],
    issueMatch: 'Winch Out',
    content: `Whether you've slid off a wet road, got bogged in mud, or ended up in a ditch - we've got the equipment to get you out. Our trucks are fitted with powerful winches that can recover vehicles from difficult situations.

We take care not to cause additional damage during recovery - slow and steady wins the race when you're stuck.`,
    caseStudies: [
      {
        title: 'Farm Track Bog',
        location: 'Te Awamutu',
        problem: 'SUV got stuck on muddy farm track after heavy rain.',
        solution: 'Winch recovery from soft ground, no additional damage to vehicle or track.',
        time: '45 minutes'
      }
    ]
  },
]

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find(s => s.slug === slug)
}

export function getAllServices(): Service[] {
  return services
}

export function getServiceByIssueType(issueType: string): Service | undefined {
  return services.find(s => s.issueMatch === issueType)
}
