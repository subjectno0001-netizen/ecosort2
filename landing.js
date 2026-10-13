// ===== Intro: tulisan EcoSort AI di atas latar bertema =====
(function jalankanIntro() {
  const intro = document.getElementById("intro");
  const html = document.documentElement;
  if (!intro) return;

  // Animasi dimatikan / dilewati: buang saja
  if (!html.classList.contains("intro-aktif")) {
    intro.remove();
    return;
  }

  const TAHAN = 2800;    // lama tulisan tampil sebelum menghilang (ms)
  const TAMBAHAN = 1800; // perpanjangan tiap kali pengguna berinteraksi (ms)
  let timer = null;
  let selesai = false;

  function akhiri() {
    if (selesai) return;
    selesai = true;
    intro.classList.add("selesai");        // tulisan memudar
    html.classList.remove("intro-aktif");  // halaman bisa digulir, judul mulai animasi
    setTimeout(() => intro.remove(), 900);
  }

  function jadwalkan(ms) {
    clearTimeout(timer);
    timer = setTimeout(akhiri, ms);
  }

  jadwalkan(TAHAN);

  // Klik tulisan = ganti tema
  const teks = intro.querySelector(".intro-teks");
  if (teks) teks.addEventListener("click", () => temaBerikutnya());

  // Setiap interaksi (tulisan, titik tema, chibi) memperpanjang waktu tampil
  document.addEventListener("click", () => {
    if (!selesai) jadwalkan(TAMBAHAN);
  });
})();

// ===== Pengaturan =====
// Gambar chibi untuk tiap tema
const GAMBAR_FLOATER = {
  merah: "gojochibi.png",
  hijau: "violetgrd.png",
  pink:  "https://freshtango.us/cdn/shop/products/ai-hoshino-chibi-acrylic-keychain-966905_900x.png?v=1689496546",
};
const TEMA = ["merah", "hijau", "pink"];

// Muat ketiga gambar chibi dari awal supaya pergantian langsung tampil
Object.values(GAMBAR_FLOATER).forEach((u) => {
  const pra = new Image();
  pra.src = u;
});

// Elemen chibi (diisi nanti, harus dideklarasikan sebelum setTema dipanggil)
let floaterEl = null;

function ubahFloater(nama) {
  if (floaterEl) floaterEl.src = GAMBAR_FLOATER[nama];
}

// ===== Latar: buat 3 lapisan gambar sekaligus (jadi ikut dimuat dari awal) =====
const layer = document.querySelector(".bg-layer");

if (layer) {
  TEMA.forEach((nama) => {
    const d = document.createElement("div");
    d.className = "bg-img bg-" + nama;
    layer.appendChild(d);
  });
}

// ===== Tema =====
function temaAwal() {
  try {
    const p = new URLSearchParams(location.search).get("tema");
    if (TEMA.includes(p)) return p;
  } catch (e) {}
  try {
    const s = localStorage.getItem("tema");
    if (TEMA.includes(s)) return s;
  } catch (e) {}
  return "merah";
}

function setTema(nama) {
  if (!TEMA.includes(nama)) nama = "merah";
  if (document.documentElement.dataset.tema === nama && document.body.dataset.temaSiap) return;

  document.documentElement.dataset.tema = nama;
  document.body.dataset.temaSiap = "1";

  // Ganti gambar chibi sesuai tema
  ubahFloater(nama);

  // Simpan di localStorage
  try { localStorage.setItem("tema", nama); } catch (e) {}

  // Catat di URL halaman ini
  try {
    const url = new URL(location.href);
    url.searchParams.set("tema", nama);
    history.replaceState(null, "", url);
  } catch (e) {}

  // Bawa tema ke halaman lain lewat link (berguna saat file dibuka tanpa server)
  document.querySelectorAll('a[href*=".html"]').forEach((a) => {
    const [tanpaHash, hash] = a.getAttribute("href").split("#");
    const dasar = tanpaHash.split("?")[0];
    a.setAttribute("href", dasar + "?tema=" + nama + (hash ? "#" + hash : ""));
  });

  // Tandai titik warna yang aktif
  document.querySelectorAll(".tema-dot").forEach((d) => {
    d.classList.toggle("aktif", d.dataset.tema === nama);
  });
}

function temaBerikutnya() {
  const sekarang = TEMA.indexOf(document.documentElement.dataset.tema);
  setTema(TEMA[(sekarang + 1) % TEMA.length]);
}

document.querySelectorAll(".tema-dot").forEach((d) => {
  d.addEventListener("click", () => setTema(d.dataset.tema));
});

setTema(temaAwal());

// Saat kembali lewat tombol Back (halaman dari cache), ambil tema terbaru
window.addEventListener("pageshow", (e) => {
  if (!e.persisted) return;
  try {
    const s = localStorage.getItem("tema");
    if (TEMA.includes(s)) setTema(s);
  } catch (err) {}
});

