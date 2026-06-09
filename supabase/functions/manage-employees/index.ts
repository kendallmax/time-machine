import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      throw new Error('Faltan variables de entorno de Supabase en la funcion.');
    }

    const authorization = req.headers.get('Authorization');
    const token = authorization?.replace('Bearer ', '');

    if (!authorization || !token) {
      return jsonResponse({ error: 'No autorizado.' }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey);
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: authData, error: authError } = await userClient.auth.getUser(token);

    if (authError || !authData.user) {
      return jsonResponse({ error: 'No fue posible validar la sesion.' }, 401);
    }

    if (!isAdminUser(authData.user)) {
      return jsonResponse({ error: 'Solo administradores de RRHH pueden usar esta funcion.' }, 403);
    }

    const payload = await req.json();
    const action = payload?.action;

    if (action === 'create') {
      const email = String(payload.email || '').trim();
      const password = String(payload.password || '').trim();
      const nombre = String(payload.nombre || '').trim();
      const apellidos = String(payload.apellidos || '').trim();
      const isAdmin = Boolean(payload.isAdmin);
      const isActive = payload.isActive !== false;

      if (!email || !password || !nombre || !apellidos) {
        return jsonResponse({ error: 'Email, contrasena, nombre y apellidos son obligatorios.' }, 400);
      }

      if (password.length < 6) {
        return jsonResponse({ error: 'La contrasena debe tener al menos 6 caracteres.' }, 400);
      }

      const displayName = `${nombre} ${apellidos}`.trim();

      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          nombre,
          apellidos,
          display_name: displayName,
          full_name: displayName,
          is_admin: isAdmin,
          is_active: isActive,
          role: isAdmin ? 'admin' : 'employee',
        },
        app_metadata: {
          role: isAdmin ? 'admin' : 'employee',
        },
      });

      if (error) {
        return jsonResponse({ error: error.message }, 400);
      }

      return jsonResponse({ user: data.user }, 200);
    }

    if (action === 'update') {
      const userId = String(payload.userId || '').trim();
      const email = String(payload.email || '').trim();
      const password = String(payload.password || '').trim();
      const nombre = String(payload.nombre || '').trim();
      const apellidos = String(payload.apellidos || '').trim();
      const isAdmin = Boolean(payload.isAdmin);
      const isActive = payload.isActive !== false;

      if (!userId || !email || !nombre || !apellidos) {
        return jsonResponse({ error: 'Faltan datos obligatorios para actualizar el empleado.' }, 400);
      }

      const { data: existingData, error: existingError } = await adminClient.auth.admin.getUserById(userId);

      if (existingError || !existingData.user) {
        return jsonResponse({ error: existingError?.message || 'No encontramos el usuario.' }, 404);
      }

      if (existingData.user.id === authData.user.id && !isAdmin) {
        return jsonResponse({ error: 'No puedes quitarte a ti mismo el rol de administrador.' }, 400);
      }

      const displayName = `${nombre} ${apellidos}`.trim();
      const currentMetadata = existingData.user.user_metadata || {};
      const currentAppMetadata = existingData.user.app_metadata || {};

      const { data, error } = await adminClient.auth.admin.updateUserById(userId, {
        email,
        password: password || undefined,
        user_metadata: {
          ...currentMetadata,
          nombre,
          apellidos,
          display_name: displayName,
          full_name: displayName,
          is_admin: isAdmin,
          is_active: isActive,
          role: isAdmin ? 'admin' : 'employee',
        },
        app_metadata: {
          ...currentAppMetadata,
          role: isAdmin ? 'admin' : 'employee',
        },
      });

      if (error) {
        return jsonResponse({ error: error.message }, 400);
      }

      return jsonResponse({ user: data.user }, 200);
    }

    if (action === 'delete') {
      const userId = String(payload.userId || '').trim();

      if (!userId) {
        return jsonResponse({ error: 'El identificador del usuario es obligatorio.' }, 400);
      }

      if (userId === authData.user.id) {
        return jsonResponse({ error: 'No puedes eliminar tu propia cuenta de administrador.' }, 400);
      }

      const { error } = await adminClient.auth.admin.deleteUser(userId);

      if (error) {
        return jsonResponse({ error: error.message }, 400);
      }

      return jsonResponse({ success: true }, 200);
    }

    return jsonResponse({ error: 'Accion no soportada.' }, 400);
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Error interno.' }, 500);
  }
});

function isAdminUser(user: { user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> }) {
  return Boolean(
    user.user_metadata?.is_admin === true ||
    user.user_metadata?.role === 'admin' ||
    user.app_metadata?.role === 'admin'
  );
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}
