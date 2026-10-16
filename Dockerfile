# Multi-stage Dockerfile for Unified IntelliMeet Full-Stack Deployment
# Builds both React frontend and Node.js backend into a single container

# Stage 1: Build the Vite React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client

# Copy frontend dependency declarations
COPY client/package*.json ./
RUN npm ci || npm install

# Copy frontend source files and build
COPY client/ ./
RUN npm run build

# Stage 2: Build and run the Express Production Server
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache python3 make g++

# Copy backend dependencies and install
COPY server/package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy backend source code
COPY server/ ./

# Copy built frontend assets from Stage 1 into server public directory
COPY --from=frontend-builder /app/client/dist ./public

# Ensure uploads and public directories exist
RUN mkdir -p uploads public

EXPOSE 5000

ENV NODE_ENV=production \
    PORT=5000

CMD ["node", "server.js"]
