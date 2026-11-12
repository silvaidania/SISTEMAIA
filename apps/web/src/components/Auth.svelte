<script>
  import { supabase } from '../lib/supabase.js';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  let email = '';
  let password = '';
  let fullName = '';
  let isSignUp = false;
  let loading = false;
  let error = '';
  let success = '';

  async function signInWithGoogle() {
    error = '';
    success = '';
    loading = true;

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) throw error;

      // La redirección se maneja automáticamente
      // El perfil se creará automáticamente por el trigger de Supabase
    } catch (err) {
      error = err.message;
      loading = false;
    }
  }

  async function signInWithEmail() {
    error = '';
    success = '';
    loading = true;

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName
            }
          }
        });

        if (error) throw error;

        success = 'Revisa tu correo para confirmar tu cuenta';
        loading = false;
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        // Obtener el perfil del usuario
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError || !profile) {
          // Si no existe el perfil, crearlo
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email,
              full_name: data.user.user_metadata?.full_name || data.user.email,
              role: 'student'
            })
            .select()
            .single();

          if (createError) throw createError;

          dispatch('login', { user: newProfile, token: data.session.access_token });
        } else {
          dispatch('login', { user: profile, token: data.session.access_token });
        }
      }
    } catch (err) {
      error = err.message;
      loading = false;
    }
  }

  function toggleMode() {
    isSignUp = !isSignUp;
    error = '';
    success = '';
  }
</script>

<div class="auth-container">
  <div class="auth-card">
    <h2>{isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}</h2>
    <p class="subtitle">Sistema de Gestión de Documentos de Estadías</p>

    {#if error}
      <div class="error-message">{error}</div>
    {/if}

    {#if success}
      <div class="success-message">{success}</div>
    {/if}

    <button
      type="button"
      class="google-button"
      on:click={signInWithGoogle}
      disabled={loading}
    >
      {#if loading}
        <span class="spinner"></span>
      {:else}
        <svg class="google-icon" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      {/if}
      Continuar con Google
    </button>

    <div class="divider">
      <span>o</span>
    </div>

    <form on:submit|preventDefault={signInWithEmail}>
      {#if isSignUp}
        <div class="form-group">
          <label for="fullName">Nombre completo</label>
          <input
            id="fullName"
            type="text"
            bind:value={fullName}
            placeholder="Tu nombre completo"
            required
          />
        </div>
      {/if}

      <div class="form-group">
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          bind:value={email}
          placeholder="tu@email.com"
          required
        />
      </div>

      <div class="form-group">
        <label for="password">Contraseña</label>
        <input
          id="password"
          type="password"
          bind:value={password}
          placeholder="••••••••"
          required
        />
      </div>

      <button type="submit" class="submit-button" disabled={loading}>
        {#if loading}
          <span class="spinner"></span>
        {:else}
          {isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
        {/if}
      </button>
    </form>

    <p class="toggle-text">
      {isSignUp ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
      <button type="button" class="toggle-button" on:click={toggleMode}>
        {isSignUp ? 'Inicia sesión' : 'Regístrate'}
      </button>
    </p>
  </div>
</div>

<style>
  .auth-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 1rem;
  }

  .auth-card {
    background: white;
    border-radius: 1rem;
    padding: 2rem;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  }

  h2 {
    text-align: center;
    margin-bottom: 0.5rem;
    color: #1f2937;
  }

  .subtitle {
    text-align: center;
    color: #6b7280;
    margin-bottom: 2rem;
    font-size: 0.875rem;
  }

  .error-message {
    background: #fee2e2;
    color: #dc2626;
    padding: 0.75rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
  }

  .success-message {
    background: #d1fae5;
    color: #059669;
    padding: 0.75rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
  }

  .google-button {
    width: 100%;
    padding: 0.75rem;
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.2s;
    margin-bottom: 1rem;
  }

  .google-button:hover {
    border-color: #4285f4;
    background: #f9fafb;
  }

  .google-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .google-icon {
    width: 20px;
    height: 20px;
  }

  .divider {
    display: flex;
    align-items: center;
    margin: 1.5rem 0;
    color: #9ca3af;
    font-size: 0.875rem;
  }

  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e5e7eb;
  }

  .divider span {
    padding: 0 1rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
    font-size: 0.875rem;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 1rem;
    transition: border-color 0.2s;
  }

  input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .submit-button {
    width: 100%;
    padding: 0.75rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
    margin-top: 1rem;
  }

  .submit-button:hover {
    transform: translateY(-1px);
  }

  .submit-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .toggle-text {
    text-align: center;
    margin-top: 1.5rem;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .toggle-button {
    background: none;
    border: none;
    color: #667eea;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    margin-left: 0.25rem;
  }

  .toggle-button:hover {
    text-decoration: underline;
  }

  .spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 480px) {
    .auth-card {
      padding: 1.5rem;
    }
  }
</style>
