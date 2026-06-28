# syntax=docker/dockerfile:1
FROM node:24-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# We disable telemetry
ENV NEXT_TELEMETRY_DISABLED=1
# Regenerate Payload types from the schema so payload-types.ts is never stale
RUN npm run generate:types || true
# NOTE: the admin importMap (src/app/(payload)/cms/importMap.js) is committed and
# must be kept in sync by hand when admin/plugin components change — `payload
# generate:importmap` is not run here because it requires a live DB/GCS init at
# build time. When adding an admin component, add its entry to importMap.js.
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
USER nextjs

ENV PORT=3000
EXPOSE $PORT

ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
