# DeFLow API - Documentação Completa

## Visão Geral

A DeFLow API é uma aplicação NestJS que implementa um sistema de automação baseado em fluxos (flows) e nós (nodes) para interações com protocolos DeFi na blockchain Stellar. O sistema permite criar fluxos de trabalho automatizados através de uma interface visual, utilizando diferentes tipos de nós: Triggers, Actions e Loggers.

### Tecnologias Utilizadas

- **Framework**: NestJS 11.0.1
- **Banco de Dados**: MongoDB (via Mongoose 8.18.1)
- **Blockchain**: Stellar SDK 14.1.1
- **Agendamento**: @nestjs/schedule 6.0.0 com cron 4.3.3
- **Validação**: class-validator 0.14.2

---

## Estrutura do Projeto

```
src/
├── app.controller.ts           # Controller principal
├── main.ts                     # Ponto de entrada da aplicação
├── flow/                       # Módulo de gerenciamento de fluxos
├── predefined-nodes/           # Módulo de nós pré-definidos
├── models/                     # Modelos de dados (MongoDB)
├── utils/                      # Utilitários e factory de nós
├── actions/                    # Implementações de nós de ação
├── triggers/                   # Implementações de triggers
├── loggers/                    # Implementações de loggers
└── seeder/                     # Seeder para dados iniciais
```

---

## Endpoints da API

### 1. Endpoint Principal

#### `GET /`

**Descrição**: Endpoint de verificação de saúde da API  
**Resposta**:

```json
"Hello World!"
```

---

### 2. Módulo Flow (`/flow`)

#### `POST /flow`

**Descrição**: Cria um novo fluxo de trabalho

**Payload**:

```typescript
{
  "name": "string",        // Nome do fluxo (obrigatório)
  "description": "string"  // Descrição do fluxo (obrigatório)
}
```

**Resposta**:

```typescript
{
  "id": "string",          // UUID gerado automaticamente
  "name": "string",
  "description": "string"
}
```

#### `POST /flow/:flowId/trigger/:triggerId`

**Descrição**: Executa um fluxo através de um trigger HTTP

**Parâmetros de Rota**:

- `flowId`: ID do fluxo
- `triggerId`: ID do trigger

**Payload**: `object` (payload dinâmico baseado no trigger)

**Resposta**: Resultado da execução do fluxo

#### `POST /flow/:flowId/new-node`

**Descrição**: Adiciona um novo nó a um fluxo existente

**Parâmetros de Rota**:

- `flowId`: ID do fluxo

**Payload**:

```typescript
{
  "predefinedNodeId": "string",  // ID do nó pré-definido (obrigatório)
  "name": "string",              // Nome do nó (obrigatório)
  "type": "Trigger" | "Action" | "Logger",  // Tipo do nó (obrigatório)
  "description": "string",       // Descrição do nó (obrigatório)
  "params": "string",            // JSON stringificado com parâmetros (obrigatório)
  "x": "number",                 // Posição X no canvas (obrigatório)
  "y": "number",                 // Posição Y no canvas (obrigatório)
  "variables": "string"          // JSON stringificado com variáveis (opcional)
}
```

**Resposta**:

```typescript
{
  "id": "string",
  "flowId": "string",
  "name": "string",
  "description": "string",
  "type": "Trigger" | "Action" | "Logger",
  "x": "number",
  "y": "number",
  "params": "object",
  "variables": "object",
  "successFlow": "FlowNode[]",
  "errorFlow": "FlowNode[]"
}
```

#### `DELETE /flow/:flowId/node/:nodeId`

**Descrição**: Remove um nó de um fluxo

**Parâmetros de Rota**:

- `flowId`: ID do fluxo
- `nodeId`: ID do nó a ser removido

#### `PUT /flow/:flowId/node/:nodeId`

**Descrição**: Atualiza um nó existente

**Parâmetros de Rota**:

- `flowId`: ID do fluxo
- `nodeId`: ID do nó

**Payload**: Objeto parcial do `CreateFlowNodeDto` (todos os campos opcionais)

#### `POST /flow/link-nodes`

**Descrição**: Conecta dois nós em um fluxo

**Payload**:

```typescript
{
  "fromNodeId": "string",      // ID do nó de origem
  "toNodeId": "string",        // ID do nó de destino
  "isForErrorFlow": "boolean"  // Se a conexão é para fluxo de erro
}
```

#### `POST /flow/unlink-nodes`

**Descrição**: Desconecta dois nós em um fluxo

**Payload**: Mesmo formato do `link-nodes`

#### `POST /flow/:flowId/deploy`

**Descrição**: Ativa um fluxo (registra triggers agendados)

