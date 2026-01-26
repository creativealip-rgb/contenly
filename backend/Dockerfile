FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files from the backend directory
COPY backend/package*.json ./

RUN npm install

# Copy the rest of the backend code
COPY backend/ .

# Build the application
RUN npm run build

# Second stage for runtime
FROM node:20-alpine

WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
