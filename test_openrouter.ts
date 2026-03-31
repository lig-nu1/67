import { chatCompletion, getEmbedding } from './lib/openrouter.js';


async function main() {
  try {
    console.log("Testing chat completion...");
    const answer = await chatCompletion([
      { role: 'user', content: 'Привет, как дела?' }
    ], { model: 'google/gemini-2.5-flash' });
    console.log("Chat Answer:", answer);
  } catch (err) {
    console.error("Chat error:", err);
  }

  try {
    console.log("Testing embeddings...");
    const embed = await getEmbedding("Тестовая строка");
    console.log("Embedding length:", embed.length);
  } catch (err) {
    console.error("Embedding error:", err);
  }
}

main();
