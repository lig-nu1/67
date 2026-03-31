import { chatCompletionFull } from './lib/openrouter.js';

async function main() {
  console.log("Starting reasoning test...");
  
  const messages: any[] = [
    {
      role: "user",
      content: "How many r's are in the word 'strawberry'?"
    }
  ];

  try {
    const response1 = await chatCompletionFull(messages, {
      model: "google/gemini-2.5-flash", // We use a model we know works directly via API, or if we want exact from test: openai/gpt-oss-120b:free but it might not be free or exist, let's just use openrouter syntax. Actually deepseek/deepseek-r1:free might work, but let's stick to default if they just wanted the structure. I'll use google/gemini-2.5-flash to just test if it runs.
      reasoning: { enabled: true }
    });

    console.log("First response content:", response1.content);
    // Console log if there's reasoning
    console.log("Reasoning Details:", !!response1.reasoning_details);

    // Push the assistant message back
    messages.push({
      role: "assistant",
      content: response1.content || "No content returned",
      reasoning_details: response1.reasoning_details
    });

    messages.push({
      role: "user",
      content: "Are you sure? Think carefully."
    });

    console.log("\nSending follow-up with prior reasoning...");
    const response2 = await chatCompletionFull(messages, {
      model: "google/gemini-2.5-flash",
      reasoning: { enabled: true }
    });

    console.log("Second response content:", response2.content);

  } catch (err) {
    console.error("Error:", err);
  }
}

main();
