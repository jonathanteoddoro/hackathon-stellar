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
      name: 'Ethereum Transfer Trigger',
      description:
        'Dispara quando ocorre uma transferência no contrato ERC20 configurado.',
      requiredInputPayloadKeysTypes: {},
      outputPayloadKeysTypes: {
        from: 'string',
        to: 'string',
        value: 'number',
        txHash: 'string',
      },
      outputs: [
        {
          id: 'action-token-price',
          x: 400,
          y: 200,
          type: NodeType.Action,
          name: 'Fetch Token Price',
          description:
            'Busca o preço atual do token via API (ex: Coingecko ou DEX).',
          requiredInputPayloadKeysTypes: {
            value: 'number',
          },
          outputPayloadKeysTypes: {
            valueUsd: 'number',
            tokenSymbol: 'string',
          },
          outputs: [
            {
              id: 'logger-transaction',
              x: 700,
              y: 200,
              type: NodeType.Logger,
              name: 'Transaction Logger',
              description:
                'Salva no log as informações da transação e valor em USD.',
              requiredInputPayloadKeysTypes: {
                from: 'string',
                to: 'string',
                valueUsd: 'number',
              },
              outputPayloadKeysTypes: {},
              outputs: [],
            },
          ],
        },
      ],
    },
  ],
};

@Controller('flow')
export class FlowController {
  constructor(private readonly flowService: FlowService) {}

  @Post('trigger/:triggerId')
  httpTrigger(@Param('triggerId') triggerId: string, @Body() payload: object) {
    return this.flowService.executeFlow(data, payload, triggerId);
  }
}
