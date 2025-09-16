import { ActionNode } from 'src/utils/ActionNode';
import { NodeMessage } from 'src/utils/NodeMessage';

export class ActionGetBalance extends ActionNode {
  name = 'Get Balance';
  description = 'Consulta o saldo de uma carteira Stellar';

  execute(message: NodeMessage): NodeMessage {
    const payload = message.payload as any;
    
    // Validar se temos uma carteira no payload
    if (!payload.walletAddress && !payload.publicKey) {
      console.error('Campo "walletAddress" ou "publicKey" é obrigatório no payload');
      
      return {
        payload: {
          ...payload,
          error: 'Campo "walletAddress" ou "publicKey" é obrigatório',
          timestamp: new Date().toISOString()
        },
        metadata: {
          actionId: 'get-balance',
          actionType: 'stellar-query',
          success: false,
          network: 'testnet'
        }
      };
    }

    const walletAddress = payload.walletAddress || payload.publicKey;

    // Validar formato da carteira Stellar
    if (!this.isValidStellarAddress(walletAddress)) {
      console.error('❌ Endereço da carteira Stellar é inválido');
      
      return {
        payload: {
          ...payload,
          error: 'Endereço da carteira Stellar é inválido',
          timestamp: new Date().toISOString()
        },
        metadata: {
          actionId: 'get-balance',
          actionType: 'stellar-query',
          success: false,
          network: 'testnet'
        }
      };
    }

    console.log(`🔍 Processando consulta de saldo para carteira: ${walletAddress}`);

    // Iniciar consulta em background e retornar resposta imediata
    this.executeRealBalance(message, walletAddress);
    
    // Retornar resposta imediata
    return {
      payload: {
        ...payload,
        walletAddress,
        status: 'processing',
        message: 'Consultando saldo real da blockchain...',
        timestamp: new Date().toISOString()
      },
      metadata: {
        actionId: 'get-balance',
        actionType: 'stellar-query',
        success: true,
        network: 'testnet',
        status: 'processing'
      }
    };
  }

  private async executeRealBalance(message: NodeMessage, walletAddress: string): Promise<void> {
    try {
      console.log(`🌐 Consultando saldo REAL via Horizon API...`);
      
      // Usar fetch nativo do Node.js
      const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${walletAddress}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.error('❌ Conta não encontrada na rede Stellar');
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const account = await response.json();
      
      // Processar saldos reais
      const balances = account.balances.map((balance: any) => {
        if (balance.asset_type === 'native') {
          return {
            asset: 'XLM',
            balance: parseFloat(balance.balance),
            asset_type: 'native'
          };
        } else {
          return {
            asset: `${balance.asset_code}:${balance.asset_issuer}`,
            asset_code: balance.asset_code,
            asset_issuer: balance.asset_issuer,
            balance: parseFloat(balance.balance),
            asset_type: balance.asset_type
          };
        }
      });

      const xlmBalance = balances.find(b => b.asset === 'XLM')?.balance || 0;
      const totalAssets = balances.length;

      console.log(`✅ Saldo REAL consultado com sucesso:`);
      console.log(`   Carteira: ${walletAddress}`);
      console.log(`   XLM: ${xlmBalance}`);
      console.log(`   Total de assets: ${totalAssets}`);
      console.log(`   Sequence: ${account.sequence}`);

    } catch (error: any) {
      console.error('❌ Erro ao consultar saldo real:', error.message);
    }
  }

  // Método auxiliar para validar endereço Stellar
  private isValidStellarAddress(address: string): boolean {
    // Endereços Stellar começam com 'G' e têm 56 caracteres
    const stellarAddressRegex = /^G[A-Z2-7]{55}$/;
    return stellarAddressRegex.test(address);
  }

  // Método estático para teste rápido
  static testWithYourWallet(): void {
    console.log('🚀 Testando ActionGetBalance com sua carteira...\n');
    
    const action = new ActionGetBalance();
    const testMessage = {
      payload: {
        walletAddress: 'GCBTWIV5Z4YDML5S2BIK6F4KPWPSDJWNQJHLPMZ672PKPA26YENI7GUZ',
        userEmail: 'teste@email.com'
      },
      metadata: {
        source: 'quick-test'
      }
    };
    
    const result = action.execute(testMessage);
    console.log('✅ Resultado:');
    console.log(JSON.stringify(result, null, 2));
  }
}

// Se executado diretamente, roda o teste
if (require.main === module) {
  ActionGetBalance.testWithYourWallet();
}