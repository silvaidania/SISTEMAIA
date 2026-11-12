# Configuración de Google OAuth en Supabase - Guía Paso a Paso

## Paso 1: Configurar Google Cloud Console

### 1.1 Acceder a Google Cloud Console

1. Ve a: https://console.cloud.google.com/
2. Inicia sesión con tu cuenta de Google
3. Si es tu primera vez, acepta los términos y condiciones

### 1.2 Crear un proyecto nuevo

1. En la parte superior, haz clic en el selector de proyectos
2. Haz clic en **"Nuevo proyecto"**
3. Completa la información:
   - **Nombre del proyecto**: `Sistema IA - Estadías`
   - **ID del proyecto**: se genera automáticamente
   - **Organización**: déjalo vacío (opcional)
   - **Ubicación**: déjalo vacío (opcional)
4. Haz clic en **"Crear"**
5. Espera a que se cree el proyecto (puede tardar unos segundos)

### 1.3 Habilitar Google+ API

1. En el menú lateral izquierdo, ve a **"APIs y servicios"** > **"Biblioteca"**
2. En la barra de búsqueda, escribe: `Google+ API`
3. Haz clic en **"Google+ API"**
4. Haz clic en **"Habilitar"**
5. Espera a que se habilite

### 1.4 Crear credenciales OAuth 2.0

1. Ve a **"APIs y servicios"** > **"Credenciales"**
2. Haz clic en **"Crear credenciales"** > **"ID de cliente de OAuth 2.0"**
3. Si te pide configurar la pantalla de consentimiento, hazlo primero:
   - **Nombre de la aplicación**: `Sistema IA - Estadías`
   - **Correo electrónico de soporte**: tu email
   - **Logo de la aplicación**: opcional (puedes subir uno)
   - **Dominio de la aplicación**: déjalo vacío
   - **Enlaces de la política de privacidad**: opcional
   - **Enlaces de los términos del servicio**: opcional
   - **Correo electrónico de contacto del desarrollador**: tu email
   - **Audiencia**: **Externo**
   - **Información de contacto**: tu email
   - Haz clic en **"Guardar y continuar"**

4. Ahora crea las credenciales:
   - **Tipo de aplicación**: **Aplicación web**
   - **Nombre**: `Sistema IA - Estadías - Web`
   - **Orígenes autorizados de JavaScript**:
     - `http://localhost:5173`
     - `https://tu-dominio-vercel.vercel.app` (tu dominio de producción)
   - **URI de redirección autorizados**:
     - `http://localhost:5173`
     - `https://tu-dominio-vercel.vercel.app`
   - Haz clic en **"Crear"**

5. **IMPORTANTE**: Copia y guarda:
   - **ID de cliente** (Client ID)
   - **Secreto del cliente** (Client Secret)

## Paso 2: Configurar en Supabase

### 2.1 Acceder a Supabase

1. Ve a: https://kqoytxpgcvkfcvojmktk.supabase.co
2. Inicia sesión con tu cuenta

### 2.2 Configurar proveedor de Google

1. En el menú lateral izquierdo, ve a **"Authentication"** > **"Providers"**
2. Busca **"Google"** en la lista de proveedores
3. Haz clic en **"Google"** para expandirlo
4. Activa el interruptor **"Enable Google provider"**
5. Pega las credenciales:
   - **Client ID**: pega el ID que copiaste de Google Cloud
   - **Client Secret**: pega el secreto que copiaste de Google Cloud
6. Haz clic en **"Save"**

### 2.3 Configurar URLs de redirección

1. Ve a **"Authentication"** > **"URL Configuration"**
2. En **"Site URL"**, ingresa:
   - Para desarrollo: `http://localhost:5173`
   - Para producción: `https://tu-dominio-vercel.vercel.app`
3. En **"Redirect URLs"**, agrega:
   - `http://localhost:5173`
   - `https://tu-dominio-vercel.vercel.app`
   - `http://localhost:5173/auth/callback`
   - `https://tu-dominio-vercel.vercel.app/auth/callback`
4. Haz clic en **"Save"**

## Paso 3: Aplicar la migración del trigger

### 3.1 Abrir SQL Editor

1. En Supabase, ve a **"SQL Editor"** en el menú lateral

### 3.2 Ejecutar la migración

1. Copia el contenido del archivo:
   `supabase/migrations/20261112030000_auth_trigger.sql`

2. Pégalo en el SQL Editor

3. Haz clic en **"Run"**

4. Verifica que no haya errores

## Paso 4: Configurar variables de entorno

### 4.1 Verificar archivo .env del frontend

Abre el archivo `apps/web/.env` y verifica que tenga:

```env
VITE_SUPABASE_URL=https://kqoytxpgcvkfcvojmktk.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### 4.2 Obtener la anon key

1. En Supabase, ve a **"Settings"** > **"API"**
2. Copia la **"anon public"** key
3. Pégala en `apps/web/.env` como `VITE_SUPABASE_ANON_KEY`

## Paso 5: Probar la configuración

### 5.1 Iniciar el servidor de desarrollo

```bash
cd apps/web
npm run dev
```

### 5.2 Probar el login con Google

1. Abre http://localhost:5173 en tu navegador
2. Verás la pantalla de login con el botón "Continuar con Google"
3. Haz clic en **"Continuar con Google"**
4. Serás redirigido a Google para autorizar
5. Selecciona tu cuenta de Google
6. Serás redirigido de vuelta al sistema
7. Se creará automáticamente tu perfil con rol "student"

### 5.3 Verificar en Supabase

1. Ve a **"Table Editor"** > **"profiles"**
2. Deberías ver tu nuevo usuario creado automáticamente

## Solución de problemas

### Error: "redirect_uri_mismatch"

- Verifica que las URLs de redirección en Google Cloud coincidan exactamente con las de Supabase
- Asegúrate de incluir el protocolo (http/https) y el puerto si es necesario

### Error: "Access blocked"

- Verifica que la pantalla de consentimiento de OAuth esté configurada correctamente
- Si estás en modo de prueba, agrega tu email como usuario de prueba

### Error: "Profile not found"

- Verifica que la migración del trigger se ejecutó correctamente
- Revisa los logs en Supabase para ver si hay errores

## Configuración de producción

Para producción en Vercel:

1. Ve a tu proyecto de Vercel
2. Ve a **"Settings"** > **"Environment Variables"**
3. Agrega:
   - `VITE_SUPABASE_URL` = tu URL de Supabase
   - `VITE_SUPABASE_ANON_KEY` = tu anon key
4. Redeploy el proyecto

5. En Google Cloud, agrega tu dominio de Vercel a las URLs autorizadas

## Notas importantes

- Los usuarios nuevos se crean automáticamente con rol "student"
- Para cambiar el rol, ve a **"Table Editor"** > **"profiles"** y modifica el campo `role`
- Los usuarios pueden cambiar su contraseña desde Supabase Auth
- Las sesiones se manejan automáticamente por Supabase
