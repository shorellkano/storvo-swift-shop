FROM oven/bun:latest AS build

# --- ADD THESE TWO LINES ---
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
# ---------------------------

WORKDIR /app
COPY . .
RUN bun install
RUN bun run build
... (rest of the file)
