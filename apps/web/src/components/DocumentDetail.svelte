<script>
  import { createEventDispatcher } from 'svelte';

  export let document = null;
  export let role = '';

  const dispatch = createEventDispatcher();

  let observationText = '';
  let severity = 'medium';
  let decision = '';
  let decisionNotes = '';
  let correctionPath = '';

  function statusLabel(status) {
    const labels = {
      submitted: 'Enviado',
      in_review: 'En revisión',
      observed: 'Con observaciones',
      corrected: 'Corregido',
      approved: 'Aprobado',
      rejected: 'Rechazado'
    };
    return labels[status] || status;
  }

  function addObservation() {
    dispatch('add-observation', { observation: observationText, severity });
    observationText = '';
  }

  function submitDecision(action) {
    dispatch('decision', { decision: action, notes: decisionNotes });
  }

  function submitCorrection() {
    dispatch('correction', { storagePath: correctionPath });
  }
</script>

{#if document}
  <section class="panel">
    <h2>{document.title}</h2>
    <p class="muted">{document.document_type} · {document.academic_period?.name || ''}</p>

    <div class="detail-grid">
      <div class="detail-item">
        <span>Estado</span>
        <strong><span class="badge {document.status}">{statusLabel(document.status)}</span></strong>
      </div>
      <div class="detail-item">
        <span>Estudiante</span>
        <strong>{document.student?.profile?.full_name || 'N/A'}</strong>
      </div>
      <div class="detail-item">
        <span>Revisor</span>
        <strong>{document.reviewer?.full_name || 'Sin asignar'}</strong>
      </div>
      <div class="detail-item">
        <span>Versión</span>
        <strong>{document.version || 1}</strong>
      </div>
    </div>

    {#if document.observations?.length}
      <h3>Observaciones</h3>
      {#each document.observations as obs}
        <div class="observation">
          <strong>{obs.reviewer?.full_name || 'Revisor'}</strong>
          <p>{obs.observation}</p>
          <p class="muted">{obs.severity} · {obs.status}</p>
        </div>
      {/each}
    {/if}

    {#if role === 'reviewer' && document.reviewer_id}
      <h3>Acciones de revisión</h3>
      <label for="obs-text">Nueva observación</label>
      <textarea id="obs-text" bind:value={observationText}></textarea>

      <label for="obs-severity">Severidad</label>
      <select id="obs-severity" bind:value={severity}>
        <option value="low">Baja</option>
        <option value="medium">Media</option>
        <option value="high">Alta</option>
      </select>

      <div class="actions">
        <button type="button" on:click={addObservation} disabled={!observationText}>Agregar observación</button>
      </div>

      <label for="decision-notes">Notas de decisión</label>
      <textarea id="decision-notes" bind:value={decisionNotes}></textarea>

      <div class="actions">
        <button type="button" class="danger" on:click={() => submitDecision('reject')}>Rechazar</button>
        <button type="button" on:click={() => submitDecision('approve')}>Aprobar</button>
      </div>
    {/if}

    {#if role === 'student' && document.status === 'observed'}
      <h3>Corrección</h3>
      <label for="correction-path">Nueva ruta de archivo corregido</label>
      <input id="correction-path" bind:value={correctionPath} />
      <button type="button" on:click={submitCorrection} disabled={!correctionPath}>Enviar corrección</button>
    {/if}
  </section>
{/if}
