<script>
  import { createEventDispatcher } from 'svelte';

  export let user = null;

  const dispatch = createEventDispatcher();

  function goToLogin() {
    dispatch('login');
  }

  function goToRegister() {
    dispatch('register');
  }

  function goToDashboard() {
    dispatch('dashboard');
  }

  function logout() {
    dispatch('logout');
  }
</script>

<div class="home-container">
  <div class="home-content">
    <div class="hero-section">
      <div class="logo-container">
        <div class="logo-circle">
          <span class="logo-text">UTCJ</span>
        </div>
      </div>
      
      <h1 class="main-title">Universidad Tecnológica de Ciudad Juárez</h1>
      <h2 class="subtitle">Sistema de Gestión de Documentos de Estadías</h2>
      
      <p class="description">
        Plataforma integral para la administración, revisión, seguimiento y validación 
        de documentos de estadías estudiantiles.
      </p>
    </div>

    <div class="features-section">
      <div class="feature-card">
        <div class="feature-icon">📄</div>
        <h3>Gestión de Documentos</h3>
        <p>Sube, revisa y gestiona documentos de estadías de manera eficiente.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">👥</div>
        <h3>Asignación Inteligente</h3>
        <p>Balance de cargas automático para asignar revisores de forma equitativa.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">📊</div>
        <h3>Reportes Académicos</h3>
        <p>Genera reportes detallados y exporta datos en múltiples formatos.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">🔔</div>
        <h3>Notificaciones</h3>
        <p>Recibe notificaciones automáticas sobre cambios en tus documentos.</p>
      </div>
    </div>

    <div class="cta-section">
      {#if user}
        <div class="user-welcome">
          <p class="welcome-text">¡Bienvenido, {user.full_name}!</p>
          <p class="role-text">Rol: {user.role}</p>
        </div>
        <div class="cta-buttons">
          <button type="button" class="cta-button primary" on:click={goToDashboard}>
            Ir al Panel de Control
          </button>
          <button type="button" class="cta-button secondary" on:click={logout}>
            Cerrar Sesión
          </button>
        </div>
      {:else}
        <div class="cta-buttons">
          <button type="button" class="cta-button primary" on:click={goToLogin}>
            Iniciar Sesión
          </button>
          <button type="button" class="cta-button secondary" on:click={goToRegister}>
            Registrarse
          </button>
        </div>
        <p class="cta-text">
          ¿No tienes cuenta? Regístrate para comenzar a gestionar tus documentos de estadías.
        </p>
      {/if}
    </div>

    <div class="footer-section">
      <p>© 2026 Idania Silva Ibarra. Todos los derechos reservados.</p>
      <p class="version">Versión 1.0.0</p>
    </div>
  </div>
</div>

<style>
  .home-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #3b82f6 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
  }

  .home-content {
    max-width: 1200px;
    width: 100%;
    color: white;
  }

  .hero-section {
    text-align: center;
    margin-bottom: 4rem;
  }

  .logo-container {
    margin-bottom: 2rem;
  }

  .logo-circle {
    width: 120px;
    height: 120px;
    background: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    border: 4px solid #60a5fa;
  }

  .logo-text {
    font-size: 2rem;
    font-weight: 700;
    color: #1e3a8a;
    letter-spacing: -0.05em;
  }

  .main-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .subtitle {
    font-size: 1.5rem;
    font-weight: 400;
    margin-bottom: 1rem;
    opacity: 0.95;
  }

  .description {
    font-size: 1.125rem;
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.6;
    opacity: 0.9;
  }

  .features-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-bottom: 4rem;
  }

  .feature-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 1rem;
    padding: 2rem;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .feature-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    background: rgba(255, 255, 255, 0.15);
  }

  .feature-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .feature-card h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .feature-card p {
    font-size: 0.875rem;
    opacity: 0.9;
    line-height: 1.5;
  }

  .cta-section {
    text-align: center;
    margin-bottom: 4rem;
  }

  .user-welcome {
    margin-bottom: 2rem;
  }

  .welcome-text {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: white;
  }

  .role-text {
    font-size: 1rem;
    opacity: 0.9;
    margin: 0;
  }

  .cta-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  .cta-button {
    padding: 1rem 2.5rem;
    font-size: 1.125rem;
    font-weight: 600;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;
  }

  .cta-button.primary {
    background: white;
    color: #1e3a8a;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }

  .cta-button.primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
    background: #60a5fa;
    color: white;
  }

  .cta-button.secondary {
    background: transparent;
    color: white;
    border: 2px solid white;
  }

  .cta-button.secondary:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.1);
  }

  .cta-text {
    font-size: 0.875rem;
    opacity: 0.8;
  }

  .footer-section {
    text-align: center;
    font-size: 0.875rem;
    opacity: 0.8;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    padding-top: 2rem;
  }

  .version {
    margin-top: 0.5rem;
    font-size: 0.75rem;
    opacity: 0.7;
  }

  @media (max-width: 768px) {
    .main-title {
      font-size: 2rem;
    }

    .subtitle {
      font-size: 1.25rem;
    }

    .description {
      font-size: 1rem;
    }

    .logo-circle {
      width: 100px;
      height: 100px;
    }

    .logo-text {
      font-size: 1.5rem;
    }

    .features-section {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .feature-card {
      padding: 1.5rem;
    }
  }
</style>
