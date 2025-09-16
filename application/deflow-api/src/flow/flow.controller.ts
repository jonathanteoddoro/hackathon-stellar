import { Body, Controller, Param, Post } from '@nestjs/common';
import { FlowService } from './flow.service';
import { NodeType } from 'src/utils/NodeType';

const data = {
  flowId: 'defi-flow-001',
  name: 'Monitorar Transferência e Logar Valor em USD',
  description:
    'Fluxo que monitora transferências de token ERC20 e registra o valor em USD.',
  nodes: [
    {
      id: 'trigger-eth-transfer',
      x: 100,
      y: 200,
      type: NodeType.Trigger,
      name: 'EthereumTransferTrigger',
      description:
        'Dispara quando ocorre uma transferência no contrato ERC20 configurado.',
      requiredInputPayloadKeysTypes: {},
      params: {},
      outputPayloadKeysTypes: {
        from: 'string',
        to: 'string',
        value: 'number',
        txHash: 'string',
      },
      successFlow: [
        {
          id: 'action-token-price',
          x: 400,
          y: 200,
          type: NodeType.Action,
          name: 'SwapNode',
          params: {
            user_secret:
              'SDHYBJ2AEA3YNIUA66G4TNU4FACRNB2C3AEYTJN6AY6NRZ5HUE3SZAZG',
          },
          description:
            'Busca o preço atual do token via API (ex: Coingecko ou DEX).',
          requiredInputPayloadKeysTypes: {
            value: 'number',
          },
          variables: {
            message: 'Swapped {{value}} tokens for USD com o hash {{txHash}}',
          },
          outputPayloadKeysTypes: {
            valueUsd: 'number',
            tokenSymbol: 'string',
          },
          successFlow: [
            {
              id: 'whatsapp-logger',
              x: 700,
              y: 200,
              type: NodeType.Logger,
              name: 'WhatsAppLogger',
              params: {
                messageText: '{{variables.message}}',
                toNumber: '+5527998924571',
              },
              description:
                'Salva no log as informações da transação e valor em USD.',
              requiredInputPayloadKeysTypes: {
                from: 'string',
                to: 'string',
                valueUsd: 'number',
              },
              outputPayloadKeysTypes: {},
              successFlow: [],
            },
          ],
          errorFlow: [],
        },
      ],
    },
  ],
};

@Controller('flow')
export class FlowController {
  constructor(private readonly flowService: FlowService) {}

  @Post('trigger/:triggerId')
  async httpTrigger(
    @Param('triggerId') triggerId: string,
    @Body() payload: object,
  ) {
    return await this.flowService.executeFlow(data, payload, triggerId);
  }
}
