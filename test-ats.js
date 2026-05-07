const fs = require('fs');

async function go() {
    try {
        const res = await fetch("http://localhost:3000/api/parse-manual-resume", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: "Hello this is a test resume with dummy text and nothing else so it should fallback" })
        });
        const data = await res.json();
        console.log("RESPONSE DATA:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.log("ERROR:", e.message);
    }
}
go();
