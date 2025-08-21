# docker build -t multivendor-backend .


# Use official Node.js LTS image
FROM node:20-alpine


# Set working directory inside container
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the project
COPY . .

# Build TypeScript
RUN npm run build

# Expose the app port (change if not 5000)
EXPOSE 5000

# Run the compiled app
CMD ["node", "dist/index.js"]
