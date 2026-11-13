<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import L from 'leaflet';
  import 'leaflet/dist/leaflet.css';
  import 'leaflet-draw';
  import 'leaflet-draw/dist/leaflet.draw.css';

  const dispatch = createEventDispatcher();

  let map = null;
  let drawnItems = null;
  let geofences = [];
  let mapError = '';
  let loading = false;

  onMount(() => {
    initializeMap();
  });

  onDestroy(() => {
    if (map) {
      map.remove();
      map = null;
    }
  });

  function initializeMap() {
    loading = true;
    mapError = '';

    try {
      // Verificar que el div del mapa exista
      const mapElement = document.getElementById('map');
      if (!mapElement) {
        mapError = 'No se encontró el elemento del mapa';
        loading = false;
        return;
      }

      // Inicializar el mapa centrado en Ciudad Juárez
      map = L.map('map', {
        center: [31.6906, -106.4252],
        zoom: 13,
        zoomControl: true
      });

      // Agregar capa base de OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      // Inicializar el grupo de items dibujados
      drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);

      // Configurar el control de dibujo
      const drawControl = new L.Control.Draw({
        position: 'topleft',
        draw: {
          polygon: {
            allowIntersection: false,
            showArea: true,
            shapeOptions: {
              color: '#1e3a8a',
              weight: 2,
              fillColor: '#3b82f6',
              fillOpacity: 0.2
            }
          },
          polyline: false,
          rectangle: false,
          circle: {
            shapeOptions: {
              color: '#1e3a8a',
              weight: 2,
              fillColor: '#3b82f6',
              fillOpacity: 0.2
            }
          },
          marker: false,
          circlemarker: false
        },
        edit: {
          featureGroup: drawnItems,
          remove: true
        }
      });

      map.addControl(drawControl);

      // Eventos de dibujo
      map.on(L.Draw.Event.CREATED, handleGeofenceCreated);
      map.on(L.Draw.Event.EDITED, handleGeofenceEdited);
      map.on(L.Draw.Event.DELETED, handleGeofenceDeleted);

      loading = false;
    } catch (err) {
      console.error('Error initializing map:', err);
      mapError = 'Error al inicializar el mapa: ' + err.message;
      loading = false;
    }
  }

  function handleGeofenceCreated(e) {
    const layer = e.layer;
    drawnItems.addLayer(layer);

    const geoData = layer.toGeoJSON();
    const geofence = {
      id: Date.now(),
      type: e.layerType,
      coordinates: geoData.geometry.coordinates,
      properties: {
        name: `Geocerca ${geofences.length + 1}`,
        createdAt: new Date().toISOString()
      }
    };

    geofences = [...geofences, geofence];
    dispatch('geofence-created', geofence);
  }

  function handleGeofenceEdited(e) {
    const layers = e.layers;
    layers.eachLayer(function (layer) {
      const geoData = layer.toGeoJSON();
      const index = geofences.findIndex(g =>
        JSON.stringify(g.coordinates) === JSON.stringify(geoData.geometry.coordinates)
      );

      if (index !== -1) {
        geofences[index].coordinates = geoData.geometry.coordinates;
        geofences[index].properties.updatedAt = new Date().toISOString();
        dispatch('geofence-updated', geofences[index]);
      }
    });
  }

  function handleGeofenceDeleted(e) {
    const layers = e.layers;
    layers.eachLayer(function (layer) {
      const geoData = layer.toGeoJSON();
      const index = geofences.findIndex(g =>
        JSON.stringify(g.coordinates) === JSON.stringify(geoData.geometry.coordinates)
      );

      if (index !== -1) {
        const deletedGeofence = geofences[index];
        geofences = geofences.filter((_, i) => i !== index);
        dispatch('geofence-deleted', deletedGeofence);
      }
    });
  }

  function clearGeofences() {
    if (drawnItems) {
      drawnItems.clearLayers();
    }
    geofences = [];
    dispatch('geofences-cleared');
  }

  function exportGeofences() {
    if (geofences.length === 0) {
      alert('No hay geocercas para exportar');
      return;
    }

    const data = {
      type: 'FeatureCollection',
      features: geofences.map(g => ({
        type: 'Feature',
        geometry: {
          type: g.type === 'circle' ? 'Point' : 'Polygon',
          coordinates: g.coordinates
        },
        properties: g.properties
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'geofences.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importGeofences(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.type === 'FeatureCollection' && data.features) {
          data.features.forEach(feature => {
            try {
              const layer = L.geoJSON(feature).getLayers()[0];
              if (layer && drawnItems) {
                drawnItems.addLayer(layer);

                const geofence = {
                  id: Date.now() + Math.random(),
                  type: feature.geometry.type === 'Point' ? 'circle' : 'polygon',
                  coordinates: feature.geometry.coordinates,
                  properties: feature.properties || {}
                };

                geofences = [...geofences, geofence];
              }
            } catch (err) {
              console.error('Error importing feature:', err);
            }
          });
          dispatch('geofences-imported', geofences);
        } else {
          alert('Formato de archivo inválido. Debe ser un FeatureCollection de GeoJSON.');
        }
      } catch (error) {
        console.error('Error importing geofences:', error);
        alert('Error al importar el archivo: ' + error.message);
      }
    };
    reader.readAsText(file);
  }

  function deleteGeofence(index) {
    const geofence = geofences[index];
    if (!geofence) return;

    // Buscar y eliminar la capa correspondiente del mapa
    if (drawnItems) {
      const layers = drawnItems.getLayers();
      for (const layer of layers) {
        try {
          const geoData = layer.toGeoJSON();
          if (JSON.stringify(geoData.geometry.coordinates) === JSON.stringify(geofence.coordinates)) {
            drawnItems.removeLayer(layer);
            break;
          }
        } catch (err) {
          // Continuar si hay error con una capa específica
        }
      }
    }

    geofences = geofences.filter((_, i) => i !== index);
  }
</script>

<div class="map-container">
  {#if loading}
    <div class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Cargando mapa...</p>
    </div>
  {/if}

  {#if mapError}
    <div class="error-message">
      <p>{mapError}</p>
      <button type="button" class="retry-button" on:click={initializeMap}>
        Reintentar
      </button>
    </div>
  {/if}

  <div class="map-header">
    <h2>Gestión de Geocercas</h2>
    <div class="map-actions">
      <button type="button" class="action-button" on:click={clearGeofences} disabled={geofences.length === 0}>
        Limpiar todo
      </button>
      <button type="button" class="action-button" on:click={exportGeofences} disabled={geofences.length === 0}>
        Exportar
      </button>
      <label class="action-button file-label" class:disabled={loading || !!mapError}>
        Importar
        <input
          type="file"
          accept=".json"
          on:change={(e) => {
            importGeofences(e.target.files[0]);
            e.target.value = '';
          }}
          hidden
          disabled={loading || !!mapError}
        />
      </label>
    </div>
  </div>

  <div id="map" class="map"></div>

  <div class="geofence-list">
    <h3>Geocercas activas ({geofences.length})</h3>
    {#if geofences.length === 0}
      <p class="empty-message">No hay geocercas dibujadas. Usa las herramientas del mapa para crear una.</p>
    {:else}
      <ul>
        {#each geofences as geofence, index}
          <li class="geofence-item">
            <div class="geofence-info">
              <span class="geofence-name">{geofence.properties.name || `Geocerca ${index + 1}`}</span>
              <span class="geofence-meta">
                {geofence.type} • {new Date(geofence.properties.createdAt).toLocaleDateString('es-MX')}
              </span>
            </div>
            <button type="button" class="delete-button" on:click={() => deleteGeofence(index)}>
              Eliminar
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

<style>
  .map-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 1rem;
    position: relative;
  }

  .map-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .map-header h2 {
    margin: 0;
    color: #1e3a8a;
    font-size: 1.25rem;
  }

  .map-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .action-button {
    padding: 0.5rem 1rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    transition: background 0.2s;
    font-weight: 500;
  }

  .action-button:hover:not(:disabled) {
    background: #2563eb;
  }

  .action-button:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }

  .file-label {
    cursor: pointer;
    display: inline-block;
  }

  .file-label.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .map {
    flex: 1;
    min-height: 400px;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
    z-index: 1;
  }

  .geofence-list {
    background: white;
    border-radius: 0.5rem;
    padding: 1rem;
    border: 1px solid #e5e7eb;
    max-height: 200px;
    overflow-y: auto;
  }

  .geofence-list h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    color: #374151;
  }

  .empty-message {
    color: #6b7280;
    font-style: italic;
    margin: 0;
  }

  .geofence-list ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .geofence-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .geofence-item:last-child {
    border-bottom: none;
  }

  .geofence-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
  }

  .geofence-name {
    font-weight: 500;
    color: #1f2937;
  }

  .geofence-meta {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .delete-button {
    padding: 0.5rem 1rem;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    font-size: 0.875rem;
    transition: background 0.2s;
    font-weight: 500;
  }

  .delete-button:hover {
    background: #dc2626;
  }

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    border-radius: 0.5rem;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e5e7eb;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .error-message {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .error-message p {
    color: #991b1b;
    margin: 0;
    font-weight: 500;
  }

  .retry-button {
    padding: 0.5rem 1rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: background 0.2s;
  }

  .retry-button:hover {
    background: #2563eb;
  }

  @media (max-width: 768px) {
    .map-header {
      flex-direction: column;
      align-items: stretch;
    }

    .map-actions {
      justify-content: center;
    }

    .map {
      min-height: 300px;
    }

    .geofence-item {
      flex-direction: column;
      align-items: flex-start;
    }

    .delete-button {
      width: 100%;
    }
  }
</style>
