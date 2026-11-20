FROM node:20-bookworm-slim

# Install system dependencies including Nmap
RUN apt-get update && apt-get install -y --no-install-recommends \
    nmap \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency definition
COPY package*.json ./

# Install npm dependencies
RUN npm ci

# Copy all source files
COPY . .

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start", "--", "--hostname", "0.0.0.0"]
