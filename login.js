document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorMessage = document.getElementById('error-message');
  errorMessage.textContent = '';

  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    // Simpan token dan role
    localStorage.setItem('token', data.token);

    // Decode role dari JWT payload
    const payload = JSON.parse(atob(data.token.split('.')[1]));
    const role = payload.role;

    // Redirect berdasarkan role
    if (role === 'admin') {
      window.location.href = 'admin.html';
    } else if (role === 'user') {
      window.location.href = 'user.html';
    } else {
      alert('Login berhasil, tapi role tidak dikenali');
    }

  } catch (error) {
    errorMessage.textContent = error.message;
  }
});
