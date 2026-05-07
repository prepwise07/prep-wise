const { GoogleGenAI } = require("@google/genai");
try { new GoogleGenAI(); } catch(e) { console.log("Google:", e.message); }
