FROM node:18-alpine as build

WORKDIR /app

# Accept build argument for API URL
ARG VITE_API_URL=/api

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Set environment variable for Vite build
ENV VITE_API_URL=$VITE_API_URL

# Build the application
RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
