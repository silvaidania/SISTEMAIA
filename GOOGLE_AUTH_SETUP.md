# Guía para configurar autenticación con Google en Supabase

## 1. Configurar Google OAuth en Supabase

### Paso 1: Obtener credenciales de Google

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **APIs & Services** > **Credentials**
4. Haz clic en **Create Credentials** > **OAuth 2.0 Client IDs**
5. Configura la aplicación:
   - **Application type**: Web application
   - **Name**: Sistema IA - Estadías
   - **Authorized JavaScript origins**: 
     - `http://localhost:5173`
     - `https://tu-dominio-vercel.vercel.app` (tu dominio de producción)
   - **Authorized redirect URIs**:
     - `http://localhost:5173`
     - `https://tu-dominio-vercel.vercel.app`

6. Copia el **Client ID** y **Client Secret**

### Paso 2: Configurar en Supabase

1. Ve a tu proyecto de Supabase: https://kqoytxpgcvkfcvojmktk.supabase.co
2. Ve a **Authentication** > **Providers**
3. Busca **Google** y actívalo
4. Pega el **Client ID** y **Client Secret** de Google
5. Guarda la configuración

## 2. Aplicar la migración del trigger

La migración `20261112030000_auth_trigger.sql` crea un trigger que automáticamente crea perfiles cuando los usuarios se registran.

### Opción A: Aplicar manualmente en SQL Editor

1. Ve a **SQL Editor** en Supabase
2. Copia el contenido de `supabase/migrations/20261112030000_auth_trigger.sql`
3. Pégalo en el SQL Editor
4. Haz clic en **Run**

### Opción B: Usar Supabase CLI (si está configurado)

```bash
cd backend
npx supabase db push
```

## 3. Variables de entorno

Asegúrate de que el archivo `apps/web/.env` tenga las credenciales correctas:

```env
VITE_SUPABASE_URL=https://kqoytxpgcvkfcvojmktk.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

## 4. Probar la autenticación

1. Inicia el servidor de desarrollo:
   ```bash
   cd apps/web
   npm run dev
   ```

2. Abre http://localhost:5173

3. Verás la pantalla de login con:
   - Botón "Continuar con Google"
   - Formulario de email/contraseña
   - Opción de registro

4. Prueba el login con Google:
   - Haz clic en "Continuar con Google"
   - Autoriza la aplicación
   - Serás redirigido de vuelta al sistema
   - Se creará automáticamente tu perfil con rol "student"

## 5. Roles de usuario

Por defecto, los usuarios nuevos se crean con rol "student". Para cambiar el rol:

1. Ve a **Table Editor** > **profiles**
2. Encuentra tu usuario
3. Cambia el campo `role` a uno de: `admin`, `coordinator`, `reviewer`, `student`

O usa la interfaz de administración del sistema una vez que tengas un admin.

## 6. Configuración de producción

Para producción en Vercel:

1. Ve a tu proyecto de Vercel
2. Ve a **Settings** > **Environment Variables**
3. Agrega las variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Redeploy el proyecto

## Notas importantes

- Los usuarios que se registren con Google tendrán automáticamente el rol "student"
- Los usuarios pueden cambiar su contraseña desde Supabase Auth
- Las sesiones se manejan automáticamente por Supabase
- El sistema es compatible con el login anterior (JWT) durante la transición
