# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.14.2 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/
COPY packages/domain/package.json packages/domain/
COPY apps/brain/package.json apps/brain/

RUN pnpm install --frozen-lockfile

COPY packages/shared packages/shared
COPY packages/db packages/db
COPY packages/domain packages/domain
COPY apps/brain apps/brain

RUN pnpm --filter "@socialbud/brain..." run build

RUN pnpm prune --prod

# Run stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app .

EXPOSE 8080

CMD ["node", "apps/brain/dist/index.js"]
