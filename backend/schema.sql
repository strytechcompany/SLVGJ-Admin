-- ============================================================
--  Jewelry Suite — shared SQLite schema
--  Used by Stock Entry, Billing, and Admin desktop apps.
--  All statements are guarded with IF NOT EXISTS so the file is
--  safe to run on every app startup.
-- ============================================================

PRAGMA foreign_keys = ON;

-- ============================================================
--  PRODUCTS  (merged Stock Entry purchase fields + Billing sale fields)
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    product_id      TEXT PRIMARY KEY,         -- INV-XXXXXXXX
    name            TEXT NOT NULL,
    barcode         TEXT NOT NULL UNIQUE,

    -- Weights
    gross_weight    REAL DEFAULT 0,           -- total physical weight (gold + stones)
    stone_weight    REAL DEFAULT 0,
    net_weight      REAL DEFAULT 0,           -- gross - stone (computed server-side)
    purity          TEXT,

    -- Purchase side (Stock Entry)
    buying_cost     REAL,
    bore_rate       REAL,
    supplier_name   TEXT,

    -- Sale side (Billing)
    price_per_gram  REAL,
    making_charge   REAL,
    stock           INTEGER DEFAULT 1,

    -- Lifecycle
    status          TEXT NOT NULL DEFAULT 'in_stock',  -- in_stock | sold | deleted
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sold_at         TIMESTAMP,
    deleted_at      TIMESTAMP,

    -- Staff tracking
    added_by        TEXT                              -- staff name who created this entry
);

CREATE INDEX IF NOT EXISTS idx_products_status     ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_supplier   ON products(supplier_name);
CREATE INDEX IF NOT EXISTS idx_products_created    ON products(created_at);

-- ============================================================
--  PENDING ACTIONS  (owner approval queue)
-- ============================================================
CREATE TABLE IF NOT EXISTS pending_actions (
    id           TEXT PRIMARY KEY,
    action_type  TEXT NOT NULL,                -- 'login' | 'edit' | 'delete'
    product_id   TEXT,                          -- nullable for login
    payload      TEXT,                          -- JSON of intended changes
    code_hash    TEXT NOT NULL,                 -- sha256 of the 6-digit code
    attempts     INTEGER NOT NULL DEFAULT 0,
    expires_at   TIMESTAMP NOT NULL,
    status       TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected | expired
    requested_by TEXT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at  TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pending_status ON pending_actions(status, expires_at);

-- ============================================================
--  AUDIT LOG  (who did what, when)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    actor       TEXT,                            -- staff | owner | system | billing_app
    action      TEXT NOT NULL,                   -- create | edit | delete | sold | login | approve | reject | email_failed
    product_id  TEXT,
    details     TEXT,                            -- JSON
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);

-- ============================================================
--  STOCK EVENTS  (Billing writes here on sale; Stock Entry polls)
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type  TEXT NOT NULL,                   -- 'sold' | 'returned'
    product_id  TEXT NOT NULL,
    bill_id     TEXT,
    consumed    INTEGER NOT NULL DEFAULT 0,      -- 0 = not yet processed by Stock Entry
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stock_events_unconsumed ON stock_events(consumed, id);

-- ============================================================
--  CUSTOMERS  (used by Billing — kept here so the shared DB has it)
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
    customer_id TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    phone       TEXT,
    address     TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  BILLS  (Billing app)
