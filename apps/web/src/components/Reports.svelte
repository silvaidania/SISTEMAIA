<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { api } from '../lib/api.js';

  export let user = null;

  const dispatch = createEventDispatcher();

  let activeReport = 'metrics';
  let metrics = null;
  let documentsByStatus = null;
  let documentsByUniversity = null;
  let documentsByPeriod = null;
  let reviewerPerformance = null;
  let studentProgress = null;
  let observationsSummary = null;
  let academicReport = null;
  let selectedPeriodId = '';
  let loading = false;
  let error = '';

  const reportTabs = [
    { id: 'metrics', label: 'Métricas' },
    { id: 'status', label: 'Por estado' },
    { id: 'university', label: 'Por universidad' },
    { id: 'period', label: 'Por periodo' },
    { id: 'reviewers', label: 'Revisores' },
    { id: 'students', label: 'Estudiantes' },
    { id: 'observations', label: 'Observaciones' },
    { id: 'academic', label: 'Académico' }
  ];

  async function loadReport(reportId) {
    loading = true;
    error = '';

    try {
      switch (reportId) {
        case 'metrics':
          const metricsData = await api('/reports/metrics');
          metrics = metricsData.metrics;
          break;
        case 'status':
          const statusData = await api('/reports/documents-by-status');
          documentsByStatus = statusData.data;
          break;
        case 'university':
          const universityData = await api('/reports/documents-by-university');
          documentsByUniversity = universityData.data;
          break;
        case 'period':
          const periodData = await api('/reports/documents-by-period');
          documentsByPeriod = periodData.data;
          break;
        case 'reviewers':
          const reviewersData = await api('/reports/reviewer-performance');
          reviewerPerformance = reviewersData.data;
          break;
        case 'students':
          const studentsData = await api('/reports/student-progress');
          studentProgress = studentsData.data;
          break;
        case 'observations':
          const observationsData = await api('/reports/observations-summary');
          observationsSummary = observationsData.data;
          break;
        case 'academic':
          const params = selectedPeriodId ? `?periodId=${selectedPeriodId}` : '';
          const academicData = await api(`/reports/academic${params}`);
          academicReport = academicData.data;
          break;
      }
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function switchReport(reportId) {
    activeReport = reportId;
    loadReport(reportId);
  }

  function exportToCSV(data, filename) {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async function exportPDF(reportType) {
    try {
      let url = '';
      let filename = '';

      switch (reportType) {
        case 'academic':
          url = `/reports/export/academic/pdf${selectedPeriodId ? `?periodId=${selectedPeriodId}` : ''}`;
          filename = 'reporte-academico.pdf';
          break;
        case 'reviewers':
          url = '/reports/export/reviewers/pdf';
          filename = 'reporte-revisores.pdf';
          break;
        case 'students':
          url = '/reports/export/students/pdf';
          filename = 'reporte-estudiantes.pdf';
          break;
      }

      const response = await fetch(`/api${url}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sistemaia_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al exportar PDF');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      error = err.message;
    }
  }

  async function exportExcel(reportType) {
    try {
      let url = '';
      let filename = '';

      switch (reportType) {
        case 'academic':
          url = `/reports/export/academic/excel${selectedPeriodId ? `?periodId=${selectedPeriodId}` : ''}`;
          filename = 'reporte-academico.xlsx';
          break;
        case 'reviewers':
          url = '/reports/export/reviewers/excel';
          filename = 'reporte-revisores.xlsx';
          break;
        case 'students':
          url = '/reports/export/students/excel';
          filename = 'reporte-estudiantes.xlsx';
          break;
      }

      const response = await fetch(`/api${url}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sistemaia_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al exportar Excel');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      error = err.message;
    }
  }

  onMount(() => {
    if (user && ['admin', 'coordinator'].includes(user.role)) {
      loadReport('metrics');
    }
  });
</script>

{#if user && ['admin', 'coordinator'].includes(user.role)}
  <section class="panel">
    <h2>Reportes y métricas</h2>

    <nav class="tabs">
      {#each reportTabs as tab}
        <button
          type="button"
          class="tab"
          class:active={activeReport === tab.id}
          on:click={() => switchReport(tab.id)}
        >
          {tab.label}
        </button>
      {/each}
    </nav>

    {#if error}
      <p class="error">{error}</p>
    {/if}

    {#if loading}
      <p class="muted">Cargando...</p>
    {:else if activeReport === 'metrics' && metrics}
      <div class="grid">
        <article class="panel">
          <h3>Documentos</h3>
          <p><strong>Total:</strong> {metrics.documents.total}</p>
          <p><strong>Enviados:</strong> {metrics.documents.submitted}</p>
          <p><strong>En revisión:</strong> {metrics.documents.in_review}</p>
          <p><strong>Observados:</strong> {metrics.documents.observed}</p>
          <p><strong>Corregidos:</strong> {metrics.documents.corrected}</p>
          <p><strong>Aprobados:</strong> {metrics.documents.approved}</p>
          <p><strong>Rechazados:</strong> {metrics.documents.rejected}</p>
        </article>

        <article class="panel">
          <h3>Usuarios</h3>
          <p><strong>Estudiantes:</strong> {metrics.users.students}</p>
          <p><strong>Revisores:</strong> {metrics.users.reviewers}</p>
        </article>

        <article class="panel">
          <h3>Observaciones</h3>
          <p><strong>Total:</strong> {metrics.observations}</p>
        </article>
      </div>
    {:else if activeReport === 'status' && documentsByStatus}
      <div class="grid">
        {#each Object.entries(documentsByStatus) as [status, count]}
          <article class="panel">
            <h3>{status}</h3>
            <p><strong>{count}</strong> documentos</p>
          </article>
        {/each}
      </div>
    {:else if activeReport === 'university' && documentsByUniversity}
      <div class="grid">
        {#each Object.entries(documentsByUniversity) as [university, count]}
          <article class="panel">
            <h3>{university}</h3>
            <p><strong>{count}</strong> documentos</p>
          </article>
        {/each}
      </div>
    {:else if activeReport === 'period' && documentsByPeriod}
      <div class="grid">
        {#each Object.entries(documentsByPeriod) as [period, count]}
          <article class="panel">
            <h3>{period}</h3>
            <p><strong>{count}</strong> documentos</p>
          </article>
        {/each}
      </div>
    {:else if activeReport === 'reviewers' && reviewerPerformance}
      <div class="list">
        {#each reviewerPerformance as reviewer}
          <article class="list-item">
            <strong>{reviewer.full_name}</strong>
            <div class="detail-grid">
              <div class="detail-item">
                <span>Capacidad</span>
                <strong>{reviewer.capacity}</strong>
              </div>
              <div class="detail-item">
                <span>Carga actual</span>
                <strong>{reviewer.current_workload}</strong>
              </div>
              <div class="detail-item">
                <span>Total asignados</span>
                <strong>{reviewer.total_assigned}</strong>
              </div>
              <div class="detail-item">
                <span>Completados</span>
                <strong>{reviewer.completed}</strong>
              </div>
              <div class="detail-item">
                <span>Aprobados</span>
                <strong>{reviewer.approved}</strong>
              </div>
              <div class="detail-item">
                <span>Rechazados</span>
                <strong>{reviewer.rejected}</strong>
              </div>
              <div class="detail-item">
                <span>Tasa aprobación</span>
                <strong>{reviewer.approval_rate.toFixed(1)}%</strong>
              </div>
              <div class="detail-item">
                <span>Tiempo prom. revisión</span>
                <strong>{reviewer.avg_review_time_days} días</strong>
              </div>
            </div>
          </article>
        {/each}
      </div>
      <div class="actions" style="margin-top: 1rem;">
        <button type="button" class="secondary" on:click={() => exportToCSV(reviewerPerformance, 'revisores.csv')}>
          Exportar CSV
        </button>
        <button type="button" class="secondary" on:click={() => exportPDF('reviewers')}>
          Exportar PDF
        </button>
        <button type="button" class="secondary" on:click={() => exportExcel('reviewers')}>
          Exportar Excel
        </button>
      </div>
    {:else if activeReport === 'students' && studentProgress}
      <div class="list">
        {#each studentProgress as student}
          <article class="list-item">
            <strong>{student.full_name}</strong>
            <p class="muted">{student.student_code} · {student.career} · {student.semester}° semestre · {student.university}</p>
            <div class="detail-grid">
              <div class="detail-item">
                <span>Total documentos</span>
                <strong>{student.total_documents}</strong>
              </div>
              <div class="detail-item">
                <span>Aprobados</span>
                <strong>{student.approved_documents}</strong>
              </div>
              <div class="detail-item">
                <span>En progreso</span>
                <strong>{student.in_progress_documents}</strong>
              </div>
              <div class="detail-item">
                <span>Con observaciones</span>
                <strong>{student.observed_documents}</strong>
              </div>
              <div class="detail-item">
                <span>Tasa completado</span>
                <strong>{student.completion_rate.toFixed(1)}%</strong>
              </div>
            </div>
          </article>
        {/each}
      </div>
      <div class="actions" style="margin-top: 1rem;">
        <button type="button" class="secondary" on:click={() => exportToCSV(studentProgress, 'estudiantes.csv')}>
          Exportar CSV
        </button>
        <button type="button" class="secondary" on:click={() => exportPDF('students')}>
          Exportar PDF
        </button>
        <button type="button" class="secondary" on:click={() => exportExcel('students')}>
          Exportar Excel
        </button>
      </div>
    {:else if activeReport === 'observations' && observationsSummary}
      <div class="grid">
        <article class="panel">
          <h3>Por severidad</h3>
          {#each Object.entries(observationsSummary.by_severity) as [severity, count]}
            <p><strong>{severity}:</strong> {count}</p>
          {/each}
        </article>

        <article class="panel">
          <h3>Por estado</h3>
          {#each Object.entries(observationsSummary.by_status) as [status, count]}
            <p><strong>{status}:</strong> {count}</p>
          {/each}
        </article>
      </div>

      <h3>Observaciones recientes</h3>
      <div class="list">
        {#each observationsSummary.recent as obs}
          <article class="list-item">
            <strong>{obs.student_name || 'Estudiante'}</strong>
            <p class="muted">{obs.severity} · {obs.status} · {new Date(obs.created_at).toLocaleDateString()}</p>
          </article>
        {/each}
      </div>
    {:else if activeReport === 'academic' && academicReport}
      <div class="panel">
        <h3>Reporte académico</h3>
        <div class="actions" style="margin-bottom: 1rem;">
          <button type="button" class="secondary" on:click={() => exportToCSV(academicReport, 'reporte-academico.csv')}>
            Exportar CSV
          </button>
          <button type="button" class="secondary" on:click={() => exportPDF('academic')}>
            Exportar PDF
          </button>
          <button type="button" class="secondary" on:click={() => exportExcel('academic')}>
            Exportar Excel
          </button>
        </div>
        <div class="list">
          {#each academicReport as doc}
            <article class="list-item">
              <strong>{doc.title}</strong>
              <p class="muted">
                {doc.student_name} · {doc.student_code} · {doc.career} · {doc.semester}° semestre · {doc.university}
              </p>
              <p class="muted">Estado: {doc.status} · Periodo: {doc.period} · Revisor: {doc.reviewer || 'Sin asignar'}</p>
            </article>
          {/each}
        </div>
      </div>
    {/if}
  </section>
{/if}
