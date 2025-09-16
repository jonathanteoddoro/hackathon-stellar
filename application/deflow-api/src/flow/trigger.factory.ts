import { Injectable } from '@nestjs/common';
import { CronJobTrigger } from 'src/triggers/CronJobTrigger';
import { HttpTrigger } from 'src/triggers/HttpTrigger';
import { TriggerNode } from 'src/utils/TriggerNode';

@Injectable()
export class TriggerFactory {
  constructor(
    private readonly cronJobTrigger: CronJobTrigger,
    private readonly httpTrigger: HttpTrigger,
  ) {}

  getTrigger(triggerId: string): TriggerNode {
    switch (triggerId) {
      case 'cron-job':
        return this.cronJobTrigger;
      case 'http-trigger':
      case 'http':
        return this.httpTrigger;
      default:
        throw new Error(`Unknown trigger type: ${triggerId}`);
    }
  }
}
