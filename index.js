import fetch from 'node-fetch'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const NEWS_KEY = `94d4de1b09714b469a9c58b692c876cc` // have my free key lol

const weatherCodes = {
  0: 'Clear',
  1: 'Mostly Clear',
  2: 'Partly Cloudy',
  3: 'Cloudy',
  45: 'Fog',
  48: 'Freezing Fog',
  51: 'Light Drizzle',
  53: 'Drizzle',
  55: 'Heavy Drizzle',
  56: 'Light Freezing Drizzle',
  57: 'Freezing Drizzle',
  61: 'Light Rain',
  63: 'Rain',
  65: 'Heavy Rain',
  66: 'Light Freezing Rain',
  67: 'Freezing Rain',
  71: 'Light Snow',
  73: 'Snow',
  75: 'Heavy Snow',
  77: 'Snow Grains',
  80: 'Light Rain Shower',
  81: 'Rain Shower',
  82: 'Heavy Rain Shower',
  85: 'Light Snow Shower',
  86: 'Heavy Snow Shower',
  95: 'Thunderstorm',
  96: 'Thunderstorm with Hail',
  99: 'Heavy Hailstorm'
}

async function fetchNews(country = 'us') {
  const res = await fetch(
    `https://newsapi.org/v2/top-headlines?country=${country}&apiKey=${NEWS_KEY}&pageSize=5` // for basic shows 5 pages news
  )
  if (!res.ok) throw new Error(`NewsAPI error ${res.status}`)
  const json = await res.json()
  return json.articles.slice(0, 5).map(a => ({
    title: a.title,
    url: a.url,
    source: a.source.name,
    published: a.publishedAt
  }))
}

async function geocodeCity(city) {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
  )
  if (!res.ok) throw new Error(`Geocoding error: ${res.status}`)
  const j = await res.json()
  if (!j.results?.length) throw new Error(`City not found: ${city}`)
  return j.results[0]
}

async function fetchWeather(lat, lon) {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
  )
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`)
  return res.json()
}

async function main() {
  const server = new McpServer({ name: 'news-weather-mcp', version: '1.2.0' })

  server.registerTool('GetNews', {
    title: 'Get World News',
    description: 'Top 5 headlines for a country (ISO code)',
    inputSchema: { country: z.string().length(2).default('us') }
  }, async ({ country }) => {
    const articles = await fetchNews(country)

    const summaryText = articles
      .map((a, i) => `${i + 1}. ${a.title} (${a.source})`)
      .join('\n')

    return {
      content: [{ type: 'text', text: `Top news for ${country.toUpperCase()}:\n` + summaryText }],
      structuredContent: { articles }
    }
  })

  server.registerTool('GetWeather', {
    title: 'Get Weather by City',
    description: 'Current weather by city name',
    inputSchema: { city: z.string() }
  }, async ({ city }) => {
    const geo = await geocodeCity(city)
    const j = await fetchWeather(geo.latitude, geo.longitude)
    const cw = j.current_weather
    const description = weatherCodes[cw.weathercode] || 'Unknown'
    const summary = `Weather in ${geo.name}: ${description}, ${cw.temperature}°C, wind ${cw.windspeed} m/s`

    return {
      content: [{ type: 'text', text: summary }],
      structuredContent: {
        city: geo.name,
        temperature: cw.temperature,
        windspeed: cw.windspeed,
        description,
        time: cw.time
      }
    }
  })

  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})