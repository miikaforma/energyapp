FROM node:22.22.0-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
ENV SKIP_ENV_VALIDATION=true
ENV DATABASE_URL="postgresql://user:password@localhost:5432/db"
COPY . .
RUN npm ci
RUN npx prisma generate
RUN npm run build

FROM node:22.22.0-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
EXPOSE 3001

ENTRYPOINT ["npm", "run", "start"]