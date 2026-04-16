/**
 * Reads the response body as text, then parses JSON when possible.
 * Throws an Error with a clearer message when the server returns HTML or empty body (e.g. API down or SPA fallback).
 */
export async function parseApiJson(response) {
  const raw = await response.text()
  const trimmed = raw.trim()

  if (!trimmed) {
    throw new Error(
      'The server returned an empty response. Start the API from project/server (npm start) and ensure PORT in server/.env matches the Vite proxy in vite.config.js.'
    )
  }

  const type = response.headers.get('content-type') || ''
  if (!type.includes('application/json')) {
    throw new Error(
      'The server did not return JSON (often HTML from a proxy error or the wrong port). Ensure the Express API is running and that /api is proxied to the same PORT as in server/.env.'
    )
  }

  try {
    return JSON.parse(trimmed)
  } catch {
    throw new Error(
      'Unexpected server response. Make sure the API is running and reachable; the response was not valid JSON.'
    )
  }
}