// ===== Gambar latar bergerak: mouse, sentuhan jari, dan kemiringan HP =====
if (layer) {
  const KEKUATAN = 60;      // harus lebih kecil dari inset di CSS (100)
  const KELEMBUTAN = 0.08;
  const GYRO = true;        // false = matikan gerak saat HP dimiringkan

  let tX = 0, tY = 0, x = 0, y = 0;
  let berjalan = false;
  let terakhirSentuh = 0;

  function gerakLatar() {
    x += (tX - x) * KELEMBUTAN;
    y += (tY - y) * KELEMBUTAN;
    layer.style.transform = `translate3d(${x}px, ${y}px, 0)`;

    // Berhenti sendiri kalau sudah sampai target (hemat baterai)
    if (Math.abs(tX - x) > 0.05 || Math.abs(tY - y) > 0.05) {
      requestAnimationFrame(gerakLatar);
    } else {
      berjalan = false;
    }
  }

  function arahkan(clientX, clientY) {
    tX = -((clientX / window.innerWidth) - 0.5) * 2 * KEKUATAN;
    tY = -((clientY / window.innerHeight) - 0.5) * 2 * KEKUATAN;
    if (!berjalan) {
      berjalan = true;
      requestAnimationFrame(gerakLatar);
    }
  }

  // Mouse (laptop/PC)
  document.addEventListener("mousemove", (e) => arahkan(e.clientX, e.clientY));

  // Sentuhan jari (HP/tablet): touchmove tetap jalan saat layar di-scroll
  function sentuh(e) {
    const t = e.touches[0];
    if (!t) return;
    terakhirSentuh = Date.now();
    arahkan(t.clientX, t.clientY);
  }
  document.addEventListener("touchstart", sentuh, { passive: true });
  document.addEventListener("touchmove", sentuh, { passive: true });

  // Kemiringan HP (Android; di iPhone butuh izin khusus jadi dilewati)
  if (GYRO && "DeviceOrientationEvent" in window) {
    window.addEventListener("deviceorientation", (e) => {
      if (e.gamma == null || e.beta == null) return;
      if (Date.now() - terakhirSentuh < 1500) return; // sentuhan lebih diutamakan

      const batas = (n) => Math.max(-30, Math.min(30, n)) / 30;
      const kiriKanan = batas(e.gamma);         // miring kiri-kanan
      const depanBelakang = batas(e.beta - 45); // anggap HP dipegang ~45°

      tX = -kiriKanan * KEKUATAN;
      tY = -depanBelakang * KEKUATAN;
      if (!berjalan) {
        berjalan = true;
        requestAnimationFrame(gerakLatar);
      }
    });
  }
}

// ===== Animasi scroll =====
// 1) Navbar jadi gelap setelah halaman digulir
const nav = document.querySelector(".nav");
if (nav) {
  const cekScroll = () => nav.classList.toggle("scrolled", window.scrollY > 20);
  window.addEventListener("scroll", cekScroll, { passive: true });
  cekScroll();
}

// 2) Kartu muncul pelan saat masuk layar
const targetReveal = document.querySelectorAll(".card");
if ("IntersectionObserver" in window && targetReveal.length) {
  const pengamat = new IntersectionObserver(
    (daftar) => {
      daftar.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("terlihat");
          pengamat.unobserve(en.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  targetReveal.forEach((el) => {
    el.classList.add("reveal");
    // muncul berurutan menurut posisi di dalam induknya
    const urutan = Array.from(el.parentElement.children).indexOf(el);
    el.style.setProperty("--delay", urutan * 0.12 + "s");
    pengamat.observe(el);
  });
}

// 3) Highlight menu navbar sesuai bagian yang sedang dilihat
const linkMenu = document.querySelectorAll('.nav-links a[href^="#"]');
const bagian = Array.from(linkMenu)
  .map((a) => document.querySelector(a.getAttribute("href")))
  .filter(Boolean);

let kunciMenu = null; // bagian yang baru dipilih lewat klik/tap

function tandaiMenu(id) {
  linkMenu.forEach((a) => {
    a.classList.toggle("aktif", a.getAttribute("href") === "#" + id);
  });
}

function perbaruiMenu() {
  if (!linkMenu.length) return;

  // Setelah menu ditekan, highlight tetap di menu itu sampai pengguna menggulung sendiri
  if (kunciMenu) {
    tandaiMenu(kunciMenu);
    return;
  }

  // Garis acuan: sedikit di bawah navbar
  const tinggiNav = nav ? nav.offsetHeight : 0;
  const garis = tinggiNav + window.innerHeight * 0.25;

  let aktif = null;
  bagian.forEach((s) => {
    if (s.getBoundingClientRect().top <= garis) aktif = s.id;
  });

  // Sudah mentok di bawah halaman: anggap bagian terakhir yang aktif
  const dasarHalaman =
    window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
  if (dasarHalaman && bagian.length) aktif = bagian[bagian.length - 1].id;

  tandaiMenu(aktif);
}

// Saat link menu (atau tombol "Lihat cara kerja") ditekan: kunci highlight ke tujuannya
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", () => {
    const id = a.getAttribute("href").slice(1);
    if (!id) return;
    const adaDiMenu = Array.from(linkMenu).some((m) => m.getAttribute("href") === "#" + id);
    if (adaDiMenu) {
      kunciMenu = id;
      tandaiMenu(id);
    }
  });
});

