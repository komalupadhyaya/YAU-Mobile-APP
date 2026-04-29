/**
 * Vercel Serverless Function — acts as a CORS-safe proxy to the Expo Push API.
 * Deployed at: /api/push
 */
export default async function handler(req, res) {
  // Allow preflight CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await expoResponse.json();
    return res.status(expoResponse.status).json(data);
  } catch (error) {
    console.error('[Proxy] Error forwarding to Expo:', error);
    return res.status(500).json({ error: 'Failed to forward notification request.' });
  }
}
