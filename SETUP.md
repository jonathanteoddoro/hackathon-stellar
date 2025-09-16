# 🚀 Guia de Setup - Hackathon Stellar DeFi

## 📋 Pré-requisitos

### 1. Sistema Operacional
- Linux/Ubuntu (recomendado)
- macOS
- Windows com WSL2

### 2. Ferramentas Necessárias

#### Node.js & pnpm
```bash
# Instalar Node.js (versão 18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar pnpm
npm install -g pnpm
```

#### Rust & Cargo
```bash
# Instalar Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Adicionar target WASM
rustup target add wasm32-unknown-unknown
```

#### Stellar CLI
```bash
# Instalar Stellar CLI (versão mais recente)
curl -sSL https://release.stellar.org/cli/install.sh | bash

# Ou via Homebrew (macOS)
brew install stellar/tap/stellar-cli
```

## 🔧 Setup do Projeto

### 1. Clonar e Instalar Dependências
```bash
git clone https://github.com/jonathanteoddoro/hackathon-stellar.git
cd hackathon-stellar

# Instalar dependências do backend
cd application/deflow-api
pnpm install
cd ../..
```

### 2. Configurar Stellar CLI
```bash
# Configurar rede testnet (já vem por padrão)
stellar network ls

# Gerar nova chave ou usar existente
stellar keys generate --global default --network testnet

# Ver endereço gerado
stellar keys address default

# Financiar conta no testnet
# Vá para: https://friendbot.stellar.org
# Cole seu endereço e clique em "Get test network lumens"
```

### 3. Deploy do Smart Contract
```bash
cd smart-contracts/blend

# Compilar contrato
cargo build --target wasm32-unknown-unknown --release

# Deployar no testnet
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/blend_loan.wasm \
  --source-account default \
  --network testnet

# Salvar o CONTRACT_ID que aparecer na saída
```

### 4. Configurar Environment Variables
```bash
cd application/deflow-api

# Copiar arquivo de exemplo
cp .env.example .env

# Editar com seus valores
nano .env
```

**Configurar no arquivo `.env`:**
```bash
# Seu contract ID deployado
STELLAR_CONTRACT_ID=SEU_CONTRACT_ID_AQUI

# Seu endereço Stellar
STELLAR_USER_ADDRESS=SEU_ENDERECO_AQUI

# Opcional: Configurações Twilio para WhatsApp
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### 5. Configurar Backend
```bash
# As configurações agora são feitas via .env
# Não precisa mais editar código manualmente!
```

## 🧪 Testar o Sistema

### 1. Testar Smart Contract Diretamente
```bash
cd smart-contracts/blend

# Testar pool stats
stellar contract invoke \
  --id SEU_CONTRACT_ID \
  --source-account default \
  --network testnet \
  -- get_pool_stats --asset "USDC"

# Testar supply
stellar contract invoke \
  --id SEU_CONTRACT_ID \
  --source-account default \
  --network testnet \
  --send=yes \
  -- supply --supplier SEU_ENDERECO --amount 100 --asset "USDC"
```

### 2. Testar via Backend
```bash
cd ../../application/deflow-api

# Executar script de teste
npx ts-node scripts/test-blend-real-action.ts
```

## 📁 Estrutura do Projeto

```
hackathon-stellar/
├── smart-contracts/
│   └── blend/
│       ├── src/lib.rs          # Smart contract principal
│       └── Cargo.toml          # Configuração Rust
├── application/
│   └── deflow-api/
│       ├── src/actions/        # Ações DeFi (ActionBlendLoanReal.ts)
│       ├── src/triggers/       # Triggers para operações
│       └── scripts/            # Scripts de teste
└── README.md
```

## 🎯 Funcionalidades Disponíveis

### Smart Contract (Blend Protocol)
- **supply()** - Fornecer liquidez
- **borrow()** - Pegar empréstimo
- **repay()** - Pagar empréstimo
- **withdraw()** - Sacar liquidez
- **get_position()** - Ver posição
- **get_pool_stats()** - Estatísticas do pool

### Backend Integration
- **ActionBlendLoanReal** - Integração com contrato real
- **TriggerSwapXML** - Trigger para swaps
- **ActionGetBalance** - Consultar saldos
- **Flow System** - Sistema de fluxos DeFi

## 🔍 Comandos Úteis

```bash
# Ver versões
stellar --version
cargo --version
node --version
pnpm --version

# Ver chaves Stellar
stellar keys ls

# Ver redes configuradas
stellar network ls

# Ver saldo da conta
stellar account --id SEU_ENDERECO --network testnet

# Compilar contrato
cargo build --target wasm32-unknown-unknown --release

# Executar testes do backend
cd application/deflow-api
npm test
```

## 🆘 Solução de Problemas

### Erro: "stellar: command not found"
```bash
# Verificar se está no PATH
echo $PATH | grep stellar

# Recarregar shell
source ~/.bashrc
# ou
source ~/.zshrc
```

### Erro: "wasm32-unknown-unknown not found"
```bash
rustup target add wasm32-unknown-unknown
```

### Erro: "insufficient balance"
```bash
# Financiar conta novamente
# https://friendbot.stellar.org
```

### Erro de compilação TypeScript
```bash
cd application/deflow-api
pnpm install
npx tsc --noEmit  # Verificar erros
```

## ✅ Checklist Final

- [ ] Node.js 18+ instalado
- [ ] Rust + Cargo instalados
- [ ] Stellar CLI instalado e configurado
- [ ] Chave gerada e financiada no testnet
- [ ] Smart contract compilado e deployado
- [ ] Backend configurado com CONTRACT_ID e endereço
- [ ] Teste do smart contract funcionando
- [ ] Teste do backend funcionando

---

🎉 **Pronto! Agora você tem um sistema DeFi completo rodando na Stellar!**

Para dúvidas ou problemas, consulte:
- [Stellar Documentation](https://developers.stellar.org/)
- [Soroban Smart Contracts](https://soroban.stellar.org/)
- [Issues do repositório](https://github.com/jonathanteoddoro/hackathon-stellar/issues)