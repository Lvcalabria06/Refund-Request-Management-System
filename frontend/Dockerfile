# Image base com Node 20.19 (mesma versão do .nvmrc)
FROM node:20.19

# Pasta de trabalho dentro do container
WORKDIR /app

# Copia primeiro só os manifests para aproveitar cache de layers do Docker
COPY package*.json ./

# Instala dependências
RUN npm ci

# Copia o restante do projeto (src, vite.config.ts, tsconfig, etc.)
COPY . .

# Documentação: Vite roda na porta 5173 por padrão
EXPOSE 5173

# Vite por padrão escuta só em 127.0.0.1 (interno ao container).
# "--host 0.0.0.0" expõe em todas as interfaces para o navegador (host) acessar.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
