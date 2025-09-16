import { ActionNode } from '../utils/ActionNode';
import { NodeMessage } from '../utils/NodeMessage';
import { ActionBlendGetPosition, BlendActionParams } from './ActionBlendGetPosition';
import { ActionBlendSupply } from './ActionBlendSupply';
import * as dotenv from 'dotenv';

dotenv.config();

export interface AutoCompoundParams {
    userAddress: string;
    minThreshold?: number;
}

export class ActionAutoCompound extends ActionNode {
    name = 'ActionAutoCompound';
    description = 'Automatically compounds yield from Blend Protocol by claiming and re-investing rewards';
    
    private getPositionAction: ActionBlendGetPosition;
    private supplyAction: ActionBlendSupply;
    private minCompoundThreshold: number;
    private readonly params: AutoCompoundParams;
    
    constructor(params: AutoCompoundParams) {
        super();
        if (!params || !params.userAddress) {
            throw new Error('ActionAutoCompound requires a valid userAddress in constructor');
        }
        this.params = params;
        this.minCompoundThreshold = params.minThreshold || 5;
        
        const blendParams: BlendActionParams = { userAddress: params.userAddress };
        this.getPositionAction = new ActionBlendGetPosition(blendParams);
        this.supplyAction = new ActionBlendSupply(blendParams);
    }
    
    async execute(message: NodeMessage): Promise<NodeMessage> {
        const out = new NodeMessage();
        
        try {
            const asset = (message.payload as any)?.asset || 'USDC';
            
            // 1. Get current position to check available rewards
            const positionResult = await this.getCurrentPosition(asset);
            const earnedRewards = this.calculateEarnedRewards(positionResult);
            
            // 2. Check if rewards meet minimum threshold
            if (earnedRewards < this.minCompoundThreshold) {
                out.payload = {
                    success: false,
                    message: `Insufficient rewards for compound. Need ${this.minCompoundThreshold}, have ${earnedRewards}`,
                    earnedRewards,
                    threshold: this.minCompoundThreshold,
                    timestamp: new Date().toISOString()
                };
                return out;
            }
            
            // 3. Execute compound strategy
            const compoundResult = await this.executeCompound(earnedRewards, asset);
            
            // 4. Get updated position
            const newPosition = await this.getCurrentPosition(asset);
            
            out.payload = {
                success: true,
                compounded: earnedRewards,
                asset: asset,
                previousPosition: positionResult,
                newPosition: newPosition,
                improvement: this.calculateImprovement(positionResult, newPosition),
                timestamp: new Date().toISOString(),
                message: `Auto-compound successful! +${earnedRewards} ${asset} reinvested`
            };
            
            return out;
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            
            out.payload = {
                success: false,
                error: errorMessage,
                timestamp: new Date().toISOString()
            };
            
            return out;
        }
    }
    
    private async getCurrentPosition(asset: string): Promise<any> {
        const positionMessage = new NodeMessage();
        positionMessage.payload = {
            asset: asset
        };
        
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
        
        return Math.round(earnedRewards * 100) / 100; // Round to 2 decimals
    }
    
    private async executeCompound(amount: number, asset: string): Promise<any> {
        // In a real implementation, this would:
        // 1. Claim rewards from the protocol
        // 2. Supply the claimed rewards back to the protocol
        
        // For now, simulate by calling supply with the compound amount
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
            percentage: Math.round(percentageIncrease * 10000) / 10000, // 4 decimal places
            newTotal: newSupplied
        };
    }
}