import { createClient } from '@supabase/supabase-js';

// Usar directamente la URL de Supabase y la ANON KEY en el bundle.
// Netlify inyectará estas variables durante el build cuando estén
// configuradas en Site settings → Environment → Environment variables.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
  throw new Error('VITE_SUPABASE_URL no está definida o es inválida. Revisa tus variables de entorno en Netlify.');
}
if (!supabaseKey || supabaseKey.length < 20) {
  throw new Error('VITE_SUPABASE_ANON_KEY no está definida o es inválida. Revisa tus variables de entorno en Netlify.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Las funciones wrapper ahora siempre usan Supabase a través del proxy.

export async function getUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'student');
  if (error) throw error;
  return data;
}

export async function addUser({ name, email, password, level, grade }) {
  const { data, error } = await supabase
    .from('users')
    .insert([{ name, email, password, role: 'student', level, grade }])
    .select();
  if (error) throw error;
  return data;
}

// Buscar usuario por credenciales
export async function findUserByCredentials(role, email, password) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', role)
    .eq('email', email.toLowerCase())
    .eq('password', password)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function getGrades(studentId, isTeacher = false) {
  let query = supabase.from('grades').select('*');
  if (!isTeacher) query = query.eq('student_id', studentId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function updateGrades(studentId, subject, value) {
  const { data, error } = await supabase
    .from('grades')
    .upsert([{ student_id: studentId, subject, value }], {
      onConflict: 'student_id,subject',
    })
    .select();
  if (error) throw error;
  return data;
}

export async function deleteUser(userId) {
  // Primero eliminar notas asociadas (si existen)
  const { error: err1 } = await supabase
    .from('grades')
    .delete()
    .eq('student_id', userId);
  if (err1) throw err1;

  const { data, error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId)
    .select();
  if (error) throw error;
  return data;
}
