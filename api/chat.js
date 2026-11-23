import { handleChatRequest } from '../server/chat.js'

export const config = {
  maxDuration: 60,
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ error: 'Method not allowed. Use POST /api/chat.' })
  }

  const result = await handleChatRequest(request.body)
  return response.status(result.status).json(result.body)
}
