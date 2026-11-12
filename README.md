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

## Reportes y métricas

Los usuarios con rol `admin` o `coordinator` tienen acceso a la pestaña **Reportes** con las siguientes vistas:

- **Métricas del sistema**: totales de documentos por estado, usuarios y observaciones.
- **Documentos por estado**: distribución de documentos según su estado actual.
- **Documentos por universidad**: cantidad de documentos por institución.
- **Documentos por periodo**: cantidad de documentos por periodo académico.
- **Rendimiento de revisores**: carga, documentos completados, tasa de aprobación y tiempo promedio de revisión.
- **Progreso de estudiantes**: documentos totales, aprobados, en progreso y tasa de completado.
- **Resumen de observaciones**: observaciones por severidad y estado, más las más recientes.
- **Reporte académico**: listado detallado de documentos con información del estudiante, revisor y periodo.

Los reportes de revisores, estudiantes y académico se pueden exportar a CSV.

## Notificaciones

El sistema envía notificaciones automáticas cuando un documento cambia de estado. Los usuarios reciben notificaciones en la campana del panel de control.

### Eventos que generan notificaciones

- Documento enviado
- Documento asignado a revisor
- Documento en revisión
- Documento con observaciones
- Documento corregido
- Documento aprobado
- Documento rechazado

### Funcionalidades

- Campana de notificaciones con contador de no leídas
- Lista de notificaciones con fecha relativa
- Marcar como leída individual o todas
- Clic en notificación navega al documento correspondiente
- Notificaciones en tiempo real para cambios de estado

## Gestión de usuarios

Los usuarios con rol `admin` tienen acceso a la pestaña **Usuarios** para gestionar el sistema.

### Funcionalidades

- **Crear usuarios**: registrar nuevos usuarios con roles (admin, coordinator, reviewer, student).
- **Datos de estudiante**: al crear un estudiante, se registran código, carrera, semestre y universidad.
- **Editar usuarios**: modificar nombre, rol, estado activo y capacidad de revisión.
- **Eliminar usuarios**: eliminar usuarios del sistema (elimina también el usuario de autenticación).
- **Restablecer contraseña**: generar una nueva contraseña para cualquier usuario.
- **Filtrar usuarios**: por rol, estado activo/inactivo y búsqueda por email o nombre.
- **Ver información**: email, rol, estado, datos de estudiante (si aplica) y carga de trabajo para revisores.

### Roles disponibles

- **admin**: acceso completo al sistema, gestión de usuarios, reportes y configuración.
- **coordinator**: acceso a documentos, reportes y balance de cargas.
- **reviewer**: acceso a documentos asignados, observaciones y balance de cargas.
- **student**: acceso a envío de documentos y visualización de sus propios documentos.

## Dashboard con gráficos

Los usuarios con rol `admin` o `coordinator` tienen acceso a la pestaña **Dashboard** con visualizaciones interactivas de métricas del sistema.

### Gráficos disponibles

- **Documentos por estado**: gráfico de dona que muestra la distribución de documentos según su estado actual (enviado, en revisión, observado, corregido, aprobado, rechazado).
- **Documentos por universidad**: gráfico de barras que muestra la cantidad de documentos por institución.
- **Documentos por periodo**: gráfico de líneas que muestra la evolución de documentos por periodo académico.
- **Rendimiento de revisores**: gráfico de barras agrupadas que compara documentos completados y pendientes por revisor.
- **Progreso de estudiantes**: gráfico de barras agrupadas que muestra documentos aprobados y en progreso por estudiante.

### Características

- Gráficos interactivos con Chart.js
- Diseño responsive optimizado para celular
- Botón de actualización manual de datos
- Colores intuitivos para cada estado de documento
- Leyendas y tooltips informativos

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
