# 1. Build Phase
FROM oven/bun:latest AS build

# Pass keys from Coolify to Docker
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Make the keys available to the build command
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

WORKDIR /app
COPY . .
RUN bun install
RUN bun run build

# 2. Deployment Phase
FROM oven/bun:latest
WORKDIR /app

# Install the 'serve' tool globally
RUN bun add -g serve

# Copy the built files from the build stage
COPY --from=build /app/dist ./dist

EXPOSE 3000

# This command handles both TanStack Start and standard Vite paths
CMD ["sh", "-c", "if [ -d 'dist/client' ]; then serve -s dist/client -l 3000; else serve -s dist -l 3000; fi"]
