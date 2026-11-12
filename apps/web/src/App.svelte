<script>
  import './app.css';
  import { onMount } from 'svelte';
  import { api, setSession, getStoredUser, getToken, clearSession } from './lib/api.js';
  import DocumentList from './components/DocumentList.svelte';
  import DocumentForm from './components/DocumentForm.svelte';
  import DocumentDetail from './components/DocumentDetail.svelte';
  import Reports from './components/Reports.svelte';
  import Notifications from './components/Notifications.svelte';
  import Users from './components/Users.svelte';
  import Dashboard from './components/Dashboard.svelte';
  import FilePreview from './components/FilePreview.svelte';

  let email = '';
  let password = '';
  let user = null;
  let loading = false;
  let error = '';
  let success = '';
  let activeTab = 'documents';
  let documents = [];
  let periods = [];
  let balance = [];
  let selectedDocument = null;
  let showFilePreview = false;
  let previewStoragePath = '';

  async function login() {
    error = '';
    success = '';
    loading = true;

    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      setSession(data.token, data.user);
      user = data.user;
      await loadAll();
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function loadAll() {
    await Promise.all([loadDocuments(), loadPeriods(), loadBalance()]);
  }

  async function loadDocuments() {
    try {
      const data = await api('/documents');
      documents = data.documents || [];
    } catch (err) {
      error = err.message;
    }
  }

  async function loadPeriods() {
    try {
      const data = await api('/academic-periods');
      periods = data.periods || [];
    } catch {
      periods = [];
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

  async function selectDocument(id) {
    try {
      const data = await api(`/documents/${id}`);
      selectedDocument = data.document;
      activeTab = 'documents';
    } catch (err) {
      error = err.message;
    }
  }

  async function submitDocument(event) {
    error = '';
    success = '';
    try {
      const { title, documentType, academicPeriodId, file } = event.detail;
      const formData = new FormData();
      formData.append('title', title);
      formData.append('documentType', documentType);
      formData.append('academicPeriodId', academicPeriodId);
      if (file && file.length > 0) {
        formData.append('file', file[0]);
      }

      await api('/documents/upload', {
        method: 'POST',
        body: formData
      });
      success = 'Documento enviado correctamente';
      await loadDocuments();
    } catch (err) {
      error = err.message;
    }
  }

  async function addObservation(event) {
    if (!selectedDocument) return;
    error = '';
    try {
      await api(`/documents/${selectedDocument.id}/observations`, {
        method: 'POST',
        body: JSON.stringify(event.detail)
      });
      success = 'Observación agregada';
      await selectDocument(selectedDocument.id);
      await loadDocuments();
    } catch (err) {
      error = err.message;
    }
  }

  async function submitDecision(event) {
    if (!selectedDocument) return;
    error = '';
    try {
      await api(`/documents/${selectedDocument.id}/decision`, {
        method: 'POST',
        body: JSON.stringify(event.detail)
      });
      success = 'Decisión registrada';
      await selectDocument(selectedDocument.id);
      await loadDocuments();
      await loadBalance();
    } catch (err) {
      error = err.message;
    }
  }

  async function submitCorrection(event) {
    if (!selectedDocument) return;
    error = '';
    try {
      await api(`/documents/${selectedDocument.id}/correction`, {
        method: 'POST',
        body: JSON.stringify(event.detail)
      });
      success = 'Corrección enviada';
      await selectDocument(selectedDocument.id);
      await loadDocuments();
    } catch (err) {
      error = err.message;
    }
  }

  function handlePreviewFile(event) {
    previewStoragePath = event.detail.storagePath;
    showFilePreview = true;
  }

  function closeFilePreview() {
    showFilePreview = false;
    previewStoragePath = '';
  }

  async function assignAuto(id) {
    error = '';
    try {
      await api(`/documents/${id}/assign`, {
        method: 'POST',
        body: JSON.stringify({ auto: true })
      });
      success = 'Revisor asignado automáticamente';
      await loadDocuments();
      await loadBalance();
      if (selectedDocument?.id === id) {
        await selectDocument(id);
      }
    } catch (err) {
      error = err.message;
    }
  }

  function logout() {
    clearSession();
    user = null;
    documents = [];
    periods = [];
    balance = [];
    selectedDocument = null;
    email = '';
    password = '';
    error = '';
    success = '';
  }

  onMount(() => {
    const stored = getStoredUser();
    if (stored && getToken()) {
      user = stored;
      loadAll();
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
      <div style="display: flex; align-items: center; gap: 1rem;">
        <Notifications user={user} on:select-document={selectDocument} />
        <button type="button" class="secondary" on:click={logout}>Cerrar sesión</button>
      </div>
    </header>

    <nav class="tabs">
      <button type="button" class="tab" class:active={activeTab === 'documents'} on:click={() => (activeTab = 'documents')}>
        Documentos
      </button>
      {#if ['admin', 'coordinator'].includes(user.role)}
        <button type="button" class="tab" class:active={activeTab === 'dashboard'} on:click={() => (activeTab = 'dashboard')}>
          Dashboard
        </button>
      {/if}
      {#if ['admin', 'coordinator', 'reviewer'].includes(user.role)}
        <button type="button" class="tab" class:active={activeTab === 'balance'} on:click={() => (activeTab = 'balance')}>
          Balance
        </button>
      {/if}
      {#if ['admin', 'coordinator'].includes(user.role)}
        <button type="button" class="tab" class:active={activeTab === 'reports'} on:click={() => (activeTab = 'reports')}>
          Reportes
        </button>
      {/if}
      {#if user.role === 'admin'}
        <button type="button" class="tab" class:active={activeTab === 'users'} on:click={() => (activeTab = 'users')}>
          Usuarios
        </button>
      {/if}
      {#if user.role === 'student'}
        <button type="button" class="tab" class:active={activeTab === 'submit'} on:click={() => (activeTab = 'submit')}>
          Enviar
        </button>
      {/if}
    </nav>

    {#if error}
      <p class="error">{error}</p>
    {/if}
    {#if success}
      <p class="success">{success}</p>
    {/if}

    {#if activeTab === 'documents'}
      <section class="grid">
        <article class="panel" style="grid-column: 1 / -1;">
          <h2>Documentos</h2>
          <DocumentList documents={documents} onSelect={selectDocument} />
        </article>

        {#if selectedDocument}
          <article class="panel" style="grid-column: 1 / -1;">
            <DocumentDetail
              document={selectedDocument}
              role={user.role}
              on:add-observation={addObservation}
              on:decision={submitDecision}
              on:correction={submitCorrection}
              on:preview-file={handlePreviewFile}
            />
            {#if ['admin', 'coordinator'].includes(user.role) && !selectedDocument.reviewer_id}
              <div class="actions">
                <button type="button" on:click={() => assignAuto(selectedDocument.id)}>Asignar revisor automático</button>
              </div>
            {/if}
          </article>
        {/if}
      </section>
    {/if}

    {#if activeTab === 'balance'}
      <section class="grid">
        <article class="panel">
          <h2>Balance de cargas</h2>
          {#if balance.length === 0}
            <p class="muted">No hay revisores con balance cargado todavía.</p>
          {:else}
            <div class="list">
              {#each balance as row}
                <div class="list-item">
                  <strong>{row.full_name}</strong>
                  <p class="muted">
                    {row.pending_documents ?? 0} pendientes · capacidad {row.reviewer_capacity ?? 0} · disponibles {row.available_capacity ?? 0}
                  </p>
                </div>
              {/each}
            </div>
          {/if}
        </article>
      </section>
    {/if}

    {#if activeTab === 'dashboard'}
      <Dashboard user={user} />
    {/if}

    {#if activeTab === 'reports'}
      <Reports user={user} />
    {/if}

    {#if activeTab === 'users'}
      <Users user={user} />
    {/if}

    {#if activeTab === 'submit'}
      <section class="grid">
        <article class="panel" style="grid-column: 1 / -1;">
          <h2>Enviar documento</h2>
          <DocumentForm periods={periods} on:submit={submitDocument} />
        </article>
      </section>
    {/if}

    <FilePreview
      storagePath={previewStoragePath}
      show={showFilePreview}
      on:close={closeFilePreview}
    />
  </main>
{/if}
