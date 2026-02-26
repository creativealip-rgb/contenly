FROM node:20-alpine AS builder

# Install Python and build tools for canvas
RUN apk add --no-cache python3 make g++ pkgconfig pixman-dev cairo-dev pango-dev libjpeg-turbo-dev giflib-dev

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

# Install Chromium, wget, and dependencies for Puppeteer + canvas runtime deps
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    wget \
    cairo \
    pango \
    libjpeg-turbo \
    giflib

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
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/start.sh ./

# Make startup script executable
RUN chmod +x start.sh

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["./start.sh"]
