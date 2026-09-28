FROM node:22-alpine

WORKDIR /app

# Installation des dépendances
COPY package.json package-lock.json ./
RUN npm ci

# Code de l'application
COPY . .

# Build Next.js
RUN npm run build

ENV NODE_ENV=production

EXPOSE 3000

# Render fournit PORT automatiquement
CMD ["sh", "-c", "npm start -- -H 0.0.0.0 -p ${PORT:-3000}"]
