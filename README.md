# ChatbotFrontend

## Setup

To install the project dependencies, run the following commands:

```bash
# Navigate to the project folder
cd /chatbot-frontend

# Install the dependencies
npm install
```

## Running the application

To start the application locally, run the following command:

```bash
# Navigate to the project folder
cd /chatbot-frontend

# Start the application
npm start
```

Alternatively, to use Docker to run the app, run the following commands:

```bash
# Navigate to the project folder
cd /chatbot-frontend

# Build the application in the Docker container
docker compose build --no-cache

# Start the built application in the Docker container
docker compose up -d
```

**Note that you can run both the chatbot frontend application and the chatbot backend application in the same Docker network.  See docker-compose.yaml, nginx.conf, and environment.prod.ts.**

To stop the Docker container and the running application, run the following command:

```bash
docker compose down
```
