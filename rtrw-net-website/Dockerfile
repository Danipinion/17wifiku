# === STAGE 1: Dependencies ===
FROM node:20-alpine AS deps
#RUN echo "nameserver 8.8.8.8" > /etc/resolv.conf && apk add --no-cache libc6-compat openssl
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# === STAGE 2: Builder ===
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .


ARG NEXT_PUBLIC_API_KEY
ENV NEXT_PUBLIC_API_KEY=$NEXT_PUBLIC_API_KEY

ARG AUTH_SECRET
ENV AUTH_SECRET=$AUTH_SECRET

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

RUN npx prisma generate
RUN npm run build

# === STAGE 3: Production Runner ===
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl tzdata

ENV NODE_ENV=production
ENV TZ=Asia/Jakarta
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN mkdir -p public
COPY --from=builder /app/public ./public

# Copy hasil build standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]