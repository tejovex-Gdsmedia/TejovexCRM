import prisma from '../config/database';

export class WhatsAppService {
  async sendTemplateMessage(phone: string, name: string): Promise<void> {
    const settings = await prisma.crmSettings.findUnique({
      where: { id: 'global' },
    });

    if (!settings || !settings.whatsappEnabled) return;

    if (
      !settings.whatsappPhoneNumberId ||
      !settings.whatsappAccessToken ||
      !settings.whatsappTemplateName
    ) {
      console.warn('⚠️ WhatsApp credentials not fully configured in Settings');
      return;
    }

    // Strip everything except digits — Meta requires plain digits, no + or spaces
    const formattedPhone = phone.replace(/\D/g, '');

    const payload = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'template',
      template: {
        name: settings.whatsappTemplateName,
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: name || 'there' },
            ],
          },
        ],
      },
    };

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${settings.whatsappPhoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.whatsappAccessToken}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ WhatsApp API error:', JSON.stringify(error));
    } else {
      console.log(`✅ WhatsApp message sent to ${formattedPhone}`);
    }
  }
}

export const whatsAppService = new WhatsAppService();