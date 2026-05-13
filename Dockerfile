FROM oven/bun:latest

# 1. Set working directory
WORKDIR /app

# 2. Define the keys as arguments (These come from Coolify)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# 3. FORCE these into the environment so Bun sees them during the build
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# 4. Copy code and install
COPY . .
RUN bun install

# 5. Build (The keys are now physically present in the build environment)
RUN bun run build

# 6. Setup the server
RUN bun add -g serve
EXPOSE 3000

# 7. Start the server (Checking for sub-folders)
CMD ["sh", "-c", "if [ -d 'dist/client' ]; then serve -s dist/client -l 3000; else serve -s dist -l 3000; fi"]
