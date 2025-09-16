# 🌟 Hackathon Stellar - Sistema DeFi

Sistema completo de DeFi (Finanças Descentralizadas) construído na blockchain Stellar usando Soroban smart contracts.

## 🚀 Setup Rápido (Para Iniciantes)

### Opção 1: Setup Automático
```bash
git clone https://github.com/jonathanteoddoro/hackathon-stellar.git
cd hackathon-stellar
chmod +x setup.sh
./setup.sh
```

### Opção 2: Setup Manual
Consulte o arquivo [`SETUP.md`](./SETUP.md) para instruções detalhadas.

## 🎯 Funcionalidades

### 💰 Smart Contract (Blend Protocol)
- **Supply**: Fornecer liquidez para ganhar juros
- **Borrow**: Pegar empréstimos com garantia
- **Repay**: Pagar empréstimos
- **Withdraw**: Sacar liquidez fornecida
- **Queries**: Consultar posições e estatísticas

### 🔗 Backend Integration
- **ActionBlendLoanReal**: Integração TypeScript com smart contract
- **TriggerSwapXML**: Sistema de triggers para operações
- **Flow Controller**: Orquestração de fluxos DeFi

## 📁 Estrutura do Projeto

```
hackathon-stellar/
├── smart-contracts/
│   └── blend/                  # Smart contract Blend Protocol
│       ├── src/lib.rs         # Código principal do contrato
│       └── Cargo.toml         # Configuração Rust
├── application/
│   └── deflow-api/            # Backend Node.js/TypeScript
│       ├── src/actions/       # Ações DeFi
│       ├── src/triggers/      # Triggers para operações
│       └── scripts/           # Scripts de teste
├── SETUP.md                   # Guia completo de setup
└── setup.sh                  # Script de setup automático
```

## 🧪 Como Testar

### 1. Testar Smart Contract Diretamente
```bash
cd smart-contracts/blend

# Ver estatísticas do pool
stellar contract invoke \
  --id SEU_CONTRACT_ID \
  --source-account default \
  --network testnet \
  -- get_pool_stats --asset "USDC"

# Fornecer liquidez
stellar contract invoke \
  --id SEU_CONTRACT_ID \
  --source-account default \
  --network testnet \
  --send=yes \
  -- supply --supplier SEU_ENDERECO --amount 100 --asset "USDC"
```

### 2. Testar via Backend
```bash
cd application/deflow-api
npx ts-node scripts/test-blend-real-action.ts
```

## 🔧 Tecnologias Utilizadas

- **Blockchain**: Stellar Network (Testnet)
- **Smart Contracts**: Soroban (Rust)
- **Backend**: Node.js + TypeScript
- **Package Manager**: pnpm
- **CLI**: Stellar CLI v23.1.3+

## 📚 Documentação

- [`SETUP.md`](./SETUP.md) - Guia completo de instalação e configuração
- [`smart-contracts/README.md`](./smart-contracts/README.md) - Documentação dos contratos
- [Stellar Documentation](https://developers.stellar.org/)
- [Soroban Documentation](https://soroban.stellar.org/)

## 🆘 Problemas Comuns

### Erro: "stellar: command not found"
```bash
curl -sSL https://release.stellar.org/cli/install.sh | bash
source ~/.bashrc
```

### Erro: "insufficient balance"
Financie sua conta no testnet: https://friendbot.stellar.org

### Erro de compilação WASM
```bash
rustup target add wasm32-unknown-unknown
```

## 🎯 Status do Projeto

- ✅ Smart Contract Blend Protocol implementado
- ✅ Deploy automático no Stellar Testnet
- ✅ Backend TypeScript integrado
- ✅ Sistema de triggers e ações
- ✅ Testes automatizados funcionando
- ✅ Documentação completa

## 🏆 Funcionalidades Demonstradas

1. **DeFi Protocol Completo**: Supply, Borrow, Repay, Withdraw
2. **Smart Contract Real**: Deployado e funcional na Stellar
3. **Backend Integration**: TypeScript/Node.js conectado ao contrato
4. **Automation**: Scripts de setup e teste automatizados
5. **Error Handling**: Tratamento robusto de erros
6. **Event Publishing**: Eventos publicados on-chain

---

🚀 **Desenvolvido para o Hackathon Stellar** 🌟

Este projeto demonstra um protocolo DeFi completo e funcional na Stellar blockchain, com smart contracts Soroban e integração backend moderna.