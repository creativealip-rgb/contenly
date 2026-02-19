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

# Install Chromium and dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tell Puppeteer to skip downloading Chrome and use the system's chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/drizzle.config.ts ./

EXPOSE 3001

# Run db:push before starting the app (force to skip interactive prompts)
CMD npm run db:push -- --force && npm run start:prod
