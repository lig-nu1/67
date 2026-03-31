const OPENROUTER_API_KEY = "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";

async function testFetch() {
  const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

  try {
    const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: 'Привет' }]
      })
    });
    console.log("Chat status:", res.status);
    console.log(await res.text());
  } catch (e) {
    console.error(e);
  }

  try {
    const res2 = await fetch(`${OPENROUTER_BASE}/embeddings`, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/text-embedding-3-small',
        input: 'Привет мир'
      })
    });
    console.log("Embed status:", res2.status);
    console.log(await res2.text());
  } catch (e) {
    console.error(e);
  }
}

testFetch();
