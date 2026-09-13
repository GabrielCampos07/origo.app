#!/usr/bin/env bash
set -euo pipefail

# Origo - Script de setup local (W0.4 + W0.5 stub)
# Objetivo: levantar ambiente Docker + instalar deps + rodar migrations

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🔧 Origo - Setup local"
echo "======================"
echo ""

# 1. Verificar dependências
echo "1️⃣  Verificando dependências..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Instale: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose não encontrado"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js 20+"
    exit 1
fi

echo "✅ Dependências OK (Docker, Node)"
echo ""

# 2. Criar .env se não existir
echo "2️⃣  Configurando .env..."
if [ ! -f "$ROOT_DIR/.env" ]; then
    cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
    echo "✅ .env criado a partir de .env.example"
else
    echo "ℹ️  .env já existe"
fi
echo ""

# 3. Subir Docker (Postgres + Mailhog)
echo "3️⃣  Subindo Docker (Postgres + Mailhog)..."
cd "$ROOT_DIR/deploy"
docker compose up -d
echo "✅ Docker rodando"
echo ""

# 4. Aguardar Postgres ficar pronto
echo "4️⃣  Aguardando Postgres (max 30s)..."
for i in {1..30}; do
    if docker exec origo-postgres pg_isready -U origo &> /dev/null; then
        echo "✅ Postgres pronto"
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

# 5. Instalar dependências NPM
echo "5️⃣  Instalando dependências (npm install)..."
cd "$ROOT_DIR"
npm install
echo "✅ Dependências instaladas"
echo ""

# 6. Gerar Prisma client
echo "6️⃣  Gerando Prisma client..."
cd "$ROOT_DIR/apps/api"
npx prisma generate
echo "✅ Prisma client gerado"
echo ""

# 7. Rodar migrations
echo "7️⃣  Rodando migrations..."
npx prisma migrate dev --name init
echo "✅ Migrations aplicadas"
echo ""

echo "✨ Setup completo!"
echo ""
echo "🚀 Para iniciar a API:"
echo "   cd $ROOT_DIR"
echo "   npm run api:dev"
echo ""
echo "📋 Endpoints:"
echo "   API:       http://localhost:3001"
echo "   Health:    http://localhost:3001/health"
echo "   Mailhog:   http://localhost:8025"
echo ""
echo "🗄️  Postgres: localhost:5435"
echo ""
