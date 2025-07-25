// Variabel global untuk harga emas

const token = localStorage.getItem("token");
if (!token) {
  alert("Anda belum login. Silakan login terlebih dahulu.");
  window.location.href = "index.html";
}
let currentHargaEmas = 0;

// Decode JWT sederhana
function parseJwt(token) {
  try {
    const base = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(atob(base).split('').map(c =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
  } catch {
    return null;
  }
}

// Saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) return location.replace('index.html');

  const payload = parseJwt(token);
  if (!payload || payload.role !== 'user') {
    localStorage.removeItem('token');
    return location.replace('index.html');
  }

  document.getElementById('userEmail').textContent = payload.email || 'Pengguna';
// Toggle navbar (mobile)

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  location.replace('index.html');
});
  fetchPrice();
  setupTabToggle();
  setupAddressToggle();
  setupHargaCalculation();
  fetchProdukPerhiasan();         // isi dropdown
  setupAddressTogglePerhiasan(); // toggle alamat COD
  setupHargaPerhiasanCalculation(); // hitung total otomatis
fetchDaftarProdukTabel()
});



// Ambil harga emas dari API
async function fetchPrice() {
  const el = document.getElementById('goldPrice');
  el.textContent = 'Memuat...';

  try {
    const res = await fetch('http://localhost:5000/api/gold/hargaanntam');
    const data = await res.json();

    if (res.ok && data.harga) {
      currentHargaEmas = parseFloat(data.harga); // Simpan harga global
      el.textContent = `Rp ${currentHargaEmas.toLocaleString()} / gram`;
    } else {
      el.textContent = data.message || 'Gagal memuat';
    }
  } catch {
    el.textContent = 'Error jaringan';
  }
}

// Tombol refresh harga
document.getElementById('refreshPrice').addEventListener('click', fetchPrice);

// Tab beli / jual
function setupTabToggle() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const tab = btn.getAttribute('data-tab');
      document.getElementById(tab + 'Form').classList.add('active');
    });
  });
}

// Toggle alamat jika COD
function setupAddressToggle() {
  const deliverySelects = [
    { selectId: 'deliveryBeli', formId: 'beliForm' },
    { selectId: 'deliveryJual', formId: 'jualForm' }
  ];

  deliverySelects.forEach(({ selectId, formId }) => {
    const select = document.getElementById(selectId);
    const form = document.getElementById(formId);
    const addressField = form.querySelector('.address-field');

    function toggleAddressField() {
      if (select.value === 'cod') {
        addressField.style.display = 'block';
      } else {
        addressField.style.display = 'none';
        addressField.value = '';
      }
    }

    toggleAddressField(); // Jalankan saat awal
    select.addEventListener('change', toggleAddressField);
  });
}

// Hitung total harga berdasarkan input gram
function setupHargaCalculation() {
  const beliInput = document.getElementById('jumlahBeli');
  const jualInput = document.getElementById('jumlahJual');
  const beliTotal = document.getElementById('totalHargaBeli');
  const jualTotal = document.getElementById('totalHargaJual');

  function updateHarga(input, output) {
    const gram = parseFloat(input.value);
    if (!isNaN(gram) && currentHargaEmas) {
      const total = gram * currentHargaEmas;
      output.textContent = `Total: Rp ${total.toLocaleString()}`;
    } else {
      output.textContent = '';
    }
  }

  if (beliInput && beliTotal) {
    beliInput.addEventListener('input', () => updateHarga(beliInput, beliTotal));
  }

  if (jualInput && jualTotal) {
    jualInput.addEventListener('input', () => updateHarga(jualInput, jualTotal));
  }
}

// Submit form beli emas
document.getElementById('beliForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const responseEl = document.getElementById('beliResponse');

  responseEl.textContent = 'Mengirim...';

  try {
    const res = await fetch('http://localhost:5000/api/gold/beli', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });

    const data = await res.json();
    responseEl.textContent = res.ok ? 'Berhasil dikirim!' : data.message || 'Gagal mengirim';
    if (res.ok) form.reset();
  } catch (err) {
    responseEl.textContent = 'Gagal mengirim data';
  }
});

// Submit form jual emas
document.getElementById('jualForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const responseEl = document.getElementById('jualResponse');

  responseEl.textContent = 'Mengirim...';

  try {
    const res = await fetch('http://localhost:5000/api/gold/jual', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });

    const data = await res.json();
    responseEl.textContent = res.ok ? 'Berhasil dikirim!' : data.message || 'Gagal mengirim';
    if (res.ok) form.reset();
  } catch (err) {
    responseEl.textContent = 'Gagal mengirim data';
  }
});


