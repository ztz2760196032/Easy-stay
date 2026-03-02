(async () => {
  try {
    const res = await fetch('http://localhost:3000/api/admin/hotels?status=pending', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const text = await res.text();
    console.log('STATUS', res.status);
    console.log(text);
  } catch (err) {
    console.error('ERR', err);
  }
})();
