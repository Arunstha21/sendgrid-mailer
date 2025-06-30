
import { NextRequest } from 'next/server'
import { parse } from 'json2csv'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const jsonUrl = searchParams.get('url')

  if (!jsonUrl) {
    return new Response(JSON.stringify({ error: 'Missing ?url=' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const response = await fetch(jsonUrl)
    if (!response.ok) throw new Error('Failed to fetch JSON data')

    const data = await response.json()
    const arrayData = Array.isArray(data) ? data : [data]
    const csv = parse(arrayData)

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain'  // Served as raw CSV text
      }
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Failed to convert' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}