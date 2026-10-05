const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/api/generate";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

const SUPPORTED_LANGUAGES = [
  "JavaScript",
  "Python",
  "HTML",
  "CSS",
  "Java",
  "C++",
];

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/generate", async (req, res) => {
  try {
    const { prompt, language } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const selectedLanguage = language && SUPPORTED_LANGUAGES.includes(language)
      ? language
      : "JavaScript";

    const systemInstruction = `
You are an expert programmer.
Return only code in ${selectedLanguage}.
Do not add explanations.
Do not wrap code in markdown fences.
Use valid syntax only.
`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const ollamaResponse = await fetch(OLLAMA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          prompt: `${systemInstruction}\n\nUser request: ${prompt}`,
          stream: false,
        }),
        signal: controller.signal,
      });

      if (!ollamaResponse.ok) {
        throw new Error(`Ollama API error: ${ollamaResponse.status}`);
      }

      const data = await ollamaResponse.json();
      const output = data.response || "No code generated.";

      return res.json({ code: output.trim() });
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("Ollama request timed out");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error:
        error.message ||
        "Failed to generate code. Make sure Ollama is running and the model is installed.",
    });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
