FROM node:18-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json package-lock.json* ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Build da aplicação React
RUN npm run build

# Instalar serve para servir os arquivos estáticos
RUN npm install -g serve

# Expor porta
EXPOSE 3000

# Comando para servir os arquivos estáticos
CMD ["serve", "-s", "build", "-l", "3000"]
