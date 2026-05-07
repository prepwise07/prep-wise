import { NextRequest, NextResponse } from "next/server";

const PYTHON_SERVICE = "http://localhost:5001";

export async function GET() {
    try {
        const res = await fetch(`${PYTHON_SERVICE}/health`, { cache: "no-store" });
        const data = await res.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ status: "offline", deepface_available: false }, { status: 503 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // ── Route: summarise session ──────────────────────────────────
        if (body.action === "summarise") {
            const res = await fetch(`${PYTHON_SERVICE}/summarise-session`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ frames: body.frames }),
                signal: AbortSignal.timeout(15_000),
            });
            const data = await res.json();
            return NextResponse.json(data);
        }

        // ── Route: analyse single frame ───────────────────────────────
        if (!body.frame) {
            return NextResponse.json({ error: "Missing 'frame' field" }, { status: 400 });
        }

        const res = await fetch(`${PYTHON_SERVICE}/analyse-frame`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ frame: body.frame }),
            signal: AbortSignal.timeout(8_000),
        });

        const data = await res.json();
        return NextResponse.json(data);

    } catch (err: any) {
        // If the Python service is not running, return a graceful offline response
        const isOffline =
            err.message?.includes("ECONNREFUSED") ||
            err.message?.includes("fetch failed") ||
            err.name === "TimeoutError";

        if (isOffline) {
            return NextResponse.json({
                face_detected: false,
                dominant_emotion: "unknown",
                confidence_score: 0,
                eye_contact: false,
                feedback_text: "Visual analysis offline — start analysis_service.py to enable face detection.",
                service_offline: true,
            });
        }

        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
