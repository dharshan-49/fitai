import dotenv from 'dotenv'
import express from 'express'
import { fileURLToPath } from 'node:url'
import { handleChatRequest } from './chat.js'

const envPath = fileURLToPath(new URL('../.env', import.meta.url))
const envResult = dotenv.config({ path: envPath })
if (envResult.error && envResult.error.code !== 'ENOENT') {
  console.error(`[config] Could not load backend .env (${envResult.error.code || 'read error'}).`)
}

const app = express()
const port = Number(process.env.PORT) || 3001

app.disable('x-powered-by')
app.use(express.json({ limit: '64kb' }))

app.post('/api/chat', async (request, response) => {
  const result = await handleChatRequest(request.body)
  return response.status(result.status).json(result.body)
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
  console.log(`OpenRouter model: ${process.env.OPENROUTER_MODEL?.trim() || 'openai/gpt-4o-mini'}`)
  console.log(`Backend .env: ${envResult.error ? 'not found' : 'loaded'}`)
})
