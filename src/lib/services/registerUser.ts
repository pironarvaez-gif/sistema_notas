import { supabase } from "../../utils/supabaseClient";

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  role: "student" | "teacher";
  level?: string | null;
  grade?: string | null;
}

/**
 * Registra un usuario:
 * 1) Crea el usuario en Supabase Auth (email/password).
 * 2) Inserta el perfil en la tabla public.users usando el mismo id de auth.users.
 */
export async function registerUser(payload: RegisterPayload) {
  const { email, password, name, role, level, grade } = payload;

  try {
    // 1) Registro en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role, level, grade }, // metadata opcional
      },
    });

    if (error) {
      console.error("Error en auth.signUp:", error);
      throw error;
    }

    // En algunos proyectos el signUp no entrega sesión (por confirmación de email),
    // lo que provoca que la siguiente inserción se haga como anon y falle si hay RLS.
    // Intentamos hacer signIn inmediatamente para obtener un JWT si no hay sesión.
    let userId = data.user?.id;
    let session = (data as any).session;
    if (!session) {
      try {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          console.warn("signInWithPassword falló tras signUp (puede requerir verificación de email):", signInError);
        } else {
          session = (signInData as any).session;
          userId = signInData.user?.id || userId;
        }
      } catch (siErr) {
        console.warn("Excepción al intentar signIn tras signUp:", siErr);
      }
    }

    if (!userId) {
      throw new Error("No se obtuvo el ID del usuario tras el signUp.");
    }
    // Verificar si el usuario ya existe en la tabla 'users'
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 significa "no rows found", lo cual es esperado si el usuario no existe
      console.error("Error al verificar usuario existente:", fetchError);
      throw fetchError;
    }

    if (existingUser) {
      console.warn(`Usuario con ID ${userId} ya existe en public.users. Saltando inserción.`);
      return data; // Retorna los datos del signUp si el perfil ya existe
    }

    // 2) Insertar perfil en tabla public.users
    // Llamamos a una función server-side (Netlify) que usa la service_role key
    // para crear el perfil incluso si el cliente no tiene sesión (por ejemplo,
    // cuando se requiere verificación de email antes de iniciar sesión).
    try {
      const resp = await fetch('/.netlify/functions/createProfile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, name, email, role, level, grade }),
      });

      if (!resp.ok) {
        const body = await resp.text();
        console.error('createProfile function failed:', resp.status, body);
        throw new Error('Failed to create profile via server function');
      }
    } catch (fnErr) {
      console.error('Error calling createProfile function:', fnErr);
      throw fnErr;
    }

    return data;
  } catch (e: any) {
    console.error("RegisterUser error global:", e);
    throw new Error(e?.message || "Error al registrar usuario");
  }
}
