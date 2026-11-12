<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { api } from '../lib/api.js';

  export let user = null;

  const dispatch = createEventDispatcher();

  let users = [];
  let loading = false;
  let error = '';
  let success = '';
  let showCreateForm = false;
  let showEditForm = false;
  let selectedUser = null;
  let filterRole = '';
  let filterStatus = '';
  let searchQuery = '';

  let newUser = {
    email: '',
    password: '',
    fullName: '',
    role: 'student',
    studentData: {
      studentCode: '',
      universityId: '',
      career: '',
      semester: ''
    }
  };

  let editUser = {
    id: '',
    fullName: '',
    role: '',
    isActive: true,
    reviewerCapacity: 12
  };

  let resetPasswordData = {
    userId: '',
    newPassword: ''
  };

  async function loadUsers() {
    loading = true;
    error = '';

    try {
      const params = new URLSearchParams();
      if (filterRole) params.append('role', filterRole);
      if (filterStatus !== '') params.append('isActive', filterStatus);
      if (searchQuery) params.append('search', searchQuery);

      const data = await api(`/users?${params.toString()}`);
      users = data.users || [];
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function openCreateForm() {
    showCreateForm = true;
    showEditForm = false;
    selectedUser = null;
    newUser = {
      email: '',
      password: '',
      fullName: '',
      role: 'student',
      studentData: {
        studentCode: '',
        universityId: '',
        career: '',
        semester: ''
      }
    };
  }

  function openEditForm(userToEdit) {
    showEditForm = true;
    showCreateForm = false;
    selectedUser = userToEdit;
    editUser = {
      id: userToEdit.id,
      fullName: userToEdit.full_name,
      role: userToEdit.role,
      isActive: userToEdit.is_active,
      reviewerCapacity: userToEdit.reviewer_capacity || 12
    };
  }

  async function createUser() {
    error = '';
    success = '';

    try {
      const payload = {
        email: newUser.email,
        password: newUser.password,
        fullName: newUser.fullName,
        role: newUser.role
      };

      if (newUser.role === 'student') {
        payload.studentData = newUser.studentData;
      }

      await api('/users', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      success = 'Usuario creado correctamente';
      showCreateForm = false;
      await loadUsers();
    } catch (err) {
      error = err.message;
    }
  }

  async function updateUser() {
    error = '';
    success = '';

    try {
      await api(`/users/${editUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: editUser.fullName,
          role: editUser.role,
          isActive: editUser.isActive,
          reviewerCapacity: editUser.role === 'reviewer' ? editUser.reviewerCapacity : undefined
        })
      });

      success = 'Usuario actualizado correctamente';
      showEditForm = false;
      await loadUsers();
    } catch (err) {
      error = err.message;
    }
  }

  async function deleteUser(userId) {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

    error = '';
    success = '';

    try {
      await api(`/users/${userId}`, { method: 'DELETE' });
      success = 'Usuario eliminado correctamente';
      await loadUsers();
    } catch (err) {
      error = err.message;
    }
  }

  async function resetPassword() {
    error = '';
    success = '';

    try {
      await api(`/users/${resetPasswordData.userId}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword: resetPasswordData.newPassword })
      });

      success = 'Contraseña restablecida correctamente';
      resetPasswordData = { userId: '', newPassword: '' };
    } catch (err) {
      error = err.message;
    }
  }

  function openResetPassword(userId) {
    resetPasswordData = { userId, newPassword: '' };
  }

  function roleLabel(role) {
    const labels = {
      admin: 'Administrador',
      coordinator: 'Coordinador',
      reviewer: 'Revisor',
      student: 'Estudiante'
    };
    return labels[role] || role;
  }

  onMount(() => {
    if (user && user.role === 'admin') {
      loadUsers();
    }
  });
</script>

