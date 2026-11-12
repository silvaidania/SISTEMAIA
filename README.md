# Sistema IA - Universidades Tecnológicas

Monorepo para administración de documentos de estadías estudiantiles.

## Stack

- Frontend: Svelte + Vite
- Backend: Node.js + Express
- Base de datos: Supabase
- Almacenamiento: Supabase Storage
- Despliegue: Vercel

## Estructura

- `apps/web`: frontend Svelte
- `backend`: API Node/Express
- `supabase/migrations`: esquema SQL

## Requisitos

- Node.js 20+
- npm
- Proyecto Supabase creado

## Variables de entorno

Copia `.env.example` a `.env` en la raíz y en `backend/.env` si necesitas ejecutar el backend localmente.

Variables principales:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `VITE_API_URL`

Nunca subas `.env` al repositorio.

## Base de datos

Aplica las migraciones en Supabase:

```bash
supabase db push
```

Si no usas Supabase CLI, pega el contenido de los archivos en `supabase/migrations/` en el SQL Editor de Supabase, en orden.

## Desarrollo local

Instala dependencias:

```bash
npm install
```

Ejecuta frontend y backend:

```bash
npm run dev:web
npm run dev:api
```

El frontend queda en `http://localhost:5173` y el backend en `http://localhost:4000`.

## Seed inicial

Después de configurar Supabase, crea un usuario administrador:

```bash
npm --workspace backend run seed:admin
```

Puedes personalizarlo con:

- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
- `SEED_ADMIN_NAME`

## Flujo de documentos

1. El estudiante sube un documento desde la pestaña **Enviar**.
2. El backend guarda el archivo en Supabase Storage.
3. El sistema asigna automáticamente un revisor según el balance de cargas.
4. El revisor puede agregar observaciones o aprobar/rechazar el documento.
5. Si hay observaciones, el estudiante puede enviar una corrección.
6. El documento corregido vuelve a revisión.
7. La aprobación final marca el documento como `approved`.

## Seguridad implementada

- Contraseñas hasheadas con `bcryptjs`
- JWT para autenticación
- Variables sensibles fuera del código
- Row Level Security en Supabase
- Validación de roles en backend
- Balance de cargas para asignación de revisores
- Archivos privados en Supabase Storage

## Vercel

Este proyecto está preparado como monorepo:

- `apps/web` puede desplegarse como frontend estático.
- `backend` puede desplegarse como proyecto separado con `backend/vercel.json`.
- Actualiza `VITE_API_URL` para apuntar a la URL real del backend.
- Configura todas las variables de entorno en Vercel.
