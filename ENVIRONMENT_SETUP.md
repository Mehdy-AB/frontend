# Environment Setup Guide

## Required Environment Variables

To run this application properly, you need to create a `.env.local` file in the root directory with the following variables:

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-key-here

# Keycloak Configuration
KEYCLOAK_ID=dms-front-app
KEYCLOAK_SECRET=your-keycloak-secret-here
KEYCLOAK_ISSUER=http://localhost:9090/realms/AeB_Dms

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Setup Steps

1. **Create `.env.local` file** in the project root
2. **Copy the environment variables** above into the file
3. **Replace placeholder values** with your actual configuration:
   - `NEXTAUTH_SECRET`: Generate a random secret key
   - `KEYCLOAK_SECRET`: Get this from your Keycloak admin console
   - `KEYCLOAK_ISSUER`: Update if your Keycloak server is on a different URL
   - `NEXT_PUBLIC_API_URL`: Update if your backend API is on a different URL

## Keycloak Setup

Make sure your Keycloak server is running and configured with:
- Realm: `AeB_Dms`
- Client ID: `dms-front-app`
- Valid redirect URIs: `http://localhost:3001/api/auth/callback/keycloak`

## Backend API

Ensure your backend API is running on `http://localhost:8080` (or update the `NEXT_PUBLIC_API_URL` accordingly).

## Troubleshooting

If you encounter authentication errors:
1. Check that Keycloak server is running
2. Verify environment variables are set correctly
3. Ensure the Keycloak client is properly configured
4. Check browser console for detailed error messages

## Development Server

After setting up the environment variables, run:
```bash
npm run dev
```

The application will be available at `http://localhost:3001`
