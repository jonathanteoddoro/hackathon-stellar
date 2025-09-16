import { LoggerNode } from '../utils/LoggerNode';
import { NodeMessage } from '../utils/NodeMessage';

export class WhatsAppLogger extends LoggerNode {
  name = 'whatsapp-logger';
  description = process.env.TWILIO_ACCOUNT_SID || '';
  private accountSid = process.env.TWILIO_ACCOUNT_SID;
  private authToken = process.env.TWILIO_AUTH_TOKEN;
  private fromNumber = process.env.TWILIO_WHATSAPP_FROM || '';
  private toNumber: string;
  private messageText: string;

  constructor(params: Record<string, string>) {
    super();
    this.toNumber = params['toNumber'];
    this.messageText =
      params['messageText'] || 'Log message from WhatsAppLogger';
    if (!this.fromNumber) {
      throw new Error(
        'WhatsAppLogger requires a from number (params.from or TWILIO_WHATSAPP_FROM)',
      );
    }
    if (!this.toNumber) {
      throw new Error(
        'WhatsAppLogger requires a to number (params.toNumber or TWILIO_WHATSAPP_TO)',
      );
    }
  }

  async execute(message: NodeMessage): Promise<NodeMessage> {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString(
        'base64',
      );

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: this.fromNumber,
          To: `whatsapp:${this.toNumber}`,
          Body: this.messageText,
        }),
      });

      if (response.ok) {
        return message;
      } else {
        const error = await response.text();
        throw new Error(`Erro do Twilio: ${error}`);
      }
    } catch (err) {
      console.error('Erro ao enviar WhatsApp:', err);
      throw new Error('Failed to send WhatsApp message');
    }
  }
}

export default WhatsAppLogger;
