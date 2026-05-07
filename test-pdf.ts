import { parseResume } from "./lib/resumeParser";
import { readFileSync } from "fs";

async function test() {
    try {
        const buffer = readFileSync("./dummy_resume.pdf");
        const profile = await parseResume(buffer, "application/pdf", "dummy_resume.pdf");
        console.log("SUCCESS:", JSON.stringify(profile, null, 2));
    } catch (e) {
        console.error("FAILURE:", e);
    }
}

test();
