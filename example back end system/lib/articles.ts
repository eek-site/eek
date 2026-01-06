export interface Article {
  slug: string
  title: string
  description: string
  content: string
  caseStudy?: {
    title: string
    situation: string
    solution: string
    result: string
  }
}

export const articles: Article[] = [
  {
    slug: 'car-wont-start',
    title: 'Car Won\'t Start? Here\'s What To Do',
    description: 'Your car won\'t start. Don\'t panic. Here\'s what to check and when to call for a tow.',
    content: `
# Car Won't Start

It happens to everyone. You turn the key, press the button, and... nothing. Or maybe just a click. Here's what to do.

## Quick Checks

**Before you call anyone:**

1. **Check the obvious** - Is it in Park? Is the handbrake on for manual cars?
2. **Listen** - Clicking sound means battery. Silence could mean starter motor or worse.
3. **Look at the dash** - Warning lights can tell you a lot.

## Common Causes

### Dead Battery
The most common reason. If your lights are dim or nothing happens at all, this is likely it.

**What we do:** Jump start on the spot, or if the battery is completely dead, tow to get a replacement.

### Starter Motor
If you hear a single click but nothing else, the starter motor might have given up.

**What we do:** This needs a mechanic. We'll tow you to your preferred workshop or recommend one.

### Fuel Issues
Yes, it happens. Running on empty catches people out.

**What we do:** We can bring fuel to you, or tow you to the nearest station.

### Immobiliser Problems
Modern cars have complex security systems that can malfunction.

**What we do:** Sometimes a reset helps. If not, it's a tow to the dealer or auto electrician.

## When to Call Us

- You've tried the basics and it's still dead
- You're in an unsafe location
- You don't have time to figure it out
- You just want it sorted

**Call 0800 769 000** - We'll either get you going or get you where you need to be.
    `,
    caseStudy: {
      title: 'Airport Long-Term Parking',
      situation: 'Business traveller returned from 2-week trip to find car completely dead in Auckland Airport long-term parking. Flight landed at 11pm, no jump leads, phone nearly dead.',
      solution: 'Operator dispatched immediately. Arrived in 25 minutes with jump pack. Battery was recoverable with a long charge.',
      result: 'Customer driving home by midnight. Recommended battery check the next day - turned out the battery was 6 years old and due for replacement anyway.'
    }
  },
  {
    slug: 'accident-what-to-do',
    title: 'Been in an Accident? What To Do Next',
    description: 'Step by step guide for what to do after a car accident in New Zealand, including when and how to arrange towing.',
    content: `
# Been in an Accident?

First: take a breath. Here's what to do, step by step.

## Immediate Steps

### 1. Check for Injuries
People first. If anyone is injured, call 111 immediately.

### 2. Move to Safety
If possible and it's safe to do so, move vehicles off the road. If not, turn on hazard lights and stay in your vehicle if traffic is a risk.

### 3. Call Police If Needed
You must report to police if:
- Anyone is injured
- The other driver leaves without exchanging details
- You suspect the other driver is impaired
- There's significant property damage

### 4. Exchange Details
Get from the other driver:
- Name and contact details
- Insurance company and policy number
- Vehicle registration
- Driver licence number

### 5. Document Everything
Take photos of:
- All vehicles involved (all angles)
- The accident scene
- Any damage
- Road conditions
- Traffic signs nearby

## Arranging Towing

### If Your Car Can't Be Driven
Call us: **0800 769 000**

We'll ask:
- Where are you? (Be specific - road name, nearest landmark)
- Is the road blocked?
- What kind of vehicle?
- Where do you want it taken?

### Insurance Towing
Many insurance policies cover towing. We work with all major insurers. You can either:
- Call us and claim back from insurance later
- Have your insurer arrange it through us

### What Happens to Your Car
We'll take it to:
- Your preferred panel beater
- An insurance assessor's yard
- Your home (if it's just needs minor work)
- Wherever you need it

## Our Role

We handle the vehicle side so you can deal with everything else. One call, problem sorted.
    `,
    caseStudy: {
      title: 'State Highway Multi-Vehicle',
      situation: 'Three-car accident on State Highway 1 near Hamilton during evening rush hour. One car in ditch, two blocking lane. Police on scene but needed vehicles cleared quickly.',
      solution: 'Dispatched two trucks simultaneously. First on scene in 15 minutes. Coordinated with police for safe access. All three vehicles removed within 40 minutes.',
      result: 'Highway fully reopened, all vehicles secured at our yard for insurance assessment. Drivers transported to where they needed to go.'
    }
  },
  {
    slug: 'flat-tyre-no-spare',
    title: 'Flat Tyre and No Spare? Your Options',
    description: 'Many modern cars don\'t have spare tyres. Here\'s what to do when you get a flat and can\'t change it yourself.',
    content: `
# Flat Tyre, No Spare

More and more cars come without spare tyres these days. If you've got a flat and no way to fix it yourself, here's what to do.

## Why No Spare?

Modern cars often come with:
- **Tyre repair kits** - Sealant and a compressor. Works for small punctures, not for blowouts or sidewall damage.
- **Run-flat tyres** - Can drive short distances when flat, but need replacing soon after.
- **Nothing** - Some manufacturers just expect you to call for help.

## Your Options

### Option 1: Use the Repair Kit
If your car has one and the puncture is small (nail, screw), the sealant might get you to a tyre shop. Read the instructions first.

**Note:** Once you use sealant, the tyre usually can't be properly repaired and needs replacing.

### Option 2: Run-Flats
If you have run-flat tyres, you can usually drive up to 80km at reduced speed (under 80km/h). Check your manual. Get to a tyre shop as soon as possible.

### Option 3: Call Us
We can:
- Tow you to a tyre shop
- Bring a spare wheel (if we have one that fits)
- Take you to get a replacement tyre and bring you back

## Prevention

- Check your tyres regularly - most flats start as slow punctures
- Know what your car has before you need it
- Consider keeping a proper spare if your car has space
- Have our number saved: **0800 769 000**

## The Reality

Getting a flat away from home, at night, or in bad weather is stressful. There's no shame in calling for help. That's what we're here for.
    `,
    caseStudy: {
      title: 'Queenstown Night Flat',
      situation: 'Family in rental SUV got a flat tyre on the way back from Milford Sound at 9pm. No spare (rental spec), no repair kit, no cell coverage at that spot. Drove slowly to where they got signal.',
      solution: 'Found them via their description of the location. Brought a spare wheel that fitted. Changed tyre roadside.',
      result: 'Family back on their way in 45 minutes. We returned the spare to our Queenstown base. They got the tyre repaired next morning in Te Anau.'
    }
  },
  {
    slug: 'locked-out-car',
    title: 'Locked Out of Your Car?',
    description: 'Keys locked inside? Here\'s what to do and how we can help get you back in your vehicle.',
    content: `
# Locked Out of Your Car

It's easily done. Keys on the seat, door slams, and you're standing there wondering what to do next.

## Before You Call Anyone

### Check All Doors
Walk around the car. Sometimes one door is unlocked.

### Check Windows
A slightly open window might be enough for a professional to work with.

### Check Your Phone
Do you have a spare key? Can someone bring it?

### Roadside Assistance
If you have AA or another roadside service, they may cover lockouts.

## Your Options

### 1. Spare Key
The cheapest option if someone can bring it to you.

### 2. Auto Locksmith
For lockouts, a locksmith is often the fastest solution. They can open most vehicles without damage.

### 3. Towing
If your car needs to go to a dealer (for complex security systems) or you need it moved anyway, we can help.

## Modern Car Complications

Newer cars with:
- **Smart keys** - Sometimes harder to access
- **Auto-lock features** - Car locks itself with keys inside
- **Security systems** - May need dealer intervention

## What We Do

We're not locksmiths, but we can:
- Tow your car to a locksmith or dealer
- Wait with you if you're in an unsafe area
- Coordinate with locksmiths we know and trust

**Call 0800 769 000** - We'll help you figure out the best solution.

## Prevention

- Get a spare key cut and keep it somewhere accessible
- Check your pockets before closing the door
- Use keyless entry if your car has it
- Download your car's app if it has remote unlock
    `,
    caseStudy: {
      title: 'Dog in Hot Car',
      situation: 'Owner locked keys in car with dog inside on a hot Auckland summer day. Windows up, car off, dog showing signs of heat stress. Panic setting in.',
      solution: 'Assessed as emergency. Coordinated with nearby locksmith who we knew could respond fast. Locksmith had car open in 12 minutes.',
      result: 'Dog was fine - windows down, water provided. Owner extremely relieved. We stayed until everyone was okay.'
    }
  },
  {
    slug: 'car-overheating',
    title: 'Car Overheating? Pull Over Now',
    description: 'If your temperature gauge is in the red, stop driving immediately. Here\'s what to do and how we can help.',
    content: `
# Car Overheating

When that temperature needle goes into the red, you need to act fast. Continuing to drive can destroy your engine.

## Immediate Actions

### 1. Pull Over Safely
As soon as it's safe, get off the road. Don't push it to the next exit or service station.

### 2. Turn Off the Engine
Let the car cool down. This takes time - at least 30 minutes.

### 3. Don't Open the Radiator Cap
The coolant is under pressure and extremely hot. Opening it can cause serious burns.

### 4. Look for Obvious Problems
- Steam or smoke from the engine bay
- Puddles of coolant under the car
- Burning smell

## Common Causes

### Low Coolant
Could be a slow leak you haven't noticed.

### Broken Thermostat
Relatively cheap fix if caught early.

### Failed Water Pump
More serious, but still repairable.

### Head Gasket Failure
The expensive one. If you see white smoke from the exhaust or coolant mixing with oil, this might be it.

### Blocked Radiator
Can happen with age or poor maintenance.

## What We Do

If your car has overheated, don't try to drive it. Even if it seems to cool down, you don't know what damage might have been done.

**Call 0800 769 000**

We'll tow you to:
- Your regular mechanic
- A mechanic we recommend
- Your home (if you want to arrange repairs yourself)

## The Cost of Ignoring It

An overheating repair caught early: Usually under $500
An engine replacement because you kept driving: $5,000-$15,000+

When in doubt, stop and call. It's always cheaper than an engine rebuild.
    `,
    caseStudy: {
      title: 'Desert Road Overheat',
      situation: 'Family towing caravan overheated on the Desert Road in summer. Temperature gauge maxed out, steam visible. Pulled over at the first safe spot.',
      solution: 'Dispatched our nearest operator. Assessed as radiator issue - fan had failed. Arranged tow to Taupo for repairs. Caravan secured at safe location until they could return for it.',
      result: 'New radiator fan fitted in Taupo. Family back on holiday the next day. Returned for caravan on their way home.'
    }
  },
  {
    slug: 'choosing-tow-company',
    title: 'How To Choose a Towing Company',
    description: 'Not all tow trucks are the same. Here\'s what to look for when you need your vehicle moved.',
    content: `
# Choosing a Towing Company

When your car needs to be moved, you want it done right. Here's what matters.

## What to Look For

### Response Time
When you're stuck, waiting matters. A company with operators spread across the region will get to you faster.

### Right Equipment
Different vehicles need different trucks:
- **Flatbeds** - Best for low cars, AWD vehicles, and damaged cars
- **Wheel-lifts** - Good for standard cars, faster loading
- **Flatbed** - For all vehicles

### Professionalism
- Do they answer the phone properly?
- Can they explain what will happen?
- Do they treat your vehicle with care?

### Transparent Pricing
You should know the cost before they load your car. No surprises.

### Insurance and Compliance
Any legitimate tow company should be properly insured and certified.

## Red Flags

- Won't give you a price upfront
- Takes an unreasonably long time to respond
- Doesn't ask where you want the car taken
- Damaged or poorly maintained trucks
- Rude or dismissive on the phone

## Questions to Ask

1. How long until you can get here?
2. What will it cost?
3. What type of truck are you sending?
4. Can you take it to [my preferred location]?
5. Do you work with my insurance company?

## Why People Choose Us

- 350+ operators means we're closer to you
- We answer our phone 24/7
- Clear pricing, no hidden fees
- Right equipment for every job
- We handle insurance claims

**0800 769 000** - One call, sorted.
    `
  },
  {
    slug: 'insurance-towing',
    title: 'Insurance and Towing: What You Need To Know',
    description: 'Understanding how insurance covers towing in New Zealand, and how to make a claim.',
    content: `
# Insurance and Towing

Most vehicle insurance policies include some towing coverage. Here's how it works.

## What's Usually Covered

### Comprehensive Insurance
Typically includes towing after an accident or breakdown. Often has a limit (e.g., $500) or distance (e.g., to nearest repairer).

### Third Party
Usually doesn't cover towing for your own vehicle, only if you're at fault and need to move the other person's car.

### Mechanical Breakdown Insurance
May cover towing to a repairer if the cause is mechanical failure.

## How to Use Your Coverage

### Option 1: Call Us, Claim Later
Pay for the tow, get a receipt, submit to your insurer. Usually fastest option.

### Option 2: Insurer Arranges
Call your insurer, they call us. Can take longer as you're waiting on two calls.

### Option 3: We Bill Insurer Direct
For some insurers, we can bill them directly. Ask when you call.

## What You'll Need

To claim from your insurer:
- Our invoice/receipt
- Photos of the scene
- Police report number (if applicable)
- Your policy number

## Insurance Companies We Work With

We work with all major NZ insurers:
- AA Insurance
- State
- Tower
- AMI
- Vero
- And others

## Tips

1. **Know your policy** - Check what's covered before you need it
2. **Keep receipts** - We provide full documentation
3. **Report promptly** - Insurers want to know about incidents quickly
4. **Ask us** - We deal with insurance every day and can advise

## Questions?

Call us on **0800 769 000** - we can often tell you if your situation is likely to be covered and the best way to proceed.
    `
  },
  {
    slug: 'electric-vehicle-towing',
    title: 'Electric Vehicle Towing: Special Considerations',
    description: 'EVs need special handling when being towed. Here\'s what you need to know about towing electric vehicles.',
    content: `
# Electric Vehicle Towing

Electric vehicles are becoming common on New Zealand roads. But they need different handling when they break down.

## Why EVs Are Different

### No Neutral Tow
Many EVs cannot be towed with wheels on the ground - even in "neutral". The motors are connected to the wheels and towing can damage them.

### Heavy Batteries
EVs are heavier than equivalent petrol cars, affecting how they're loaded and transported.

### High Voltage Systems
Only trained operators should handle EVs, especially after accidents.

## How We Tow EVs

### Flatbed Only
We use flatbed trucks for all EVs. The car is loaded and transported with all wheels off the ground.

### Transport Mode
Many EVs have a special transport or tow mode. We know how to engage this for different makes.

### Trained Operators
Our teams are trained in EV handling, including safety procedures for the high-voltage systems.

## Common EV Brands We Handle

- Tesla (Model 3, Model Y, Model S, Model X)
- Nissan Leaf
- Hyundai Ioniq / Kona
- Kia EV6 / Niro
- BYD
- Polestar
- BMW i-series
- And others

## EV-Specific Issues

### Flat Battery (12V)
EVs have a separate 12V battery for electronics. If this goes flat, the car may not respond at all. We can jump this to get access.

### Charging Issues
Sometimes the car won't charge or release from a charger. We can assist.

### Range Anxiety Becomes Reality
Run out of charge? We can transport to a charging station.

## What to Tell Us

When you call about an EV:
- Make and model
- What happened
- Any warning lights
- Can you access the car?

**Call 0800 769 000** - We handle EVs every day.
    `,
    caseStudy: {
      title: 'Tesla Transport Mode',
      situation: 'Tesla Model 3 wouldn\'t shift out of Park after software update went wrong. Owner stranded in their own driveway.',
      solution: 'Operator knew the special access panel for Model 3 transport mode. Released the car without damage.',
      result: 'Car transported to Tesla service centre for software reset. Back to owner same day.'
    }
  }
]

export function getArticle(slug: string): Article | undefined {
  return articles.find(a => a.slug === slug)
}

export function getAllArticleSlugs(): string[] {
  return articles.map(a => a.slug)
}
