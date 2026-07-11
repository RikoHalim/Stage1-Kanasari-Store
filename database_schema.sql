-- ==========================================================
-- SKEMA DATABASE E-COMMERCE & AFFILIATE KANASARI STORE
-- Versi: 2.0 — Diperbarui: 9 Juli 2026
-- Stack: MySQL 8.0+, Laravel 11
-- ==========================================================

-- ==========================================================
-- CATATAN PENTING BACKEND (DARI KLIEN):
-- Pengguna yang mendaftar melalui halaman afiliasi (affiliate-register)
-- harus diberikan role 'affiliate' dan dibuatkan record di tabel `affiliates`.
-- Pengguna yang mendaftar melalui halaman biasa diberikan role 'customer'.
-- Admin hanya dibuat melalui seeder atau panel admin (tidak lewat register publik).
-- ==========================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. TABEL PENGGUNA
-- ============================================================
CREATE TABLE users (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name                VARCHAR(255) NOT NULL,
    email               VARCHAR(255) NOT NULL UNIQUE,
    password            VARCHAR(255) NOT NULL,
    role                ENUM('admin', 'customer', 'affiliate') NOT NULL DEFAULT 'customer',
    email_verified_at   TIMESTAMP NULL DEFAULT NULL,
    remember_token      VARCHAR(100) NULL DEFAULT NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. TABEL PROFIL AFILIATOR
-- Terpisah dari users untuk menyimpan data spesifik afiliasi.
-- 1 user (role=affiliate) memiliki 1 record di tabel ini.
-- ============================================================
CREATE TABLE affiliates (
    id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id                 BIGINT UNSIGNED NOT NULL UNIQUE,
    affiliate_code          VARCHAR(50) NOT NULL UNIQUE,     -- Kode unik: AFF123
    status                  ENUM('pending', 'active', 'suspended', 'rejected') NOT NULL DEFAULT 'pending',
    commission_rate         DECIMAL(5, 2) NULL DEFAULT NULL, -- Override per-afiliator; NULL = pakai setting global
    -- Info Rekening Bank
    bank_name               VARCHAR(100) NULL DEFAULT NULL,
    bank_account_number     VARCHAR(50) NULL DEFAULT NULL,
    bank_account_name       VARCHAR(255) NULL DEFAULT NULL,
    -- Info E-Wallet (alternatif)
    ewallet_type            VARCHAR(50) NULL DEFAULT NULL,   -- OVO, DANA, GoPay
    ewallet_number          VARCHAR(50) NULL DEFAULT NULL,
    -- Statistik (cache, diperbarui oleh event)
    total_clicks            INT UNSIGNED NOT NULL DEFAULT 0,
    total_conversions       INT UNSIGNED NOT NULL DEFAULT 0,
    -- Catatan admin
    admin_notes             TEXT NULL DEFAULT NULL,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 3. TABEL KATEGORI PRODUK
-- ============================================================
CREATE TABLE categories (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    slug        VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NULL DEFAULT NULL,
    image       VARCHAR(500) NULL DEFAULT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 4. TABEL PRODUK
-- ============================================================
CREATE TABLE products (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id     BIGINT UNSIGNED NULL DEFAULT NULL,
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) NOT NULL UNIQUE,
    description     TEXT NULL DEFAULT NULL,
    price           DECIMAL(15, 2) NOT NULL,
    stock           INT NOT NULL DEFAULT 0,
    -- Dimensi untuk kalkulasi ongkir via Biteship (WAJIB)
    weight          DECIMAL(8, 2) NOT NULL DEFAULT 0,   -- dalam gram
    length          DECIMAL(8, 2) NULL DEFAULT NULL,    -- dalam cm
    width           DECIMAL(8, 2) NULL DEFAULT NULL,
    height          DECIMAL(8, 2) NULL DEFAULT NULL,
    -- Override komisi per produk; NULL = gunakan rate kategori atau global
    commission_rate DECIMAL(5, 2) NULL DEFAULT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- ============================================================
-- 5. TABEL GAMBAR PRODUK
-- Mendukung multi-gambar per produk.
-- ============================================================
CREATE TABLE product_images (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id  BIGINT UNSIGNED NOT NULL,
    image_path  VARCHAR(500) NOT NULL,
    is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order  INT NOT NULL DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================================
-- 6. TABEL LOG KLIK AFILIASI
-- Mencatat setiap klik pada tautan afiliasi.
-- ============================================================
CREATE TABLE affiliate_clicks (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    affiliate_id    BIGINT UNSIGNED NOT NULL,
    product_id      BIGINT UNSIGNED NULL DEFAULT NULL,       -- Produk yang diklik (nullable)
    ip_address      VARCHAR(45) NOT NULL,                    -- IPv4 atau IPv6
    user_agent      TEXT NULL DEFAULT NULL,
    clicked_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    converted       BOOLEAN NOT NULL DEFAULT FALSE,          -- TRUE jika klik berujung transaksi
    order_id        BIGINT UNSIGNED NULL DEFAULT NULL,       -- Diisi saat konversi terjadi
    FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    -- order_id FK ditambahkan setelah tabel orders dibuat (lihat CONSTRAINT di bawah)
    INDEX idx_affiliate_id (affiliate_id),
    INDEX idx_clicked_at (clicked_at)
);

-- ============================================================
-- 7. TABEL PESANAN (ORDERS)
-- ============================================================
CREATE TABLE orders (
    id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_number            VARCHAR(50) NOT NULL UNIQUE,     -- Nomor invoice: INV-20260001
    customer_id             BIGINT UNSIGNED NOT NULL,        -- User yang membeli
    affiliate_id            BIGINT UNSIGNED NULL DEFAULT NULL, -- Afiliator yang membawa customer
    affiliate_click_id      BIGINT UNSIGNED NULL DEFAULT NULL, -- Audit trail klik mana yang konversi

    -- Status pesanan (urutan alur normal)
    status                  ENUM(
                                'pending_payment',  -- Menunggu pembayaran
                                'paid',             -- Sudah dibayar, menunggu diproses
                                'processing',       -- Sedang dikemas
                                'shipped',          -- Sudah dikirim
                                'delivered',        -- Sudah diterima customer
                                'completed',        -- Selesai (periode komplain habis)
                                'cancelled',        -- Dibatalkan
                                'returned'          -- Diretur
                            ) NOT NULL DEFAULT 'pending_payment',

    -- Nilai transaksi
    subtotal                DECIMAL(15, 2) NOT NULL,         -- Total harga produk
    shipping_cost           DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_amount            DECIMAL(15, 2) NOT NULL,         -- subtotal + shipping_cost

    -- Snapshot alamat pengiriman saat checkout (penting: harga/alamat bisa berubah)
    shipping_name           VARCHAR(255) NOT NULL,
    shipping_phone          VARCHAR(20) NOT NULL,
    shipping_address        TEXT NOT NULL,
    shipping_city           VARCHAR(255) NOT NULL,
    shipping_province       VARCHAR(255) NOT NULL,
    shipping_postal_code    VARCHAR(10) NOT NULL,

    -- Info kurir (dari Biteship)
    courier_code            VARCHAR(50) NULL DEFAULT NULL,   -- jne, jnt, sicepat
    courier_service         VARCHAR(100) NULL DEFAULT NULL,  -- REG, OKE, YES
    tracking_number         VARCHAR(100) NULL DEFAULT NULL,  -- Nomor resi
    biteship_order_id       VARCHAR(255) NULL DEFAULT NULL,  -- ID order di Biteship

    -- Info pembayaran (dari Xendit)
    xendit_invoice_id       VARCHAR(255) NULL DEFAULT NULL,
    xendit_invoice_url      VARCHAR(500) NULL DEFAULT NULL,
    payment_method          VARCHAR(100) NULL DEFAULT NULL,  -- BANK_TRANSFER, QRIS, dll
    payment_status          ENUM('pending', 'paid', 'failed', 'expired') NOT NULL DEFAULT 'pending',

    -- Timestamps penting untuk logika bisnis
    paid_at                 TIMESTAMP NULL DEFAULT NULL,
    shipped_at              TIMESTAMP NULL DEFAULT NULL,
    delivered_at            TIMESTAMP NULL DEFAULT NULL,     -- PENTING: memicu timer komisi
    completed_at            TIMESTAMP NULL DEFAULT NULL,

    -- Komplain/Retur
    has_complaint           BOOLEAN NOT NULL DEFAULT FALSE,
    complaint_resolved_at   TIMESTAMP NULL DEFAULT NULL,

    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE SET NULL,
    FOREIGN KEY (affiliate_click_id) REFERENCES affiliate_clicks(id) ON DELETE SET NULL,
    INDEX idx_customer_id (customer_id),
    INDEX idx_status (status),
    INDEX idx_order_number (order_number)
);

-- Tambahkan FK order_id ke affiliate_clicks setelah orders dibuat
ALTER TABLE affiliate_clicks
    ADD CONSTRAINT fk_affiliate_clicks_order
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;

-- ============================================================
-- 8. TABEL DETAIL ITEM PESANAN
-- Snapshot produk saat checkout (nama, harga bisa berubah di masa depan)
-- ============================================================
CREATE TABLE order_items (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id            BIGINT UNSIGNED NOT NULL,
    product_id          BIGINT UNSIGNED NOT NULL,
    product_name        VARCHAR(255) NOT NULL,           -- Snapshot nama produk
    product_price       DECIMAL(15, 2) NOT NULL,         -- Snapshot harga saat pembelian
    quantity            INT NOT NULL DEFAULT 1,
    subtotal            DECIMAL(15, 2) NOT NULL,         -- product_price * quantity
    commission_rate     DECIMAL(5, 2) NOT NULL DEFAULT 0, -- Snapshot rate komisi saat transaksi
    commission_amount   DECIMAL(15, 2) NOT NULL DEFAULT 0, -- Nominal komisi untuk item ini
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================================
-- 9. TABEL KOMISI AFILIASI
-- Mencatat hak komisi afiliator per transaksi order.
-- ============================================================
CREATE TABLE affiliate_commissions (
    id                          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id                    BIGINT UNSIGNED NOT NULL,
    affiliate_id                BIGINT UNSIGNED NOT NULL,
    total_commission_amount     DECIMAL(15, 2) NOT NULL,

    -- Status mengikuti alur logika bisnis (pending period → disbursement)
    status                      ENUM(
                                    'pending_delivery',  -- Menunggu barang diterima
                                    'pending_release',   -- Barang diterima, dalam masa tenggang
                                    'approved',          -- Masa tenggang selesai, siap cair
                                    'cancelled',         -- Dibatalkan (retur/komplain)
                                    'disbursed'          -- Sudah dicairkan ke afiliator
                                ) NOT NULL DEFAULT 'pending_delivery',

    -- Informasi disbursement
    xendit_disbursement_id      VARCHAR(255) NULL DEFAULT NULL,
    release_scheduled_at        TIMESTAMP NULL DEFAULT NULL,  -- Dijadwalkan cair pada
    released_at                 TIMESTAMP NULL DEFAULT NULL,  -- Tanggal sebenarnya diproses
    disbursed_at                TIMESTAMP NULL DEFAULT NULL,  -- Tanggal berhasil cair

    -- Catatan
    notes                       TEXT NULL DEFAULT NULL,

    created_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE,
    INDEX idx_affiliate_id (affiliate_id),
    INDEX idx_status (status)
);

-- ============================================================
-- 10. TABEL DISBURSEMENT (PENCAIRAN DANA)
-- Satu disbursement bisa mencakup beberapa komisi dari afiliator yang sama.
-- ============================================================
CREATE TABLE disbursements (
    id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    affiliate_id            BIGINT UNSIGNED NOT NULL,
    xendit_disbursement_id  VARCHAR(255) UNIQUE NULL DEFAULT NULL,
    amount                  DECIMAL(15, 2) NOT NULL,
    -- Rekening tujuan (snapshot dari affiliates.bank_* saat diproses)
    bank_code               VARCHAR(50) NOT NULL,
    account_number          VARCHAR(50) NOT NULL,
    account_holder_name     VARCHAR(255) NOT NULL,
    status                  ENUM('pending', 'processing', 'success', 'failed') NOT NULL DEFAULT 'pending',
    failure_reason          TEXT NULL DEFAULT NULL,
    processed_at            TIMESTAMP NULL DEFAULT NULL,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE
);

-- ============================================================
-- 11. TABEL PIVOT: DISBURSEMENT ↔ KOMISI
-- Menghubungkan satu disbursement ke banyak record komisi.
-- ============================================================
CREATE TABLE disbursement_commissions (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    disbursement_id     BIGINT UNSIGNED NOT NULL,
    commission_id       BIGINT UNSIGNED NOT NULL,
    UNIQUE KEY uq_disb_comm (disbursement_id, commission_id),
    FOREIGN KEY (disbursement_id) REFERENCES disbursements(id) ON DELETE CASCADE,
    FOREIGN KEY (commission_id) REFERENCES affiliate_commissions(id) ON DELETE CASCADE
);

-- ============================================================
-- 12. TABEL KOMPLAIN & RETUR
-- ============================================================
CREATE TABLE complaints (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id        BIGINT UNSIGNED NOT NULL,
    customer_id     BIGINT UNSIGNED NOT NULL,
    type            ENUM('complaint', 'return') NOT NULL DEFAULT 'complaint',
    reason          TEXT NOT NULL,
    status          ENUM('open', 'under_review', 'approved', 'rejected', 'closed') NOT NULL DEFAULT 'open',
    admin_notes     TEXT NULL DEFAULT NULL,
    resolved_at     TIMESTAMP NULL DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 13. TABEL KONFIGURASI / SETTINGS DINAMIS
-- Konfigurasi toko yang dapat diubah Admin tanpa deploy ulang.
-- ============================================================
CREATE TABLE settings (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    key         VARCHAR(255) NOT NULL UNIQUE,
    value       TEXT NULL,
    group       VARCHAR(100) NOT NULL DEFAULT 'general', -- general, payment, shipping, affiliate
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- DEFAULT SETTINGS (SEED DATA)
-- ============================================================
INSERT INTO settings (key, value, group) VALUES
    ('store_name',              'Kanasari Store',   'general'),
    ('store_email',             'hello@kanasari.com', 'general'),
    ('store_phone',             '08xxxxxxxxxx',     'general'),
    ('store_origin_city',       'Jakarta',          'shipping'),
    ('global_commission_rate',  '10',               'affiliate'),  -- 10%
    ('pending_period_days',     '3',                'affiliate'),  -- 3 hari setelah delivered
    ('cookie_duration_days',    '7',                'affiliate');  -- Cookie berlaku 7 hari

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================================
-- RINGKASAN RELASI:
-- users           → affiliates (1:1, jika role=affiliate)
-- users           → orders (1:many, sebagai customer)
-- categories      → products (1:many)
-- products        → product_images (1:many)
-- affiliates      → affiliate_clicks (1:many)
-- affiliates      → orders (1:many, sebagai sumber referral)
-- orders          → order_items (1:many)
-- orders          → affiliate_commissions (1:1 per order)
-- orders          → complaints (1:many)
-- affiliates      → affiliate_commissions (1:many)
-- affiliates      → disbursements (1:many)
-- disbursements   ↔ affiliate_commissions (many:many via disbursement_commissions)
-- ==========================================================
