# FITAI

A single-page fitness coaching site built with React, Vite, and Express. Its AI coach sends conversation history to the OpenRouter chat completions API through the Express backend; the API key is never sent to the browser.

## Run locally

1. Install dependencies:

   ```sh
   npm install
   ```

2. Copy `.env.example` to `.env` and add your OpenRouter API key:

   ```env
   OPENROUTER_API_KEY=your_openrouter_api_key
   OPENROUTER_MODEL=openai/gpt-4o-mini
   PORT=3001
   ```

   Choose any model available to your OpenRouter account for `OPENROUTER_MODEL`. Keep `.env` private; it is excluded from Git.

3. Open two terminals in the project folder. Start the API server in one:

   ```sh
   npm run server
   ```

4. Start the Vite frontend in the other:

   ```sh
   npm run dev
   ```

   Open the local URL printed by Vite. Its `/api` proxy forwards chat requests to Express on port 3001.

The chat keeps its conversation in browser local storage. Use the clear button in the chat header to start over.

## Deploy on Vercel

The root `api/chat.js` file exposes the same chat handler as a Vercel serverless function, so production requests to `/api/chat` do not depend on the local Express server. In the Vercel project settings, add `OPENROUTER_API_KEY` and, optionally, `OPENROUTER_MODEL` under **Settings → Environment Variables**. Add them to the Production environment (and Preview if needed), then redeploy. Do not use a `VITE_` prefix for the API key.

## Quality checks

```sh
npm run lint
npm run build
```
