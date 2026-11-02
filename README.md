# E-fact Web — Frontend

Frontend de E-fact Web construido con Next.js App Router.

## Desarrollo local

1. Configurá el backend en `back/.env` a partir de `back/.env.example` y definí `AUTH_TOKEN_SECRET` con un valor aleatorio de al menos 32 caracteres.
2. Iniciá el backend desde `back/` con `pnpm start:dev` (por defecto escucha en `http://localhost:3000`).
3. Copiá `front/.env.example` a `front/.env.local` y revisá `BACKEND_URL`.
4. Iniciá el frontend desde `front/` con `pnpm dev` para desarrollo local por HTTP.

Para probar desde un celular y usar la cámara del escáner, detené ese servidor y ejecutá `pnpm dev:mobile`. Este comando genera un certificado HTTPS para la IP local detectada y muestra la app en `https://<IP-local>:3001`. La primera vez, instalá en el celular el certificado raíz `rootCA.pem` de mkcert, cuya ubicación informa Next.js al iniciar; después el navegador podrá confiar en el certificado y permitir el acceso a la cámara.

El inicio de sesión de superadmin está en `/admin/login`. La ruta `/admin` valida la sesión contra el backend y redirige al login si no es válida.

## Comandos

- `pnpm dev`: servidor local.
- `pnpm lint`: ESLint.
- `pnpm build`: compilación de producción.
- `pnpm start`: servidor de producción.
