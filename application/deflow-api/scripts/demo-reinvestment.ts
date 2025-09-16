import { ActionAutoCompound } from '../src/actions/ActionAutoCompound';
import { NodeMessage } from '../src/utils/NodeMessage';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function demonstrateReinvestment() {
    console.log('💰 DEMONSTRAÇÃO: Reinvestimento Automático de Juros\n');
    
    console.log('🎯 O que este sistema faz:');
    console.log('• 📊 Monitora constantemente seus depósitos DeFi');
    console.log('• 💰 Calcula os juros/rewards acumulados');
    console.log('• 🔄 Automaticamente reinveste os juros para maximizar retornos');
    console.log('• 📈 Cria efeito de juros compostos sem intervenção manual\n');
    
    // Create auto-compound with very low threshold for demo
    const autoCompound = new ActionAutoCompound(0.001); // 0.001 threshold
    
    console.log('🤖 Iniciando Auto-Compound para USDC...\n');
    
    const message = new NodeMessage();
    message.payload = {
        asset: 'USDC',
        action: 'auto_compound'
    };
    
    try {
        const result = await autoCompound.execute(message);
        
        if (result.payload?.success) {
            console.log('✅ REINVESTIMENTO REALIZADO COM SUCESSO!\n');
            console.log('📊 Detalhes da operação:');
            console.log(`💎 Juros reinvestidos: ${result.payload.compounded} ${result.payload.asset}`);
            console.log(`📅 Data/Hora: ${new Date(result.payload.timestamp).toLocaleString('pt-BR')}`);
            console.log(`📈 Mensagem: ${result.payload.message}\n`);
            
            console.log('📋 Posição anterior vs nova:');
            console.log(`• Antes: ${result.payload.previousPosition.supplied} ${result.payload.asset}`);
            console.log(`• Depois: ${result.payload.newPosition.supplied} ${result.payload.asset}`);
            
            if (result.payload.improvement) {
                console.log(`• Melhoria: +${result.payload.improvement.absolute} ${result.payload.asset}\n`);
            }
            
            console.log('🚀 PRÓXIMOS PASSOS:');
            console.log('• O sistema continuará monitorando automaticamente');
            console.log('• Novos juros serão reinvestidos quando atingirem o threshold');
            console.log('• Seus retornos crescerão exponencialmente com juros compostos!');
            
        } else {
            console.log('ℹ️ Reinvestimento não executado:');
            console.log(`📋 Motivo: ${result.payload?.message || result.payload?.error}`);
            console.log('\n💡 Isso é normal! Significa que:');
            console.log('• Os juros ainda não atingiram o valor mínimo para reinvestir');
            console.log('• O sistema está funcionando corretamente e aguardando');
            console.log('• Quando houver juros suficientes, será reinvestido automaticamente');
        }
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
}

async function explainBenefits() {
    console.log('\n💡 BENEFÍCIOS DO REINVESTIMENTO AUTOMÁTICO:\n');
    
    console.log('📈 EXEMPLO PRÁTICO:');
    console.log('• Sem reinvestimento: 1000 USDC → +36.5 USDC/ano = 1036.5 USDC');
    console.log('• Com reinvestimento: 1000 USDC → +37.11 USDC/ano = 1037.11 USDC');
    console.log('• 💰 Ganho extra: +0.61 USDC só pelo compound!\n');
    
    console.log('🔥 VANTAGENS:');
    console.log('• 🤖 100% automático - funciona 24/7');
    console.log('• 📈 Maximiza retornos através de juros compostos');
    console.log('• ⚡ Executa no momento ideal para otimizar custos');
    console.log('• 😴 Você pode dormir tranquilo sabendo que está otimizado');
    console.log('• 💎 Transforma renda passiva em renda passiva OTIMIZADA\n');
}

// Run demonstration
async function main() {
    await explainBenefits();
    await demonstrateReinvestment();
}

main().catch(console.error);