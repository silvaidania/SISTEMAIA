import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: env.smtpSecure,
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass
  }
});

export async function sendEmail({ to, subject, html, text }) {
  try {
    const info = await transporter.sendMail({
      from: env.smtpFrom,
      to,
      subject,
      text,
      html
    });

    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export function getStatusEmailTemplate(document, oldStatus, newStatus) {
  const statusLabels = {
    submitted: 'Enviado',
    in_review: 'En revisión',
    observed: 'Con observaciones',
    corrected: 'Corregido',
    approved: 'Aprobado',
    rejected: 'Rechazado'
  };

  const statusColors = {
    submitted: '#f59e0b',
    in_review: '#3b82f6',
    observed: '#ef4444',
    corrected: '#10b981',
    approved: '#22c55e',
    rejected: '#dc2626'
  };

  const oldLabel = statusLabels[oldStatus] || oldStatus;
  const newLabel = statusLabels[newStatus] || newStatus;
  const color = statusColors[newStatus] || '#6b7280';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Notificación de documento</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${color}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .status-badge { display: inline-block; padding: 8px 16px; background-color: ${color}; color: white; border-radius: 20px; font-weight: bold; margin: 10px 0; }
        .document-info { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${color}; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        .button { display: inline-block; padding: 12px 24px; background-color: ${color}; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Notificación de Documento</h1>
        </div>
        <div class="content">
          <p>Hola,</p>
          <p>El estado de tu documento ha cambiado:</p>
          
          <div class="document-info">
            <h2>${document.title}</h2>
            <p><strong>Tipo:</strong> ${document.document_type}</p>
            <p><strong>Estado anterior:</strong> ${oldLabel}</p>
            <p><strong>Estado actual:</strong> <span class="status-badge">${newLabel}</span></p>
          </div>

          <p>Puedes revisar los detalles y tomar las acciones necesarias en el sistema.</p>
          
          <a href="${env.appUrl}/documents/${document.id}" class="button">Ver documento</a>
        </div>
        <div class="footer">
          <p>Este es un correo automático del Sistema IA. Por favor no respondas a este mensaje.</p>
          <p>&copy; ${new Date().getFullYear()} Sistema IA - Universidades Tecnológicas</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Notificación de Documento
    
    Hola,
    
    El estado de tu documento ha cambiado:
    
    Documento: ${document.title}
    Tipo: ${document.document_type}
    Estado anterior: ${oldLabel}
    Estado actual: ${newLabel}
    
    Puedes revisar los detalles en: ${env.appUrl}/documents/${document.id}
    
    Este es un correo automático del Sistema IA.
  `;

  return { html, text };
}
