Para crear el usuario maestro 'sor.elia@maestro.com' con contraseña '123456' en Supabase:

1. Ve al panel de Supabase → Auth → Users → Add User.
2. Email: sor.elia@maestro.com
3. Contraseña: 123456
4. (Opcional) Marca "Confirm user" para que no requiera verificación de email.
5. Haz clic en "Create user".

Luego, en la tabla `users`, asegúrate de que exista el perfil:

1. Ve a Table Editor → users → Insert Row.
2. id: (copia el id del usuario creado en Auth)
3. name: Sor Elia
4. email: sor.elia@maestro.com
5. role: teacher
6. level: (puedes dejar vacío o poner "todos")
7. grade: (puedes dejar vacío)
8. Haz clic en "Save".

¡Listo! Ahora puedes iniciar sesión como maestro con ese usuario.
