const fs = require('fs');
const pdfParse = require('my-pdf-parse');

async function test() {
    try {
        const buffer = fs.readFileSync('valid_dummy.pdf');
        const data = await pdfParse(buffer);
        console.log("PDF parsed successfully. Characters:", data.text.length);
    } catch (e) {
        console.error("PDF Parse error:", e);
    }
}
test();
