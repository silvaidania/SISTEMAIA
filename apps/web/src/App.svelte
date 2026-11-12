<script>
  import './app.css';
  import { onMount } from 'svelte';
  import { api, setSession, getStoredUser, getToken, clearSession } from './lib/api.js';

  let email = '';
  let password = '';
  let user = null;
  let loading = false;
  let error = '';
  let balance = [];

  async function login() {
    error = '';
    loading = true;

    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      setSession(data.token, data.user);
      user = data.user;
      await loadBalance();
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function loadBalance() {
    try {
      const data = await api('/load-balance/balance');
      balance = data.balance || [];
    } catch {
      balance = [];
    }
  }

  function logout() {
    clearSession();
    user = null;
    balance = [];
    email = '';
    password = '';
  }

  onMount(() => {
    const stored = getStoredUser();
    if (stored && getToken()) {
      user = stored;
      loadBalance();
    }
  });
</script>

{#if !user}
  <main class="app-shell">
    <section class="card">
      <div class="brand">
        <h1>Sistema IA</h1>
        <p>Administración de estadías estudiantiles</p>
      </div>

      <form on:submit|preventDefault={login}>
        <label for="email">Correo institucional</label>
        <input id="email" type="email" bind:value={email} required autocomplete="username" />

        <label for="password">Contraseña</label>
        <input id="password" type="password" bind:value={password} required autocomplete="current-password" />

        {#if error}
          <p class="error">{error}</p>
        {/if}

        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Iniciar sesión'}
        </button>
      </form>
    </section>
  </main>
{:else}
  <main class="dashboard">
    <header>
      <div>
        <h1>Panel de control</h1>
        <p class="muted">{user.full_name} · {user.role}</p>
      </div>
      <button type="button" on:click={logout}>Cerrar sesión</button>
    </header>

    <section class="grid">
      <article class="panel">
        <h2>Resumen</h2>
        <p class="muted">Base funcional mínima lista para continuar con módulos de documentos, revisores y observaciones.</p>
      </article>

      <article class="panel">
        <h2>Balance de cargas</h2>
        {#if balance.length === 0}
          <p class="muted">No hay revisores con balance cargado todavía.</p>
        {:else}
          <ul>
            {#each balance as row}
              <li>
                {row.full_name}: {row.pending_documents ?? 0} pendientes · capacidad {row.reviewer_capacity ?? 0}
              </li>
            {/each}
          </ul>
        {/if}
      </article>
    </section>
  </main>
{/if}
