import { CronJob } from 'cron';
import { NodeMessage } from './NodeMessage';

export abstract class TriggerNode {
  abstract name: string;
  abstract description: string;
  abstract isJobTrigger?: boolean;

  abstract validatePayload(payload: object): NodeMessage;
  abstract execute?(
    callback: (...args: any[]) => void,
    nodeId: string,
  ): { jobName: string; job: CronJob };
}
