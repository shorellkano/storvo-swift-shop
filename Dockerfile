# 1. Build
FROM oven/bun:latest AS build
WORKDIR /app
COPY . .
RUN bun install
RUN bun run build

# 2. Serve
FROM oven/bun:latest
WORKDIR /app
RUN bun add -g serve
COPY --from=build /app/dist ./dist

EXPOSE 3000

# This line checks if 'client' exists inside dist. If yes, it serves it.
CMD ["sh", "-c", "if [ -d 'dist/client' ]; then serve -s dist/client -l 3000; else serve -s dist -l 3000; fi"]