**Parâmetros de Rota**:

- `flowId`: ID do fluxo

#### `POST /flow/:flowId/undeploy`

**Descrição**: Desativa um fluxo (remove triggers agendados)

**Parâmetros de Rota**:

- `flowId`: ID do fluxo

---

### 3. Módulo Predefined Nodes (`/predefined-nodes`)

#### `POST /predefined-nodes`

**Descrição**: Cria um novo nó pré-definido

**Payload**:

```typescript
{
  "name": "string",                                    // Nome do nó (obrigatório)
  "description": "string",                             // Descrição (obrigatório)
  "requiredParamsPayloadKeysTypes": {                  // Tipos dos parâmetros obrigatórios
    "[key: string]": "string"
  },
  "outputPayloadKeysTypes": {                          // Tipos do payload de saída
    "[key: string]": "string"
  },
  "type": "Trigger" | "Action" | "Logger"              // Tipo do nó (obrigatório)
}
```

#### `GET /predefined-nodes`

**Descrição**: Lista todos os nós pré-definidos

**Resposta**: Array de objetos `PredefinedNode`

#### `GET /predefined-nodes/:id`

**Descrição**: Obtém um nó pré-definido específico

**Parâmetros de Rota**:

- `id`: ID do nó pré-definido

#### `DELETE /predefined-nodes/:id`

**Descrição**: Remove um nó pré-definido

**Parâmetros de Rota**:

- `id`: ID do nó pré-definido

**Resposta**:

```typescript
{
  "deleted": "boolean"
}
```

---

## Modelos de Dados

### Flow

```typescript
{
  "id": "string",          // UUID único
  "name": "string",        // Nome do fluxo
  "description": "string"  // Descrição do fluxo
}
```

### FlowNode

```typescript
{
  "id": "string",                    // UUID único
  "flowId": "string",                // ID do fluxo pai
  "x": "number",                     // Posição X no canvas
  "y": "number",                     // Posição Y no canvas
  "successFlow": "FlowNode[]",       // Nós do fluxo de sucesso
  "errorFlow": "FlowNode[]",         // Nós do fluxo de erro (opcional)
  "type": "Trigger|Action|Logger",   // Tipo do nó
  "name": "string",                  // Nome do nó
  "description": "string",           // Descrição do nó
  "params": "Record<string, string>", // Parâmetros do nó
  "variables": "Record<string, string>" // Variáveis do nó (opcional)
}
```

### PredefinedNode

```typescript
{
  "id": "string",                                      // UUID único
  "name": "string",                                    // Nome do nó
  "description": "string",                             // Descrição
  "requiredParamsPayloadKeysTypes": {                  // Tipos dos parâmetros obrigatórios
    "[key: string]": "string"
  },
  "outputPayloadKeysTypes": {                          // Tipos do payload de saída
    "[key: string]": "string"
  },
  "type": "Trigger|Action|Logger"                      // Tipo do nó
}
```

---

## Sistema de Nós

### Tipos de Nós

#### 1. **Trigger Nodes**

Nós que iniciam a execução de um fluxo.

**Implementações Disponíveis**:

##### `HttpTrigger`

- **Nome**: HTTPTrigger
- **Descrição**: Trigger ativado via requisição HTTP
- **Parâmetros**: Nenhum
- **Uso**: Ativado através do endpoint `POST /flow/:flowId/trigger/:triggerId`

##### `CronJobTrigger`

- **Nome**: CronJobTrigger
- **Descrição**: Dispara em intervalos regulares definidos por uma expressão cron
- **Parâmetros**:
  - `time`: Expressão cron (obrigatório)
- **Exemplo**: `"0 0 * * *"` (executa diariamente à meia-noite)

#### 2. **Action Nodes**

Nós que executam ações específicas no fluxo.

**Implementações Disponíveis**:

##### `ActionAutoCompound`

- **Nome**: auto-compound
- **Descrição**: Automaticamente compõe rendimento do Blend Protocol
- **Parâmetros**:
  - `minThreshold`: Valor mínimo para execução do compound (padrão: 5)
- **Entrada**:
  ```typescript
  {
    "asset": "string" // Ativo para compound (padrão: "USDC")
  }
  ```
- **Saída**:
  ```typescript
  {
    "success": "boolean",
    "compounded": "number",           // Valor reinvestido
    "asset": "string",               // Ativo processado
    "previousPosition": "object",    // Posição anterior
    "newPosition": "object",         // Nova posição
    "improvement": "object",         // Melhoria calculada
    "timestamp": "string",           // ISO timestamp
    "message": "string"              // Mensagem descritiva
  }
  ```

##### `ActionBlendLoanReal`

