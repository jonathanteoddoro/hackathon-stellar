/**
 * 🚀 REFLECTOR PRICE TRIGGER SYSTEM - TYPESCRIPT VERSION
 * ======================================================
 * Sistema de triggers de preços usando TypeScript e APIs reais
 * Sem logs JSON, sem Soroban CLI, apenas dados reais
 * 
 * Funcionalidades:
 * - Sistema de triggers configurável
 * - Polling contínuo com TypeScript
 * - APIs externas para dados reais
 * - Interface type-safe
 */

import fetch from 'node-fetch';

// Types
interface PriceData {
  asset: string;
  price: number;
  rawPrice: number;
  timestamp: string;
  source: string;
}

interface TriggerConfig {
  asset: string;
  targetPrice: number;
  condition: 'above' | 'below' | 'equal';
  pollingInterval?: number;
  onTrigger?: (data: TriggerData) => Promise<void>;
}

interface TriggerData {
  asset: string;
  currentPrice: number;
  targetPrice: number;
  condition: string;
  timestamp: string;
  triggered: boolean;
}

interface CoinGeckoResponse {
  [coinId: string]: {
    usd: number;
  };
}

// Configuração
const CONTRACT_ID = 'CCYOZJCOPG34LLQQ7N24YXBM7LL62R7ONMZ3G6WZAAYPB5OYKOMJRN63';
const RPC_URL = 'https://soroban-testnet.stellar.org';
const DEFAULT_POLLING_INTERVAL = 300000; // 5 minutos

// Ativos suportados
const SUPPORTED_ASSETS: string[] = [
  'BTC', 'ETH', 'USDC', 'USDT', 'XLM', 'ADA', 'DOT', 'LINK',
  'UNI', 'AAVE', 'SOL', 'MATIC', 'AVAX', 'FTM', 'ATOM', 'ALGO'
];

// Mapeamento para CoinGecko IDs
const COIN_GECKO_IDS: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'USDC': 'usd-coin',
  'USDT': 'tether',
  'XLM': 'stellar',
  'ADA': 'cardano',
  'DOT': 'polkadot',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'AAVE': 'aave',
  'SOL': 'solana',
  'MATIC': 'matic-network',
  'AVAX': 'avalanche-2',
  'FTM': 'fantom',
  'ATOM': 'cosmos',
  'ALGO': 'algorand'
};

/**
 * Classe principal do sistema de triggers
 */
class ReflectorTrigger {
  private activeTriggers: Map<string, TriggerConfig> = new Map();
  private isRunning: boolean = false;

