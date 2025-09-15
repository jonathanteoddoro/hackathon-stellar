## Fluxo escolhido (MVP)

**Nome do fluxo:** *“Auto-Borrow + Swap se Preço Favorável”*

**Descrição:**
Usuário define:

* ativo colateral (ex: USDC)
* ativo a ser emprestado (ex: TOKEN\_X) via Blend
* preço mínimo desejado para trocar TOKEN\_X de volta para USDC via Soroswap
* slippage tolerado, montante, etc.

O fluxo:

1. Monitorar o preço do par TOKEN\_X / USDC via Reflector.
2. Quando o preço de TOKEN\_X em USDC exceder o limiar definido → disparar
3. No Blend: depositar colateral (se não depositado) e emprestar TOKEN\_X.
4. No Soroswap: fazer swap de TOKEN\_X para USDC com base na cotação + tolerância de slippage.
5. Registrar execução e enviar notificação ao usuário do resultado (tx hash, custos, lucro estimado etc).

Este fluxo cobre: trigger / oráculo, leitura de preço, lending/borrow, swap, simulação, execução.

---

## Documentação técnica backend desse fluxo

A seguir a especificação necessária para backend para suportar esse fluxo simples:

---

### A. Componentes envolvidos

| Componente                           | Função específica para esse fluxo                                                                                                                                            |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Connector Reflector**              | Fornece preço TOKEN\_X/USDC, leitura do feed, verificação de frescor (timestamp), trigger de limiar.                                                                         |
| **Connector Blend**                  | Operações: supply collateral, borrow ativo TOKEN\_X. Também leitura de pools para verificar se ativo suportado, estado de colateral, LTV. Usar *blend-sdk-js*. ([GitHub][1]) |
| **Connector Soroswap**               | Obter cotação (“quote”) e construir transação de swap TOKEN\_X → USDC. Usar **Soroswap API / SDK** para isso. ([docs.soroswap.finance][2])                                   |
| **Simulação / Transaction Composer** | Compor transações Stellar/Soroban (Blend borrow + Soroswap swap), simular para estimar taxas, slippage, ver se suficiente liquidez, checar saldo da conta.                   |
| **Orquestrador**                     | Monitorar o preço → verificar condições (slippage tolerado, colateral disponível) → sequenciar operações → lidar com falhas.                                                 |
| **Autenticação / Key Management**    | Assinar transações ou retornar unsigned para carteira do usuário; checar permissões.                                                                                         |
| **DB / histórico / log**             | Registrar parâmetros do fluxo, execuções, erros, tx hashes etc.                                                                                                              |

---

### B. Contratos / bibliotecas úteis

* **blend-sdk-js** — para interagir com Blend: supplyCollateral, borrow, leitura de configurações do pool. ([GitHub][1])
* **Soroswap SDK / API** — para cotações, rotas, construção de transações de swap. ([Libraries.io][3])
* **Stellar JS / Soroban SDK** — para compor transações, gerenciar XDR, simulação de tx, assinatura etc. ([stellar.github.io][4])

---

### C. API Endpoints (backend) necessários

Aqui vai uma proposta de API REST para o backend servir esse fluxo:

| Endpoint                         | Método | Payload                                                                                                                              | Retorno esperado / função                                                                                                    |
| -------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| **POST** `/flow/autoBorrowSwap`  | POST   | `{ userId, collateralAsset, borrowAsset, collateralAmount, borrowAmount, priceThreshold, slippageTolerance, maxFee, walletAddress }` | Cria um fluxo persistente programado / event-driven; retorna `flowId`.                                                       |
| **POST** `/flow/:flowId/trigger` | POST   | —                                                                                                                                    | Manualmente disparar ou testar trigger de preço. Retorna status.                                                             |
| **GET** `/flow/:flowId`          | GET    | —                                                                                                                                    | Retorna definição do fluxo, últimos runs, estado.                                                                            |
| **GET** `/flow/:flowId/runs`     | GET    | —                                                                                                                                    | Lista das execuções do fluxo com resultados (sucesso/falha, tx hashes).                                                      |
| **POST** `/simulate`             | POST   | `{ userId, actions: [ { type: "borrow", protocol:"Blend", params }, {type: "swap", protocol:"Soroswap", params } ] }`                | Retorna estimativas de custo, slippage, possível retorno líquido, limitação de saldo ou colateral etc. Não executa on-chain. |
| **POST** `/execute`              | POST   | `{ flowId, signedTxs? / walletSig? }`                                                                                                | Inicia execução real do fluxo: runtasks, assinatura ou retorno para assinar, envio de txs, logging. Retorno: `runId`.        |

