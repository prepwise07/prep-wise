import { NextRequest, NextResponse } from "next/server";
import { analyzeTextProfile } from "../../../lib/resumeParser";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const textStr = body.text;

        if (!textStr || textStr.trim().length === 0) {
            return NextResponse.json({ error: "No text provided" }, { status: 400 });
        }

        const profile = await analyzeTextProfile(textStr, "Manual Entry");

        return NextResponse.json(profile);
    } catch (error: any) {
        console.error("Error parsing manual resume text:", error);
        return NextResponse.json(
            { error: error.message || "Failed to parse manual resume text" },
            { status: 500 }
        );
    }
}
