FROM oven/bun:latest

# 1. Set working directory
WORKDIR /app

# 2. Copy code
COPY . .

# 3. Define arguments for Coolify to pass
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# 4. Install dependencies
RUN bun install

# 5. THE FORCE-FEED: Pass keys directly into the build command
# This is the most reliable way to ensure Vite "bakes" them
RUN VITE_SUPABASE_URL=${VITE_SUPABASE_URL} \
    VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY} \
    bun run build

# 6. Install server
RUN bun add -g serve

EXPOSE 3000

# 7. Start the server
CMD ["sh", "-c", "if [ -d 'dist/client' ]; then serve -s dist/client -l 3000; else serve -s dist -l 3000; fi"]
