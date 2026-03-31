async function main() {
  try {
    console.log("Testing POST /api/ai/interview on locahost:3000 ...");
    const response = await fetch('http://localhost:3000/api/ai/interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Привет, я хочу создать задачу.' }]
      })
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response DATA:', data);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

main();
