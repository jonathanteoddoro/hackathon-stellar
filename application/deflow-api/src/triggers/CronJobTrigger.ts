import { Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { TriggerNode } from 'src/utils/TriggerNode';
import { NodeMessage } from 'src/utils/NodeMessage';
import { FlowService } from 'src/flow/flow.service';
import { CronJob } from 'cron';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TriggerConfig } from 'src/models/TriggerConfig';

@Injectable()
export class CronJobTrigger extends TriggerNode {
  name = 'Cron Job Trigger';
  description = 'Dispara em intervalos regulares definidos por uma expressão cron.';
  private params: { time: string };
  private runCount = 0;
  private lastRunAt?: string;

  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private flowService: FlowService,
    @InjectModel(TriggerConfig.name) private triggerConfigModel?: Model<TriggerConfig>,
  ) {
    super();
    this.params = {
      time: '*/10 * * * * *',
    };
  }

  setParams(params: { time?: string }) {
    this.params = {
      time: params?.time || this.params.time,
    };
  }

  validatePayload(payload: object): NodeMessage {
    return {
      payload: {},
      metadata: {
        triggerId: 'cron-job',
        triggerType: 'cron',
        timestamp: new Date().toISOString(),
      },
    };
  }

  async execute(): Promise<NodeMessage> {
    // default execute: start a generic cron job (no specific triggerId)
    return this.startFor('cron-job').then(() => ({
      payload: { status: 'cron_job_started', jobName: `cron-${Date.now()}` },
      metadata: { triggerId: 'cron-job', triggerType: 'cron', timestamp: new Date().toISOString() },
    } as NodeMessage));
  }

  // Start job for a specific deployed triggerId (distinct per deployment)
  async startFor(triggerId: string): Promise<{ jobName: string } | null> {
    // stop existing job if configured
    try {
      if (this.triggerConfigModel) {
        const existing = await this.triggerConfigModel.findOne({ triggerId }).exec();
        if (existing?.activeJobName) {
          try {
            this.stopJob(existing.activeJobName);
          } catch (e) {
            // ignore
          }
          existing.activeJobName = undefined;
          await existing.save();
        }
      }
    } catch (err) {
      // ignore
    }

    const jobName = `${triggerId}-job-${Date.now()}`;

    let effectiveSchedule = this.params.time;
    let configuredFlowId: string | undefined;
    try {
      if (this.triggerConfigModel) {
        const cfg = await this.triggerConfigModel.findOne({ triggerId }).exec();
        if (cfg) {
          effectiveSchedule = cfg.params?.time || effectiveSchedule;
          configuredFlowId = cfg.flowId;
        }
      }
    } catch (err) {
      // ignore
    }

    const job = new CronJob(effectiveSchedule, async () => {
      const startedAt = new Date().toISOString();
      this.runCount += 1;
      console.log(`Job ${jobName} executado (#${this.runCount}) em ${startedAt}`);

      let latestCfg: TriggerConfig | null = null;
      try {
        if (this.triggerConfigModel) {
          latestCfg = await this.triggerConfigModel.findOne({ triggerId: 'cron-job' }).exec();
        }
      } catch (err) {
        console.error('Failed to read TriggerConfig before run:', err);
      }

      const cronPayload = {
        jobName,
        runId: `run_${Date.now()}`,
        runCount: this.runCount,
        startedAt,
        previousRunAt: this.lastRunAt,
        schedule: effectiveSchedule,
        context: {
          env: process.env.NODE_ENV || 'development',
          host: require('os').hostname(),
        },
      };

      this.lastRunAt = startedAt;

  const flowIdToUse = latestCfg?.flowId || configuredFlowId;

      if (!flowIdToUse) {
        console.warn(`No flowId configured for cron-job; skipping run ${cronPayload.runId}`);
        return;
      }

      // use nodeId from config if present so each deployed trigger can target a specific trigger node id
      const nodeId = latestCfg?.nodeId || 'cron-job';
      await this.flowService.executeFlow(cronPayload, nodeId, flowIdToUse);
    });

    this.schedulerRegistry.addCronJob(jobName, job as any);
    job.start();

    try {
      if (this.triggerConfigModel) {
        const cfg = await this.triggerConfigModel.findOne({ triggerId }).exec();
        if (cfg) {
          cfg.activeJobName = jobName;
          await cfg.save();
        }
      }
    } catch (err) {
      // ignore
    }

    return { jobName };
  }

  stopJob(jobName: string) {
    try {
      const job = this.schedulerRegistry.getCronJob(jobName);
      job.stop();
      this.schedulerRegistry.deleteCronJob(jobName);
      console.log(`Job ${jobName} stopped and removed`);
    } catch (error) {
      console.error(`Failed to stop job ${jobName}:`, error.message);
    }
  }
}