# Use Bun as the base image
FROM oven/bun:latest

# Set working directory
WORKDIR /server

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the app
COPY . .

# Expose the port your app runs on (Elysia default is 3000)
EXPOSE 3000

# Start the server
CMD ["bun", "run", "start"]
