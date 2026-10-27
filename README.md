# Rumah 10902

Studio rumah dengan **interior sebagai tampilan awal**: 10 render ruang dari Blender, navigasi LT1/LT2, gambar utuh, dan cutaway 3D dengan perabot. Struktur P01 tetap tersedia sebagai tampilan tambahan. Tidak memakai gambar AI atau model rumah pengganti.

## Menjalankan

Node.js 22.19+ (atau versi 22 LTS lebih baru).

```sh
npm ci
npm run dev
```

```sh
npm run verify:assets  # identitas objek, hash Blender, satuan/bounds GLB
npm run build          # TypeScript strict + production build
npm test               # Playwright, termasuk pengujian WebGL
```

Pada Windows, tes memakai Google Chrome terpasang. Pada Linux/Mac, instal Chromium terlebih dahulu: `npx playwright install chromium`.

## Interior sebagai fokus utama

- Pilih lantai dan ruang: keluarga, makan, dapur, foyer, tamu, master, kamar 2, kamar belakang dan dua kamar mandi.
- Render asli ditampilkan besar, dengan thumbnail navigasi dan tombol Perbesar untuk gambar utuh.
- Model 3D lazy-loaded dari RevCB: 305 objek LT1 dan 254 objek LT2. Orbit/zoom, tampak atas, dan pemilihan objek dengan ukuran envelope.
- Interior acuan masih 2,80 m antarlantai. **Belum diselaraskan dengan struktur P01 3,40 m.** Label ini selalu ditampilkan; mode interior dan struktur tidak ditumpuk seolah sudah cocok. Render keluarga/makan/foyer/master dari RevBS, detail lain dari RevBY, kamar 2 revisi RevCB; sumber setiap gambar tersimpan di `public/images/interior/sources.json`.
- Unduh sumber native `public/documents/rumah-10902-interior-revcb.blend`. Ekspor ulang: `blender -b --python scripts/export-interior.py`. Hash dan jumlah objek diperiksa lewat `npm run verify:assets`.

## Interaksi struktur

- Orbit, pan, zoom dan empat preset kamera; framing menyesuaikan layar.
- Mode struktur, tulangan ilustratif dan gabungan; sembilan lapisan terpisah.
- Isolasi lantai, potongan visual X/Y/Z, pemilihan objek/properti dan fokus elemen.
- Pengukuran dua titik permukaan model, snapshot PNG dan tautan tampilan.
- Dak atap beton merupakan **opsi**, dengan konfirmasi tambahan beban sebelum ditampilkan.
- Penjelajah lembar SVG, data volume/allowance, unduhan PDF A3 dan Blender native.
- Keyboard, dialog native, reduced motion, tata letak sentuh dan fallback saat WebGL/aset gagal.

## Status data - penting

**STUDI KOORDINASI / BUKAN GAMBAR KONSTRUKSI / BUKAN AS-BUILT.**

LT2 +3,40 m; atas balok atap +6,80 m. Sepuluh posisi kolom, 20 segmen model. Tulangan adalah pola visual, **bukan** desain diameter, jumlah, sengkang, kait, penyaluran atau BBS. Ukuran pondasi belum dirancang; tidak ada data tanah yang dikarang. Pengukuran layar bukan survei lapangan atau sertifikasi clearance. Potongan tidak menampilkan cap beton analitis.

Jumlah besi berasal dari allowance per volume model, bukan batang yang terlihat. Dak atap opsi tidak masuk kuantitas default. Lihat PDF untuk batas asumsi lengkap. Model ini hanya rangka/pelat/tangga, bukan klaim bahwa seluruh arsitektur/interior telah dikoordinasikan ulang dengan struktur.

## Aset dan ekspor

`public/documents/rumah-10902-p01.blend` adalah sumber. `scripts/export-models.py` berjalan dalam Blender 4.5 LTS:

```sh
blender -b --python scripts/export-models.py
npm run verify:assets
```

Model dipisah menjadi `structure.glb`, `reinforcement.glb`, `roof-option.glb`. Beton awal ~55 KB; tulangan ~1,76 MB dimuat saat diminta. GLB memakai meter, dengan pemetaan sumbu Blender `(X,Y,Z)` ke glTF `(X,Z,-Y)`. Metadata `elementId` dan `layer` dipertahankan. Font Manrope dan IBM Plex Mono dilayani lokal dari paket Fontsource.

`public/models/manifest.json` menyimpan sumber SHA-256, identitas objek dan bounds Blender. Tidak ada API key atau backend yang diperlukan.

## Build dan hosting

Keluaran statis ada pada `dist/`. Untuk host pada subpath (misalnya GitHub Pages `/rumah/`), atur `VITE_BASE_PATH=/rumah/` ketika build. Untuk root domain gunakan default `/`.

Contoh Linux/macOS:

```sh
VITE_BASE_PATH=/rumah/ npm run build
```

CI memverifikasi aset, build dan tes browser. **Workflow ini tidak men-deploy atau mengaktifkan GitHub Pages.** Sukses push/CI tidak berarti website sudah dipublikasikan di domain.

## Teknologi

React + TypeScript + Vite, Three.js/OrbitControls/GLTFLoader, Playwright. React dan Three.js menggunakan lisensi upstream masing-masing; font mengikuti lisensi Fontsource/SIL yang disertakan paketnya. Aset rumah adalah data proyek; tidak diberi lisensi ulang secara otomatis.