- **Nome**: ActionBlendLoanReal
- **Descrição**: Integração com o protocolo Blend para operações de empréstimo
- **Funcionalidades**: Supply, Borrow, Repay, Withdraw

##### `BalanceNode`

- **Nome**: BalanceNode
- **Descrição**: Consulta saldo de ativos na blockchain Stellar

##### `SwapNode`

- **Nome**: SwapNode
- **Descrição**: Executa swaps de tokens através do Soroswap

##### `TransactionNode`

- **Nome**: TransactionNode
- **Descrição**: Executa transações genéricas na blockchain Stellar

#### 3. **Logger Nodes**

Nós que registram informações ou enviam notificações.

##### `EmailLogger`

- **Nome**: LoggerTemplate
- **Descrição**: Envia logs via email
- **Parâmetros**:
  - `transporter`: Configuração do transportador de email
  - `from`: Email remetente
  - `to`: Email destinatário

##### `WhatsAppLogger`

- **Nome**: WhatsAppLogger
- **Descrição**: Envia notificações via WhatsApp

---

## Sistema de Mensagens

### NodeMessage

Estrutura padrão para comunicação entre nós:

```typescript
{
  "payload": {                    // Dados principais
    "[key: string]": "any",
    "variables": {                // Variáveis dinâmicas
      "[key: string]": "string"
    }
  },
  "metadata": {                   // Metadados
    "[key: string]": "any"
  }
}
```

### Sistema de Variáveis

O sistema suporta substituição de variáveis no formato `{{varName}}` nos parâmetros dos nós. As variáveis são extraídas do payload da mensagem atual.

---

## Patterns e Convenções

### 1. **Padrão de Execução de Fluxos**

1. **Trigger** valida o payload inicial
2. **Actions** são executadas em sequência
3. Em caso de erro, o fluxo pode ser direcionado para nós de tratamento de erro
4. **Loggers** registram o resultado final

### 2. **Padrão de Factory**

O `NodeFactory` registra dinamicamente todos os nós disponíveis através do sistema de registro automático, permitindo criação dinâmica de instâncias.

### 3. **Padrão de Deployment**

- Fluxos podem ser "deployados" para ativar triggers automáticos (como cron jobs)
- Triggers HTTP estão sempre disponíveis independente do deployment
- O sistema de agendamento do NestJS gerencia os jobs ativos

### 4. **Padrão de Tratamento de Erros**

- Actions podem ter fluxos de sucesso e erro separados
- Mensagens de erro preservam o contexto original
- Logs de erro são automaticamente gerados

---

## Configuração e Inicialização

### Variáveis de Ambiente

```bash
PORT=3000                    # Porta da aplicação (padrão: 3000)
MONGODB_URI=                 # URI de conexão com MongoDB
```

### Processo de Inicialização

1. **Registro de Nós**: Carregamento dinâmico de todos os nós disponíveis
2. **Validação Global**: Configuração de pipes de validação
3. **Seeding**: Execução do seeder para dados iniciais
4. **Servidor**: Inicialização do servidor HTTP

---

## Scripts Disponíveis

### Desenvolvimento

```bash
npm run start:dev          # Modo desenvolvimento com watch
npm run start:debug        # Modo debug
npm run build              # Build de produção
```

### Execução de Nós Individuais

```bash
npm run run:email-logger        # Testa logger de email
npm run run:whatsapp-logger     # Testa logger do WhatsApp
npm run run:make-transaction    # Testa criação de transação
npm run run:get-balance        # Testa consulta de saldo
```

### Triggers

```bash
npm run trigger:query      # Consulta dados do Stellar
npm run trigger:monitor    # Monitora eventos
npm run trigger:demo       # Execução de demonstração
```

---

## Integração com Stellar

A API integra-se com a blockchain Stellar através do SDK oficial, oferecendo:

- **Consulta de Saldos**: Verificação de ativos em contas
- **Transações**: Criação e envio de transações
- **Swaps**: Integração com DEXs como Soroswap
- **DeFi Protocols**: Integração com protocolos como Blend

---

## Segurança e Validação

### Validação de Entrada

- Todos os DTOs utilizam `class-validator` para validação
- Pipes globais de validação configurados
- Sanitização automática de dados de entrada

### Tratamento de Erros

- Exceções customizadas do NestJS
- Logs estruturados para debugging
- Propagação adequada de erros entre nós

---

## Conclusão

A DeFLow API oferece uma plataforma robusta para automação de fluxos DeFi na blockchain Stellar, com arquitetura modular, sistema de nós extensível e integração nativa com protocolos populares. O design baseado em fluxos visuais permite que usuários criem automações complexas sem necessidade de programação manual.
