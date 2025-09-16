import { LoggerNode } from 'src/utils/LoggerNode';
import { NodeMessage } from '../utils/NodeMessage';

export class WhatsAppLogger extends LoggerNode {
    name = 'whatsapp-logger';
    description = 'Envia logs via WhatsApp usando Twilio';
    private accountSid: string;
    private authToken: string;
    private fromNumber: string;
    private toNumber: string = '+5527998924571'; // Número fixo do destinatário

    constructor(params: Record<string, string>) {
        super();
        this.accountSid = params['accountSid'] || process.env.TWILIO_ACCOUNT_SID;
        this.authToken = params['authToken'] || process.env.TWILIO_AUTH_TOKEN;
        this.fromNumber = params['fromNumber'] || process.env.TWILIO_WHATSAPP_FROM 
    }

    async execute(message: NodeMessage): Promise<NodeMessage> {
        const messageText = this.renderMessage(message);
        const out = new NodeMessage();

        try {
            // Configuração da API do Twilio
            const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
            const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    From: this.fromNumber,
                    To: `whatsapp:${this.toNumber}`,
                    Body: messageText
                })
            });

            if (response.ok) {
                const result = await response.json();
                out.payload = { 
                    success: true, 
                    message: 'WhatsApp enviado com sucesso via Twilio',
                    to: this.toNumber,
                    messageSid: result.sid
                };
            } else {
                const error = await response.text();
                throw new Error(`Erro do Twilio: ${error}`);
            }

            return out;
        } catch (err) {
            console.error('Erro ao enviar WhatsApp:', err);
            
            out.payload = { 
                success: false, 
                error: err instanceof Error ? err.message : String(err),
                fallbackLogged: true
            };
            return out;
        }
    }

    private renderMessage(message: NodeMessage): string {
        const payload = message.payload ? JSON.stringify(message.payload, null, 2) : '';
        const metadata = message.metadata ? JSON.stringify(message.metadata, null, 2) : '';

        return `*Log do Sistema DeFlow*\n\n*Payload:*\n\`\`\`\n${payload}\n\`\`\`\n\n*Metadata:*\n\`\`\`\n${metadata}\n\`\`\``;
    }
}

export default WhatsAppLogger;