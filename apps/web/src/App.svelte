<script>
  import './app.css';
  import { onMount } from 'svelte';
  import { api, setSession, getStoredUser, getToken, clearSession } from './lib/api.js';
  import { supabase } from './lib/supabase.js';
  import Home from './components/Home.svelte';
  import Auth from './components/Auth.svelte';
  import DocumentList from './components/DocumentList.svelte';
  import DocumentForm from './components/DocumentForm.svelte';
  import DocumentDetail from './components/DocumentDetail.svelte';
  import DocumentSearch from './components/DocumentSearch.svelte';
  import Reports from './components/Reports.svelte';
  import Notifications from './components/Notifications.svelte';
  import Users from './components/Users.svelte';
  import Dashboard from './components/Dashboard.svelte';
  import FilePreview from './components/FilePreview.svelte';
  import SystemConfig from './components/SystemConfig.svelte';
  import GeofenceMap from './components/GeofenceMap.svelte';
  import Sitemap from './components/Sitemap.svelte';

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
  let universities = [];
  let reviewers = [];
  let students = [];
  let searchFilters = '';
  let showHome = true;
  let showAuth = false;
  let authMode = 'login';
  let userPermissions = {};

  // Definición de permisos por rol
  const rolePermissions = {
    admin: ['documents', 'dashboard', 'balance', 'reports', 'geofences', 'users', 'config', 'submit'],
    coordinator: ['documents', 'dashboard', 'balance', 'reports', 'geofences'],
    reviewer: ['documents', 'balance', 'reports'],
    student: ['documents', 'submit']
  };

  async function handleLogin(event) {
    const { user: profile, token } = event.detail;
    setSession(token, profile);
    user = profile;
    
    // Verificar y establecer permisos según el rol
    if (profile && profile.role) {
      userPermissions = {
        role: profile.role,
        allowedTabs: rolePermissions[profile.role] || [],
        canAccess: (tab) => (rolePermissions[profile.role] || []).includes(tab)
      };
      
      // Establecer el tab inicial según los permisos
      const allowedTabs = rolePermissions[profile.role] || [];
      if (allowedTabs.length > 0) {
        activeTab = allowedTabs[0];
      }
    }
    
    // Mantener en la página principal pero con usuario autenticado
    // El usuario podrá navegar al dashboard desde la página principal
    showHome = true;
    showAuth = false;
    await loadAll();
  }

  function goToLogin() {
    showHome = false;
    showAuth = true;
    authMode = 'login';
  }

  function goToRegister() {
    showHome = false;
    showAuth = true;
    authMode = 'signup';
  }

  function handleSitemapNavigate(event) {
    const { tab } = event.detail;
    if (!user) {
      // Si no hay usuario, manejar navegación pública
      if (tab === 'home') {
        showHome = true;
        showAuth = false;
      } else if (tab === 'login') {
        showHome = false;
        showAuth = true;
        authMode = 'login';
      } else if (tab === 'register') {
        showHome = false;
        showAuth = true;
        authMode = 'signup';
      } else {
        // Otros módulos requieren login
        showHome = false;
        showAuth = true;
        authMode = 'login';
      }
      return;
    }
    
    if (tab === 'logout') {
      logout();
      return;
    }
    
    // Verificar permisos antes de navegar
    if (userPermissions.canAccess && userPermissions.canAccess(tab)) {
      activeTab = tab;
    } else {
      error = 'No tienes permisos para acceder a este módulo';
      // Redirigir al primer tab permitido
      const allowedTabs = userPermissions.allowedTabs || [];
      if (allowedTabs.length > 0) {
        activeTab = allowedTabs[0];
      }
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    clearSession();
    user = null;
    userPermissions = {};
    documents = [];
    periods = [];
    balance = [];
    activeTab = 'documents';
  }

  async function loadAll() {
    await Promise.all([loadDocuments(), loadPeriods(), loadBalance(), loadUniversities(), loadReviewers(), loadStudents()]);
  }

  async function loadDocuments() {
    try {
      const url = searchFilters ? `/documents?${searchFilters}` : '/documents';
      const data = await api(url);
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

  async function loadUniversities() {
    try {
      const data = await api('/universities');
      universities = data.universities || [];
    } catch {
      universities = [];
    }
  }

  async function loadReviewers() {
    try {
      const data = await api('/load-balance/reviewers');
      reviewers = data.reviewers || [];
    } catch {
      reviewers = [];
    }
  }

  async function loadStudents() {
    try {
      if (user.role === 'admin' || user.role === 'coordinator') {
        const data = await api('/users?role=student');
        students = (data.users || []).map(u => ({
          id: u.student?.id,
          full_name: u.full_name,
          student_code: u.student?.student_code
        })).filter(s => s.id);
      }
    } catch {
      students = [];
    }
  }

  async function handleSearch(event) {
    searchFilters = event.detail.params;
    await loadDocuments();
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

  function goToDashboard() {
    showHome = false;
    showAuth = false;
  }

  async function logout() {
    await handleLogout();
    showHome = true;
    showAuth = false;
  }

  onMount(() => {
    // Función para establecer permisos del usuario
    function setUserPermissions(profile) {
      if (profile && profile.role) {
        userPermissions = {
          role: profile.role,
          allowedTabs: rolePermissions[profile.role] || [],
          canAccess: (tab) => (rolePermissions[profile.role] || []).includes(tab)
        };
        
        // Establecer el tab inicial según los permisos
        const allowedTabs = rolePermissions[profile.role] || [];
        if (allowedTabs.length > 0) {
          activeTab = allowedTabs[0];
        }
      }
    }

    // Verificar permisos al cargar la página
    const storedUser = getStoredUser();
    if (storedUser && storedUser.role) {
      setUserPermissions(storedUser);
    }

    // Escuchar cambios de autenticación de Supabase
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        // Usuario autenticado
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setSession(session.access_token, profile);
          user = profile;
          setUserPermissions(profile);
          await loadAll();
        }
      } else {
        // Usuario no autenticado
        clearSession();
        user = null;
        userPermissions = {};
      }
    });

    // Verificar sesión existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.auth.onAuthStateChange(null, session);
      }
    });
  });
