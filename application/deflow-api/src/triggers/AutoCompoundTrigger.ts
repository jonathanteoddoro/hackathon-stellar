import { TriggerNode } from 'src/utils/TriggerNode';
import { NodeMessage } from 'src/utils/NodeMessage';
import { ActionBlendGetPosition, BlendActionParams } from '../actions/ActionBlendGetPosition';
import { ActionBlendSupply } from '../actions/ActionBlendSupply';
import { CronJob } from 'cron';
import * as dotenv from 'dotenv';

dotenv.config();

export interface AutoCompoundTriggerParams {
    userAddress: string;
    minThreshold?: number;
    cronExpression?: string; // Ex: '0 */12 * * *' (a cada 12 horas)
    asset?: string;
}

export class AutoCompoundTrigger extends TriggerNode {
    name = 'AutoCompoundTrigger';
    description = 'Automatically compounds yield from Blend Protocol by claiming and re-investing rewards at scheduled intervals';
    isJobTrigger = true;
    
    private getPositionAction: ActionBlendGetPosition;
    private supplyAction: ActionBlendSupply;
    private minCompoundThreshold: number;
    private readonly params: AutoCompoundTriggerParams;
    private cronExpression: string;
    private defaultAsset: string;
    
    constructor(params: AutoCompoundTriggerParams) {
        super();
        if (!params || !params.userAddress) {
            throw new Error('AutoCompoundTrigger requires a valid userAddress in constructor');
        }
        
        this.params = params;
        this.minCompoundThreshold = params.minThreshold || 5;
        this.cronExpression = params.cronExpression || '0 * * * * *';
        this.defaultAsset = params.asset || 'USDC';
        
        const blendParams: BlendActionParams = { userAddress: params.userAddress };
        this.getPositionAction = new ActionBlendGetPosition(blendParams);
        this.supplyAction = new ActionBlendSupply(blendParams);
        
        // Validate cron expression
        try {
            const testJob = new CronJob(this.cronExpression, () => {});
            testJob.stop();
        } catch (err) {
            throw new Error(`Invalid cron expression: ${this.cronExpression}`);
        }
    }
    
    validatePayload(payload: object): NodeMessage {
        return {
            payload: {
                ...payload,
                asset: this.defaultAsset,
                userAddress: this.params.userAddress,
                minThreshold: this.minCompoundThreshold,
            },
            metadata: {
                triggerId: 'auto-compound',
                triggerType: 'cron',
                timestamp: new Date().toISOString(),
                cronExpression: this.cronExpression,
            },
        };
    }
    
    execute(callback: (...args: any[]) => void, nodeId: string): { jobName: string; job: CronJob } {
        const jobName = `auto-compound-${nodeId}`;
        
        const job = new CronJob(
            this.cronExpression,
            async () => {
                try {
                    const result = await this.performAutoCompound();
                    
                    const message = this.validatePayload({
                        triggerId: jobName,
                        triggerType: 'cron',
                        timestamp: new Date().toISOString(),
                        result: result,
                    });
                    
                    callback(message, nodeId);
                } catch (error) {
                    const errorMessage = this.validatePayload({
                        triggerId: jobName,
                        triggerType: 'cron',
                        timestamp: new Date().toISOString(),
                        error: error instanceof Error ? error.message : 'Unknown error',
                        success: false,
                    });
                    
                    callback(errorMessage, nodeId);
                }
            },
            null,
            true,
            'UTC',
        );
        return { jobName, job };
    }
    
    private async performAutoCompound(): Promise<any> {
        const asset = this.defaultAsset;
        
        // 1. Get current position to check available rewards
        const positionResult = await this.getCurrentPosition(asset);
        const earnedRewards = this.calculateEarnedRewards(positionResult);

        // 2. Check if rewards meet minimum threshold
        if (earnedRewards < this.minCompoundThreshold) {
            return {
                success: false,
                skipped: true,
                message: `Insufficient rewards for compound. Need ${this.minCompoundThreshold}, have ${earnedRewards}`,
                earnedRewards,
                threshold: this.minCompoundThreshold,
                timestamp: new Date().toISOString()
            };
        }
        
        // 3. Execute compound strategy
        const compoundResult = await this.executeCompound(earnedRewards, asset);
        
        // 4. Get updated position
        const newPosition = await this.getCurrentPosition(asset);
        
        const result = {
            success: true,
            compounded: earnedRewards,
            asset: asset,
            previousPosition: positionResult,
            newPosition: newPosition,
            improvement: this.calculateImprovement(positionResult, newPosition),
            timestamp: new Date().toISOString(),
            message: `Auto-compound successful! +${earnedRewards} ${asset} reinvested`
        };
        
        
        return result;
    }
    
    private async getCurrentPosition(asset: string): Promise<any> {
        const positionMessage = new NodeMessage();
        positionMessage.payload = { asset: asset };
        
        const result = await this.getPositionAction.execute(positionMessage);
        return result.payload?.result || { supplied: '0', borrowed: '0' };
    }
    
    private calculateEarnedRewards(position: any): number {
        // Simulate reward calculation based on time and supply
        // In real implementation, this would come from the smart contract
        const supplied = parseFloat(position.supplied || '0');
        const dailyRate = 0.0001; // 0.01% daily (roughly 3.65% APY)
        
        // Simulate 1 day of rewards (in real app, track time since last compound)
        const earnedRewards = supplied * dailyRate;
        
        return Math.round(earnedRewards * 100) / 100; 
    }
    
    private async executeCompound(amount: number, asset: string): Promise<any> {
        // In a real implementation, this would:
        // 1. Claim rewards from the protocol
        // 2. Supply the claimed rewards back to the protocol
        
        const supplyMessage = new NodeMessage();
        supplyMessage.payload = {
            amount: amount,
            asset: asset
        };
        
        return await this.supplyAction.execute(supplyMessage);
    }
    
    private calculateImprovement(previousPosition: any, newPosition: any): any {
        const prevSupplied = parseFloat(previousPosition.supplied || '0');
        const newSupplied = parseFloat(newPosition.supplied || '0');
        const increase = newSupplied - prevSupplied;
        const percentageIncrease = prevSupplied > 0 ? (increase / prevSupplied) * 100 : 0;
        
        return {
            absolute: Math.round(increase * 100) / 100,
            percentage: Math.round(percentageIncrease * 10000) / 10000, 
            newTotal: newSupplied
        };
    }
}