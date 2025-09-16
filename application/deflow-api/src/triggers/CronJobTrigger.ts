import { TriggerNode } from 'src/utils/TriggerNode';
import { NodeMessage } from 'src/utils/NodeMessage';
import { CronJob } from 'cron';

export class CronJobTrigger extends TriggerNode {
  name = 'CronJobTrigger';
  description =
    'Dispara em intervalos regulares definidos por uma expressão cron.';
  private params: { time: string };
  isJobTrigger = true;

  constructor(params: { [key: string]: string } = {}) {
    super();
    if (!params.time) {
      throw new Error('Parameter "time" is required for CronJobTrigger');
    } else {
      // validate cron expression
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const testJob = new CronJob(params.time, () => {
          // do nothing
        });
        testJob.stop();
      } catch (err) {
        void err;
        throw new Error(`Invalid cron expression: ${params.time}`);
      }
    }
  }

  validatePayload(payload: object): NodeMessage {
    void payload; // cron job does not use incoming payload
    return {
      payload: {
        ...payload,
      },
      metadata: {
        triggerId: 'cron-job',
        triggerType: 'cron',
        timestamp: new Date().toISOString(),
      },
    };
  }

  execute(
    callback: (...args: any[]) => void,
    nodeId: string,
    flowId: string,
  ): { jobName: string; job: CronJob } {
    // default execute: start a generic cron job (no specific triggerId)
    return this.startFor(callback, nodeId, flowId);
  }

  // Start job for a specific deployed triggerId (distinct per deployment)
  private startFor(
    callback: (...args: any[]) => void,
    nodeId: string,
    flowId: string,
  ): { jobName: string; job: CronJob } {
    if (!this.params || !this.params.time) {
      throw new Error('Parameter "time" is required for CronJobTrigger');
    }
    const jobName = `cron-job-${nodeId}`;
    const job = new CronJob(
      this.params.time,
      () => {
        const message = this.validatePayload({
          triggerId: jobName,
          triggerType: 'cron',
          timestamp: new Date().toISOString(),
        });
        callback(message, nodeId, flowId);
      },
      null,
      true,
      'UTC',
    );
    return { jobName, job };
  }
}
