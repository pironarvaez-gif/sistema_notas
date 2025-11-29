// Elimina un usuario de Supabase Auth usando la service_role key
export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const SERVICE_ROLE_KEY = (globalThis.Netlify?.env?.get?.('SUPABASE_SERVICE_ROLE_KEY')) || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const SUPABASE_URL = (globalThis.Netlify?.env?.get?.('SUPABASE_URL')) || process.env.SUPABASE_URL;

  let payload;
  try {
    payload = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { user_id } = payload;
  if (!user_id) {
    return new Response(JSON.stringify({ error: 'Missing user_id' }), { status: 400 });
  }

  // Supabase Admin API endpoint para eliminar usuario
  const url = `${SUPABASE_URL}/auth/v1/admin/users/${user_id}`;

  try {
    const resp = await fetch(url, {
      method: 'DELETE',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    if (!resp.ok) {
      const body = await resp.text();
      return new Response(JSON.stringify({ error: 'Failed to delete user from Auth', details: body }), { status: resp.status });
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Exception deleting user', details: err.message }), { status: 500 });
  }
};