---

### D. Sequência de execução (lógica / orquestração)

1. **Fluxo de registro/configuração**

   * Usuário define parâmetros do fluxo. Backend valida: se collateralAsset e borrowAsset suportados por Blend; se par swap existe no Soroswap; se priceThreshold & slippage em faixa aceitável.

2. **Trigger contínuo** (task agendada ou listener de oráculo)

   * Periodicamente (ou push via oráculo se disponível) buscar preço atual TOKEN\_X/USDC via Reflector.
   * Verificar se preço >= `priceThreshold`.

3. **Simulação**

   * Verificar saldo de colateral do usuário (ou se precisa depositar).
   * Simular `borrow` em Blend para `borrowAmount`. Usar `blend-sdk` para gerar operação XDR, mas não submeter. Verificar LTV, liquidação possível.
   * Simular swap TOKEN\_X → USDC via Soroswap: obter cotação, calcular minAmountOut dado slippage. Estimar taxas de rede (taxa de transação, fees de Soroban/Horizon).
   * Se simulação indica tudo OK (custos aceitáveis, slippage dentro dos parâmetros), prosseguir.

4. **Execução**

   * Se operacional não-custodial: construir transação(s) unsigned, retornar para o usuário assinar via wallet (ex: Freighter, Albedo, XUMM).

   * Se for modelo custodial: assinar via KMS e submeter.

   * Transações envolvidas:
     a) operação Blend: supply collateral (se necessário) + borrow TOKEN\_X
     b) operação Soroswap: swap TOKEN\_X → USDC

   * Pode ser feito em uma transação multi-operation se Stellar/Soroban permitir ou em duas separadas conforme requerimentos de contrato.

5. **Pós execução / notificações**

   * Confirmar inclusão das transações no ledger (via Horizon / Soroban RPC).
   * Registrar tx hashes, custos, slippage real vs estimado.
   * Notificar usuário (via webhook/email/Push) com resultado: sucesso, falha (e motivo: falta de liquidez, slippage muito grande, taxa muito alta, erro de contrato etc).

6. **Fluxo de segurança / rollback parcial**

   * Se borrow for bem-sucedido mas swap falhar → definir política: talvez manter TOKEN\_X emprestado e alertar, ou tentar swap menor, ou reverter se possível (mas em DeFi, rollback on-chain nem sempre possível).

---

### E. Estrutura de dados (modelos simplificados)

```sql
-- Tabelas principais

CREATE TABLE flows (
  flow_id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  collateral_asset TEXT NOT NULL,
  borrow_asset TEXT NOT NULL,
  collateral_amount numeric NOT NULL,
  borrow_amount numeric NOT NULL,
  price_threshold numeric NOT NULL,
  slippage_tolerance numeric NOT NULL,  -- ex: 0.5% = 0.005
  max_fee numeric NOT NULL,
  wallet_address TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'paused', 'deleted'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE flow_runs (
  run_id UUID PRIMARY KEY,
  flow_id UUID REFERENCES flows(flow_id),
  triggered_at timestamptz NOT NULL,
  price_at_trigger numeric,
  sim_estimated_cost numeric,
  sim_estimated_return numeric,
  executed boolean DEFAULT false,
  success boolean,
  borrow_tx_hash TEXT,
  swap_tx_hash TEXT,
  error_message TEXT,
  completed_at timestamptz
);
```

---

### F. Segurança / permissões

* Fluxos que fazem *borrow* implicam risco de endividamento. Precisar confirmar que usuário entende risco.
* Validar saldos e permissões de tokens.
* No modelo não-custodial: usuário assina txs; backend *não* guarda chave privada.
* Sempre simular antes de executar; alertar usuário caso taxas altas ou slippage > tolerância.
* Limitador de valor máximo por fluxo (para diminuir dano em caso de bug).