// Fetch produk perhiasan ke dropdown saat halaman dimuat
async function fetchProdukPerhiasan() {
  const select = document.getElementById('produkSelect');
  select.innerHTML = '<option value="">Memuat produk...</option>';

  try {
    const res = await fetch('http://localhost:5000/api/perhiasan/produk', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    // Tambahkan console log untuk debug response
    console.log('Status:', res.status); // Cek status code
    
    const data = await res.json();
    console.log('Response JSON:', data); // Tampilkan isi respons dari server

    if (res.ok && Array.isArray(data.products)) {
      select.innerHTML = '<option value="">-- Pilih Produk --</option>';
      data.products.forEach(prod => {
        const option = document.createElement('option');
        option.value = prod.id;
        option.textContent = `${prod.name} - Rp ${parseInt(prod.price).toLocaleString()}`;
        select.appendChild(option);
      });
    } else {
      console.warn('Data produk tidak valid:', data);
      select.innerHTML = '<option value="">Gagal memuat produk</option>';
    }
  } catch (err) {
    console.error('Terjadi kesalahan saat fetch:', err);
    select.innerHTML = '<option value="">Error jaringan</option>';
  }
}


// Submit form jual perhiasan
document.getElementById('jualPerhiasanForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const responseEl = document.getElementById('perhiasanResponse');

  responseEl.textContent = 'Mengirim...';

  try {
    const res = await fetch('http://localhost:5000/api/perhiasan/jual', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });

    const data = await res.json();
    responseEl.textContent = res.ok ? 'Berhasil dikirim!' : data.message || 'Gagal mengirim';
    if (res.ok) form.reset();
  } catch {
    responseEl.textContent = 'Gagal mengirim data';
  }
});

// Tambahkan juga delivery toggle untuk form jual perhiasan
function setupAddressTogglePerhiasan() {
  const select = document.getElementById('deliveryPerhiasan');
  const addressField = document.querySelector('#jualPerhiasanForm .address-field');

  function toggle() {
    if (select.value === 'cod') {
      addressField.style.display = 'block';
    } else {
      addressField.style.display = 'none';
      addressField.value = '';
    }
  }

  toggle(); // saat pertama load
  select.addEventListener('change', toggle);
}

function setupHargaPerhiasanCalculation() {
  const select = document.getElementById('produkSelect');
  const qtyInput = document.getElementById('jumlahPerhiasan');
  const totalEl = document.getElementById('totalHargaPerhiasan');

  let produkMap = new Map();

  // Fetch dan simpan data produk ke dalam Map untuk akses cepat harga
  fetch('http://localhost:5000/api/perhiasan/produk', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data.products)) {
        data.products.forEach(prod => {
          produkMap.set(prod.id.toString(), parseFloat(prod.price));
        });

        // Kalkulasi saat produk atau jumlah berubah
        function updateTotal() {
          const id = select.value;
          const qty = parseInt(qtyInput.value);
          const price = produkMap.get(id) || 0;

          if (id && !isNaN(qty)) {
            const total = qty * price;
            totalEl.textContent = `Total: Rp ${total.toLocaleString()}`;
          } else {
            totalEl.textContent = '';
          }
        }

        select.addEventListener('change', updateTotal);
        qtyInput.addEventListener('input', updateTotal);
      }
    })
    .catch(() => {
      totalEl.textContent = 'Gagal menghitung total';
    });
}

async function fetchDaftarProdukTabel() {
  const tbody = document.getElementById('produk-body');
  tbody.innerHTML = '<tr><td colspan="5" class="text-center">Memuat data...</td></tr>';

  try {
    const res = await fetch('http://localhost:5000/api/perhiasan/produk', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    const data = await res.json();

    if (res.ok && Array.isArray(data.products)) {
      if (data.products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Tidak ada produk tersedia</td></tr>';
        return;
      }

      tbody.innerHTML = ''; // kosongkan isi sebelum menambahkan baris
      data.products.forEach(prod => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${prod.id}</td>
          <td>${prod.name}</td>
          <td>${prod.description}</td>
          <td>Rp ${parseInt(prod.price).toLocaleString('id-ID')}</td>
          <td>${new Date(prod.created_at).toLocaleDateString('id-ID')}</td>
        `;
        tbody.appendChild(tr);
      });
    } else {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">Gagal memuat data produk</td></tr>';
    }
  } catch (err) {
    console.error(err);
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Terjadi kesalahan jaringan</td></tr>';
  }
}
