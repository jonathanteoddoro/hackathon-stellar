import { TriggerNode } from 'src/utils/TriggerNode';
import { NodeMessage } from 'src/utils/NodeMessage';
import { CronJob } from 'cron';

export class HttpTrigger extends TriggerNode {
  name = 'HTTPTrigger';
  description = 'Trigger ativado via requisição HTTP';
  isJobTrigger = false;

  constructor(params: { [key: string]: string } = {}) {
    super();
    void params; // HTTP trigger does not use params for now
  }

  validatePayload(payload: object): NodeMessage {
    return {
      payload: payload || {},
      metadata: {
        triggerId: 'http-trigger',
        triggerType: 'http',
        timestamp: new Date().toISOString(),
      },
    };
  }

  execute(): { jobName: string; job: CronJob } {
    throw new Error('HTTPTrigger does not support execute method');
  }
}