{#if user && user.role === 'admin'}
  <section class="panel">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <h2>Gestión de usuarios</h2>
      <button type="button" on:click={openCreateForm}>Crear usuario</button>
    </div>

    {#if error}
      <p class="error">{error}</p>
    {/if}
    {#if success}
      <p class="success">{success}</p>
    {/if}

    <div class="grid" style="margin-bottom: 1rem;">
      <div>
        <label for="filter-role">Filtrar por rol</label>
        <select id="filter-role" bind:value={filterRole} on:change={loadUsers}>
          <option value="">Todos</option>
          <option value="admin">Administrador</option>
          <option value="coordinator">Coordinador</option>
          <option value="reviewer">Revisor</option>
          <option value="student">Estudiante</option>
        </select>
      </div>

      <div>
        <label for="filter-status">Filtrar por estado</label>
        <select id="filter-status" bind:value={filterStatus} on:change={loadUsers}>
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>

      <div>
        <label for="search">Buscar</label>
        <input id="search" type="text" bind:value={searchQuery} placeholder="Email o nombre" />
        <button type="button" class="secondary" on:click={loadUsers} style="margin-top: 0.5rem;">Buscar</button>
      </div>
    </div>

    {#if showCreateForm}
      <article class="panel" style="margin-bottom: 1rem;">
        <h3>Crear nuevo usuario</h3>
        <form on:submit|preventDefault={createUser}>
          <label for="new-email">Email</label>
          <input id="new-email" type="email" bind:value={newUser.email} required />

          <label for="new-password">Contraseña</label>
          <input id="new-password" type="password" bind:value={newUser.password} required />

          <label for="new-fullname">Nombre completo</label>
          <input id="new-fullname" type="text" bind:value={newUser.fullName} required />

          <label for="new-role">Rol</label>
          <select id="new-role" bind:value={newUser.role} required>
            <option value="student">Estudiante</option>
            <option value="reviewer">Revisor</option>
            <option value="coordinator">Coordinador</option>
            <option value="admin">Administrador</option>
          </select>

          {#if newUser.role === 'student'}
            <h4>Datos del estudiante</h4>
            <label for="student-code">Código de estudiante</label>
            <input id="student-code" type="text" bind:value={newUser.studentData.studentCode} required />

            <label for="student-career">Carrera</label>
            <input id="student-career" type="text" bind:value={newUser.studentData.career} required />

            <label for="student-semester">Semestre</label>
            <input id="student-semester" type="number" bind:value={newUser.studentData.semester} required />
          {/if}

          <div class="actions">
            <button type="submit">Crear usuario</button>
            <button type="button" class="secondary" on:click={() => (showCreateForm = false)}>Cancelar</button>
          </div>
        </form>
      </article>
    {/if}

    {#if showEditForm && selectedUser}
      <article class="panel" style="margin-bottom: 1rem;">
        <h3>Editar usuario</h3>
        <form on:submit|preventDefault={updateUser}>
          <label for="edit-fullname">Nombre completo</label>
          <input id="edit-fullname" type="text" bind:value={editUser.fullName} required />

          <label for="edit-role">Rol</label>
          <select id="edit-role" bind:value={editUser.role} required>
            <option value="student">Estudiante</option>
            <option value="reviewer">Revisor</option>
            <option value="coordinator">Coordinador</option>
            <option value="admin">Administrador</option>
          </select>

          <label for="edit-active">
            <input id="edit-active" type="checkbox" bind:checked={editUser.isActive} style="width: auto; margin-right: 0.5rem;" />
            Usuario activo
          </label>

          {#if editUser.role === 'reviewer'}
            <label for="edit-capacity">Capacidad de revisión</label>
            <input id="edit-capacity" type="number" bind:value={editUser.reviewerCapacity} min="0" />
          {/if}

          <div class="actions">
            <button type="submit">Guardar cambios</button>
            <button type="button" class="secondary" on:click={() => (showEditForm = false)}>Cancelar</button>
          </div>
        </form>
      </article>
    {/if}

    {#if resetPasswordData.userId}
      <article class="panel" style="margin-bottom: 1rem;">
        <h3>Restablecer contraseña</h3>
        <form on:submit|preventDefault={resetPassword}>
          <label for="reset-password">Nueva contraseña</label>
          <input id="reset-password" type="password" bind:value={resetPasswordData.newPassword} required />

          <div class="actions">
            <button type="submit">Restablecer</button>
            <button type="button" class="secondary" on:click={() => (resetPasswordData = { userId: '', newPassword: '' })}>Cancelar</button>
          </div>
        </form>
      </article>
    {/if}

    {#if loading}
      <p class="muted">Cargando usuarios...</p>
    {:else if users.length === 0}
      <p class="muted">No hay usuarios que coincidan con los filtros.</p>
    {:else}
      <div class="list">
        {#each users as userItem}
          <article class="list-item">
            <strong>{userItem.full_name}</strong>
            <p class="muted">{userItem.email} · {roleLabel(userItem.role)}</p>
            {#if userItem.student}
              <p class="muted">
                {userItem.student.student_code} · {userItem.student.career} · {userItem.student.semester}° semestre · {userItem.student.university?.short_name || userItem.student.university?.name}
              </p>
            {/if}
            <p class="muted">
              {userItem.is_active ? 'Activo' : 'Inactivo'} ·
              {#if userItem.role === 'reviewer'}
                Carga: {userItem.current_workload}/{userItem.reviewer_capacity}
              {/if}
            </p>
            <div class="actions">
              <button type="button" class="secondary" on:click={() => openEditForm(userItem)}>Editar</button>
              <button type="button" class="secondary" on:click={() => openResetPassword(userItem.id)}>Reset contraseña</button>
              <button type="button" class="danger" on:click={() => deleteUser(userItem.id)}>Eliminar</button>
            </div>
          </article>
        {/each}
      </div>
    {/if}
  </section>
{/if}
