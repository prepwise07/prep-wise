import { NextResponse } from "next/server";

// Usually with VAPI we can just use the public key client-side, 
// but if we want to mint a token securely:
export async function GET() {
    try {
        // For Vapi Web SDK, we can just return the public key if the user hasn't set up custom tokens.
        // If they have set up custom server-side tokens, this is where that logic would go.
        // For this low-code setup, we are providing the public key to the client from the env directly,
        // so this is a placeholder/helper route.

        return NextResponse.json({
            publicKey: process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || ""
        });
    } catch (error: any) {
        console.error("Error fetching VAPI token details:", error);
        return NextResponse.json(
            { error: error.message || "Failed" },
            { status: 500 }
        );
    }
}