// Kunci dilepas saat pengguna menggulung halaman sendiri
function lepasKunci() {
  if (!kunciMenu) return;
  kunciMenu = null;
  perbaruiMenu();
}

window.addEventListener("wheel", lepasKunci, { passive: true });
window.addEventListener("touchmove", lepasKunci, { passive: true });
window.addEventListener("keydown", (e) => {
  if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key)) {
    lepasKunci();
  }
});
document.addEventListener("pointerdown", (e) => {
  // Menyeret scrollbar di desktop
  if (e.target === document.documentElement) lepasKunci();
});

let menungguFrame = false;
window.addEventListener(
  "scroll",
  () => {
    if (menungguFrame) return;
    menungguFrame = true;
    requestAnimationFrame(() => {
      perbaruiMenu();
      menungguFrame = false;
    });
  },
  { passive: true }
);
window.addEventListener("resize", perbaruiMenu);
perbaruiMenu();

// ===== Satu objek melayang (landing & scanner) =====
const wadah = document.getElementById("floaters");

if (wadah) {
  const UKURAN = window.innerWidth < 700 ? 46 : 60; // kecil agar tidak menghalangi layar
  const VMAX = 2.2;
  const VMIN = 0.5;
  const acak = (a, b) => a + Math.random() * (b - a);

  const el = new Image();
  el.className = "floater";
  el.alt = "Klik untuk ganti tema";
  el.title = "Klik untuk ganti tema";
  el.draggable = false;
  el.style.width = UKURAN + "px";

  // Kalau gambar tema gagal dimuat (misalnya diblokir situs asal), pakai gambar merah
  let sudahCadangan = false;
  el.addEventListener("error", () => {
    if (sudahCadangan) return;
    sudahCadangan = true;
    el.src = GAMBAR_FLOATER.merah;
  });

  floaterEl = el;
  el.src = GAMBAR_FLOATER[document.documentElement.dataset.tema] || GAMBAR_FLOATER.merah;
  wadah.appendChild(el);

  const o = {
    x: acak(0, Math.max(0, window.innerWidth - UKURAN)),
    y: acak(0, Math.max(0, window.innerHeight - UKURAN)),
    vx: acak(-1.5, 1.5),
    vy: acak(-1.5, 1.5),
    rot: acak(0, 360),
    vr: acak(-0.6, 0.6),
    skala: 1,
  };

  // Setiap diklik: ganti tema (dan gambar chibi), objek "pop" lalu terlempar acak
  el.addEventListener("click", () => {
    temaBerikutnya();
    o.skala = 1.5;
    o.vx = acak(-VMAX, VMAX) * 1.6;
    o.vy = acak(-VMAX, VMAX) * 1.6;
    o.vr = acak(-3, 3);
  });

  function gerakObjek() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const tinggi = el.offsetHeight || UKURAN;

    // Sesekali ubah arah sedikit agar gerakannya acak
    if (Math.random() < 0.02) {
      o.vx += acak(-0.4, 0.4);
      o.vy += acak(-0.4, 0.4);
    }

    // Batasi kecepatan (perlahan menurun setelah dilempar)
    const v = Math.hypot(o.vx, o.vy);
    if (v > VMAX) {
      o.vx *= 0.97;
      o.vy *= 0.97;
    } else if (v < VMIN) {
      o.vx = acak(-1.5, 1.5);
      o.vy = acak(-1.5, 1.5);
    }

    o.x += o.vx;
    o.y += o.vy;
    o.rot += o.vr;
    o.vr *= 0.995;
    if (Math.abs(o.vr) < 0.2) o.vr = acak(-0.6, 0.6);

    // Memantul di tepi layar
    if (o.x < 0)            { o.x = 0;            o.vx = Math.abs(o.vx); }
    if (o.x > W - UKURAN)   { o.x = W - UKURAN;   o.vx = -Math.abs(o.vx); }
    if (o.y < 0)            { o.y = 0;            o.vy = Math.abs(o.vy); }
    if (o.y > H - tinggi)   { o.y = H - tinggi;   o.vy = -Math.abs(o.vy); }

    o.skala += (1 - o.skala) * 0.1;

    el.style.transform =
      `translate(${o.x}px, ${o.y}px) rotate(${o.rot}deg) scale(${o.skala})`;

    requestAnimationFrame(gerakObjek);
  }

  gerakObjek();
}

// ===== Proteksi dasar anti-salin =====
const PROTEKSI = true; // ubah ke false saat kamu masih mengembangkan

if (PROTEKSI) {
  document.addEventListener("contextmenu", (e) => e.preventDefault());
  document.addEventListener("dragstart", (e) => e.preventDefault());
  document.addEventListener("copy", (e) => e.preventDefault());
  document.addEventListener("cut", (e) => e.preventDefault());

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && ["c", "x", "a", "s", "u"].includes(e.key.toLowerCase())) {
      e.preventDefault();
    }
  });
}