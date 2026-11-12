import { supabase } from '../config/supabase.js';
import { hashPassword } from '../utils/security.js';

export async function listUsers({ role, isActive, search }) {
  let query = supabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      role,
      is_active,
      reviewer_capacity,
      current_workload,
      created_at,
      last_login_at,
      student:students(
        id,
        student_code,
        career,
        semester,
        university:universities(name, short_name)
      )
    `)
    .order('created_at', { ascending: false });

  if (role) {
    query = query.eq('role', role);
  }

  if (isActive !== undefined) {
    query = query.eq('is_active', isActive);
  }

  if (search) {
    query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getUserById(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      role,
      is_active,
      reviewer_capacity,
      current_workload,
      created_at,
      last_login_at,
      student:students(
        id,
        student_code,
        career,
        semester,
        university:universities(name, short_name)
      )
    `)
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createUser({ email, password, fullName, role, studentData = null }) {
  const passwordHash = await hashPassword(password);

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError) {
    throw authError;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      email,
      full_name: fullName,
      role,
      password_hash: passwordHash,
      is_active: true
    })
    .select()
    .single();

  if (profileError) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw profileError;
  }

  if (role === 'student' && studentData) {
    const { error: studentError } = await supabase
      .from('students')
      .insert({
        profile_id: authData.user.id,
        student_code: studentData.studentCode,
        university_id: studentData.universityId,
        career: studentData.career,
        semester: studentData.semester
      });

    if (studentError) {
      console.error('Error creating student profile:', studentError);
    }
  }

  return profile;
}

export async function updateUser(userId, { fullName, role, isActive, reviewerCapacity }) {
  const updates = {};

  if (fullName !== undefined) updates.full_name = fullName;
  if (role !== undefined) updates.role = role;
  if (isActive !== undefined) updates.is_active = isActive;
  if (reviewerCapacity !== undefined) updates.reviewer_capacity = reviewerCapacity;

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteUser(userId) {
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (profileError) {
    throw profileError;
  }

  const { error: authError } = await supabase.auth.admin.deleteUser(userId);

  if (authError) {
    console.error('Error deleting auth user:', authError);
  }

  return true;
}

export async function resetPassword(userId, newPassword) {
  const passwordHash = await hashPassword(newPassword);

  const { data, error } = await supabase
    .from('profiles')
    .update({ password_hash: passwordHash })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
