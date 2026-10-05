const generateBtn = document.getElementById("generateBtn");
const copyBtn = document.getElementById("copyBtn");
const promptInput = document.getElementById("prompt");
const languageInput = document.getElementById("language");
const output = document.getElementById("output");
const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");

generateBtn.addEventListener("click", async () => {
  const prompt = promptInput.value.trim();
  const language = languageInput.value;

  if (!prompt) {
    showError("Please enter a prompt first.");
    return;
  }

  loading.classList.remove("hidden");
  errorBox.classList.add("hidden");
  output.textContent = "Generating...";
  generateBtn.disabled = true;

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        language,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Something went wrong");
    }

    output.textContent = data.code || "No code returned.";
  } catch (err) {
    showError(err.message || "Failed to generate code.");
    output.textContent = "No output.";
  } finally {
    loading.classList.add("hidden");
    generateBtn.disabled = false;
  }
});

copyBtn.addEventListener("click", async () => {
  const text = output.textContent;
  if (!text || text === "Your generated code will appear here..." || text === "No output.") {
    showError("There is no code to copy.");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = "Copied!";
    setTimeout(() => (copyBtn.textContent = "Copy"), 1200);
  } catch {
    showError("Copy failed. Please copy manually.");
  }
});

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}
