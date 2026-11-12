<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { api } from '../lib/api.js';

  export let user = null;

  const dispatch = createEventDispatcher();

  let activeTab = 'universities';
  let universities = [];
  let periods = [];
  let loading = false;
  let error = '';
  let success = '';

  let showUniversityForm = false;
  let showPeriodForm = false;
  let editingUniversity = null;
  let editingPeriod = null;

  let newUniversity = {
    name: '',
    shortName: ''
  };

  let newPeriod = {
    universityId: '',
    name: '',
    startDate: '',
    endDate: ''
  };

  async function loadUniversities() {
    loading = true;
    error = '';

    try {
      const data = await api('/universities');
      universities = data.universities || [];
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function loadPeriods() {
    loading = true;
    error = '';

    try {
      const data = await api('/academic-periods-management');
      periods = data.periods || [];
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function loadAll() {
    await Promise.all([loadUniversities(), loadPeriods()]);
  }

  function openUniversityForm(university = null) {
    showUniversityForm = true;
    editingUniversity = university;
    if (university) {
      newUniversity = {
        name: university.name,
        shortName: university.short_name || ''
      };
    } else {
      newUniversity = { name: '', shortName: '' };
    }
  }

  function openPeriodForm(period = null) {
    showPeriodForm = true;
    editingPeriod = period;
    if (period) {
      newPeriod = {
        universityId: period.university?.id || '',
        name: period.name,
        startDate: period.start_date,
        endDate: period.end_date
      };
    } else {
      newPeriod = { universityId: '', name: '', startDate: '', endDate: '' };
    }
  }

  async function saveUniversity() {
    error = '';
    success = '';

    try {
      if (editingUniversity) {
        await api(`/universities/${editingUniversity.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: newUniversity.name,
            shortName: newUniversity.shortName
          })
        });
        success = 'Universidad actualizada correctamente';
      } else {
        await api('/universities', {
          method: 'POST',
          body: JSON.stringify(newUniversity)
        });
        success = 'Universidad creada correctamente';
      }

      showUniversityForm = false;
      editingUniversity = null;
      await loadUniversities();
    } catch (err) {
      error = err.message;
    }
  }

  async function savePeriod() {
    error = '';
    success = '';

    try {
      if (editingPeriod) {
        await api(`/academic-periods-management/${editingPeriod.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            universityId: newPeriod.universityId,
            name: newPeriod.name,
            startDate: newPeriod.startDate,
            endDate: newPeriod.endDate
          })
        });
        success = 'Periodo académico actualizado correctamente';
      } else {
        await api('/academic-periods-management', {
          method: 'POST',
          body: JSON.stringify(newPeriod)
        });
        success = 'Periodo académico creado correctamente';
      }

      showPeriodForm = false;
      editingPeriod = null;
      await loadPeriods();
    } catch (err) {
      error = err.message;
    }
  }

  async function deleteUniversity(universityId) {
    if (!confirm('¿Estás seguro de eliminar esta universidad?')) return;

    error = '';
    success = '';

    try {
      await api(`/universities/${universityId}`, { method: 'DELETE' });
      success = 'Universidad eliminada correctamente';
      await loadUniversities();
    } catch (err) {
      error = err.message;
    }
  }

  async function deletePeriod(periodId) {
    if (!confirm('¿Estás seguro de eliminar este periodo académico?')) return;

    error = '';
    success = '';

    try {
      await api(`/academic-periods-management/${periodId}`, { method: 'DELETE' });
      success = 'Periodo académico eliminado correctamente';
      await loadPeriods();
    } catch (err) {
      error = err.message;
    }
  }

  async function toggleUniversityStatus(university) {
    error = '';
    success = '';

    try {
      await api(`/universities/${university.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !university.is_active })
      });
      success = `Universidad ${university.is_active ? 'desactivada' : 'activada'} correctamente`;
      await loadUniversities();
    } catch (err) {
      error = err.message;
    }
  }

  async function togglePeriodStatus(period) {
    error = '';
    success = '';

    try {
      await api(`/academic-periods-management/${period.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !period.is_active })
      });
      success = `Periodo ${period.is_active ? 'desactivado' : 'activado'} correctamente`;
      await loadPeriods();
    } catch (err) {
      error = err.message;
    }
  }

  onMount(() => {
    if (user && user.role === 'admin') {
      loadAll();
    }
  });
</script>

