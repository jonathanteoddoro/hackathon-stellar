import { Body, Controller, Post } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TriggerConfig } from 'src/models/TriggerConfig';
import { TriggerFactory } from './trigger.factory';

@Controller('flow')
export class FlowDeployController {
  constructor(
    @InjectModel(TriggerConfig.name) private triggerConfigModel: Model<TriggerConfig>,
    private readonly triggerFactory: TriggerFactory,
  ) {}

  @Post('deploy')
  async deploy(@Body() body: { triggerId: string; flowId: string; params?: Record<string, any>; active?: boolean }) {
    if (!body.triggerId || !body.flowId) {
      throw new Error('triggerId and flowId are required');
    }

    // upsert trigger config
    const existing = await this.triggerConfigModel.findOne({ triggerId: body.triggerId }).exec();
    if (existing) {
      existing.flowId = body.flowId;
      existing.params = body.params || {};
      existing.active = body.active !== undefined ? body.active : true;
      await existing.save();
    } else {
      const created = new this.triggerConfigModel({
        triggerId: body.triggerId,
        flowId: body.flowId,
        params: body.params || {},
        active: body.active !== undefined ? body.active : true,
      });
      await created.save();
    }

    try {
      const trigger = this.triggerFactory.getTrigger(body.triggerId);
      if ((trigger as any).setParams && body.params) {
        (trigger as any).setParams(body.params);
      }
      if ((trigger as any).startFor) {
        const cfg = await this.triggerConfigModel.findOne({ triggerId: body.triggerId }).exec();
        if (cfg?.activeJobName && (trigger as any).stopJob) {
          try { (trigger as any).stopJob(cfg.activeJobName); } catch (e) { /* ignore */ }
          cfg.activeJobName = undefined;
          await cfg.save();
        }

        const started = await (trigger as any).startFor(body.triggerId);
        if (started && typeof started.jobName === 'string') {
          const cfg2 = await this.triggerConfigModel.findOne({ triggerId: body.triggerId }).exec();
          if (cfg2) { cfg2.activeJobName = started.jobName; await cfg2.save(); }
        }
      } else if ((trigger as any).execute) {
        await (trigger as any).execute();
      }
    } catch (err) {
    }

    return { status: 'deployed', triggerId: body.triggerId, flowId: body.flowId };
  }
}
