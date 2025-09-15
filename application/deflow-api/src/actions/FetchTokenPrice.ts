import { ActionNode } from 'src/utils/ActionNode';

export class FetchTokenPrice extends ActionNode {
  name = 'Fetch Token Price';
  description = 'Busca o preço atual do token via API (ex: Coingecko ou DEX).';

  whenResolved(): void {
    console.log('FetchTokenPrice resolved');
    // Lógica para buscar o preço do token
  }

  whenRejected(): void {
    console.log('FetchTokenPrice rejected');
    // Lógica para lidar com erro na busca do preço
  }
}
