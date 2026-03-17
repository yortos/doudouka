import { createClient } from '@vercel/flags-core'
import { gridRedesignFlag } from '../src/flags.js'

// Reuse the client across warm invocations of this serverless function.
let flagsClient

async function getClient() {
  if (!flagsClient) {
    flagsClient = createClient(process.env.FLAGS)
    await flagsClient.initialize()
  }
  return flagsClient
}

/**
 * GET /api/flags
 *
 * Returns the resolved value of all feature flags for the current request.
 * The React app calls this once on mount to know which variants to render.
 *
 * Response: { "grid-redesign": boolean }
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const client = await getClient()
    const result = await client.evaluate(gridRedesignFlag.key, gridRedesignFlag.defaultValue)

    res.setHeader('Cache-Control', 'no-store')
    res.json({ [gridRedesignFlag.key]: result.value })
  } catch (err) {
    // Fall back to default values so a flag outage never breaks the app.
    console.error('[flags] evaluation error:', err)
    res.setHeader('Cache-Control', 'no-store')
    res.json({ [gridRedesignFlag.key]: gridRedesignFlag.defaultValue })
  }
}
