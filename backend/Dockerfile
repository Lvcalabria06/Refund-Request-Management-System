# Image base com Node 20.19 (mesma versão do .nvmrc)
FROM node:20.19

# Pasta de trabalho dentro do container
WORKDIR /app

# Copia primeiro só os manifests para aproveitar cache de layers do Docker:
# se package.json não mudou, o "npm ci" abaixo é reusado em rebuilds.
COPY package*.json ./

# A image node:20.19 (Debian) já vem com OpenSSL instalado — não precisa
# de "apk add" (que é do Alpine) nem de "apt-get install".

# Instala dependências de forma determinística (usa package-lock.json).
# O postinstall do projeto cria o .env automaticamente a partir do .env.example.
RUN npm ci

# Copia o schema do Prisma e gera o client antes do código
# (assim o "prisma generate" é cacheado se o schema não mudar).
COPY prisma ./prisma
RUN npx prisma generate

# Copia o restante do projeto (src, tsconfig, etc.)
COPY . .

# Documentação: o servidor escuta nessa porta dentro do container.
EXPOSE 3333

# Comando default: o docker-compose vai sobrescrever para rodar
# "prisma db push" e o seed antes de iniciar o servidor.
CMD ["npm", "run", "dev"]
