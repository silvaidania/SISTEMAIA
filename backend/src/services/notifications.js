import { supabase } from '../config/supabase.js';
import { sendEmail, getStatusEmailTemplate } from './email.js';

export async function createNotification({ userId, type, title, message, documentId = null }) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      document_id: documentId
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    throw error;
  }

  return data;
}

export async function getUserNotifications(userId, { unreadOnly = false, limit = 50 } = {}) {
  let query = supabase
    .from('notifications')
    .select(`
      id,
      type,
      title,
      message,
      document_id,
      is_read,
      created_at,
      document:documents(
        id,
        title,
        status
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getUnreadCount(userId) {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    throw error;
  }

  return count || 0;
}

export async function markAsRead(notificationId, userId) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function markAllAsRead(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
    .select();

  if (error) {
    throw error;
  }

  return data || [];
}

export async function notifyDocumentStatusChange(document, oldStatus, newStatus, actorId, actorRole = null) {
  const statusMessages = {
    submitted: 'Documento enviado',
    in_review: 'Documento en revisión',
    observed: 'Documento con observaciones',
    corrected: 'Documento corregido',
    approved: 'Documento aprobado',
    rejected: 'Documento rechazado'
  };

  const title = statusMessages[newStatus] || 'Estado de documento actualizado';
  const message = `El documento "${document.title}" cambió de ${oldStatus} a ${newStatus}.`;

  const notifications = [];
  const emailRecipients = [];

  if (document.student?.profile_id) {
    notifications.push({
      userId: document.student.profile_id,
      type: 'document_status',
      title,
      message,
      documentId: document.id
    });

    const { data: studentProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', document.student.profile_id)
      .single();

    if (studentProfile?.email) {
      emailRecipients.push({
        email: studentProfile.email,
        name: studentProfile.full_name
      });
    }
  }

  if (document.reviewer_id && document.reviewer_id !== actorId) {
    notifications.push({
      userId: document.reviewer_id,
      type: 'document_status',
      title,
      message,
      documentId: document.id
    });

    const { data: reviewerProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', document.reviewer_id)
      .single();

    if (reviewerProfile?.email) {
      emailRecipients.push({
        email: reviewerProfile.email,
        name: reviewerProfile.full_name
      });
    }
  }

  if (actorRole && ['admin', 'coordinator'].includes(actorRole)) {
    const { data: staff } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('role', ['admin', 'coordinator'])
      .eq('is_active', true);

    if (staff) {
      staff.forEach((user) => {
        if (user.id !== actorId) {
          notifications.push({
            userId: user.id,
            type: 'document_status',
            title,
            message,
            documentId: document.id
          });

          if (user.email) {
            emailRecipients.push({
              email: user.email,
              name: user.full_name
            });
          }
        }
      });
    }
  }

  for (const notification of notifications) {
    try {
      await createNotification(notification);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  const emailTemplate = getStatusEmailTemplate(document, oldStatus, newStatus);

  for (const recipient of emailRecipients) {
    try {
      await sendEmail({
        to: recipient.email,
        subject: `${title} - ${document.title}`,
        html: emailTemplate.html,
        text: emailTemplate.text
      });
    } catch (error) {
      console.error('Error sending email to', recipient.email, ':', error);
    }
  }
}
