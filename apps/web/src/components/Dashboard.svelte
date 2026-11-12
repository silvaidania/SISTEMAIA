<script>
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import { api } from '../lib/api.js';

  Chart.register(...registerables);

  export let user = null;

  let charts = {};
  let documentsByStatus = null;
  let documentsByUniversity = null;
  let documentsByPeriod = null;
  let reviewerPerformance = null;
  let studentProgress = null;
  let loading = false;
  let error = '';

  async function loadDashboardData() {
    loading = true;
    error = '';

    try {
      const [statusData, universityData, periodData, reviewersData, studentsData] = await Promise.all([
        api('/reports/documents-by-status'),
        api('/reports/documents-by-university'),
        api('/reports/documents-by-period'),
        api('/reports/reviewer-performance'),
        api('/reports/student-progress')
      ]);

      documentsByStatus = statusData.data;
      documentsByUniversity = universityData.data;
      documentsByPeriod = periodData.data;
      reviewerPerformance = reviewersData.data;
      studentProgress = studentsData.data;

      setTimeout(() => {
        createCharts();
      }, 100);
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function createCharts() {
    destroyCharts();

    if (documentsByStatus) {
      const ctx = document.getElementById('statusChart');
      if (ctx) {
        charts.status = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: Object.keys(documentsByStatus).map(s => {
              const labels = {
                submitted: 'Enviado',
                in_review: 'En revisión',
                observed: 'Observado',
                corrected: 'Corregido',
                approved: 'Aprobado',
                rejected: 'Rechazado'
              };
              return labels[s] || s;
            }),
            datasets: [{
              data: Object.values(documentsByStatus),
              backgroundColor: [
                '#f59e0b',
                '#3b82f6',
                '#ef4444',
                '#10b981',
                '#22c55e',
                '#dc2626'
              ]
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }
        });
      }
    }

    if (documentsByUniversity) {
      const ctx = document.getElementById('universityChart');
      if (ctx) {
        charts.university = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: Object.keys(documentsByUniversity),
            datasets: [{
              label: 'Documentos',
              data: Object.values(documentsByUniversity),
              backgroundColor: '#3b82f6'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      }
    }

    if (documentsByPeriod) {
      const ctx = document.getElementById('periodChart');
      if (ctx) {
        charts.period = new Chart(ctx, {
          type: 'line',
          data: {
            labels: Object.keys(documentsByPeriod),
            datasets: [{
              label: 'Documentos',
              data: Object.values(documentsByPeriod),
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              fill: true,
              tension: 0.4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      }
    }

    if (reviewerPerformance) {
      const ctx = document.getElementById('reviewerChart');
      if (ctx) {
        charts.reviewer = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: reviewerPerformance.map(r => r.full_name),
            datasets: [{
              label: 'Documentos completados',
              data: reviewerPerformance.map(r => r.completed),
              backgroundColor: '#f59e0b'
            }, {
              label: 'Pendientes',
              data: reviewerPerformance.map(r => r.pending),
              backgroundColor: '#3b82f6'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom'
              }
            },
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      }
    }

    if (studentProgress) {
      const ctx = document.getElementById('studentChart');
      if (ctx) {
        charts.student = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: studentProgress.map(s => s.full_name),
            datasets: [{
              label: 'Aprobados',
              data: studentProgress.map(s => s.approved_documents),
              backgroundColor: '#22c55e'
            }, {
              label: 'En progreso',
              data: studentProgress.map(s => s.in_progress_documents),
              backgroundColor: '#f59e0b'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom'
              }
            },
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      }
    }
  }

  function destroyCharts() {
    Object.values(charts).forEach(chart => {
      if (chart) {
        chart.destroy();
      }
    });
    charts = {};
  }

  onMount(() => {
    if (user && ['admin', 'coordinator'].includes(user.role)) {
      loadDashboardData();
    }
  });

  onDestroy(() => {
    destroyCharts();
  });
</script>

{#if user && ['admin', 'coordinator'].includes(user.role)}
  <section class="panel">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <h2>Dashboard</h2>
      <button type="button" class="secondary" on:click={loadDashboardData} disabled={loading}>
        {loading ? 'Actualizando...' : 'Actualizar'}
      </button>
    </div>

    {#if error}
      <p class="error">{error}</p>
    {/if}

    {#if loading}
      <p class="muted">Cargando dashboard...</p>
    {:else}
      <div class="dashboard-grid">
        <article class="chart-panel">
          <h3>Documentos por estado</h3>
          <div class="chart-container">
            <canvas id="statusChart"></canvas>
          </div>
        </article>

        <article class="chart-panel">
          <h3>Documentos por universidad</h3>
          <div class="chart-container">
            <canvas id="universityChart"></canvas>
          </div>
        </article>

        <article class="chart-panel">
          <h3>Documentos por periodo</h3>
          <div class="chart-container">
            <canvas id="periodChart"></canvas>
          </div>
        </article>

        <article class="chart-panel">
          <h3>Rendimiento de revisores</h3>
          <div class="chart-container">
            <canvas id="reviewerChart"></canvas>
          </div>
        </article>

        <article class="chart-panel">
          <h3>Progreso de estudiantes</h3>
          <div class="chart-container">
            <canvas id="studentChart"></canvas>
          </div>
        </article>
      </div>
    {/if}
  </section>
{/if}
