import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");

    // Redirect to the correct callback path
    const targetUrl = new URL("/auth/callback", origin);
    if (code) {
        targetUrl.searchParams.set("code", code);
    }

    return NextResponse.redirect(targetUrl);
}
