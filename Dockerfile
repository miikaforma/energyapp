FROM node:22.15.0-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY . .
ENV SKIP_ENV_VALIDATION=true
RUN npx prisma generate
RUN npm run build

FROM node:22.15.0-alpine AS runner
WORKDIR /app

COPY --from=builder /app/package.json .
COPY --from=builder /app/package-lock.json .
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
ENTRYPOINT ["node", "server.js"]