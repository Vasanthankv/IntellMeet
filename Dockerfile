# Base image with Node 20
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install build dependencies if needed
RUN apk add --no-cache python3 make g++

# Copy backend package files
COPY server/package*.json ./

# Install production dependencies
RUN npm ci --omit=dev || npm install --omit=dev

# Copy server application source code
COPY server/ ./

# Create uploads directory
RUN mkdir -p uploads

# Expose backend port
EXPOSE 5000

# Set default environment variables
ENV NODE_ENV=production \
    PORT=5000

# Start application
CMD ["node", "server.js"]
