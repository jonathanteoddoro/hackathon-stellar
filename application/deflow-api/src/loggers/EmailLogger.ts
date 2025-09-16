import { LoggerNode } from 'src/utils/LoggerNode';
import { NodeMessage } from '../utils/NodeMessage';

const nodemailer = require('nodemailer');

interface MailOptions {
  subject: string;
  text: string;
  html: string;
  from: string;
  to: string;
}

interface EmailMetadata {
  subject?: string;
  message?: string;
  [key: string]: unknown;
}

interface SentMessageInfo {
  messageId: string;
  [key: string]: unknown;
}

interface Transporter {
  sendMail(options: MailOptions): Promise<SentMessageInfo>;
}

class NodemailerTransporter {
  private transporter: Transporter;

  constructor(user: string, pass: string) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  }

  async sendMail(
    options: MailOptions,
  ): Promise<{ success: boolean; messageId: string }> {
    try {
      console.log(`📧 Enviando email para ${options.to}...`);
      
      const info: SentMessageInfo = await this.transporter.sendMail({
        from: options.from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      console.log(`Email enviado com sucesso! ID: ${info.messageId}`);
      
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      console.error(`❌ Erro ao enviar email: ${errorMessage}`);
      
      return {
        success: false,
        messageId: `error-${Date.now()}`,
      };
    }
  }
}

export class EmailLogger extends LoggerNode {
  name = 'EmailLogger';
  description =
    'Logger que envia notificações por email com assunto e mensagem personalizáveis';
  private transporter: NodemailerTransporter;
  private from: string;
  private to: string;
  private defaultSubject?: string;
  private defaultMessage?: string;

  constructor(params: Record<string, unknown>) {
    super();
    const user = params['user'] as string;
    const pass = params['pass'] as string;

    this.transporter = new NodemailerTransporter(user, pass);
    this.from = params['from'] as string;
    this.to = params['to'] as string;
    this.defaultSubject = params['subject'] as string | undefined;
    this.defaultMessage = params['message'] as string | undefined;
  }

  async log(message: NodeMessage): Promise<void> {
    try {
      const metadata = message.metadata as EmailMetadata;
      const subject = metadata?.subject || this.defaultSubject || 'Notificação do Sistema';
      const messageBody = 
        metadata?.message || 
        this.defaultMessage || 
        `Nova mensagem: ${JSON.stringify(message.payload)}`;

      const htmlMessage = `
        <h2>${subject}</h2>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        <p><strong>Mensagem:</strong> ${messageBody}</p>
        <hr>
        <details>
          <summary>Dados completos da mensagem</summary>
          <pre>${JSON.stringify(message, null, 2)}</pre>
        </details>
      `;

      const mailOptions: MailOptions = {
        from: this.from,
        to: this.to,
        subject: subject,
        text: `${subject}\n\nTimestamp: ${new Date().toLocaleString('pt-BR')}\nMensagem: ${messageBody}\n\nDados: ${JSON.stringify(message, null, 2)}`,
        html: htmlMessage,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      if (result.success) {
        console.log(`📧 EmailLogger: Email enviado com sucesso para ${this.to}`);
      } else {
        console.error(`❌ EmailLogger: Falha ao enviar email para ${this.to}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error(`❌ EmailLogger: Erro inesperado: ${errorMessage}`);
    }
  }

  async execute(message: NodeMessage): Promise<NodeMessage> {
    await this.log(message);
    return message; // Passa a mensagem adiante
  }
}