{#if user && user.role === 'admin'}
  <section class="panel">
    <h2>Configuración del sistema</h2>

    <nav class="tabs">
      <button type="button" class="tab" class:active={activeTab === 'universities'} on:click={() => (activeTab = 'universities')}>
        Universidades
      </button>
      <button type="button" class="tab" class:active={activeTab === 'periods'} on:click={() => (activeTab = 'periods')}>
        Periodos académicos
      </button>
    </nav>

    {#if error}
      <p class="error">{error}</p>
    {/if}
    {#if success}
      <p class="success">{success}</p>
    {/if}

    {#if activeTab === 'universities'}
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3>Universidades</h3>
        <button type="button" on:click={() => openUniversityForm()}>Agregar universidad</button>
      </div>

      {#if showUniversityForm}
        <article class="panel" style="margin-bottom: 1rem;">
          <h4>{editingUniversity ? 'Editar universidad' : 'Nueva universidad'}</h4>
          <form on:submit|preventDefault={saveUniversity}>
            <label for="uni-name">Nombre completo</label>
            <input id="uni-name" type="text" bind:value={newUniversity.name} required />

            <label for="uni-short">Nombre corto</label>
            <input id="uni-short" type="text" bind:value={newUniversity.shortName} />

            <div class="actions">
              <button type="submit">Guardar</button>
              <button type="button" class="secondary" on:click={() => (showUniversityForm = false)}>Cancelar</button>
            </div>
          </form>
        </article>
      {/if}

      {#if loading}
        <p class="muted">Cargando universidades...</p>
      {:else if universities.length === 0}
        <p class="muted">No hay universidades registradas.</p>
      {:else}
        <div class="list">
          {#each universities as university}
            <article class="list-item">
              <strong>{university.name}</strong>
              {#if university.short_name}
                <p class="muted">{university.short_name}</p>
              {/if}
              <p class="muted">{university.is_active ? 'Activa' : 'Inactiva'}</p>
              <div class="actions">
                <button type="button" class="secondary" on:click={() => openUniversityForm(university)}>Editar</button>
                <button type="button" class="secondary" on:click={() => toggleUniversityStatus(university)}>
                  {university.is_active ? 'Desactivar' : 'Activar'}
                </button>
                <button type="button" class="danger" on:click={() => deleteUniversity(university.id)}>Eliminar</button>
              </div>
            </article>
          {/each}
        </div>
      {/if}
    {/if}

    {#if activeTab === 'periods'}
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3>Periodos académicos</h3>
        <button type="button" on:click={() => openPeriodForm()}>Agregar periodo</button>
      </div>

      {#if showPeriodForm}
        <article class="panel" style="margin-bottom: 1rem;">
          <h4>{editingPeriod ? 'Editar periodo' : 'Nuevo periodo'}</h4>
          <form on:submit|preventDefault={savePeriod}>
            <label for="period-university">Universidad</label>
            <select id="period-university" bind:value={newPeriod.universityId} required>
              <option value="" disabled>Selecciona una universidad</option>
              {#each universities.filter(u => u.is_active) as university}
                <option value={university.id}>{university.name}</option>
              {/each}
            </select>

            <label for="period-name">Nombre del periodo</label>
            <input id="period-name" type="text" bind:value={newPeriod.name} placeholder="Ej. 2024-1" required />

            <label for="period-start">Fecha de inicio</label>
            <input id="period-start" type="date" bind:value={newPeriod.startDate} required />

            <label for="period-end">Fecha de fin</label>
            <input id="period-end" type="date" bind:value={newPeriod.endDate} required />

            <div class="actions">
              <button type="submit">Guardar</button>
              <button type="button" class="secondary" on:click={() => (showPeriodForm = false)}>Cancelar</button>
            </div>
          </form>
        </article>
      {/if}

      {#if loading}
        <p class="muted">Cargando periodos...</p>
      {:else if periods.length === 0}
        <p class="muted">No hay periodos académicos registrados.</p>
      {:else}
        <div class="list">
          {#each periods as period}
            <article class="list-item">
              <strong>{period.name}</strong>
              <p class="muted">
                {period.university?.name || 'Sin universidad'} ·
                {period.start_date} - {period.end_date}
              </p>
              <p class="muted">{period.is_active ? 'Activo' : 'Inactivo'}</p>
              <div class="actions">
                <button type="button" class="secondary" on:click={() => openPeriodForm(period)}>Editar</button>
                <button type="button" class="secondary" on:click={() => togglePeriodStatus(period)}>
                  {period.is_active ? 'Desactivar' : 'Activar'}
                </button>
                <button type="button" class="danger" on:click={() => deletePeriod(period.id)}>Eliminar</button>
              </div>
            </article>
          {/each}
        </div>
      {/if}
    {/if}
  </section>
{/if}
