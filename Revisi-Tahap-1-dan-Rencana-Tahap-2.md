# Revisi Tahap 1 dan Rencana Tahap 2 - Kanasari Store

## Ringkasan Revisi Tahap 1

Dokumen ini merangkum revisi UI/UX terakhir pada prototype Kanasari Store serta daftar pekerjaan yang perlu dilanjutkan pada Tahap 2, yaitu implementasi backend, API, integrasi payment gateway, webhook logistik, dan automasi komisi affiliate.

## Revisi yang Sudah Dikerjakan

### 1. Responsiveness Mobile dan Desktop

- Memperbaiki layout agar lebih konsisten di berbagai ukuran layar mobile dan desktop.
- Menyesuaikan ukuran font mobile agar tetap terbaca tanpa membuat elemen terpotong.
- Memperbaiki beberapa elemen dashboard yang sebelumnya terpotong di bagian bawah saat viewport mobile.
- Menyesuaikan ukuran tombol dan card yang terlalu besar pada dashboard admin dan affiliate.
- Memastikan beberapa section tidak menimbulkan horizontal overflow.

### 2. Font dan Navbar

- Menjaga font utama tetap sesuai desain yang sedang digunakan.
- Memperbaiki inkonsistensi font pada navbar dan halaman checkout.
- Memperbaiki penggunaan logo navbar agar memakai `assets/img/logo.png`.
- Membesarkan logo untuk mobile sesuai permintaan sebelumnya.

### 3. Halaman Beranda

- Menambahkan konsep agar hero image dan copywriting beranda dapat diedit dari dashboard admin.
- Merapikan section CTA WhatsApp **Dapatkan Penawaran Eksklusif** agar layout desktop tidak berantakan.
- Menghilangkan ruang kosong putih di area tombol **Gabung Channel WhatsApp**.
- Menambahkan floating WhatsApp di website sebagai pengganti konsep in-website chat.

### 4. Checkout

- Memperbaiki flow login customer agar setelah login tidak diminta login ulang saat membuka keranjang atau checkout.
- Memperbaiki layout metode pembayaran pada versi mobile agar tidak menyisakan ruang kosong kanan yang berlebihan.
- Menjaga auto-fill data customer demo tetap berjalan tanpa menampilkan teks status tambahan.

### 5. Dashboard Admin

- Mengarahkan card **Total Pendapatan** langsung ke menu **Laporan** tab **Laporan Penjualan**.
- Menghapus shortcut **Chat Pembeli**.
- Menghapus metrik **Respon chat**.
- Mengganti metrik kesehatan toko menjadi **Kecepatan proses**.
- Mengganti shortcut terkait chat menjadi fitur yang lebih relevan, yaitu **Ulasan Produk**.
- Menjaga dashboard admin tetap mendekati kebutuhan seller dashboard seperti Shopee, namun disesuaikan dengan scope Kanasari Store.

### 6. Dashboard Affiliate

- Menampilkan semua produk affiliate aktif yang relevan.
- Mengecilkan card produk agar lebih compact dan nyaman dilihat di desktop maupun mobile.
- Menambahkan menu baru **Produk Affiliate**.
- Menambahkan tab **Discover** dan **Manage** seperti pola dashboard TikTok Affiliate, namun disesuaikan agar relevan dengan Kanasari Store.
- Menambahkan fitur search product di dashboard affiliate.
- Menambahkan section **Product ranking** untuk menampilkan produk top selling.
- Menambahkan daftar produk yang bisa dibagikan oleh affiliate, lengkap dengan harga, komisi, estimasi komisi, dan stok.
- Menambahkan tab **Manage** untuk melihat produk yang sedang dipromosikan affiliate, beserta klik, order, dan total komisi.
- Menambahkan popup share produk bergaya bottom sheet, berisi preview produk, estimasi komisi per penjualan, stok, kontak cepat, dan channel share.
- Mengecilkan gambar produk pada hasil search agar tidak terlalu besar.

### 7. Floating WhatsApp

