#!/bin/sh

# Default to local
DEPLOY_MODE=${DEPLOY_MODE:-local}
PUBLIC_CONFIG_PATH="/app/frontend/public/config.js"

echo "Starting Frontend in DEPLOY_MODE: ${DEPLOY_MODE}"

# 1. IP Detection Logic
if [ "$DEPLOY_MODE" = "line" ]; then
    if [ -z "$PUBLIC_IP" ]; then
        echo "Auto-detecting public IP..."
        PUBLIC_IP=$(wget -qO- https://api.ipify.org)
    fi
    DETECTED_URL="http://${PUBLIC_IP}"
    API_URL="${DETECTED_URL}:8080/api/v1"

elif [ "$DEPLOY_MODE" = "network" ]; then
    echo "Auto-detecting network IP..."
    NETWORK_IP=$(hostname -i 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}')
    if [ -z "$NETWORK_IP" ]; then
         NETWORK_IP=$(ip route get 1 | awk '{print $7;exit}')
    fi
    DETECTED_URL="http://${NETWORK_IP}"
    API_URL="${DETECTED_URL}:8080/api/v1"

else
    # Default to localhost
    DETECTED_URL="http://localhost"
    API_URL="${DETECTED_URL}:8080/api/v1"
fi

# 2. Write Client-Side Config (config.js)
echo "Generating ${PUBLIC_CONFIG_PATH} with API_URL=${API_URL}"
echo "window.ENV = {" > "$PUBLIC_CONFIG_PATH"
echo "  API_URL: \"${API_URL}\"" >> "$PUBLIC_CONFIG_PATH"
echo "};" >> "$PUBLIC_CONFIG_PATH"

# 3. Set Server-Side Environment (NEXTAUTH_URL)
# If NEXTAUTH_URL is already set (e.g. from .env), keep it. Otherwise default to DETECTED_URL
if [ -z "$NEXTAUTH_URL" ]; then
    export NEXTAUTH_URL="${DETECTED_URL}"
    echo "Auto-configured NEXTAUTH_URL=${NEXTAUTH_URL}"
else
    echo "Using provided NEXTAUTH_URL=${NEXTAUTH_URL}"
fi

# 4. Start Application
echo "Starting Next.js server..."
exec node server.js
