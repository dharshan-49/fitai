import dotenv from 'dotenv'
import express from 'express'
import { fileURLToPath } from 'node:url'

const envPath = fileURLToPath(new URL('../.env', import.meta.url))
const envResult = dotenv.config({ path: envPath })
if (envResult.error && envResult.error.code !== 'ENOENT') {
  console.error(`[config] Could not load backend .env (${envResult.error.code || 'read error'}).`)
}

const app = express()
const port = Number(process.env.PORT) || 3001
const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions'
const model = process.env.OPENROUTER_MODEL?.trim() || 'openai/gpt-4o-mini'
const coachInstructions = `You are FITAI, a friendly, evidence-informed fitness and nutrition coach. Be supportive, specific, and concise. Make plans practical and adaptable to the person's schedule, fitness level, equipment, and budget.

Personalize workout plans and Indian meal suggestions to the information the user shares in this conversation. Before giving a detailed personalized plan, ask for any missing essentials naturally: age, height, weight, primary goal, training experience and available days/equipment, plus dietary preferences or restrictions. Do not repeatedly ask for details they have already shared. You may offer useful general guidance while collecting missing details, and clearly label assumptions.

For Indian nutrition, prioritize familiar foods and flexible portions (for example dal, rice, roti, curd, paneer, eggs, beans, and seasonal vegetables), adapting to vegetarian, vegan, and other preferences. Do not prescribe extreme calorie restriction, supplements as necessities, or guaranteed outcomes. Do not diagnose medical conditions. Encourage users with relevant medical concerns, a history of disordered eating, pregnancy, or injuries to consult a qualified health professional before changing their routine.`

function redactSecrets(value, apiKey) {
  let safeValue = String(value || '')
  if (apiKey) safeValue = safeValue.split(apiKey).join('[redacted]')
  return safeValue
    .replace(/Bearer\s+[^\s"'`,]+/gi, 'Bearer [redacted]')
    .replace(/\bsk-or-[A-Za-z0-9_-]{10,}\b/gi, '[redacted]')
}

function logOpenRouterFailure(status, data, requestId, apiKey) {
  const providerError = data?.error
  const message = redactSecrets(providerError?.message, apiKey)

  console.error('[OpenRouter] request failed', JSON.stringify({
    status,
    model,
    requestId: requestId || undefined,
    code: providerError?.code || undefined,
    message: message.slice(0, 400) || 'No provider error details returned',
  }))
}

function openRouterError(status) {
  switch (status) {
    case 401:
      return { status: 401, error: 'OpenRouter rejected the API key. Check OPENROUTER_API_KEY in the project-root .env file, then restart the backend.' }
    case 402:
      return { status: 402, error: 'OpenRouter credits are insufficient. Add credits to your OpenRouter account and try again.' }
    case 403:
      return { status: 403, error: 'OpenRouter denied access. Check that your account and selected model are allowed to make this request.' }
    case 404:
      return { status: 404, error: `OpenRouter could not find model "${model}". Check OPENROUTER_MODEL in .env.` }
    case 429:
      return { status: 429, error: 'The AI coach is receiving too many requests. Please wait a moment and try again.' }
    case 502:
      return { status: 502, error: 'OpenRouter is temporarily unavailable. Please try again shortly.' }
    default:
      return { status: 502, error: `OpenRouter returned an unexpected error (${status}). Check the backend log for details.` }
  }
}

app.disable('x-powered-by')
app.use(express.json({ limit: '64kb' }))

app.post('/api/chat', async (request, response) => {
  const { messages } = request.body ?? {}
  if (!Array.isArray(messages) || messages.length === 0) {
    return response.status(400).json({ error: 'Send at least one message to start a conversation.' })
  }
  if (messages.length > 40 || messages.some((message) =>
    !message ||
    !['user', 'assistant'].includes(message.role) ||
    typeof message.content !== 'string' ||
    !message.content.trim() ||
    message.content.length > 4000
  )) {
    return response.status(400).json({ error: 'The conversation contains an invalid message. Please shorten it and try again.' })
  }
  if (!messages.some((message) => message.role === 'user')) {
    return response.status(400).json({ error: 'Send a message from the user to start a conversation.' })
  }

  const apiKey = process.env.OPENROUTER_API_KEY?.trim()
  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    console.error(`[config] OPENROUTER_API_KEY is missing or still a placeholder in ${envPath}.`)
    return response.status(503).json({ error: 'The AI coach is not configured. Add your OpenRouter key to the project-root .env file and restart the backend.' })
  }

  try {
    const upstreamResponse = await fetch(openRouterUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || `http://localhost:${process.env.VITE_PORT || 5173}`,
        'X-Title': 'FITAI Fitness Coach',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: coachInstructions },
          ...messages.slice(-24).map(({ role, content }) => ({ role, content: content.trim() })),
        ],
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(60000),
    })

    const rawBody = await upstreamResponse.text()
    let data = null
    try {
      data = rawBody ? JSON.parse(rawBody) : null
    } catch {
      data = null
    }

    if (!upstreamResponse.ok) {
      logOpenRouterFailure(
        upstreamResponse.status,
        data,
        upstreamResponse.headers.get('x-request-id'),
        apiKey,
      )
      const error = openRouterError(upstreamResponse.status)
      return response.status(error.status).json({ error: error.error })
    }

    const reply = data?.choices?.[0]?.message?.content
    if (typeof reply !== 'string' || !reply.trim()) {
      logOpenRouterFailure(
        upstreamResponse.status,
        data,
        upstreamResponse.headers.get('x-request-id'),
        apiKey,
      )
      return response.status(502).json({ error: 'OpenRouter returned an empty or unreadable response. Please try again.' })
    }
    return response.json({ reply: reply.trim() })
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      console.error('[OpenRouter] request timed out after 60 seconds.')
      return response.status(504).json({ error: 'The AI coach took too long to respond. Please try again.' })
    }
    console.error('[OpenRouter] connection error', JSON.stringify({
      name: error.name,
      message: redactSecrets(error.message || 'Unknown network error', apiKey).slice(0, 300),
    }))
    return response.status(502).json({ error: 'Could not connect to OpenRouter. Check the backend network connection and try again.' })
  }
})

app.use((error, request, response, _next) => {
  if (error.type === 'entity.too.large') {
    return response.status(413).json({ error: 'The conversation is too large. Clear the chat and try again.' })
  }
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return response.status(400).json({ error: 'The chat request was not valid JSON.' })
  }
  console.error('[API] unhandled request error', JSON.stringify({
    name: error.name,
    type: error.type || undefined,
  }))
  return response.status(500).json({ error: 'The chat service encountered an unexpected error.' })
})

app.listen(port, '127.0.0.1', () => {
  console.log(`FITAI API server listening on http://127.0.0.1:${port}`)
  console.log(`OpenRouter model: ${model}`)
  console.log(`Backend .env: ${envResult.error ? 'not found' : 'loaded'}`)
})
