# 1. Build Phase
FROM oven/bun:latest AS build
WORKDIR /app
COPY . .

# HARDCODED KEYS - Physically forced into the builder's brain
ENV VITE_SUPABASE_URL="https://iwpduihkkzijilcdwhyf.supabase.co"
ENV VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3cGR1aWhra3ppamlsY2R3aHlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NjU2NTUsImV4cCI6MjA5MDE0MTY1NX0.VjjI2KU2XXScSab5wDq9GosCco7Y6EVghlxDaRonSAo"

RUN bun install
RUN bun run build

# 2. Deployment Phase
FROM oven/bun:latest
WORKDIR /app
RUN bun add -g serve
# Copy the built files
COPY --from=build /app/dist ./dist
EXPOSE 3000

# This command walks into the room and starts the site
CMD ["sh", "-c", "if [ -d 'dist/client' ]; then serve -s dist/client -l 3000; else serve -s dist -l 3000; fi"]
