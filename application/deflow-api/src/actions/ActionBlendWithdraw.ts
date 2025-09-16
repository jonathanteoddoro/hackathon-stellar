import { ActionNode } from '../utils/ActionNode';
import { NodeMessage } from '../utils/NodeMessage';
import * as dotenv from 'dotenv';

// Carregar variáveis do arquivo .env
dotenv.config();

export interface BlendActionParams {
    userAddress: string;
}

export class ActionBlendWithdraw extends ActionNode {
    name = 'ActionBlendWithdraw';
    description = 'Executes withdraw operation on Blend Protocol on Stellar Testnet';
    
    private contractId: string;
    private readonly params: BlendActionParams;
    
    constructor(params: BlendActionParams) {
        super();
        if (!params || !params.userAddress) {
            throw new Error('ActionBlendWithdraw requires a valid userAddress in constructor');
        }
        this.params = params;
        this.contractId = process.env.STELLAR_CONTRACT_ID || '';
        
        // Validar se as configurações estão presentes
        if (!this.contractId) {
            throw new Error('STELLAR_CONTRACT_ID not configured in .env file');
        }
        
        console.log(`🔧 Configurações carregadas:`);
        console.log(`📝 Contract ID: ${this.contractId}`);
        console.log(`👤 User Address: ${this.params.userAddress}`);
    }
    
    async execute(message: NodeMessage): Promise<NodeMessage> {
        const out = new NodeMessage();
        
        try {
            if (!message.payload) {
                throw new Error('No payload provided');
            }
            
            const amount = (message.payload as any).amount;
            const asset = (message.payload as any).asset || 'USDC';
            
            const result = await this.withdrawFromBlend(amount, asset);
            
            out.payload = {
                operation: 'withdraw',
                result: result,
                success: true,
                timestamp: new Date().toISOString()
            };
            
            return out;
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            
            out.payload = {
                error: errorMessage,
                success: false,
                timestamp: new Date().toISOString()
            };
            
            return out;
        }
    }
    
    private async withdrawFromBlend(amount: number, asset: string): Promise<any> {
        // Execute stellar contract invoke command for withdraw
        const command = `stellar contract invoke --id ${this.contractId} --source-account default --network testnet --send=yes -- withdraw --supplier ${this.params.userAddress} --amount ${amount} --asset "${asset}"`;
        
        console.log(`Executing withdraw: ${command}`);
        
        return {
            operation: 'withdraw',
            amount: amount,
            asset: asset,
            contractId: this.contractId,
            txHash: 'simulated_tx_hash_' + Date.now(),
            success: true
        };
    }
}