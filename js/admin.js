// Fungsi set harga emas
async function setHarga() {
  const harga = document.getElementById("hargaInput").value;
  const msg = document.getElementById("hargaMsg");

  if (!harga) {
    msg.textContent = "Masukkan harga terlebih dahulu.";
    msg.classList.replace("text-success", "text-danger");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/gold/set-harga", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ harga: parseInt(harga) }),
    });

    const data = await res.json();
    if (res.ok) {
      msg.textContent = "Harga berhasil disimpan!";
      msg.classList.replace("text-danger", "text-success");
      document.getElementById("hargaInput").value = "";
    } else {
      msg.textContent = data.message || "Gagal menyimpan harga.";
      msg.classList.replace("text-success", "text-danger");
    }
  } catch (err) {
    msg.textContent = "Terjadi kesalahan jaringan.";
    msg.classList.replace("text-success", "text-danger");
  }
}

// Fungsi untuk load transaksi dari API
async function loadTransaksi() {
  const tbody = document.getElementById("transaksiBody");
  tbody.innerHTML = `<tr><td colspan="8" class="text-center">Memuat data...</td></tr>`;

  try {
    const res = await fetch("http://localhost:5000/api/gold/transaksi", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const json = await res.json();
    const data = json.transactions || [];

    if (res.ok) {
      tbody.innerHTML = "";
      if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center">Belum ada transaksi.</td></tr>`;
        return;
      }

      data.forEach(trx => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td class="text-center">${trx.id}</td>
          <td class="text-center">${trx.transaction_type}</td>
          <td class="text-center">${trx.amount} gr</td>
          <td class="text-center">${formatRupiah(trx.total_price)}</td>
          <td class="text-center">${trx.status}</td>
          <td class="text-center">${trx.delivery_method || "-"}</td>
          <td>${trx.address || "-"}</td>
          <td class="text-center">
            ${trx.proof ? `<img src="/${trx.proof}" alt="Bukti" height="60" loading="lazy">` : "-"}
          </td>
          <td class="text-center">
            ${trx.status === "pending" ? `
              <button class="btn btn-success btn-sm me-1" onclick="approve(${trx.id})">✔️</button>
              <button class="btn btn-danger btn-sm" onclick="reject(${trx.id})">✖️</button>
            ` : "-"}
          </td>
        `;
        tbody.appendChild(row);
      });

      renderGrafik(data);
    } else {
      tbody.innerHTML = `<tr><td colspan="8" class="text-danger text-center">Gagal memuat data.</td></tr>`;
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-danger text-center">Terjadi kesalahan jaringan.</td></tr>`;
  }
}

// Format angka jadi Rupiah
function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(number);
}

// Approve transaksi
async function approve(id) {
  await fetch("http://localhost:5000/api/gold/approve", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({ id })
  });
  loadTransaksi();
}

// Reject transaksi
async function reject(id) {
  await fetch("http://localhost:5000/api/gold/reject", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({ id })
  });
  loadTransaksi();
}

// Grafik transaksi berdasarkan jenis (purchase/sale)
let chartInstance = null;

function renderGrafik(transactions) {
  const ctx = document.getElementById("grafikTransaksi").getContext("2d");

  const jenis = transactions.reduce((acc, trx) => {
    const type = trx.transaction_type || "lainnya";
    acc[type] = (acc[type] || 0) + parseFloat(trx.amount || 0);
    return acc;
  }, {});

  const labels = Object.keys(jenis);
  const data = Object.values(jenis);

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Total (gram)",
        data: data,
        backgroundColor: ["#007bff", "#ffc107"],
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Gram" }
        }
      }
    }
  });
}

// Jalankan saat halaman siap
document.addEventListener("DOMContentLoaded", loadTransaksi);
