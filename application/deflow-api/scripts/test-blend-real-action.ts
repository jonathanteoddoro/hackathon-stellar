import { ActionBlendLoanReal } from '../src/actions/ActionBlendLoanReal';
import { NodeMessage } from '../src/utils/NodeMessage';

async function testBlendSupply() {
    console.log('🚀 Executando operação de Supply no Blend Protocol\n');
    
    const action = new ActionBlendLoanReal();
    
    // Operação de Supply
    console.log('💰 Executando Supply de 200 USDC...');
    const supplyMessage = new NodeMessage();
    supplyMessage.payload = {
        operation: 'supply',
        amount: 200,
        asset: 'USDC'
    };
    
    try {
        const result = await action.execute(supplyMessage);
        
        console.log('✅ Supply executado com sucesso!');
        console.log('📊 Resultado:', JSON.stringify(result.payload, null, 2));
        
        // Verificar posição após supply
        console.log('\n📊 Verificando posição atualizada...');
        const positionMessage = new NodeMessage();
        positionMessage.payload = {
            operation: 'get_position',
            asset: 'USDC'
        };
        
        const positionResult = await action.execute(positionMessage);
        console.log('📈 Nova posição:', JSON.stringify(positionResult.payload, null, 2));
        
    } catch (error) {
        console.error('❌ Erro na operação:', error);
    }
    
    console.log('\n🎯 Teste concluído - Blend Protocol funcionando!');
}

// Executar o teste
testBlendSupply().catch(console.error);