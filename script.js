const MODEL_URL = "https://teachablemachine.withgoogle.com/models/ogposTrp2/";
let model, webcam, maxPredictions;

const IKON = { organik: "🍃", plastik: "🥤", kertas: "📄" };

async function init() {
  const tombol = document.getElementById("btn-start");
  const camBox = document.getElementById("cam-box");
  const status = document.getElementById("status");

  tombol.disabled = true;
  tombol.innerText = "Memuat model...";

  try {
    model = await tmImage.load(MODEL_URL + "model.json", MODEL_URL + "metadata.json");
    maxPredictions = model.getTotalClasses();

    // Konfigurasi kamera (facingMode environment untuk kamera belakang)
    webcam = new tmImage.Webcam(300, 300, false);
    await webcam.setup({ facingMode: "environment" });
    await webcam.play();
    window.requestAnimationFrame(loop);

    camBox.innerHTML = ""; // Hapus ikon placeholder
    camBox.appendChild(webcam.canvas);
    camBox.classList.add("aktif");

    tombol.innerText = "Kamera Aktif ✓";
    status.innerText = "Arahkan sampah ke kamera...";
  } catch (err) {
    console.error(err);
    tombol.disabled = false;
    tombol.innerText = "Coba Lagi";
    status.innerText = "Gagal mengakses kamera atau model";
  }
}

// Fungsi loop frame kamera
async function loop() {
  webcam.update();
  await predict();
  window.requestAnimationFrame(loop);
}

// Ubah nama kelas dari model menjadi jenis standar
function getJenis(namaKelas) {
  const kat = namaKelas.toLowerCase();
  if (kat.includes("organik")) return "organik";
  if (kat.includes("plastik")) return "plastik";
  if (kat.includes("kertas")) return "kertas";
  return "";
}

async function predict() {
  const prediction = await model.predict(webcam.canvas);
  let topClass = "", topScore = 0;
  for (let i = 0; i < maxPredictions; i++) {
    if (prediction[i].probability > topScore) {
      topScore = prediction[i].probability;
      topClass = prediction[i].className;
    }
  }

  const status = document.getElementById("status");

  // Validasi ambang keyakinan 75%
  if (topScore > 0.75) {
    const jenis = getJenis(topClass);
    status.innerText = (IKON[jenis] || "♻️") + " " + topClass + " (" + Math.round(topScore * 100) + "%)";
    status.dataset.kategori = jenis;
    tampilkanEdukasiIPAS(topClass);
  } else {
    // Objek hilang atau belum yakin: jangan biarkan hasil lama tertinggal
    status.innerText = "Mencari objek...";
    status.dataset.kategori = "";
    document.getElementById("edukasi").innerText = "";
  }
}

function tampilkanEdukasiIPAS(kategori) {
  const info = document.getElementById("edukasi");
  const jenis = getJenis(kategori);
  if (jenis === "organik") {
    info.innerText = "🍃 Buang ke komposter agar terurai jadi pupuk organik.";
  } else if (jenis === "plastik") {
    info.innerText = "🥤 Kosongkan cairan dan masukkan ke tempat daur ulang plastik.";
  } else if (jenis === "kertas") {
    info.innerText = "📄 Pastikan kertas tetap kering untuk memudahkan daur ulang.";
  } else {
    info.innerText = "";
  }
}