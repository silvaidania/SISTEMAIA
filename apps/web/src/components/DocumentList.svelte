<script>
  export let documents = [];
  export let onSelect = () => {};
  export let emptyText = 'No hay documentos disponibles.';

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
</script>

{#if documents.length === 0}
  <p class="muted">{emptyText}</p>
{:else}
  <div class="list">
    {#each documents as doc}
      <article class="list-item">
        <strong>{doc.title}</strong>
        <p class="muted">
          {doc.document_type} · {doc.student?.profile?.full_name || 'Estudiante'} · {doc.academic_period?.name || 'Periodo'}
        </p>
        <div class="actions">
          <span class="badge {doc.status}">{statusLabel(doc.status)}</span>
          <button type="button" class="secondary" on:click={() => onSelect(doc.id)}>
            Ver detalle
          </button>
        </div>
      </article>
    {/each}
  </div>
{/if}