---

### G. Dependências externas

* Reflector API / oracles para obter preço.
* Blend SDK + contrato Blend em rede (Testnet / Mainnet).
* Soroswap SDK / API + contratos.
* Stellar / Soroban RPC endpoints para simulação, submissão de transações.
* Horizon para confirmação.

---

### H. Observabilidade e logs

* Registrar cada execução de run: entrada (parametros, preço no gatilho), simulação (custos estimados, slippage esperada), resultado (tx hashes, respostas).
* Métricas:

  * Tempo entre disparo do trigger e execução.
  * Sucesso vs falhas.
  * Discrepância simulação vs execução real (slippage, custo).
* Alertas: se repetidas falhas, se preço refletido parecer muito instável, se rede Soroban congestionada / taxas muito altas.

---

### I. MVP limitações reconhecidas

* O modelo assume liquidez suficiente no Soroswap para o par; em pares menos usados, pode falhar.
* Se o usuário já tiver colateral suficiente, talvez parte “supply collateral” desnecessária; pode simplificar assumindo que colateral já está depositado.
* Rollback total difícil no caso de falha parcial (borrow ok, swap falha).

---

## Exemplos de payloads / fluxo

### Exemplo: criar fluxo

```json
POST /flow/autoBorrowSwap
{
  "userId": "user-1234-uuid",
  "collateralAsset": "USDC-StellarContractAddress",
  "borrowAsset": "TOKEN_X-StellarContractAddress",
  "collateralAmount": 1000.0,
  "borrowAmount": 200.0,
  "priceThreshold": 2.5,       // ex: quiser que TOKEN_X ≥ 2.5 USDC para swap
  "slippageTolerance": 0.01,   // 1%
  "maxFee": 5.0,               // USDC equivalente de fee máximo que aceita pagar
  "walletAddress": "G...usuario"
}
```

### Exemplo: simulate

```json
POST /simulate
{
  "userId": "user-1234-uuid",
  "actions": [
    {
      "type": "borrow",
      "protocol": "Blend",
      "params": {
        "poolId": "pool-id-TokenX-pool",
        "amount": 200.0,
        "collateralAsset": "USDC-StellarContractAddress",
        "collateralAmount": 1000.0
      }
    },
    {
      "type": "swap",
      "protocol": "Soroswap",
      "params": {
        "assetIn": "TOKEN_X-StellarContractAddress",
        "assetOut": "USDC-StellarContractAddress",
        "amountIn": 200.0,
        "slippage": 0.01
      }
    }
  ]
}
```

Simulate retorna algo tipo:

```json
{
  "estimatedFeeUSDC": 1.5,
  "estimatedSlippage": 0.8,   // em %
  "expectedReturnUSDC": 490.0,  // depois de swap, etc.
  "warnings": [ "slippage close to tolerance", "fee acima usual" ]
}
```

---

## J. Tecnologias sugeridas / stack

* **Linguagem**: Node.js + Typescript (boa compat com SDKs Blend, Soroswap)
* **Framework backend**: Express / Fastify ou NestJS para organizar endpoints
* **Banco de dados**: Postgres para persistência
* **Job scheduler**: cron / Agenda ou um job queue (ex: BullMQ ou similar) para trigger periódico
* **Cache**: Redis para TTL de preços, locks de execução
* **Assinatura de tx**: Stellar SDK + Soroban RPC para simulação; integração com wallets (não-custodial)

---

## K. Diagrama simplificado de fluxo

```
[Scheduler / Trigger Service] —(exec no horário ou checagem do preço)→ Reflector Connector → obtém preço

→ se preço ≥ limiar:  
    → Simulação: Blend Connector + Soroswap Connector  
    → se simulação OK:  
         → montar tx(s)  
         → requisição para usuário assinar (ou usar KMS)  
         → submeter tx(s)  
         → registrar resultado  
         → notificar usuário  
    → senão: registrar falha / log / alerta  
```