- Menambahkan tombol floating WhatsApp pada halaman website publik.
- Menambahkan tombol WhatsApp statis pada halaman login/register yang tidak memuat script utama.
- Mengarahkan komunikasi customer ke WhatsApp, bukan ke fitur chat internal website.

## Catatan Scope Tahap 1

Tahap 1 saat ini berfokus pada:

- UI halaman customer.
- UI dashboard admin.
- UI dashboard affiliate.
- Struktur database awal.
- Simulasi flow login, checkout, affiliate, payout, dan laporan.
- Placeholder integrasi API yang akan dilanjutkan di Tahap 2.

Fitur yang tampil pada Tahap 1 masih berupa prototype/demo. Data belum berasal dari database dinamis dan belum terhubung ke API eksternal.

## Yang Perlu Dilakukan pada Tahap 2

### 1. Setup Backend Laravel

- Membuat project Laravel final atau memigrasikan prototype HTML ke Blade/Livewire/Inertia sesuai pilihan implementasi.
- Menyiapkan struktur route untuk customer, affiliate, admin, checkout, order, payout, dan laporan.
- Menyiapkan middleware role untuk `customer`, `affiliate`, dan `admin`.
- Menyiapkan autentikasi dan session yang konsisten untuk semua aktor.
- Mengubah data dummy menjadi data dari database.

### 2. Implementasi Database Final

Tabel utama yang perlu disiapkan atau disempurnakan:

- `users`
- `customers`
- `affiliates`
- `admin_users` atau role-based users
- `products`
- `product_categories`
- `product_images`
- `carts`
- `orders`
- `order_items`
- `payments`
- `shipments`
- `shipping_logs`
- `affiliate_links`
- `affiliate_clicks`
- `affiliate_conversions`
- `affiliate_commissions`
- `commission_payouts`
- `withdrawal_accounts`
- `refunds`
- `complaints`
- `store_settings`
- `homepage_contents`
- `webhook_logs`

### 3. Customer Flow

- Register dan login customer real.
- Manajemen cart berbasis database/session.
- Checkout real dengan validasi alamat dan pilihan ekspedisi.
- Order history customer.
- Detail pesanan dan status pengiriman.
- Notifikasi via WhatsApp atau email jika diperlukan.

### 4. Affiliate Flow

- Register dan login affiliate real.
- Approval affiliate oleh admin jika dibutuhkan.
- Dashboard affiliate berdasarkan data asli.
- Generator link affiliate unik per produk.
- Search dan discover produk dari database.
- Manage produk yang sedang dipromosikan.
- Tracking klik affiliate berbasis cookie atau referral token.
- Attribution order ke affiliate berdasarkan cookie/referral code.
- Perhitungan komisi berdasarkan produk, campaign, dan status order.
- Status komisi: `pending`, `eligible`, `available`, `paid`, `cancelled`.

### 5. Cookie Tracking Affiliate

- Menyimpan referral code dari URL affiliate ke cookie browser customer.
- Menentukan masa aktif cookie, misalnya 7-30 hari sesuai kebijakan toko.
- Mencatat klik ke tabel `affiliate_clicks`.
- Menghubungkan checkout/order ke affiliate jika cookie masih valid.
- Mencegah self-referral jika affiliate membeli dari link sendiri.

### 6. Payment Gateway Xendit

- Integrasi Xendit untuk pembayaran customer.
- Membuat invoice atau payment request saat checkout.
- Menyimpan status payment di database.
- Menerima webhook payment dari Xendit.
- Memvalidasi signature/token webhook.
- Mengupdate order menjadi paid setelah payment sukses.
- Menangani payment expired, failed, dan cancelled.

### 7. Split Payout / Disbursement Affiliate

- Menyimpan rekening bank/e-wallet affiliate.
- Verifikasi rekening affiliate jika API mendukung.
- Menahan komisi terlebih dahulu dalam status pending.
- Mengubah komisi menjadi eligible setelah order delivered dan masa tenggang selesai.
- Menjalankan payout massal atau individual via Xendit Disbursement/XenPlatform sesuai skema akun client.
- Menyimpan response payout dan status pencairan.
- Menangani payout failed dan retry payout.

