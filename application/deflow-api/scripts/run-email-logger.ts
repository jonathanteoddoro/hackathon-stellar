import 'ts-node/register';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import EmailLoggerNode from '../src/loggers/EmailLogger';
import { NodeMessage } from '../src/utils/NodeMessage';

dotenv.config();

const user = process.env.GMAIL_USER;
const pass = process.env.GMAIL_PASS;
const to = process.env.GMAIL_TO || user;

const message: NodeMessage = {
  payload: { test: 'hello from email logger' },
  metadata: { subject: 'Test email from EmailLoggerNode', timestamp: new Date().toISOString() },
};

let logger: any;

(async () => {
  let transporter: any | undefined;

  if (!user || !pass) {
    console.log('GMAIL_USER or GMAIL_PASS not provided — creating a test account (no real email will be sent).');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  logger = new EmailLoggerNode({ user, pass, to }, transporter);

  const result = await logger.execute(message as any);
  console.log('Result:', result);
  if (result?.info && result.info.messageId && nodemailer.getTestMessageUrl) {
    const url = nodemailer.getTestMessageUrl(result.info);
    if (url) console.log('Preview URL:', url);
  }
  process.exit(result?.success ? 0 : 1);
})();
