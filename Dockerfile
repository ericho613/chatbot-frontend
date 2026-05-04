# Stage 1: Build the Angular application
# FROM node:20-alpine AS build

# WORKDIR /app

# # Copy package files first for better layer caching
# COPY package*.json ./

# # Install dependencies
# RUN npm ci

# # Copy the rest of the application source
# COPY . .

# # Build the Angular app for production
# RUN npm run build -- --configuration production

# # Stage 2: Serve the built app with nginx
# FROM nginx:1.27-alpine

# # Copy custom nginx config
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# # Copy Angular build output
# COPY --from=build /app/dist /usr/share/nginx/html

# EXPOSE 80

# CMD ["nginx", "-g", "daemon off;"]

# Stage 1: Build Angular app
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build Angular for production
RUN npm run build -- --configuration production

# Stage 2: Serve with nginx
FROM nginx:1.27-alpine

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy Angular build output
# IMPORTANT:
# Adjust this path if your Angular dist output is different.
# Common Angular 20 output is dist/<project-name>/browser

# if output is dist/chatbot-frontend, then use:
# COPY --from=build /app/dist/chatbot-frontend /usr/share/nginx/html

COPY --from=build /app/dist/chatbot-frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]