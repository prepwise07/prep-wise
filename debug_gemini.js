const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/GEMINI_API_KEY\s*=\s*\"?([^\s\"]+)\"?/);

if (!match) {
    console.error("❌ GEMINI_API_KEY not found in .env.local");
    process.exit(1);
}

const key = match[1];
console.log(`🔍 Testing Gemini Key: ${key.substring(0, 5)}...${key.substring(key.length - 4)}`);

async function test() {
    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Say 'ready'");
        console.log("✅ SUCCESS! Gemini says:", result.response.text());
    } catch (e) {
        console.error("❌ FAILED!");
        console.error("Error Name:", e.constructor.name);
        console.error("Error Message:", e.message);
        if (e.response) {
            console.error("Response JSON:", JSON.stringify(e.response, null, 2));
        }
    }
}

test();