### 8. Integrasi Logistik

- Memilih provider logistik: Biteship, Shipper, Plugin Ongkos Kirim, atau provider lain.
- Menghitung ongkir saat checkout berdasarkan alamat customer.
- Membuat shipment/order pengiriman jika provider mendukung.
- Menyimpan nomor resi dan kurir.
- Menerima webhook status pengiriman.
- Mengupdate shipment status seperti `picked_up`, `in_transit`, `delivered`, dan `returned`.
- Menentukan trigger ketika status menjadi **Delivered / Barang Diterima**.

### 9. Masa Tenggang Anti-Retur

- Membuat konfigurasi masa tenggang toko, misalnya 2-3 hari setelah delivered.
- Saat paket delivered, sistem mencatat tanggal delivered.
- Komisi tetap ditahan sampai masa tenggang selesai.
- Jika ada komplain atau retur, komisi dibatalkan atau tetap pending sampai kasus selesai.
- Jika tidak ada komplain sampai masa tenggang selesai, komisi berubah menjadi available/eligible.

### 10. Retur dan Komplain

- Customer dapat membuat komplain/retur terhadap order.
- Admin dapat melihat, memproses, menerima, atau menolak komplain.
- Status komisi affiliate harus terhubung dengan status retur.
- Jika order diretur/refund, komisi affiliate tidak boleh dicairkan.

### 11. Dashboard Admin Tahap 2

- CRUD produk dan kategori.
- Upload gambar produk.
- Manajemen stok.
- Manajemen order dan status pengiriman.
- Cetak resi atau sinkron resi dari provider logistik.
- Manajemen affiliate.
- Approval affiliate dan rekening payout.
- Manajemen komisi dan payout.
- Laporan penjualan real.
- Laporan affiliate real.
- Editor konten beranda: hero image, judul, deskripsi, CTA.
- Pengaturan toko, payment gateway, logistik, dan masa tenggang retur.

### 12. Dashboard Affiliate Tahap 2

- Data dashboard dari database real.
- Search product real.
- Discover product dengan ranking berdasarkan penjualan, klik, dan komisi.
- Manage product yang dipromosikan.
- Generate affiliate link real.
- Copy link real.
- Share link ke WhatsApp atau channel lain.
- Statistik klik, order, konversi, pending commission, available commission, dan paid commission.
- Request tarik saldo.
- Riwayat payout.
- Pengaturan rekening/e-wallet.

### 13. Laporan dan Analytics

- Laporan penjualan berdasarkan tanggal.
- Laporan affiliate berdasarkan affiliate, produk, klik, order, dan komisi.
- Export CSV/Excel.
- Filter berdasarkan status order, status payout, kategori produk, dan periode.
- Dashboard ringkasan untuk admin.

### 14. Keamanan dan Validasi

- Validasi input semua form.
- CSRF protection.
- Middleware role dan permission.
- Rate limiting untuk webhook dan login.
- Signature verification untuk webhook Xendit dan logistik.
- Sanitasi file upload.
- Proteksi data rekening affiliate.
- Logging webhook dan payout untuk audit.

### 15. Testing

- Unit test perhitungan komisi.
- Feature test checkout.
- Feature test webhook payment.
- Feature test webhook delivered.
- Feature test masa tenggang anti-retur.
- Feature test payout affiliate.
- Test role access customer, affiliate, dan admin.
- Test responsive UI setelah migrasi ke Laravel.

## Catatan Akhir

Tahap 1 sudah cukup kuat sebagai prototype UI dan alur bisnis. Tahap 2 perlu difokuskan pada backend yang stabil, terutama payment, webhook, tracking affiliate, perhitungan komisi, masa tenggang anti-retur, dan payout otomatis. Bagian paling krusial adalah memastikan komisi tidak pernah dicairkan sebelum order benar-benar delivered dan masa komplain/retur selesai.
