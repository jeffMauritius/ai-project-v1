import { SendMailClient } from 'zeptomail';

// Configuration ZeptoMail
const ZEPTOMAIL_URL = 'api.zeptomail.com/';
const ZEPTOMAIL_TOKEN = process.env.ZEPTOMAIL_TOKEN || '';
const FROM_EMAIL = process.env.ZEPTOMAIL_FROM_EMAIL || 'noreply@monmariage.ai';
const FROM_NAME = process.env.ZEPTOMAIL_FROM_NAME || 'MonMariage.ai';

// Initialiser le client ZeptoMail
const client = new SendMailClient({ url: ZEPTOMAIL_URL, token: ZEPTOMAIL_TOKEN });

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  toName?: string;
}

export async function sendMail({ to, subject, html, toName }: SendMailOptions): Promise<void> {
  if (!ZEPTOMAIL_TOKEN) {
    console.warn('[EMAIL] Token ZeptoMail non configuré - email non envoyé');
    console.log('[EMAIL] Destinataire:', to);
    console.log('[EMAIL] Sujet:', subject);
    return;
  }

  try {
    const response = await client.sendMail({
      from: {
        address: FROM_EMAIL,
        name: FROM_NAME,
      },
      to: [
        {
          email_address: {
            address: to,
            name: toName || to,
          },
        },
      ],
      subject,
      htmlbody: html,
      track_clicks: true,
      track_opens: true,
    });

    console.log('[EMAIL] Email envoyé avec succès:', {
      to,
      subject,
      response: (response as { data?: unknown })?.data || 'OK',
    });
  } catch (error) {
    console.error('[EMAIL] Erreur envoi ZeptoMail:', error);
    throw error;
  }
}

// Fonction pour envoyer un email avec template
export async function sendMailWithTemplate({
  to,
  templateKey,
  mergeInfo,
  toName,
}: {
  to: string;
  templateKey: string;
  mergeInfo: Record<string, string>;
  toName?: string;
}): Promise<void> {
  if (!ZEPTOMAIL_TOKEN) {
    console.warn('[EMAIL] Token ZeptoMail non configuré - email non envoyé');
    return;
  }

  try {
    const response = await client.sendMailWithTemplate({
      template_key: templateKey,
      from: {
        address: FROM_EMAIL,
        name: FROM_NAME,
      },
      to: [
        {
          email_address: {
            address: to,
            name: toName || to,
          },
        },
      ],
      merge_info: mergeInfo,
    });

    console.log('[EMAIL] Email template envoyé:', {
      to,
      templateKey,
      response: (response as { data?: unknown })?.data || 'OK',
    });
  } catch (error) {
    console.error('[EMAIL] Erreur envoi template ZeptoMail:', error);
    throw error;
  }
}
