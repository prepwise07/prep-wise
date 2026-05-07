import { NextRequest, NextResponse } from "next/server";
import { parseResume } from "../../../lib/resumeParser";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const mimeType = file.type;
        const filename = file.name;

        const profile = await parseResume(buffer, mimeType, filename);

        return NextResponse.json(profile);
    } catch (error: any) {
        console.error("Error parsing resume:", error);
        return NextResponse.json(
            { error: error.message || "Failed to parse resume" },
            { status: 500 }
        );
    }
}
