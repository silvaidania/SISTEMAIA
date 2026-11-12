<script>
  import { onMount, onDestroy } from 'svelte';
  import L from 'leaflet';
  import 'leaflet/dist/leaflet.css';
  import 'leaflet-draw';
  import 'leaflet-draw/dist/leaflet.draw.css';

  let map;
  let drawnItems;
  let geofences = [];

  onMount(() => {
    // Inicializar el mapa
    map = L.map('map').setView([31.6906, -106.4252], 13); // Ciudad Juárez por defecto

    // Agregar capa base de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Inicializar el grupo de items dibujados
    drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    // Configurar el control de dibujo
    const drawControl = new L.Control.Draw({
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true
        },
        polyline: false,
        rectangle: false,
        circle: true,
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
    map.on(L.Draw.Event.CREATED, function (e) {
      const layer = e.layer;
      drawnItems.addLayer(layer);
      
      // Obtener los datos de la geocerca
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
    });

    map.on(L.Draw.Event.EDITED, function (e) {
      const layers = e.layers;
      layers.eachLayer(function (layer) {
        const geoData = layer.toGeoJSON();
        const index = geofences.findIndex(g => 
          JSON.stringify(g.coordinates) === JSON.stringify(geoData.geometry.coordinates)
        );
        
        if (index !== -1) {
          geofences[index].coordinates = geoData.geometry.coordinates;
          dispatch('geofence-updated', geofences[index]);
        }
      });
    });

    map.on(L.Draw.Event.DELETED, function (e) {
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
    });
  });

  onDestroy(() => {
    if (map) {
      map.remove();
    }
  });

  function clearGeofences() {
    drawnItems.clearLayers();
    geofences = [];
    dispatch('geofences-cleared');
  }

  function exportGeofences() {
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
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.type === 'FeatureCollection' && data.features) {
          data.features.forEach(feature => {
            const layer = L.geoJSON(feature).getLayers()[0];
            drawnItems.addLayer(layer);
            
            const geofence = {
              id: Date.now() + Math.random(),
              type: feature.geometry.type === 'Point' ? 'circle' : 'polygon',
              coordinates: feature.geometry.coordinates,
              properties: feature.properties || {}
            };
            
            geofences = [...geofences, geofence];
          });
          dispatch('geofences-imported', geofences);
        }
      } catch (error) {
        console.error('Error importing geofences:', error);
      }
    };
    reader.readAsText(file);
  }
</script>

<div class="map-container">
  <div class="map-header">
    <h2>Gestión de Geocercas</h2>
    <div class="map-actions">
      <button type="button" class="action-button" on:click={clearGeofences}>
        Limpiar todo
      </button>
      <button type="button" class="action-button" on:click={exportGeofences}>
        Exportar
      </button>
      <label class="action-button file-label">
        Importar
        <input type="file" accept=".json" on:change={(e) => importGeofences(e.target.files[0])} hidden />
      </label>
    </div>
  </div>
  
  <div id="map" class="map"></div>
  
  <div class="geofence-list">
    <h3>Geocercas activas ({geofences.length})</h3>
    {#if geofences.length === 0}
      <p class="empty-message">No hay geocercas dibujadas</p>
    {:else}
      <ul>
        {#each geofences as geofence, index}
          <li class="geofence-item">
            <span class="geofence-name">{geofence.properties.name || `Geocerca ${index + 1}`}</span>
            <span class="geofence-type">{geofence.type}</span>
            <button type="button" class="delete-button" on:click={() => {
              const layer = drawnItems.getLayers().find(l => {
                const geoData = l.toGeoJSON();
                return JSON.stringify(geoData.geometry.coordinates) === JSON.stringify(geofence.coordinates);
              });
              if (layer) {
                drawnItems.removeLayer(layer);
              }
              geofences = geofences.filter((_, i) => i !== index);
            }}>
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
  }

  .action-button:hover {
    background: #2563eb;
  }

  .file-label {
    cursor: pointer;
  }

  .map {
    flex: 1;
    min-height: 400px;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
  }

  .geofence-list {
    background: white;
    border-radius: 0.5rem;
    padding: 1rem;
    border: 1px solid #e5e7eb;
  }

  .geofence-list h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    color: #374151;
  }

  .empty-message {
    color: #6b7280;
    font-style: italic;
  }

  .geofence-list ul {
    list-style: none;
    padding: 0;
    margin: 0;
    max-height: 200px;
    overflow-y: auto;
  }

  .geofence-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .geofence-item:last-child {
    border-bottom: none;
  }

  .geofence-name {
    flex: 1;
    font-weight: 500;
    color: #1f2937;
  }

  .geofence-type {
    padding: 0.25rem 0.5rem;
    background: #dbeafe;
    color: #1e40af;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .delete-button {
    padding: 0.25rem 0.5rem;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 0.75rem;
    transition: background 0.2s;
  }

  .delete-button:hover {
    background: #dc2626;
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
  }
</style>
