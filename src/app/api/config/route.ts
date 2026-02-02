import { NextResponse } from 'next/server';

// This API route returns runtime configuration
// Environment variables are read at RUNTIME, not build time
// Use CLIENT_API_URL instead of NEXT_PUBLIC_API_URL so it can be changed after Docker build
export async function GET() {
    return NextResponse.json({
        API_URL: process.env.CLIENT_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
    });
}
