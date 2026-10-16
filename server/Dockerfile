# Base image with Node 20
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install build dependencies if needed
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev || npm install --omit=dev

# Copy application source code
COPY . .

# Create uploads and public directories
RUN mkdir -p uploads public

# Expose backend port
EXPOSE 5000

# Set default environment variables
ENV NODE_ENV=production \
    PORT=5000

# Start application
CMD ["node", "server.js"]
