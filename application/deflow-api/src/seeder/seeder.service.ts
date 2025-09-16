import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PredefinedNode } from '../models/PredefinedNodes';
import { SwapNode } from '../actions/SwapNode';
import { TransactionNode } from '../actions/TransactionNode';
import { OpenAINode } from '../actions/OpenAINode';
import { WhatsAppLogger } from '../loggers/WhatsAppLogger';
import { EmailLogger } from '../loggers/EmailLogger';
import { v4 as uuidv4 } from 'uuid';
import { NodeType } from '../utils/NodeType';

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

    const predefinedNodes: Omit<PredefinedNode, '_id'>[] = [
      {
        id: uuidv4(),
        name: swapNode.name,
        description: swapNode.description,
        requiredParamsPayloadKeysTypes: { user_secret: 'string' },
        outputPayloadKeysTypes: { hash: 'string', status: 'string' },
        type: NodeType.Action,
      },
      {
        id: uuidv4(),
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
        id: uuidv4(),
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
        id: uuidv4(),
        name: emailLogger.name,
        description: emailLogger.description,
        requiredParamsPayloadKeysTypes: { from: 'string', to: 'string' },
        outputPayloadKeysTypes: { messageId: 'string', status: 'string' },
        type: NodeType.Logger,
      },
      {
        id: uuidv4(),
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
      // Adicione outros nós aqui...
    ];

    // Usando 'upsert' para evitar duplicatas e ser idempotente
    for (const node of predefinedNodes) {
      await this.predefinedNodeModel.updateOne(
        { name: node.name },
        node as any,
        {
          upsert: true,
        },
      );
    }

    this.logger.log('Seeding completed.');
  }
}
