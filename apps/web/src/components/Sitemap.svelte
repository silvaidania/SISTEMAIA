<script>
  import { createEventDispatcher } from 'svelte';

  export let user = null;
  export let currentTab = '';
  export let isSidebar = false;
  export let userPermissions = {};

  const dispatch = createEventDispatcher();

  function navigateToTab(tab) {
    // Verificar permisos antes de navegar
    if (user && userPermissions.canAccess && !userPermissions.canAccess(tab)) {
      return; // No tiene permiso
    }
    dispatch('navigate', { tab });
  }

  function goBack() {
    dispatch('back');
  }

  const roleConfigs = {
    public: {
      title: 'Inicio Público',
      icon: '🏠',
      color: '#1e3a8a',
      modules: [
        { name: 'Página de inicio', icon: '🏠', tab: 'home' },
        { name: 'Iniciar sesión', icon: '🔐', tab: 'login' },
        { name: 'Registrarse', icon: '📝', tab: 'register' },
        { name: 'Recuperar contraseña', icon: '🔑', tab: 'login' },
        { name: 'Aviso de privacidad', icon: '🛡️', tab: 'login' },
        { name: 'Ayuda y soporte', icon: '❓', tab: 'login' }
      ]
    },
    student: {
      title: 'Estudiante',
      icon: '🎓',
      color: '#3b82f6',
      modules: [
        { name: 'Panel principal', icon: '📊', tab: 'documents' },
        { name: 'Perfil y datos académicos', icon: '👤', tab: 'documents' },
        { name: 'Mi estadía', icon: '🏢', tab: 'documents' },
        { name: 'Empresa y proyecto', icon: '💼', tab: 'documents' },
        { name: 'Calendario de entregas', icon: '📅', tab: 'documents' },
        { name: 'Mis documentos', icon: '📄', tab: 'documents' },
        { name: 'Subir documento', icon: '⬆️', tab: 'submit' },
        { name: 'Historial de versiones', icon: '📝', tab: 'documents' },
        { name: 'Observaciones recibidas', icon: '⚠️', tab: 'documents' },
        { name: 'Corregir y reenviar', icon: '🔄', tab: 'documents' },
        { name: 'Estado de revisión', icon: '👁️', tab: 'documents' },
        { name: 'Avance general', icon: '📈', tab: 'documents' },
        { name: 'Notificaciones', icon: '🔔', tab: 'documents' },
        { name: 'Aprobación final', icon: '✅', tab: 'documents' },
        { name: 'Constancia o liberación', icon: '📜', tab: 'documents' },
        { name: 'Ayuda y soporte', icon: '❓', tab: 'documents' }
      ]
    },
    reviewer: {
      title: 'Revisor Académico',
      icon: '📋',
      color: '#6366f1',
      modules: [
        { name: 'Panel principal', icon: '📊', tab: 'documents' },
        { name: 'Estudiantes asignados', icon: '👥', tab: 'documents' },
        { name: 'Expediente del estudiante', icon: '📁', tab: 'documents' },
        { name: 'Visor de documentos', icon: '👁️', tab: 'documents' },
        { name: 'Validar documento', icon: '✅', tab: 'documents' },
        { name: 'Registrar observaciones', icon: '📝', tab: 'documents' },
        { name: 'Solicitar correcciones', icon: '🔄', tab: 'documents' },
        { name: 'Aprobar o rechazar', icon: '✔️', tab: 'documents' },
        { name: 'Historial de revisiones', icon: '📋', tab: 'documents' },
        { name: 'Seguimiento del avance', icon: '📈', tab: 'balance' },
        { name: 'Notificaciones', icon: '🔔', tab: 'documents' },
        { name: 'Reportes de revisión', icon: '📊', tab: 'reports' }
      ]
    },
    coordinator: {
      title: 'Coordinador de Estadías',
      icon: '⚙️',
      color: '#8b5cf6',
      modules: [
        { name: 'Panel general', icon: '📊', tab: 'dashboard' },
        { name: 'Gestión de estudiantes', icon: '👥', tab: 'documents' },
        { name: 'Gestión de revisores', icon: '📋', tab: 'users' },
        { name: 'Asignación automática o manual', icon: '⚖️', tab: 'documents' },
        { name: 'Gestión de periodos y fechas límite', icon: '📅', tab: 'config' },
        { name: 'Catálogo de documentos requeridos', icon: '📚', tab: 'config' },
        { name: 'Lineamientos y formatos', icon: '📖', tab: 'config' },
        { name: 'Seguimiento global', icon: '📈', tab: 'dashboard' },
        { name: 'Documentos pendientes', icon: '⏳', tab: 'documents' },
        { name: 'Observaciones sin resolver', icon: '⚠️', tab: 'documents' },
        { name: 'Aprobaciones finales', icon: '✅', tab: 'documents' },
        { name: 'Notificaciones y avisos', icon: '🔔', tab: 'documents' },
        { name: 'Reportes académicos', icon: '📊', tab: 'reports' },
        { name: 'Exportación de reportes', icon: '📤', tab: 'reports' },
        { name: 'Bitácora y trazabilidad', icon: '📋', tab: 'balance' },
        { name: 'Geocercas', icon: '🗺️', tab: 'geofences' }
      ]
    },
    admin: {
      title: 'Administrador',
      icon: '🔧',
      color: '#ef4444',
      modules: [
        { name: 'Panel administrativo', icon: '📊', tab: 'dashboard' },
        { name: 'Usuarios, roles y permisos', icon: '👥', tab: 'users' },
        { name: 'Carreras y grupos', icon: '🎓', tab: 'config' },
        { name: 'Periodos académicos', icon: '📅', tab: 'config' },
        { name: 'Configuración de flujos de revisión', icon: '⚙️', tab: 'config' },
        { name: 'Plantillas y tipos de documentos', icon: '📄', tab: 'config' },
        { name: 'Reglas de asignación', icon: '⚖️', tab: 'config' },
        { name: 'Configuración de notificaciones', icon: '🔔', tab: 'config' },
        { name: 'Parámetros institucionales', icon: '🏛️', tab: 'config' },
        { name: 'Auditoría y registros de actividad', icon: '🔍', tab: 'balance' },
        { name: 'Respaldo y seguridad', icon: '🔒', tab: 'config' },
        { name: 'Geocercas', icon: '🗺️', tab: 'geofences' }
      ]
    }
  };

  const mainFlow = [
    { name: 'Cargar documento', icon: '⬆️', step: 1 },
    { name: 'Asignar revisor', icon: '👥', step: 2 },
    { name: 'Revisar', icon: '👁️', step: 3 },
    { name: 'Registrar observaciones', icon: '📝', step: 4 },
    { name: 'Corregir y reenviar', icon: '🔄', step: 5 },
    { name: 'Aprobar', icon: '✅', step: 6 },
    { name: 'Generar reporte final', icon: '📊', step: 7 }
  ];

  const documentStates = [
    { name: 'Pendiente', color: '#6b7280' },
    { name: 'Entregado', color: '#3b82f6' },
    { name: 'En revisión', color: '#f59e0b' },
    { name: 'Con observaciones', color: '#ef4444' },
    { name: 'Corregido', color: '#8b5cf6' },
    { name: 'Aprobado', color: '#10b981' },
    { name: 'Rechazado', color: '#dc2626' }
  ];

  $: currentRole = user?.role || 'public';
  $: roleConfig = roleConfigs[currentRole] || roleConfigs.public;
  
  // Filtrar módulos según permisos
  $: filteredModules = user && userPermissions.allowedTabs 
    ? roleConfig.modules.filter(m => userPermissions.allowedTabs.includes(m.tab))
    : roleConfig.modules;
