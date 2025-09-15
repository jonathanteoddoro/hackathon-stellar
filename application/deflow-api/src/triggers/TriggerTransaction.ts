import { NodeMessage } from 'src/utils/NodeMessage';
import { TriggerNode } from 'src/utils/TriggerNode';

export class TriggerTransaction extends TriggerNode {
  name = 'TriggerTransaction';
  description = 'Trigger para iniciar processo de transação de criptomoedas';

  validatePayload(payload: object): NodeMessage {
    // Validar se o payload é um objeto válido
    if (!payload || typeof payload !== 'object') {
      throw new Error('Payload deve ser um objeto válido');
    }

    const typedPayload = payload as any;

    // Validar valor da transação
    if (!typedPayload.amount || typeof typedPayload.amount !== 'number') {
      throw new Error('Campo "amount" é obrigatório e deve ser um número');
    }

    if (typedPayload.amount <= 0) {
      throw new Error('Valor da transação deve ser maior que zero');
    }

    // Validar tipo de moeda
    if (!typedPayload.currency || typeof typedPayload.currency !== 'string') {
      throw new Error('Campo "currency" é obrigatório e deve ser uma string');
    }

    // Validar moedas suportadas
    const supportedCurrencies = ['XML', 'USDT', 'BTC', 'ETH', 'XLM'];
    if (!supportedCurrencies.includes(typedPayload.currency.toUpperCase())) {
      throw new Error(`Moeda "${typedPayload.currency}" não é suportada. Opções: ${supportedCurrencies.join(', ')}`);
    }

    // Validar carteira de origem
    if (!typedPayload.fromWallet || typeof typedPayload.fromWallet !== 'string') {
      throw new Error('Campo "fromWallet" é obrigatório e deve ser uma string');
    }

    // Validar carteira de destino
    if (!typedPayload.toWallet || typeof typedPayload.toWallet !== 'string') {
      throw new Error('Campo "toWallet" é obrigatório e deve ser uma string');
    }

    // Validação básica de formato de carteiras
    if (typedPayload.fromWallet.length < 10 || typedPayload.toWallet.length < 10) {
      throw new Error('Endereços das carteiras parecem inválidos');
    }

    // Validar se carteiras são diferentes
    if (typedPayload.fromWallet === typedPayload.toWallet) {
      throw new Error('Carteira de origem e destino não podem ser iguais');
    }

    // Validar email para notificação
    if (!typedPayload.userEmail || typeof typedPayload.userEmail !== 'string') {
      throw new Error('Campo "userEmail" é obrigatório e deve ser uma string');
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(typedPayload.userEmail)) {
      throw new Error('Email fornecido não é válido');
    }

    // Calcular taxas baseado na moeda e valor
    const feePercentage = this.calculateFeePercentage(typedPayload.currency);
    const transactionFee = typedPayload.amount * feePercentage;
    const netAmount = typedPayload.amount - transactionFee;

    // Retornar NodeMessage formatado para o próximo nó (Action)
    return {
      payload: {
        amount: typedPayload.amount,
        currency: typedPayload.currency.toUpperCase(),
        fromWallet: typedPayload.fromWallet.trim(),
        toWallet: typedPayload.toWallet.trim(),
        userEmail: typedPayload.userEmail.trim().toLowerCase(),
        timestamp: new Date().toISOString(),
        transactionId: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      },
      metadata: {
        triggerId: 'transaction',
        triggerType: 'api-call',
        validation: 'success',
        transactionFee: transactionFee,
        netAmount: netAmount,
        feePercentage: feePercentage
      },
    };
  }

  // Método auxiliar para calcular taxa baseada na moeda
  private calculateFeePercentage(currency: string): number {
    const feeMap: { [key: string]: number } = {
      'XML': 0.02,   // 2%
      'USDT': 0.01,  // 1%
      'BTC': 0.005,  // 0.5%
      'ETH': 0.015,  // 1.5%
      'XLM': 0.001   // 0.1%
    };
    
    return feeMap[currency.toUpperCase()] || 0.02; // Default 2%
  }
}