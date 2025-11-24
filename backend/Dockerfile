# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=20.18.0

FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl bash python3 make g++ git

FROM base AS deps
COPY package*.json nx.json tsconfig.base.json jest.config.ts tsconfig*.json ./
COPY prisma ./prisma
RUN npm install --legacy-peer-deps

FROM deps AS builder
COPY . .
RUN npx prisma generate
RUN npx nx run-many --target=build --all

FROM node:${NODE_VERSION}-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./ 
COPY prisma ./prisma
EXPOSE 4000
CMD ["node", "dist/apps/api-gateway/main.js"]