</script>

<div class="sitemap-container" class:sidebar={isSidebar}>
  {#if !isSidebar}
    <header class="sitemap-header">
      <button type="button" class="back-button" on:click={goBack}>
        ← Volver
      </button>
      <h1>Mapa del Sitio</h1>
      <p class="subtitle">Sistema de Gestión de Documentos de Estadías - UTCJ</p>
      <div class="user-role-badge" style="background-color: {roleConfig.color}20; border-color: {roleConfig.color};">
        <span class="role-icon">{roleConfig.icon}</span>
        <span>{roleConfig.title}</span>
      </div>
    </header>
  {/if}

  <div class="sitemap-content">
    <!-- Flujo Principal -->
    {#if !isSidebar}
      <section class="sitemap-section">
        <h2 class="section-title">
          <span class="section-icon">🔄</span>
          Flujo Principal del Proceso
        </h2>
        <div class="flow-container">
          {#each mainFlow as step, index}
            <div class="flow-step">
              <div class="flow-node">
                <span class="flow-icon">{step.icon}</span>
                <span class="flow-text">{step.name}</span>
              </div>
              {#if index < mainFlow.length - 1}
                <div class="flow-arrow">→</div>
              {/if}
            </div>
          {/each}
        </div>
      </section>

      <!-- Estados del Documento -->
      <section class="sitemap-section">
        <h2 class="section-title">
          <span class="section-icon">📊</span>
          Estados del Documento
        </h2>
        <div class="states-grid">
          {#each documentStates as state}
            <div class="state-badge" style="background-color: {state.color}20; border-color: {state.color};">
              <span class="state-dot" style="background-color: {state.color};"></span>
              {state.name}
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <!-- Módulos del Rol Actual -->
    <section class="sitemap-section">
      <h2 class="section-title">
        <span class="section-icon">{roleConfig.icon}</span>
        {roleConfig.title}
      </h2>
      <div class="modules-grid">
        {#each filteredModules as module}
          <button
            type="button"
            class="module-card"
            class:active={currentTab === module.tab}
            style="border-left: 4px solid {roleConfig.color};"
            on:click={() => navigateToTab(module.tab)}
          >
            <span class="module-icon">{module.icon}</span>
            <span class="module-name">{module.name}</span>
            {#if currentTab === module.tab}
              <span class="active-indicator">●</span>
            {/if}
          </button>
        {/each}
      </div>
    </section>

    <!-- Funciones Transversales -->
    <section class="sitemap-section">
      <h2 class="section-title">
        <span class="section-icon">🔄</span>
        Funciones
      </h2>
      <div class="transversal-grid">
        {#if user}
          <button
            type="button"
            class="transversal-card"
            on:click={() => navigateToTab('logout')}
          >
            <span class="module-icon">🚪</span>
            <span class="module-name">Cerrar sesión</span>
          </button>
        {/if}
      </div>
    </section>
  </div>
</div>

<style>
  .sitemap-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    padding: 1rem;
  }

  .sitemap-container.sidebar {
    min-height: auto;
    background: white;
    padding: 0;
    border-right: 1px solid #e2e8f0;
  }

  .sitemap-header {
    text-align: center;
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
    border-radius: 1rem;
    color: white;
    position: relative;
  }

  .back-button {
    position: absolute;
    top: 1rem;
    left: 1rem;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    transition: background 0.2s;
  }

  .back-button:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .sitemap-header h1 {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
  }

  .subtitle {
    font-size: 0.875rem;
    opacity: 0.9;
    margin: 0 0 1rem 0;
  }

  .user-role-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    border: 2px solid;
    font-size: 0.875rem;
    font-weight: 600;
    backdrop-filter: blur(10px);
  }

  .role-icon {
    font-size: 1.25rem;
  }

  .sitemap-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .sitemap-container.sidebar .sitemap-content {
    max-width: none;
    margin: 0;
    padding: 1rem;
  }

  .sitemap-section {
    background: white;
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    border: 1px solid #e2e8f0;
  }

  .sitemap-container.sidebar .sitemap-section {
    background: transparent;
    border: none;
    box-shadow: none;
    padding: 0.5rem 0;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e3a8a;
    margin: 0 0 1rem 0;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #e2e8f0;
  }

  .sitemap-container.sidebar .section-title {
    font-size: 1rem;
    padding-bottom: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .section-icon {
    font-size: 1.5rem;
  }

  /* Flujo Principal */
  .flow-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
  }

  .flow-step {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    justify-content: center;
  }

  .flow-node {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 0.75rem;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    transition: transform 0.2s;
  }

  .flow-node:hover {
    transform: scale(1.02);
  }

  .flow-icon {
    font-size: 1.5rem;
  }

  .flow-text {
    font-size: 0.875rem;
  }

  .flow-arrow {
    font-size: 1.5rem;
    color: #3b82f6;
    font-weight: bold;
  }

  /* Estados */
  .states-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: center;
  }

  .state-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    border: 2px solid;
    font-size: 0.875rem;
    font-weight: 500;
    transition: transform 0.2s;
  }

  .state-badge:hover {
    transform: scale(1.05);
  }

  .state-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }

  /* Módulos Grid */
  .modules-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .sitemap-container.sidebar .modules-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .module-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    position: relative;
  }

  .sitemap-container.sidebar .module-card {
    padding: 0.75rem;
    border: none;
    background: transparent;
    border-radius: 0.5rem;
  }

  .module-card:hover {
    background: white;
    border-color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  }

  .sitemap-container.sidebar .module-card:hover {
    background: #f1f5f9;
    transform: none;
    box-shadow: none;
  }

  .module-card.active {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    border-color: #3b82f6;
  }

  .sitemap-container.sidebar .module-card.active {
    background: #e0e7ff;
    color: #1e3a8a;
  }

  .module-card.active .module-name {
    color: white;
  }

  .sitemap-container.sidebar .module-card.active .module-name {
    color: #1e3a8a;
  }

  .module-icon {
    font-size: 1.5rem;
    width: 32px;
    text-align: center;
  }

  .sitemap-container.sidebar .module-icon {
    font-size: 1.25rem;
    width: 24px;
  }

  .module-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: #475569;
    flex: 1;
  }

  .sitemap-container.sidebar .module-name {
    font-size: 0.8rem;
  }

  .active-indicator {
    color: #10b981;
    font-size: 0.75rem;
  }

  /* Transversal Grid */
  .transversal-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
  }

  .sitemap-container.sidebar .transversal-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .transversal-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border: none;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
    color: white;
    text-align: left;
  }

  .sitemap-container.sidebar .transversal-card {
    padding: 0.75rem;
    background: #f1f5f9;
    color: #475569;
    border-radius: 0.5rem;
  }

  .transversal-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  .sitemap-container.sidebar .transversal-card:hover {
    background: #e2e8f0;
    transform: none;
    box-shadow: none;
  }

  .transversal-card .module-name {
    color: white;
    font-weight: 500;
  }

  .sitemap-container.sidebar .transversal-card .module-name {
    color: #475569;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .sitemap-container {
      padding: 0.5rem;
    }

    .sitemap-container.sidebar {
      padding: 0.5rem;
    }

    .sitemap-header {
      padding: 1.5rem 1rem;
    }

    .sitemap-header h1 {
      font-size: 1.5rem;
    }

    .flow-container {
      gap: 0.25rem;
    }

    .flow-node {
      padding: 0.75rem 1rem;
      font-size: 0.8rem;
    }

    .flow-icon {
      font-size: 1.25rem;
    }

    .modules-grid {
      grid-template-columns: 1fr;
    }

    .transversal-grid {
      grid-template-columns: 1fr;
    }

    .states-grid {
      gap: 0.5rem;
    }

    .state-badge {
      font-size: 0.75rem;
      padding: 0.4rem 0.8rem;
    }

    .module-card {
      padding: 0.75rem;
    }

    .module-icon {
      font-size: 1.25rem;
    }

    .module-name {
      font-size: 0.8rem;
    }
  }

  @media (max-width: 480px) {
    .sitemap-header h1 {
      font-size: 1.25rem;
    }

    .subtitle {
      font-size: 0.75rem;
    }

    .flow-node {
      padding: 0.6rem 0.8rem;
    }

    .flow-text {
      font-size: 0.75rem;
    }
  }
</style>