  /**
   * Consultar preço atual via API externa
   */
  async getCurrentPrice(asset: string): Promise<PriceData> {
    try {
      console.log(`🔗 Consultando ${asset} via API...`);

      const coinId = COIN_GECKO_IDS[asset.toUpperCase()];
      if (!coinId) {
        throw new Error(`Asset ${asset} não suportado`);
      }

      const apiUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ReflectorTrigger/2.0'
        }
      });

      if (!response.ok) {
        throw new Error(`API falhou: ${response.status}`);
      }

      const data = await response.json() as CoinGeckoResponse;
      
      if (data[coinId] && data[coinId].usd) {
        const price = data[coinId].usd;
        
        return {
          asset: asset.toUpperCase(),
          price,
          rawPrice: price * 1e14, // Simular formato de contrato
          timestamp: new Date().toISOString(),
          source: 'coingecko-api'
        };
      }
      
      throw new Error('Preço não encontrado na resposta da API');
      
    } catch (error) {
      throw new Error(`Erro ao consultar ${asset}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Verificar condição do trigger
   */
  private checkTriggerCondition(currentPrice: number, targetPrice: number, condition: string): boolean {
    switch (condition.toLowerCase()) {
      case 'above':
      case 'acima':
      case '>':
        return currentPrice > targetPrice;
      
      case 'below':
      case 'abaixo':
      case '<':
        return currentPrice < targetPrice;
      
      case 'equal':
      case 'igual':
      case '=':
        const tolerance = targetPrice * 0.01; // 1% tolerância
        return Math.abs(currentPrice - targetPrice) <= tolerance;
      
      default:
        console.log(`⚠️ Condição desconhecida: ${condition}. Usando 'above' como padrão.`);
        return currentPrice > targetPrice;
    }
  }

  /**
   * Executar ação quando trigger é ativado
   */
  private async executeTriggerAction(config: TriggerConfig, currentPrice: number): Promise<void> {
    const triggerData: TriggerData = {
      asset: config.asset,
      currentPrice,
      targetPrice: config.targetPrice,
      condition: config.condition,
      timestamp: new Date().toISOString(),
      triggered: true
    };

    console.log('\n🚨 TRIGGER ATIVADO!');
    console.log('═'.repeat(50));
    console.log(`💰 Ativo: ${config.asset}`);
    console.log(`📈 Preço atual: $${currentPrice.toFixed(2)}`);
    console.log(`🎯 Preço alvo: $${config.targetPrice.toFixed(2)}`);
    console.log(`⚡ Condição: ${config.condition}`);
    console.log(`⏰ Timestamp: ${triggerData.timestamp}`);
    console.log('═'.repeat(50));

    // Executar callback personalizado se fornecido
    if (config.onTrigger) {
      try {
        await config.onTrigger(triggerData);
        console.log('✅ Callback personalizado executado');
      } catch (error) {
        console.error('❌ Erro no callback:', error instanceof Error ? error.message : 'Erro desconhecido');
      }
    }

    console.log('🎉 Trigger executado com sucesso!');
  }

  /**
   * Adicionar novo trigger
   */
  addTrigger(config: TriggerConfig): string {
    if (!SUPPORTED_ASSETS.includes(config.asset.toUpperCase())) {
      throw new Error(`Asset ${config.asset} não suportado. Disponíveis: ${SUPPORTED_ASSETS.join(', ')}`);
    }

    const triggerId = `${config.asset}_${config.condition}_${config.targetPrice}_${Date.now()}`;
    this.activeTriggers.set(triggerId, {
      ...config,
      asset: config.asset.toUpperCase(),
      pollingInterval: config.pollingInterval || DEFAULT_POLLING_INTERVAL
    });

    console.log(`✅ Trigger adicionado: ${triggerId}`);
    console.log(`   ${config.asset} ${config.condition} $${config.targetPrice}`);
    
    return triggerId;
  }

  /**
   * Remover trigger
   */
  removeTrigger(triggerId: string): boolean {
    const removed = this.activeTriggers.delete(triggerId);
    if (removed) {
      console.log(`✅ Trigger removido: ${triggerId}`);
    } else {
      console.log(`⚠️ Trigger não encontrado: ${triggerId}`);
    }
    return removed;
  }

  /**
   * Listar triggers ativos
   */
  listTriggers(): TriggerConfig[] {
    return Array.from(this.activeTriggers.values());
  }

  /**
   * Iniciar monitoramento de todos os triggers
   */
  async startMonitoring(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Monitoramento já está rodando');
      return;
    }

    if (this.activeTriggers.size === 0) {
      console.log('⚠️ Nenhum trigger ativo para monitorar');
      return;
    }

    this.isRunning = true;
    
    console.log('🚀 REFLECTOR TRIGGER SYSTEM - TYPESCRIPT VERSION');
    console.log('═'.repeat(60));
    console.log(`📊 Triggers ativos: ${this.activeTriggers.size}`);
    console.log(`🔗 Fonte: APIs externas (dados reais)`);
    console.log(`⏰ Intervalo padrão: ${DEFAULT_POLLING_INTERVAL/60000}min`);
    console.log('═'.repeat(60));

    // Configurar handler para interrupção
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Monitoramento interrompido pelo usuário');
      this.stopMonitoring();
      process.exit(0);
    });

    console.log('🚀 Iniciando monitoramento de triggers...');
    console.log('💡 Pressione Ctrl+C para parar\n');

    // Loop principal de monitoramento
    while (this.isRunning && this.activeTriggers.size > 0) {
      await this.checkAllTriggers();
      
      if (this.activeTriggers.size > 0) {
        await this.sleep(DEFAULT_POLLING_INTERVAL);
      }
    }

    console.log('✅ Monitoramento finalizado');
  }

  /**
   * Parar monitoramento
   */
  stopMonitoring(): void {
    this.isRunning = false;
    console.log('🛑 Parando monitoramento...');
  }

  /**
   * Verificar todos os triggers ativos
   */
  private async checkAllTriggers(): Promise<void> {
    const triggersToRemove: string[] = [];

    for (const [triggerId, config] of this.activeTriggers) {
      try {
        const timestamp = new Date().toLocaleString('pt-BR');
        console.log(`🔄 Verificando ${config.asset} - ${timestamp}`);

        const priceData = await this.getCurrentPrice(config.asset);
        const currentPrice = priceData.price;

        console.log(`   💰 ${config.asset}: $${currentPrice.toFixed(2)} (${priceData.source})`);

        // Verificar se trigger deve ser ativado
        const shouldTrigger = this.checkTriggerCondition(currentPrice, config.targetPrice, config.condition);

        if (shouldTrigger) {
          console.log(`\n🎯 Trigger ${triggerId} ativado!`);
          await this.executeTriggerAction(config, currentPrice);
          
          // Remover trigger após ativação (comportamento padrão)
          triggersToRemove.push(triggerId);
        } else {
          const difference = Math.abs(currentPrice - config.targetPrice);
          const percentDiff = ((difference / config.targetPrice) * 100).toFixed(2);
          
          console.log(`   📊 Diferença: $${difference.toFixed(2)} (${percentDiff}%)`);
          
          let statusMessage = '';
          if (config.condition === 'above') {
            statusMessage = `ainda abaixo de $${config.targetPrice.toFixed(2)}`;
          } else if (config.condition === 'below') {
            statusMessage = `ainda acima de $${config.targetPrice.toFixed(2)}`;
          } else {
            statusMessage = `não próximo de $${config.targetPrice.toFixed(2)}`;
          }
          
          console.log(`   ⏳ ${statusMessage}`);
        }

      } catch (error) {
        console.error(`❌ Erro ao verificar ${config.asset}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    // Remover triggers ativados
    for (const triggerId of triggersToRemove) {
      this.removeTrigger(triggerId);
    }

    if (this.activeTriggers.size > 0) {
      console.log(`⏰ Próxima verificação em ${DEFAULT_POLLING_INTERVAL/60000}min...\n`);
    }
  }

  /**
   * Helper para sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Funções utilitárias para uso direto
 */

/**
 * Criar e iniciar um trigger simples
 */
export async function createSimpleTrigger(
  asset: string,
  targetPrice: number,
  condition: 'above' | 'below' | 'equal',
  onTrigger?: (data: TriggerData) => Promise<void>
): Promise<void> {
  const trigger = new ReflectorTrigger();
  
  trigger.addTrigger({
    asset,
    targetPrice,
    condition,
    onTrigger
  });

  await trigger.startMonitoring();
}

/**
 * Interface de linha de comando
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    showHelp();
    return;
  }
  
  const command = args[0].toLowerCase();
  const trigger = new ReflectorTrigger();
  
  switch (command) {
    case 'query':
    case 'price':
      if (args.length < 2) {
        console.log('❌ Uso: npm run trigger:query <ASSET>');
        return;
      }
      
      try {
        const priceData = await trigger.getCurrentPrice(args[1]);
        console.log('💰 CONSULTA DE PREÇO - TYPESCRIPT');
        console.log('═'.repeat(40));
        console.log(`   Ativo: ${priceData.asset}`);
        console.log(`   Preço: $${priceData.price.toFixed(2)}`);
        console.log(`   Fonte: ${priceData.source}`);
        console.log(`   Timestamp: ${priceData.timestamp}`);
      } catch (error) {
        console.error('❌ Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      }
      break;
      
    case 'trigger':
    case 'monitor':
      if (args.length < 4) {
        console.log('❌ Uso: npm run trigger:monitor <ASSET> <TARGET_PRICE> <CONDITION>');
        console.log('   Exemplo: npm run trigger:monitor BTC 120000 above');
        return;
      }
      
      const asset = args[1];
      const targetPrice = parseFloat(args[2]);
      const condition = args[3] as 'above' | 'below' | 'equal';
      
      if (isNaN(targetPrice)) {
        console.log('❌ Preço alvo deve ser um número válido');
        return;
      }
      
      trigger.addTrigger({
        asset,
        targetPrice,
        condition,
        onTrigger: async (data) => {
          console.log('🔔 Callback personalizado executado!');
          console.log(`   Dados: ${JSON.stringify(data, null, 2)}`);
        }
      });
      
      await trigger.startMonitoring();
      break;
      
    case 'demo':
      await runDemo();
      break;
      
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
      
    default:
      console.log(`❌ Comando desconhecido: ${command}`);
      showHelp();
  }
}

/**
 * Demonstração completa
 */
async function runDemo(): Promise<void> {
  console.log('🎯 DEMONSTRAÇÃO - TYPESCRIPT TRIGGERS');
  console.log('====================================');
  
  const trigger = new ReflectorTrigger();
  
  // Adicionar múltiplos triggers
  trigger.addTrigger({
    asset: 'BTC',
    targetPrice: 100000,
    condition: 'above',
    onTrigger: async (data) => {
      console.log('🚀 BTC trigger customizado ativado!');
    }
  });
  
  trigger.addTrigger({
    asset: 'ETH',
    targetPrice: 5000,
    condition: 'above',
    onTrigger: async (data) => {
      console.log('🚀 ETH trigger customizado ativado!');
    }
  });
  
  trigger.addTrigger({
    asset: 'USDC',
    targetPrice: 1.01,
    condition: 'below'
  });
  
  console.log(`\n📊 ${trigger.listTriggers().length} triggers configurados`);
  console.log('🚀 Iniciando monitoramento...\n');
  
  await trigger.startMonitoring();
}

/**
 * Mostrar ajuda
 */
function showHelp(): void {
  console.log('\n🚀 REFLECTOR TRIGGER SYSTEM - TYPESCRIPT');
  console.log('========================================');
  console.log('Sistema de triggers inteligente com TypeScript');
  console.log('');
  console.log('📊 ATIVOS DISPONÍVEIS:');
  console.log(`   ${SUPPORTED_ASSETS.join(', ')}`);
  console.log('');
  console.log('💡 COMANDOS:');
  console.log('');
  console.log('1. Consultar preço:');
  console.log('   npm run trigger:query BTC');
  console.log('');
  console.log('2. Criar trigger:');
  console.log('   npm run trigger:monitor BTC 120000 above');
  console.log('   npm run trigger:monitor ETH 4000 below');
  console.log('');
  console.log('3. Demonstração:');
  console.log('   npm run trigger:demo');
  console.log('');
  console.log('⚡ CARACTERÍSTICAS:');
  console.log('   ✅ TypeScript type-safe');
  console.log('   ✅ Múltiplos triggers simultâneos');
  console.log('   ✅ Callbacks personalizados');
  console.log('   ✅ APIs externas para dados reais');
  console.log('   ✅ Sem logs JSON, apenas console');
  console.log('');
}

// Exportar classes e tipos
export { ReflectorTrigger };
export type { TriggerConfig, TriggerData, PriceData };

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}
