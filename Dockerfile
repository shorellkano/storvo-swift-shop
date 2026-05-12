# 1. Use the fast Bun image
FROM oven/bun:latest AS build
WORKDIR /app

# 2. Copy your code
COPY . .

# 3. Install dependencies
RUN bun install

# 4. Build the project
RUN bun run build

# 5. Deployment Stage
FROM oven/bun:latest
WORKDIR /app

# Install the 'serve' tool
RUN bun add -g serve

# Copy only the built files (Look for 'dist' or 'dist/client')
COPY --from=build /app/dist ./dist

EXPOSE 3000

# Start the server
CMD ["serve", "-s", "dist", "-l", "3000"]
