# Dataset

Katalog abstrak hasil kurasi manual. `catalog.json` memuat 2.300 record yang disalin dari `abstract-modelling/data/polinema-enriched/curated.jsonl` pada 18 November 2026, dengan nama field mengikuti format katalog UI.

Seluruh record dipertahankan, termasuk 9 record nonaktif. Status review dan teks abstrak mengikuti sumber tanpa perubahan. Salinan ini merupakan snapshot, bukan sinkronisasi otomatis; sumber kurasi tetap berada di proyek `abstract-modelling`.

Filter, daftar, dan detail menggunakan tiga status tampilan dengan urutan prioritas:
- **Abstrak tersedia**: `reviewStatus: approved`, mengungguli kategori ekstraksi.
- **Abstrak belum tersedia**: belum disetujui dan `category: unavailable`, termasuk record nonaktif.
- **Dikecualikan**: record lainnya yang belum disetujui. Pada snapshot saat ini, semuanya `extracted` + `pending` + nonaktif.

Jumlah saat ini: 1.628 tersedia, 668 belum tersedia, dan 4 dikecualikan. Pengelompokan UI tidak mengaktifkan kembali record nonaktif untuk modelling.

Status tampilan tidak mengubah `category`, `reviewStatus`, atau `isActive` di `catalog.json`. Kategori ekstraksi dan status review lama tidak lagi ditampilkan sebagai badge.

## Menjalankan lokal

```bash
python3 -m http.server 8000
```

Buka `http://localhost:8000`. Tes pencarian dan filter:

```bash
npm test
```

Filter status berada di atas tabel, tanpa sidebar. Warna status konsisten pada filter, tabel, dan detail: hijau untuk **Abstrak tersedia**, amber untuk **Abstrak belum tersedia**, dan merah untuk **Dikecualikan**; label teks tetap ditampilkan.

Klik baris atau tombol **Detail** untuk membuka record di tab yang sama. Status di dalam tabel hanya label berwarna, bukan kontrol yang dapat diklik. Gunakan filter status di atas tabel, yang dapat digabungkan dengan pencarian; kembali dari detail mempertahankan filter dan pencarian selama halaman tidak dimuat ulang. Tombol filter dan **Detail** juga dapat dioperasikan melalui keyboard.

URL memakai parameter `?id=...` agar detail bisa dibuka langsung dan tombol kembali bekerja. Logo dan favicon menggunakan aset yang sama, `public/dataset.svg`.

Halaman meminta mesin pencari untuk tidak mengindeksnya. Ini bukan perlindungan akses: jika diterbitkan ke GitHub Pages, situs tetap dapat dibuka siapa pun yang tahu alamatnya.
