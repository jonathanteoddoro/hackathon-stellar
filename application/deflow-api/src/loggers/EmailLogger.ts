import { LoggerNode } from 'src/utils/LoggerNode';
import { NodeMessage } from '../utils/NodeMessage';

export class LoggerTemplate extends LoggerNode {
  name = 'logger-template';
  description = 'A template for creating new logger nodes';
  private transporter: any;
  private from: string;
  private to: string;

  constructor(params: Record<string, string>) {
    super();
    this.transporter = params['transporter'];
    this.from = params['from'];
    this.to = params['to'];
  }

  async execute(message: NodeMessage): Promise<NodeMessage> {
    const subject = message.metadata?.subject || `Log: ${this.name}`;
    const body = this.renderBody(message);

    const out = new NodeMessage();

    try {
      const mailOptions: any = {
        subject,
        text: body.text,
        html: body.html,
      };

      if (this.from) mailOptions.from = this.from;
      if (this.to) mailOptions.to = this.to;

      const info = await this.transporter.sendMail(mailOptions);

      out.payload = { success: true, info };
      return out;
    } catch (err) {
      out.payload = {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
      return out;
    }
  }

  private renderBody(message: NodeMessage) {
    const payload = message.payload
      ? JSON.stringify(message.payload, null, 2)
      : '';
    const metadata = message.metadata
      ? JSON.stringify(message.metadata, null, 2)
      : '';

    const text = `Payload:\n${payload}\n\nMetadata:\n${metadata}`;
    const html = `<h3>Payload</h3><pre>${this.escapeHtml(payload)}</pre><h3>Metadata</h3><pre>${this.escapeHtml(metadata)}</pre>`;

    return { text, html };
  }

  private escapeHtml(str: string) {
    return str.replace(
      /[&<>"']/g,
      (c) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[c] as string,
    );
  }
}
