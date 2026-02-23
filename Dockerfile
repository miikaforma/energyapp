FROM node:22.22.0-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl

RUN ln -s /usr/lib/libssl.so.3 /lib/libssl.so.3

COPY package.json package-lock.json ./
COPY . .
RUN npm ci
ENV SKIP_ENV_VALIDATION=true
RUN npx prisma generate
RUN npm run build

FROM node:22.22.0-alpine AS runner
WORKDIR /app

COPY --from=builder /app/package.json .
COPY --from=builder /app/package-lock.json .
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
ENTRYPOINT ["node", "server.js"]