</script>

{#if !user}
  {#if showHome}
    <Home on:login={goToLogin} on:register={goToRegister} />
  {:else if showAuth}
    <main class="app-shell">
      <section class="card">
        <div class="brand">
          <h1>Sistema IA</h1>
          <p>Administración de estadías estudiantiles</p>
        </div>

        <Auth on:login={handleLogin} initialMode={authMode} />
      </section>
    </main>
  {/if}
{:else}
  {#if showHome}
    <Home
      user={user}
      on:dashboard={goToDashboard}
      on:logout={logout}
    />
  {:else}
    <main class="dashboard-layout">
      <aside class="sidebar">
        <Sitemap
          user={user}
          currentTab={activeTab}
          isSidebar={true}
          userPermissions={userPermissions}
          on:navigate={handleSitemapNavigate}
        />
      </aside>

      <div class="main-content">
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

        {#if error}
          <p class="error">{error}</p>
        {/if}
        {#if success}
          <p class="success">{success}</p>
        {/if}

        {#if userPermissions.canAccess('documents')}
          {#if activeTab === 'documents'}
            <section class="grid">
              <article class="panel" style="grid-column: 1 / -1;">
                <DocumentSearch
                  {universities}
                  {periods}
                  {reviewers}
                  {students}
                  on:search={handleSearch}
                />
              </article>

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
        {/if}

        {#if userPermissions.canAccess('balance')}
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
        {/if}

        {#if userPermissions.canAccess('dashboard')}
          {#if activeTab === 'dashboard'}
            <Dashboard user={user} />
          {/if}
        {/if}

        {#if userPermissions.canAccess('reports')}
          {#if activeTab === 'reports'}
            <Reports user={user} />
          {/if}
        {/if}

        {#if userPermissions.canAccess('geofences')}
          {#if activeTab === 'geofences'}
            <section class="grid">
              <article class="panel" style="grid-column: 1 / -1; height: 80vh;">
                <GeofenceMap />
              </article>
            </section>
          {/if}
        {/if}

        {#if userPermissions.canAccess('users')}
          {#if activeTab === 'users'}
            <Users user={user} />
          {/if}
        {/if}

        {#if userPermissions.canAccess('config')}
          {#if activeTab === 'config'}
            <SystemConfig user={user} />
          {/if}
        {/if}

        {#if userPermissions.canAccess('submit')}
          {#if activeTab === 'submit'}
            <section class="grid">
              <article class="panel" style="grid-column: 1 / -1;">
                <h2>Enviar documento</h2>
                <DocumentForm periods={periods} on:submit={submitDocument} />
              </article>
            </section>
          {/if}
        {/if}
      </div>

      <FilePreview
        storagePath={previewStoragePath}
        show={showFilePreview}
        on:close={closeFilePreview}
      />
    </main>
  {/if}
{/if}

<style>
  .dashboard-layout {
    display: flex;
    min-height: 100vh;
    background: #f8fafc;
  }

  .sidebar {
    width: 280px;
    background: white;
    border-right: 1px solid #e2e8f0;
    overflow-y: auto;
    flex-shrink: 0;
  }

  .main-content {
    flex: 1;
    padding: 2rem;
    overflow-y: auto;
  }

  .main-content header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .main-content header h1 {
    font-size: 1.75rem;
    font-weight: 700;
    color: #1e3a8a;
    margin: 0;
  }

  .main-content header .muted {
    font-size: 0.875rem;
    color: #64748b;
    margin: 0.25rem 0 0 0;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .dashboard-layout {
      flex-direction: column;
    }

    .sidebar {
      width: 100%;
      border-right: none;
      border-bottom: 1px solid #e2e8f0;
      max-height: 300px;
    }

    .main-content {
      padding: 1rem;
    }

    .main-content header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .main-content header h1 {
      font-size: 1.5rem;
    }
  }

  @media (max-width: 480px) {
    .sidebar {
      max-height: 200px;
    }

    .main-content {
      padding: 0.5rem;
    }
  }
</style>
