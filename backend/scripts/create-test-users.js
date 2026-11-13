import { supabase } from '../src/config/supabase.js';
import { hashPassword } from '../src/utils/security.js';

const testUsers = [
  {
    email: 'student@utcj.edu.mx',
    password: 'student123',
    full_name: 'Estudiante UTCJ',
    role: 'student'
  },
  {
    email: 'reviewer@utcj.edu.mx',
    password: 'reviewer123',
    full_name: 'Revisor UTCJ',
    role: 'reviewer'
  },
  {
    email: 'coordinator@utcj.edu.mx',
    password: 'coordinator123',
    full_name: 'Coordinador UTCJ',
    role: 'coordinator'
  },
  {
    email: 'admin@utcj.edu.mx',
    password: 'admin123',
    full_name: 'Administrador UTCJ',
    role: 'admin'
  }
];

console.log('Creando usuarios de prueba...');

for (const user of testUsers) {
  try {
    // Verificar si el usuario ya existe
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', user.email)
      .maybeSingle();

    if (existing) {
      console.log(`Usuario ${user.email} ya existe, actualizando...`);
      
      // Actualizar contraseña
      const passwordHash = await hashPassword(user.password);
      await supabase
        .from('profiles')
        .update({
          password_hash: passwordHash,
          full_name: user.full_name,
          role: user.role,
          is_active: true
        })
        .eq('id', existing.id);
      
      console.log(`✅ Usuario ${user.email} actualizado`);
    } else {
      console.log(`Creando usuario ${user.email}...`);
      
      // Crear usuario en auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      });

      if (authError) {
        console.error(`❌ Error creando usuario ${user.email}:`, authError.message);
        continue;
      }

      // Obtener el ID del usuario creado
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const authUser = authUsers.users.find(u => u.email === user.email);

      if (!authUser) {
        console.error(`❌ No se pudo encontrar el usuario creado ${user.email}`);
        continue;
      }

      // Crear perfil
      const passwordHash = await hashPassword(user.password);
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authUser.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        password_hash: passwordHash,
        is_active: true
      });

      if (profileError) {
        console.error(`❌ Error creando perfil ${user.email}:`, profileError.message);
        continue;
      }

      console.log(`✅ Usuario ${user.email} creado exitosamente`);
    }
  } catch (error) {
    console.error(`❌ Error procesando ${user.email}:`, error.message);
  }
}

console.log('\n🎉 Proceso completado!');
console.log('\nUsuarios de prueba:');
testUsers.forEach(user => {
  console.log(`- ${user.email} / ${user.password} (${user.role})`);
});
