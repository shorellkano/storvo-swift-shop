FROM oven/bun:latest

WORKDIR /app
COPY . .

# Define the inputs for Coolify
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

RUN bun install

# THE SLEDGEHAMMER: Injecting keys directly into the build command
RUN VITE_SUPABASE_URL=${VITE_SUPABASE_URL} \
    VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY} \
    bun run build

RUN bun add -g serve
EXPOSE 3000

CMD ["sh", "-c", "if [ -d 'dist/client' ]; then serve -s dist/client -l 3000; else serve -s dist -l 3000; fi"]
