import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

/**
 * API endpoint to add completed jobs as stories
 * Used by the thanks page after payment, or manually by admin
 */

interface StoryPayload {
  customerName: string
  vehicle: string
  location: string
  slug?: string
  issue: string
  responseTime: string
  story?: string
  completedAt?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: StoryPayload = await request.json()

    const { 
      customerName, 
      vehicle, 
      location,
      slug,
      issue,
      responseTime,
      story,
      completedAt
    } = body

    // Validate required fields
    if (!customerName || !location || !issue) {
      return NextResponse.json(
        { error: 'Missing required fields: customerName, location, issue' },
        { status: 400 }
      )
    }

    // Generate story ID
    const storyId = `story-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`

    // Create the story object
    const newStory = {
      id: storyId,
      name: customerName,
      vehicle: vehicle || 'Vehicle',
      location,
      slug: slug || location.toLowerCase().replace(/\s+/g, '-'),
      issue,
      responseTime: responseTime || '20 mins',
      story: story || generateDefaultStory(customerName, vehicle || 'vehicle', location, issue, responseTime),
      createdAt: completedAt || new Date().toISOString()
    }

    // Save to KV
    try {
      await kv.lpush('completed_stories', JSON.stringify(newStory))
      await kv.ltrim('completed_stories', 0, 999) // Keep last 1000
      console.log('📝 Story saved to KV:', newStory.id)
    } catch (kvError) {
      console.error('KV error:', kvError)
    }

    console.log('📝 NEW STORY ADDED:', newStory)

    return NextResponse.json({ 
      success: true,
      storyId,
      message: 'Story added successfully'
    })

  } catch (error) {
    console.error('Add story API error:', error)
    return NextResponse.json(
      { error: 'Failed to add story' },
      { status: 500 }
    )
  }
}

function generateDefaultStory(name: string, vehicle: string, location: string, issue: string, responseTime: string): string {
  const time = responseTime || '20 mins'
  const issueLower = issue.toLowerCase()
  
  if (issueLower.includes('battery')) {
    return `${name} was stranded in ${location} with a flat battery. We arrived in ${time} and got their ${vehicle} started.`
  }
  
  if (issueLower.includes('tyre') || issueLower.includes('tire')) {
    return `${name} had a flat tyre on their ${vehicle} in ${location}. Our team arrived in ${time} and sorted the spare.`
  }
  
  if (issueLower.includes('lock')) {
    return `${name} was locked out of their ${vehicle} in ${location}. We had them back inside in ${time}.`
  }
  
  if (issueLower.includes('accident')) {
    return `After an accident in ${location}, we helped ${name} get their ${vehicle} safely towed. On scene in ${time}.`
  }
  
  // Default breakdown story
  return `${name} broke down in ${location}. We arrived in ${time} and towed their ${vehicle} to safety.`
}

// GET endpoint to fetch stories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const stories = await kv.lrange('completed_stories', 0, limit - 1)
    const parsed = stories.map(s => JSON.parse(s as string))

    return NextResponse.json({ 
      success: true, 
      stories: parsed,
      count: parsed.length 
    })
  } catch (error) {
    console.error('Error fetching stories:', error)
    return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 })
  }
}
