<script>
  import { createEventDispatcher } from 'svelte';

  export let universities = [];
  export let periods = [];
  export let reviewers = [];
  export let students = [];

  const dispatch = createEventDispatcher();

  let filters = {
    status: '',
    documentType: '',
    universityId: '',
    periodId: '',
    studentId: '',
    reviewerId: '',
    dateFrom: '',
    dateTo: '',
    hasObservations: '',
    isApproved: '',
    search: ''
  };

  let showAdvanced = false;

  function applyFilters() {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.append(key, value);
      }
    });

    dispatch('search', { filters, params: params.toString() });
  }

  function clearFilters() {
    filters = {
      status: '',
      documentType: '',
      universityId: '',
      periodId: '',
      studentId: '',
      reviewerId: '',
      dateFrom: '',
      dateTo: '',
      hasObservations: '',
      isApproved: '',
      search: ''
    };
    applyFilters();
  }
</script>

<article class="panel">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
    <h3>Búsqueda de documentos</h3>
    <button type="button" class="secondary" on:click={() => (showAdvanced = !showAdvanced)}>
      {showAdvanced ? 'Búsqueda simple' : 'Búsqueda avanzada'}
    </button>
  </div>

  <form on:submit|preventDefault={applyFilters}>
    <div class="grid">
      <div>
        <label for="search-text">Buscar</label>
        <input
          id="search-text"
          type="text"
          bind:value={filters.search}
          placeholder="Título o tipo de documento"
        />
      </div>

      <div>
        <label for="filter-status">Estado</label>
        <select id="filter-status" bind:value={filters.status}>
          <option value="">Todos</option>
          <option value="submitted">Enviado</option>
          <option value="in_review">En revisión</option>
          <option value="observed">Con observaciones</option>
          <option value="corrected">Corregido</option>
          <option value="approved">Aprobado</option>
          <option value="rejected">Rechazado</option>
        </select>
      </div>

      {#if showAdvanced}
        <div>
          <label for="filter-type">Tipo de documento</label>
          <input
            id="filter-type"
            type="text"
            bind:value={filters.documentType}
            placeholder="Ej. Reporte final"
          />
        </div>

        <div>
          <label for="filter-university">Universidad</label>
          <select id="filter-university" bind:value={filters.universityId}>
            <option value="">Todas</option>
            {#each universities as university}
              <option value={university.id}>{university.name}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="filter-period">Periodo académico</label>
          <select id="filter-period" bind:value={filters.periodId}>
            <option value="">Todos</option>
            {#each periods as period}
              <option value={period.id}>{period.name}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="filter-student">Estudiante</label>
          <select id="filter-student" bind:value={filters.studentId}>
            <option value="">Todos</option>
            {#each students as student}
              <option value={student.id}>{student.full_name} ({student.student_code})</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="filter-reviewer">Revisor</label>
          <select id="filter-reviewer" bind:value={filters.reviewerId}>
            <option value="">Todos</option>
            {#each reviewers as reviewer}
              <option value={reviewer.id}>{reviewer.full_name}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="filter-date-from">Fecha desde</label>
          <input id="filter-date-from" type="date" bind:value={filters.dateFrom} />
        </div>

        <div>
          <label for="filter-date-to">Fecha hasta</label>
          <input id="filter-date-to" type="date" bind:value={filters.dateTo} />
        </div>

        <div>
          <label for="filter-observations">Con observaciones</label>
          <select id="filter-observations" bind:value={filters.hasObservations}>
            <option value="">Todos</option>
            <option value="true">Solo con observaciones</option>
          </select>
        </div>

        <div>
          <label for="filter-approved">Estado de aprobación</label>
          <select id="filter-approved" bind:value={filters.isApproved}>
            <option value="">Todos</option>
            <option value="true">Solo aprobados</option>
          </select>
        </div>
      {/if}
    </div>

    <div class="actions" style="margin-top: 1rem;">
      <button type="submit">Aplicar filtros</button>
      <button type="button" class="secondary" on:click={clearFilters}>Limpiar filtros</button>
    </div>
  </form>
</article>