-- ============================================================
CREATE TABLE IF NOT EXISTS bills (
    bill_id          TEXT PRIMARY KEY,
    bill_datetime    TIMESTAMP NOT NULL,
    customer_id      TEXT,
    customer_name    TEXT NOT NULL,
    customer_phone   TEXT,
    customer_address TEXT,
    subtotal         REAL NOT NULL,
    making_charges   REAL,
    cgst_amount      REAL NOT NULL,
    sgst_amount      REAL NOT NULL,
    total_gst_amount REAL NOT NULL,
    final_net_amount REAL NOT NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- ============================================================
--  BILL ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS bill_items (
    id            TEXT PRIMARY KEY,
    bill_id       TEXT NOT NULL,
    product_id    TEXT,
    item_name     TEXT NOT NULL,
    gross_weight  REAL,
    stone_weight  REAL,
    net_weight    REAL,
    purity        TEXT,
    rate          REAL,
    making_charge REAL,
    total         REAL NOT NULL,
    FOREIGN KEY (bill_id)    REFERENCES bills(bill_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- ============================================================
--  PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
    id           TEXT PRIMARY KEY,
    bill_id      TEXT NOT NULL,
    payment_type TEXT,
    amount       REAL,
    gold_weight  REAL,
    gold_rate    REAL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES bills(bill_id)
);

-- ============================================================
--  DEBTS
-- ============================================================
CREATE TABLE IF NOT EXISTS debts (
    debt_id          TEXT PRIMARY KEY,
    bill_id          TEXT NOT NULL,
    customer_id      TEXT,
    total_amount     REAL NOT NULL,
    paid_amount      REAL,
    remaining_amount REAL NOT NULL,
    status           TEXT,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id)     REFERENCES bills(bill_id),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- ============================================================
--  DEBT TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS debt_transactions (
    id           TEXT PRIMARY KEY,
    debt_id      TEXT NOT NULL,
    payment_type TEXT,
    amount       REAL,
    gold_weight  REAL,
    gold_rate    REAL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (debt_id) REFERENCES debts(debt_id)
);

-- ============================================================
--  CHIT FUND USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS chitfund_users (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    phone       TEXT UNIQUE NOT NULL,
    address     TEXT NOT NULL,
    password    TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  CHIT FUNDS
-- ============================================================
CREATE TABLE IF NOT EXISTS chitfunds (
    id                TEXT PRIMARY KEY,
    user_id           TEXT NOT NULL,
    chitfund_name     TEXT NOT NULL,
    chitfund_amount   REAL NOT NULL,
    chitfund_duration INTEGER DEFAULT 12,
    chitfund_type     TEXT NOT NULL,
    start_month       TEXT NOT NULL,
    start_year        INTEGER NOT NULL,
    status            TEXT DEFAULT 'PENDING',
    months_paid       INTEGER DEFAULT 0,
    is_completed      BOOLEAN DEFAULT 0,
    start_date        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES chitfund_users(id),
    UNIQUE(user_id, chitfund_name)
);

-- ============================================================
--  CHIT FUND TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS chitfund_transactions (
    id                TEXT PRIMARY KEY,
    chitfund_id       TEXT NOT NULL,
    amount            REAL NOT NULL,
    payment_method    TEXT NOT NULL,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sold_at         TIMESTAMP,
    deleted_at      TIMESTAMP,

    -- Staff tracking
    added_by        TEXT                              -- staff name who created this entry
);

CREATE INDEX IF NOT EXISTS idx_products_status     ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_supplier   ON products(supplier_name);
CREATE INDEX IF NOT EXISTS idx_products_created    ON products(created_at);

-- ============================================================
--  PENDING ACTIONS  (owner approval queue)
-- ============================================================
CREATE TABLE IF NOT EXISTS pending_actions (
    id           TEXT PRIMARY KEY,
    action_type  TEXT NOT NULL,                -- 'login' | 'edit' | 'delete'
    product_id   TEXT,                          -- nullable for login
    payload      TEXT,                          -- JSON of intended changes
    code_hash    TEXT NOT NULL,                 -- sha256 of the 6-digit code
    attempts     INTEGER NOT NULL DEFAULT 0,
    expires_at   TIMESTAMP NOT NULL,
    status       TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected | expired
    requested_by TEXT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at  TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pending_status ON pending_actions(status, expires_at);

-- ============================================================
--  AUDIT LOG  (who did what, when)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    actor       TEXT,                            -- staff | owner | system | billing_app
    action      TEXT NOT NULL,                   -- create | edit | delete | sold | login | approve | reject | email_failed
    product_id  TEXT,
    details     TEXT,                            -- JSON
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);

-- ============================================================
--  STOCK EVENTS  (Billing writes here on sale; Stock Entry polls)
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type  TEXT NOT NULL,                   -- 'sold' | 'returned'
    product_id  TEXT NOT NULL,
    bill_id     TEXT,
    consumed    INTEGER NOT NULL DEFAULT 0,      -- 0 = not yet processed by Stock Entry
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stock_events_unconsumed ON stock_events(consumed, id);

-- ============================================================
--  CUSTOMERS  (used by Billing — kept here so the shared DB has it)
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
    customer_id TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    phone       TEXT,
    address     TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  BILLS  (Billing app)
-- ============================================================
CREATE TABLE IF NOT EXISTS bills (
    bill_id          TEXT PRIMARY KEY,
    bill_datetime    TIMESTAMP NOT NULL,
    customer_id      TEXT,
    customer_name    TEXT NOT NULL,
    customer_phone   TEXT,
    customer_address TEXT,
    subtotal         REAL NOT NULL,
    making_charges   REAL,
    cgst_amount      REAL NOT NULL,
    sgst_amount      REAL NOT NULL,
    total_gst_amount REAL NOT NULL,
    final_net_amount REAL NOT NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- ============================================================
--  BILL ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS bill_items (
    id            TEXT PRIMARY KEY,
    bill_id       TEXT NOT NULL,
    product_id    TEXT,
    item_name     TEXT NOT NULL,
    gross_weight  REAL,
    stone_weight  REAL,
    net_weight    REAL,
    purity        TEXT,
    rate          REAL,
    making_charge REAL,
    total         REAL NOT NULL,
    FOREIGN KEY (bill_id)    REFERENCES bills(bill_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- ============================================================
--  PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
    id           TEXT PRIMARY KEY,
    bill_id      TEXT NOT NULL,
    payment_type TEXT,
    amount       REAL,
    gold_weight  REAL,
    gold_rate    REAL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES bills(bill_id)
);

-- ============================================================
--  DEBTS
-- ============================================================
CREATE TABLE IF NOT EXISTS debts (
    debt_id          TEXT PRIMARY KEY,
    bill_id          TEXT NOT NULL,
    customer_id      TEXT,
    total_amount     REAL NOT NULL,
    paid_amount      REAL,
    remaining_amount REAL NOT NULL,
    status           TEXT,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id)     REFERENCES bills(bill_id),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- ============================================================
--  DEBT TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS debt_transactions (
    id           TEXT PRIMARY KEY,
    debt_id      TEXT NOT NULL,
    payment_type TEXT,
    amount       REAL,
    gold_weight  REAL,
    gold_rate    REAL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (debt_id) REFERENCES debts(debt_id)
);

-- ============================================================
--  CHIT FUND USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS chitfund_users (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    phone       TEXT UNIQUE NOT NULL,
    address     TEXT NOT NULL,
    password    TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  CHIT FUNDS
-- ============================================================
CREATE TABLE IF NOT EXISTS chitfunds (
    id                TEXT PRIMARY KEY,
    user_id           TEXT NOT NULL,
    chitfund_name     TEXT NOT NULL,
    chitfund_amount   REAL NOT NULL,
    chitfund_duration INTEGER DEFAULT 12,
    chitfund_type     TEXT NOT NULL,
    start_month       TEXT NOT NULL,
    start_year        INTEGER NOT NULL,
    status            TEXT DEFAULT 'PENDING',
    months_paid       INTEGER DEFAULT 0,
    is_completed      BOOLEAN DEFAULT 0,
    start_date        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES chitfund_users(id),
    UNIQUE(user_id, chitfund_name)
);

-- ============================================================
--  CHIT FUND TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS chitfund_transactions (
    id                TEXT PRIMARY KEY,
    chitfund_id       TEXT NOT NULL,
    amount            REAL NOT NULL,
    payment_method    TEXT NOT NULL,
    payment_status    TEXT DEFAULT 'PENDING',
    payment_reference TEXT,
    month_number      INTEGER NOT NULL,
    month_name        TEXT NOT NULL,
    year              INTEGER NOT NULL,
    date              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chitfund_id) REFERENCES chitfunds(id)
);

-- ============================================================
--  EXPENSES
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
    id          TEXT PRIMARY KEY,
    amount      REAL NOT NULL,
    description TEXT NOT NULL,
    date        TEXT NOT NULL,
    time        TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
