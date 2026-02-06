# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache wget git python3 make g++

COPY package*.json ./
RUN npm ci

# Copy source and env files
COPY . .
COPY .env.production ./.env

# Build with production env
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy built files and runtime config
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env ./

# Install and configure serve
RUN npm install -g serve

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

# Set image name
LABEL org.opencontainers.image.name="cricket_admin"

# Serve with custom config to handle client-side routing
CMD ["serve", "-s", "dist", "-l", "3030", "--single"]
