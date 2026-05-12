FROM oven/bun:latest AS build

# Pass the keys from Coolify into the build
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

WORKDIR /app
COPY . .

# PHYSICAL INJECTION: This creates a real .env file inside the container
RUN echo "VITE_SUPABASE_URL=${VITE_SUPABASE_URL}" > .env && \
    echo "VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}" >> .env

RUN bun install
RUN bun run build

# Stage 2: Serving the files
FROM oven/bun:latest
WORKDIR /app
RUN bun add -g serve
COPY --from=build /app/dist ./dist
EXPOSE 3000

# Start server checking for sub-folders
CMD ["sh", "-c", "if [ -d 'dist/client' ]; then serve -s dist/client -l 3000; else serve -s dist -l 3000; fi"]
