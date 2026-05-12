# 1. Build Phase
FROM oven/bun:latest AS build

# Pass keys from Coolify to Docker
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# THIS IS THE NEW PART: Make the keys available to the build command
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

WORKDIR /app
COPY . .
RUN bun install
RUN bun run build
...
