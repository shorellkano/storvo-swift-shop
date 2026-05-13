FROM oven/bun:latest AS build

# 1. Set working directory
WORKDIR /app

# 2. Define arguments (These come from Coolify)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# 3. PHYSICAL INJECTION: Create a real .env file inside the build folder
# This ensures Vite finds the keys on the "disk" during build
RUN echo "VITE_SUPABASE_URL=$VITE_SUPABASE_URL" > .env && \
    echo "VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY" >> .env

# 4. Copy code and build
COPY . .
RUN bun install
RUN bun run build

# 5. Deployment Stage
FROM oven/bun:latest
WORKDIR /app
RUN bun add -g serve
COPY --from=build /app/dist ./dist
EXPOSE 3000

# Start server checking for sub-folders
CMD ["sh", "-c", "if [ -d 'dist/client' ]; then serve -s dist/client -l 3000; else serve -s dist -l 3000; fi"]
