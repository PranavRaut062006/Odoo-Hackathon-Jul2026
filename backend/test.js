async function test() {
  const res = await fetch('http://127.0.0.1:5000/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test',
      email: 'test@test.com',
      password: 'password123'
    })
  });
  const data = await res.json();
  console.log(data);
}
test();
