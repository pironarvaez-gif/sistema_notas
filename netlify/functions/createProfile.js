
export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  // Usar Netlify.env.get si está disponible, si no process.env
  const SUPABASE_URL = (globalThis.Netlify?.env?.get?.('SUPABASE_URL')) || (globalThis.Netlify?.env?.get?.('VITE_SUPABASE_URL')) || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SERVICE_ROLE_KEY = (globalThis.Netlify?.env?.get?.('SUPABASE_SERVICE_ROLE_KEY')) || (globalThis.Netlify?.env?.get?.('SERVICE_ROLE_KEY')) || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Supabase URL or service role key not configured' }), { status: 500 });
  }

  let payload;
  try {
    payload = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { id, name, email, role, level, grade } = payload;
  if (!id || !email || !name || !role) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  const url = `${SUPABASE_URL}/rest/v1/users`;

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify([
        { id, name, email, role, level, grade }
      ]),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: 'Failed to insert profile', details: data }), { status: resp.status });
    }
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to insert profile', details: err.message }), { status: 500 });
  }
};
