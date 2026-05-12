# 1. Build Phase
FROM oven/bun:latest AS build

# Pass Supabase keys into the build process
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

WORKDIR /app
COPY . .
RUN bun install
RUN bun run build

# 2. Deployment Phase
FROM oven/bun:latest
WORKDIR /app

# Install the 'serve' tool to show the website
RUN bun add -g serve

# Copy the build results from the previous step
COPY --from=build /app/dist ./dist

EXPOSE 3000

# This command checks if 'dist/client' exists. 
# If it does, it serves that. If not, it serves 'dist'. 
CMD ["sh", "-c", "if [ -d 'dist/client' ]; then serve -s dist/client -l 3000; else serve -s dist -l 3000; fi"]
