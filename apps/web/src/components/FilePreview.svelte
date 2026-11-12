<script>
  import { createEventDispatcher } from 'svelte';
  import { api } from '../lib/api.js';

  export let storagePath = '';
  export let show = false;

  const dispatch = createEventDispatcher();

  let signedUrl = '';
  let loading = false;
  let error = '';
  let fileType = 'unknown';
  let fileName = 'Documento';

  async function loadFile() {
    if (!storagePath) return;

    loading = true;
    error = '';

    try {
      const data = await api(`/documents/file-url?path=${encodeURIComponent(storagePath)}`);
      signedUrl = data.url;
      fileType = data.fileType;
      fileName = data.fileName;
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function close() {
    dispatch('close');
  }

  $: if (show && storagePath) {
    loadFile();
  }
</script>

{#if show}
  <div class="modal-overlay" role="dialog" aria-modal="true">
    <button type="button" class="modal-backdrop" on:click={close} aria-label="Cerrar modal"></button>
    <div class="modal-content" role="document">
      <div class="modal-header">
        <h3>{fileName}</h3>
        <button type="button" class="close-btn" on:click={close} aria-label="Cerrar">×</button>
      </div>

      <div class="modal-body">
        {#if loading}
          <p class="muted">Cargando archivo...</p>
        {:else if error}
          <p class="error">{error}</p>
        {:else if signedUrl}
          {#if fileType === 'pdf'}
            <iframe src={signedUrl} class="file-preview" title={fileName}></iframe>
          {:else if fileType === 'image'}
            <img src={signedUrl} alt={fileName} class="file-preview-image" />
          {:else}
            <div class="file-download">
              <p>Este tipo de archivo no se puede previsualizar en el navegador.</p>
              <a href={signedUrl} target="_blank" rel="noopener noreferrer" class="download-btn">
                Descargar archivo
              </a>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  </div>
{/if}
