const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local manually
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([^#\s=]+)\s*=\s*(.*)$/);
    if (match) {
        let val = match[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.substring(1, val.length - 1);
        env[match[1]] = val;
    }
});

async function testKeys() {
    console.log("--- 🕵️ API Key Diagnostic Report ---");

    // 1. Supabase
    try {
        const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
        const { data, error } = await supabase.from('profiles').select('*').limit(1);
        if (error) throw error;
        console.log("✅ Supabase: Valid (URL & Key are connected)");
    } catch (e) {
        console.log("❌ Supabase: Invalid (" + e.message.substring(0, 60) + "...)");
    }

    // 2. Gemini
    try {
        const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        await model.generateContent("hi");
        console.log("✅ Gemini: Valid");
    } catch (e) {
        console.log("❌ Gemini: Invalid (" + e.message.substring(0, 60) + "...)");
    }

    // 3. Groq
    try {
        const groq = new Groq({ apiKey: env.GROQ_API_KEY });
        await groq.chat.completions.create({ messages: [{ role: 'user', content: 'hi' }], model: 'llama-3.3-70b-versatile' });
        console.log("✅ Groq: Valid");
    } catch (e) {
        console.log("❌ Groq: Invalid (" + e.message.substring(0, 60) + "...)");
    }

    // 4. OneCompiler
    try {
        const res = await fetch("https://onecompiler.com/api/v1/run", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-OneCompiler-Key": env.ONECOMPILER_API_KEY },
            body: JSON.stringify({ language: "javascript", files: [{ name: "index.js", content: "console.log('hi')" }] })
        });
        if (res.status === 200) console.log("✅ OneCompiler: Valid");
        else console.log("❌ OneCompiler: Invalid (Status " + res.status + ")");
    } catch (e) {
        console.log("❌ OneCompiler: Error (" + e.message + ")");
    }

    // 5. Vapi (Format Check)
    const vapiPublic = env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    const vapiPrivate = env.VAPI_PRIVATE_KEY;
    if (vapiPublic?.length > 20 && vapiPrivate?.length > 20) {
        console.log("✅ Vapi Keys: Format appears valid (UUID format)");
    } else {
        console.log("❌ Vapi Keys: Missing or too short");
    }
}

testKeys();
