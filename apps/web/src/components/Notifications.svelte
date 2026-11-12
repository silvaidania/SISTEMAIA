<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { api } from '../lib/api.js';

  export let user = null;

  const dispatch = createEventDispatcher();

  let notifications = [];
  let unreadCount = 0;
  let showNotifications = false;
  let loading = false;
  let error = '';

  async function loadNotifications() {
    loading = true;
    error = '';

    try {
      const [notificationsData, countData] = await Promise.all([
        api('/notifications'),
        api('/notifications/unread-count')
      ]);

      notifications = notificationsData.notifications || [];
      unreadCount = countData.count || 0;
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function markAsRead(notificationId) {
    try {
      await api(`/notifications/${notificationId}/read`, { method: 'PATCH' });
      await loadNotifications();
    } catch (err) {
      error = err.message;
    }
  }

  async function markAllAsRead() {
    try {
      await api('/notifications/mark-all-read', { method: 'POST' });
      await loadNotifications();
    } catch (err) {
      error = err.message;
    }
  }

  function toggleNotifications() {
    showNotifications = !showNotifications;
    if (showNotifications) {
      loadNotifications();
    }
  }

  function handleNotificationClick(notification) {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.document_id) {
      dispatch('select-document', notification.document_id);
      showNotifications = false;
    }
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours} h`;
    if (days < 7) return `Hace ${days} d`;
    return date.toLocaleDateString();
  }

  onMount(() => {
    if (user) {
      loadNotifications();
    }
  });
</script>

<div class="notification-container">
  <button type="button" class="notification-bell" on:click={toggleNotifications}>
    🔔
    {#if unreadCount > 0}
      <span class="notification-badge">{unreadCount}</span>
    {/if}
  </button>

  {#if showNotifications}
    <div class="notification-dropdown">
      <div class="notification-header">
        <h3>Notificaciones</h3>
        {#if unreadCount > 0}
          <button type="button" class="mark-all-btn" on:click={markAllAsRead}>
            Marcar todas como leídas
          </button>
        {/if}
      </div>

      {#if error}
        <p class="error">{error}</p>
      {/if}

      {#if loading}
        <p class="muted">Cargando...</p>
      {:else if notifications.length === 0}
        <p class="muted">No hay notificaciones</p>
      {:else}
        <div class="notification-list">
          {#each notifications as notification}
            <button
              type="button"
              class="notification-item"
              class:unread={!notification.is_read}
              on:click={() => handleNotificationClick(notification)}
            >
              <div class="notification-content">
                <strong>{notification.title}</strong>
                <p>{notification.message}</p>
                <span class="notification-time">{formatDate(notification.created_at)}</span>
              </div>
              {#if !notification.is_read}
                <span class="unread-dot"></span>
              {/if}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>
