import { NodeMessage } from 'src/utils/NodeMessage';
import { TriggerNode } from 'src/utils/TriggerNode';

export class TriggerSwapXML extends TriggerNode {
  name = 'TriggerSwapXML';
  description = 'Trigger para iniciar processo de troca XML por USDT';

  validatePayload(payload: object): NodeMessage {
    // Validar se o payload é um objeto válido
    if (!payload || typeof payload !== 'object') {
      throw new Error('Payload deve ser um objeto válido');
    }

    const typedPayload = payload as any;

    // Validar quantidade de XML
    if (!typedPayload.xmlAmount || typeof typedPayload.xmlAmount !== 'number') {
      throw new Error('Campo "xmlAmount" é obrigatório e deve ser um número');
    }

    if (typedPayload.xmlAmount <= 0) {
      throw new Error('Quantidade de XML deve ser maior que zero');
    }

    // Validar carteira de destino USDT
    if (!typedPayload.usdtWallet || typeof typedPayload.usdtWallet !== 'string') {
      throw new Error('Campo "usdtWallet" é obrigatório e deve ser uma string');
    }

    // Validação básica de formato de carteira (você pode melhorar isso)
    if (typedPayload.usdtWallet.length < 10) {
      throw new Error('Endereço da carteira USDT parece inválido');
    }

    // Validar email para logging
    if (!typedPayload.userEmail || typeof typedPayload.userEmail !== 'string') {
      throw new Error('Campo "userEmail" é obrigatório e deve ser uma string');
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(typedPayload.userEmail)) {
      throw new Error('Email fornecido não é válido');
    }

    // Retornar NodeMessage formatado para o próximo nó (Action)
    return {
      payload: {
        xmlAmount: typedPayload.xmlAmount,
        usdtWallet: typedPayload.usdtWallet.trim(),
        userEmail: typedPayload.userEmail.trim().toLowerCase(),
        timestamp: new Date().toISOString(),
        transactionId: `swap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      },
      metadata: {
        triggerId: 'swap-xml-usdt',
        triggerType: 'api-call',
        validation: 'success',
        estimatedUSDT: typedPayload.xmlAmount * 1, // Exemplo: taxa de conversão
        fees: typedPayload.xmlAmount * 0.00 // Exemplo: taxa de 0%
      },
    };
  }
}