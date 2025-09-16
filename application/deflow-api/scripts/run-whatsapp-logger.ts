import 'ts-node/register';
import dotenv from 'dotenv';
import path from 'path';
import WhatsAppLoggerNode from '../src/loggers/WhatsAppLogger';
import { NodeMessage } from '../src/utils/NodeMessage';

// Carrega o .env do diretório raiz do projeto
dotenv.config({ path: path.join(__dirname, '../.env') });

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_FROM;

const message: NodeMessage = {
  payload: { 
    test: 'hello from whatsapp logger',
    type: 'notification',
    timestamp: new Date().toISOString()
  },
  metadata: { 
    source: 'WhatsAppLoggerNode Test', 
    environment: 'development',
    timestamp: new Date().toISOString() 
  },
};

let logger: any;

(async () => {
  try {
    logger = new WhatsAppLoggerNode({
      accountSid: accountSid,
      authToken: authToken,
      fromNumber: fromNumber
    });

    const result = await logger.execute(message);
    console.log('Result:', result);
    
    process.exit((result.payload as any)?.success ? 0 : 1);
  } catch (error) {
    console.error('Erro no WhatsApp Logger:', error);
    process.exit(1);
  }
})();