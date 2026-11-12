<script>
  import { createEventDispatcher } from 'svelte';

  export let periods = [];

  const dispatch = createEventDispatcher();

  let title = '';
  let documentType = '';
  let academicPeriodId = '';
  let file = null;

  function submit() {
    dispatch('submit', {
      title,
      documentType,
      academicPeriodId,
      file
    });
  }
</script>

<form on:submit|preventDefault={submit}>
  <label for="doc-title">Título del documento</label>
  <input id="doc-title" bind:value={title} required />

  <label for="doc-type">Tipo de documento</label>
  <input id="doc-type" bind:value={documentType} placeholder="Ej. Reporte final" required />

  <label for="doc-period">Periodo académico</label>
  <select id="doc-period" bind:value={academicPeriodId} required>
    <option value="" disabled>Selecciona un periodo</option>
    {#each periods as period}
      <option value={period.id}>{period.name} · {period.university?.short_name || period.university?.name || ''}</option>
    {/each}
  </select>

  <label for="doc-file">Archivo del documento</label>
  <input id="doc-file" type="file" accept=".pdf,.doc,.docx" bind:files={file} required />

  <button type="submit">Enviar documento</button>
</form>
