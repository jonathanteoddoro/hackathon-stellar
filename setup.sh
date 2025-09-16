#!/bin/bash

echo "🚀 Setup Automático - Hackathon Stellar DeFi"
echo "=============================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para verificar se comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar dependências
echo -e "${BLUE}📋 Verificando dependências...${NC}"

# Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo -e "✅ Node.js: ${NODE_VERSION}"
else
    echo -e "${RED}❌ Node.js não encontrado!${NC}"
    echo "Instale com: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
    exit 1
fi

# pnpm
if command_exists pnpm; then
    PNPM_VERSION=$(pnpm --version)
    echo -e "✅ pnpm: v${PNPM_VERSION}"
else
    echo -e "${YELLOW}⚠️  pnpm não encontrado. Instalando...${NC}"
    npm install -g pnpm
fi

# Rust
if command_exists cargo; then
    RUST_VERSION=$(rustc --version)
    echo -e "✅ Rust: ${RUST_VERSION}"
else
    echo -e "${RED}❌ Rust não encontrado!${NC}"
    echo "Instale com: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

# Stellar CLI
if command_exists stellar; then
    STELLAR_VERSION=$(stellar --version | head -n1)
    echo -e "✅ Stellar CLI: ${STELLAR_VERSION}"
else
    echo -e "${RED}❌ Stellar CLI não encontrado!${NC}"
    echo "Instale com: curl -sSL https://release.stellar.org/cli/install.sh | bash"
    exit 1
fi

echo ""
echo -e "${BLUE}🔧 Configurando projeto...${NC}"

# Verificar target WASM
if rustup target list | grep -q "wasm32-unknown-unknown (installed)"; then
    echo -e "✅ WASM target já instalado"
else
    echo -e "${YELLOW}📦 Instalando WASM target...${NC}"
    rustup target add wasm32-unknown-unknown
fi

# Instalar dependências do projeto
echo -e "${YELLOW}📦 Instalando dependências do backend...${NC}"
cd application/deflow-api
pnpm install
cd ../..

# Verificar configuração Stellar
echo ""
echo -e "${BLUE}🔑 Verificando configuração Stellar...${NC}"

if stellar keys ls | grep -q "default"; then
    ACCOUNT_ADDRESS=$(stellar keys address default)
    echo -e "✅ Chave 'default' encontrada: ${ACCOUNT_ADDRESS}"
else
    echo -e "${YELLOW}🔑 Gerando nova chave...${NC}"
    stellar keys generate --global default --network testnet
    ACCOUNT_ADDRESS=$(stellar keys address default)
    echo -e "✅ Nova chave gerada: ${ACCOUNT_ADDRESS}"
    echo ""
    echo -e "${YELLOW}💰 IMPORTANTE: Financie sua conta no testnet!${NC}"
    echo -e "   Vá para: ${BLUE}https://friendbot.stellar.org${NC}"
    echo -e "   Cole este endereço: ${GREEN}${ACCOUNT_ADDRESS}${NC}"
    echo ""
    read -p "Pressione ENTER após financiar a conta..."
fi

# Compilar smart contract
echo ""
echo -e "${BLUE}🔨 Compilando smart contract...${NC}"
cd smart-contracts/blend

if cargo build --target wasm32-unknown-unknown --release; then
    echo -e "✅ Smart contract compilado com sucesso!"
else
    echo -e "${RED}❌ Erro ao compilar smart contract${NC}"
    exit 1
fi

# Deploy automático (opcional)
echo ""
read -p "🚀 Fazer deploy do smart contract agora? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🚀 Fazendo deploy...${NC}"
    
    CONTRACT_ID=$(stellar contract deploy \
        --wasm target/wasm32-unknown-unknown/release/blend_loan.wasm \
        --source-account default \
        --network testnet 2>/dev/null | tail -n1)
    
    if [[ $CONTRACT_ID =~ ^C[A-Z0-9]{55}$ ]]; then
        echo -e "✅ Deploy realizado com sucesso!"
        echo -e "📋 Contract ID: ${GREEN}${CONTRACT_ID}${NC}"
        echo -e "🔗 Explorer: ${BLUE}https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}${NC}"
        
        # Atualizar arquivo de configuração
        echo ""
        echo -e "${YELLOW}📝 Atualizando configuração do backend...${NC}"
        cd ../../application/deflow-api
        
        # Backup do arquivo original
        cp src/actions/ActionBlendLoanReal.ts src/actions/ActionBlendLoanReal.ts.backup
        
        # Atualizar CONTRACT_ID
        sed -i "s/private contractId: string = '[^']*'/private contractId: string = '${CONTRACT_ID}'/" src/actions/ActionBlendLoanReal.ts
        sed -i "s/private userAddress: string = '[^']*'/private userAddress: string = '${ACCOUNT_ADDRESS}'/" src/actions/ActionBlendLoanReal.ts
        
        echo -e "✅ Configuração atualizada!"
        
    else
        echo -e "${RED}❌ Erro no deploy${NC}"
        exit 1
    fi
fi

# Teste final
echo ""
echo -e "${BLUE}🧪 Executando teste final...${NC}"
cd ../../application/deflow-api

if npx ts-node scripts/test-blend-real-action.ts; then
    echo ""
    echo -e "${GREEN}🎉 SETUP CONCLUÍDO COM SUCESSO!${NC}"
    echo -e "   ✅ Todas as dependências instaladas"
    echo -e "   ✅ Smart contract deployado e funcionando"
    echo -e "   ✅ Backend configurado e testado"
    echo ""
    echo -e "${BLUE}📋 Próximos passos:${NC}"
    echo -e "   • Execute: ${YELLOW}npx ts-node scripts/test-blend-real-action.ts${NC}"
    echo -e "   • Explore as operações DeFi disponíveis"
    echo -e "   • Consulte o SETUP.md para mais detalhes"
    echo ""
else
    echo -e "${YELLOW}⚠️  Setup básico concluído, mas teste falhou${NC}"
    echo -e "   Consulte o SETUP.md para troubleshooting"
fi

echo -e "${BLUE}📚 Documentação completa em: SETUP.md${NC}"