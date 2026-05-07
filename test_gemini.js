const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
    try {
        const genAI = new GoogleGenerativeAI("AIzaSyB1HjHqfaAoAySJolkQ76SN6mJ-rbNtI5g");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("hi");
        console.log("✅ Gemini 1.5 Flash: Valid -", result.response.text().substring(0, 50));
    } catch(e) {
        console.log("❌ Gemini 1.5 Flash error:", e.message.substring(0, 200));
    }
    try {
        const genAI = new GoogleGenerativeAI("AIzaSyB1HjHqfaAoAySJolkQ76SN6mJ-rbNtI5g");
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent("hi");
        console.log("✅ Gemini 2.5 Flash: Valid -", result.response.text().substring(0, 50));
    } catch(e) {
        console.log("❌ Gemini 2.5 Flash error:", e.message.substring(0, 200));
    }
}
testGemini();
