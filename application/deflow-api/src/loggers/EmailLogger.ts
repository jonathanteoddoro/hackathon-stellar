import { LoggerNode } from '../utils/LoggerNode';
import { NodeMessage } from '../utils/NodeMessage';
import nodemailer from 'nodemailer';

type GmailConfig = {
  user?: string;  
  pass?: string;   
  to?: string;    
};

export class EmailLoggerNode extends LoggerNode {
  name = 'email-logger';
  description = 'Sends a log message via Gmail using nodemailer';

  private transporter: any;
  private from: string;
  private to: string;

  constructor(config: GmailConfig, transporter?: ReturnType<typeof nodemailer.createTransport>) {
    super();

    if (transporter) {
      this.transporter = transporter;
      this.from = config.user || 'no-reply@example.com';
      this.to = config.to || this.from;
    } else {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.user,
          pass: config.pass,
        },
      });

      this.from = config.user || '';
      this.to = config.to || '';
    }
  }

  async execute(message: NodeMessage) {
    const subject = message.metadata?.subject || `Log: ${this.name}`;
    const body = this.renderBody(message);

    try {
      const mailOptions: any = {
        subject,
        text: body.text,
        html: body.html,
      };

      if (this.from) mailOptions.from = this.from;
      if (this.to) mailOptions.to = this.to;

      const info = await this.transporter.sendMail(mailOptions);

      return { success: true, info };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  private renderBody(message: NodeMessage) {
    const payload = message.payload ? JSON.stringify(message.payload, null, 2) : '';
    const metadata = message.metadata ? JSON.stringify(message.metadata, null, 2) : '';

    const text = `Payload:\n${payload}\n\nMetadata:\n${metadata}`;
    const html = `<h3>Payload</h3><pre>${this.escapeHtml(payload)}</pre><h3>Metadata</h3><pre>${this.escapeHtml(metadata)}</pre>`;

    return { text, html };
  }

  private escapeHtml(str: string) {
    return str.replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
    );
  }
}

export default EmailLoggerNode;
