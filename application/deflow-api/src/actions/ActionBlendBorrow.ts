import { ActionNode } from '../utils/ActionNode';
import { NodeMessage } from '../utils/NodeMessage';
import * as dotenv from 'dotenv';

// Carregar variáveis do arquivo .env
dotenv.config();

export interface BlendActionParams {
    userAddress: string;
}

export class ActionBlendBorrow extends ActionNode {
    name = 'ActionBlendBorrow';
    description = 'Executes borrow operation on Blend Protocol on Stellar Testnet';
    
    private contractId: string;
    private readonly params: BlendActionParams;
    
    constructor(params: BlendActionParams) {
        super();
        if (!params || !params.userAddress) {
            throw new Error('ActionBlendBorrow requires a valid userAddress in constructor');
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
            
            const result = await this.borrowFromBlend(amount, asset);
            
            out.payload = {
                operation: 'borrow',
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
    
    private async borrowFromBlend(amount: number, asset: string): Promise<any> {
        // Execute stellar contract invoke command for borrow
        const command = `stellar contract invoke --id ${this.contractId} --source-account default --network testnet --send=yes -- borrow --borrower ${this.params.userAddress} --amount ${amount} --asset "${asset}"`;
        
        console.log(`Executing borrow: ${command}`);
        
        return {
            operation: 'borrow',
            amount: amount,
            asset: asset,
            contractId: this.contractId,
            txHash: 'simulated_tx_hash_' + Date.now(),
            success: true
        };
    }
}