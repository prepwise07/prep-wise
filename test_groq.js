const Groq = require("groq-sdk");
try { new Groq({ apiKey: undefined }); } catch(e) { console.log(e.message); }
