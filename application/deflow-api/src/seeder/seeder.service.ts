import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PredefinedNode } from '../models/PredefinedNodes';
import { SwapNode } from '../actions/SwapNode';
import { TransactionNode } from '../actions/TransactionNode';
import { OpenAINode } from '../actions/OpenAINode';
import { WhatsAppLogger } from '../loggers/WhatsAppLogger';
import { EmailLogger } from '../loggers/EmailLogger';
import { NodeType } from '../utils/NodeType';
import { HttpTrigger } from 'src/triggers/HttpTrigger';
import { CryptoPriceTrigger } from 'src/triggers/CryptoPriceTrigger';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectModel(PredefinedNode.name)
    private readonly predefinedNodeModel: Model<PredefinedNode>,
  ) {}

  async seed() {
    this.logger.log('Starting to seed predefined nodes...');

    const swapNode = new SwapNode({
      user_secret: 'MOCK',
      amount: '1',
      fromToken: 'XLM',
      toToken: 'USDC',
    });
    const transactionNode = new TransactionNode({
      user_secret: 'MOCK',
      destination: 'MOCK',
      amount: 'MOCK',
    });
    const openAINode = new OpenAINode({
      api_key: 'MOCK',
      prompt: 'MOCK',
    });
    const whatsAppLogger = new WhatsAppLogger({
      toNumber: 'MOCK',
      messageText: 'MOCK',
    });
    const emailLogger = new EmailLogger({ from: 'MOCK', to: 'MOCK' });
    const httpTrigger = new HttpTrigger({
      teste: 'MOCK',
    });
    const reflectorTrigger = new CryptoPriceTrigger({
      asset: 'MOCK',
      limitPrice: '2.0',
      sourceSecret: 'above',
      condition: '60',
    });

    const predefinedNodes: Omit<PredefinedNode, '_id'>[] = [
      {
        id: swapNode.name,
        name: swapNode.name,
        description: swapNode.description,
        requiredParamsPayloadKeysTypes: {
          user_secret: 'string',
          amount: 'string',
          fromToken: 'string',
          toToken: 'string',
        },
        outputPayloadKeysTypes: { hash: 'string', status: 'string' },
        type: NodeType.Action,
      },
      {
        id: transactionNode.name,
        name: transactionNode.name,
        description: transactionNode.description,
        requiredParamsPayloadKeysTypes: {
          user_secret: 'string',
          destination: 'string',
          amount: 'string',
        },
        outputPayloadKeysTypes: {
          hash: 'string',
          ledger: 'number',
          successful: 'boolean',
          envelope_xdr: 'string',
          result_xdr: 'string',
          result_meta_xdr: 'string',
          paging_token: 'string',
        },
        type: NodeType.Action,
      },
      {
        id: whatsAppLogger.name,
        name: whatsAppLogger.name,
        description: whatsAppLogger.description,
        requiredParamsPayloadKeysTypes: {
          toNumber: 'string',
          messageText: 'string',
        },
        outputPayloadKeysTypes: { messageId: 'string', status: 'string' },
        type: NodeType.Logger,
      },
      {
        id: emailLogger.name,
        name: emailLogger.name,
        description: emailLogger.description,
        requiredParamsPayloadKeysTypes: {
          from: 'string',
          to: 'string',
          message: 'string',
          subject: 'string',
          user: 'string',
          pass: 'string',
        },
        outputPayloadKeysTypes: { messageId: 'string', status: 'string' },
        type: NodeType.Logger,
      },
      {
        id: openAINode.name,
        name: openAINode.name,
        description: openAINode.description,
        requiredParamsPayloadKeysTypes: {
          api_key: 'string',
          prompt: 'string',
          model: 'string',
          max_tokens: 'number',
          temperature: 'number',
        },
        outputPayloadKeysTypes: {
          openai_response: 'string',
          openai_usage: 'object',
          openai_model: 'string',
        },
        type: NodeType.Action,
      },
      {
        id: httpTrigger.name,
        name: httpTrigger.name,
        description: httpTrigger.description,
        requiredParamsPayloadKeysTypes: {},
        outputPayloadKeysTypes: { payload: 'object' },
        type: NodeType.Trigger,
      },
      {
        id: reflectorTrigger.name,
        name: reflectorTrigger.name,
        description: reflectorTrigger.description,
        requiredParamsPayloadKeysTypes: {
          asset: 'string',
          limitPrice: 'string',
          sourceSecret: 'string',
          condition: 'string',
        },
        outputPayloadKeysTypes: {
          conditionMet: 'boolean',
          asset: 'string',
          currentPrice: 'number',
          timestamp: 'number',
        },
        type: NodeType.Trigger,
      },
      // Adicione outros nós aqui...
    ];

    // Usando 'upsert' para evitar duplicatas e ser idempotente
    for (const node of predefinedNodes) {
      await this.predefinedNodeModel.updateOne(
        { name: node.name },
        {
          name: node.name,
          description: node.description,
          requiredParamsPayloadKeysTypes: node.requiredParamsPayloadKeysTypes,
          outputPayloadKeysTypes: node.outputPayloadKeysTypes,
          type: node.type,
          id: node.id,
        },
        {
          upsert: true,
        },
      );
    }

    this.logger.log('Seeding completed.');
  }
}
