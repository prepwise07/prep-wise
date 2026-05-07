import fs from 'fs';

async function go() {
    try {
        const formData = new FormData();
        const buf = fs.readFileSync("test-ats.js");
        formData.append("file", new Blob([buf], { type: "application/pdf" }), "resume-test.pdf");

        const res = await fetch("http://localhost:3000/api/parse-resume", {
            method: "POST",
            body: formData
        });

        console.log("HTTP", res.status);
        if (!res.ok) {
            console.log(await res.text());
            return;
        }

        const data = await res.json();
        console.log("RESPONSE ATS:", !!data.atsData);
        if (!data.atsData) console.log(data);
    } catch (e) {
        console.log("ERROR:", e.message);
    }
}
go();
