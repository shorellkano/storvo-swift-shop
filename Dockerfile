# 1. Build Phase
FROM oven/bun:latest AS build

# --- ADD THESE TWO LINES HERE ---
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
# --------------------------------

WORKDIR /app
COPY . .
RUN bun install
RUN bun run build

# 2. Deployment Phase
FROM oven/bun:latest
WORKDIR /app
RUN bun add -g serve
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["sh", "-c", "if [ -d 'dist/client' ]; then serve -s dist/client -l 3000; else serve -s dist -l 3000; fi"]
