import express from "express";
import sqlite3 from "sqlite3";
import fs from "fs";
import XLSX from "xlsx";
import multer from "multer";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

import sendEmail from "./sendEmail.js";
import User from "./model/user.js";
import Rate from "./model/rate.js";
import ChitfundUser from "./model/chitfunds_user.js";
import Chitfund from "./model/chitfund.js";
import ChitfundTransaction from "./model/chitfund_transactions.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({ dest: "./uploads/" });

if(!fs.existsSync("./db")) {
    fs.mkdirSync("./db");
}

if (!fs.existsSync("./uploads")) {
    fs.mkdirSync("./uploads");
}

const db = new sqlite3.Database("./db/gold.db", (err) => {
    if(err) {
        console.log(err);
    }
    else {
        console.log("SQLite connected");
    }
});

db.serialize(() => {
    db.run("PRAGMA foreign_keys = ON");
});

const extDbPath = process.env.DB_PATH || "C:/ProgramData/JewelrySuite/gold_system.db";
const extDb = new sqlite3.Database(extDbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if(err) {
        console.error("External DB connection error:", err);
    } else {
        console.log("External SQLite connected to", extDbPath);
    }
});

// ── 1. customers ──────────────────────────────────────────────────
db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
        customer_id   TEXT PRIMARY KEY,
        name          TEXT NOT NULL,
        phone         TEXT UNIQUE,
        address       TEXT,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
`);

// ── 2. bills ──────────────────────────────────────────────────────
db.exec(`
    CREATE TABLE IF NOT EXISTS bills (
        bill_id           TEXT PRIMARY KEY,
        bill_datetime     TIMESTAMP NOT NULL,

        customer_id       TEXT,
        customer_name     TEXT NOT NULL,
        customer_phone    TEXT,
        customer_address  TEXT,

        subtotal          REAL NOT NULL CHECK (subtotal >= 0),
        making_charges    REAL DEFAULT 0 CHECK (making_charges >= 0),

        cgst_amount       REAL NOT NULL CHECK (cgst_amount >= 0),
        sgst_amount       REAL NOT NULL CHECK (sgst_amount >= 0),
        total_gst_amount  REAL NOT NULL CHECK (total_gst_amount >= 0),

        final_net_amount  REAL NOT NULL CHECK (final_net_amount >= 0),

        created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (customer_id) REFERENCES customers (customer_id) ON DELETE CASCADE
    );
`);

// ── 3. products (NAREN) ───────────────────────────────────────────────────
// db.exec(`
//     CREATE TABLE IF NOT EXISTS products (
//         product_id      TEXT PRIMARY KEY,
//         name            TEXT NOT NULL,
//         barcode         TEXT UNIQUE,

//         gross_weight    REAL,
//         stone_weight    REAL DEFAULT 0,
//         net_weight      REAL,

//         purity          TEXT,
//         price_per_gram  REAL,
//         making_charge   REAL,

//         stock           INTEGER DEFAULT 1 CHECK (stock >= 0),

//         created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//     );
// `);

// db.exec(`
//     DROP TABLE products;
// `);

db.exec(`
    CREATE TABLE IF NOT EXISTS products (
        product_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        barcode TEXT,
        gross_weight REAL,
        stone_weight REAL,
        net_weight REAL,
        purity TEXT,
        price_per_gram REAL,
        making_charge REAL,
        stock INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
`)

// ── 4. bill_items ─────────────────────────────────────────────────
db.exec(`
    CREATE TABLE IF NOT EXISTS bill_items (
        id              TEXT PRIMARY KEY,
        bill_id         TEXT NOT NULL,

        product_id      TEXT,
        item_name       TEXT NOT NULL,

        gross_weight    REAL,
        stone_weight    REAL DEFAULT 0,
        net_weight      REAL,

        purity          TEXT,
        rate            REAL,
        making_charge   REAL DEFAULT 0,

        total           REAL NOT NULL CHECK (total >= 0),

        FOREIGN KEY (bill_id)     REFERENCES bills    (bill_id)     ON DELETE CASCADE,
        FOREIGN KEY (product_id)  REFERENCES products (product_id)  ON DELETE CASCADE
    );
`);

// ── 5. payments ───────────────────────────────────────────────────
db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
        id              TEXT PRIMARY KEY,
        bill_id         TEXT NOT NULL,

        payment_type    TEXT CHECK (payment_type IN ('CASH', 'CARD', 'UPI', 'GOLD')),

        amount          REAL DEFAULT 0 CHECK (amount >= 0),

        gold_weight     REAL DEFAULT 0,
        gold_rate       REAL DEFAULT 0,

        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (bill_id) REFERENCES bills (bill_id) ON DELETE CASCADE
    );
`);

// ── 6. debts ──────────────────────────────────────────────────────
db.exec(`
    CREATE TABLE IF NOT EXISTS debts (
        debt_id           TEXT PRIMARY KEY,

        bill_id           TEXT NOT NULL,
        customer_id       TEXT,

        total_amount      REAL NOT NULL CHECK (total_amount >= 0),
        paid_amount       REAL DEFAULT 0 CHECK (paid_amount >= 0),
        remaining_amount  REAL NOT NULL CHECK (remaining_amount >= 0),

        status            TEXT CHECK (status IN ('OPEN', 'CLOSED')),

        created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (bill_id)     REFERENCES bills     (bill_id)     ON DELETE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES customers (customer_id) ON DELETE CASCADE
    );
`);

// ── 7. debt_transactions ──────────────────────────────────────────
db.exec(`
    CREATE TABLE IF NOT EXISTS debt_transactions (
        id              TEXT PRIMARY KEY,
        debt_id         TEXT NOT NULL,

        payment_type    TEXT CHECK (payment_type IN ('CASH', 'CARD', 'UPI', 'GOLD')),

        amount          REAL DEFAULT 0 CHECK (amount >= 0),

        gold_weight     REAL DEFAULT 0,
        gold_rate       REAL DEFAULT 0,

        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (debt_id) REFERENCES debts (debt_id) ON DELETE CASCADE
    );
`);

// ── Indexes ───────────────────────────────────────────────────────
db.exec(`
    CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id   ON bill_items (bill_id);
    CREATE INDEX IF NOT EXISTS idx_payments_bill_id     ON payments   (bill_id);
    CREATE INDEX IF NOT EXISTS idx_debts_bill_id        ON debts      (bill_id);
    CREATE INDEX IF NOT EXISTS idx_products_barcode     ON products   (barcode);
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS dealers (
        id              TEXT PRIMARY KEY,
        name            TEXT NOT NULL,
        address         TEXT NOT NULL,
        phone           TEXT NOT NULL,
        advance_balance REAL DEFAULT 0,
        old_balance     REAL DEFAULT 0
    );
`);

db.run("ALTER TABLE dealers ADD COLUMN advance_balance REAL DEFAULT 0", () => {});
db.run("ALTER TABLE dealers ADD COLUMN old_balance REAL DEFAULT 0", () => {});

db.exec(`
    CREATE TABLE IF NOT EXISTS dealer_transactions (
        id              TEXT PRIMARY KEY,
        dealer_id       TEXT NOT NULL,
        type            TEXT CHECK (type IN ('DEBT', 'CREDIT')),
        gram            REAL NOT NULL CHECK (gram >= 0),
        description     TEXT NOT NULL,
        date            TIMESTAMP NOT NULL,
        time            TIMESTAMP NOT NULL,
        FOREIGN KEY (dealer_id) REFERENCES dealers (id) ON DELETE CASCADE
    );
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
        id              TEXT PRIMARY KEY,
        amount          REAL NOT NULL CHECK (amount > 0),
        description     TEXT NOT NULL,
        date            TIMESTAMP NOT NULL,
        time            TIMESTAMP NOT NULL
    );
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS other_adjustments (
        id              TEXT PRIMARY KEY,
        date            TIMESTAMP NOT NULL,
        name            TEXT NOT NULL,
        description     TEXT NOT NULL,
        grams           REAL NOT NULL,
        amount          REAL NOT NULL
    );
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS gold_rate (
        type    TEXT PRIMARY KEY,
        rate    REAL NOT NULL DEFAULT 0
    );
`);
// seed defaults if missing
db.run(`INSERT OR IGNORE INTO gold_rate (type, rate) VALUES ('gold', 0)`);
db.run(`INSERT OR IGNORE INTO gold_rate (type, rate) VALUES ('silver', 0)`);


app.use(express.json());
app.use(
    cors({
        origin: "*",
        credentials: true
    })
);

const dbConnect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database connected");

        // Automatically seed default admin if it doesn't exist
        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail) {
            const adminExists = await User.findOne({ email: adminEmail });
            if (!adminExists) {
                const salt = await bcrypt.genSalt(12);
                const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);
                await User.create({
                    email: adminEmail,
                    password: hashedPassword,
                    phone: process.env.ADMIN_PHONE || "1234567890"
                });
                console.log("Default admin user created from .env");
            }
        }
    } catch (error) {
        console.log(error);
    }
};

// Authentication Section

app.post("/api/admin/register", async (req, res) => {
    try {
        const email = req.body.email || process.env.ADMIN_EMAIL;
        const password = req.body.password || process.env.ADMIN_PASSWORD;
        const phone = req.body.phone || process.env.ADMIN_PHONE;
        if(!email || !password || !phone) {
            return res.status(400).json({ error: "All fields are required" });
        }
        const user = await User.findOne({ email });
        if (user) return res.status(400).json({ error: "User already exists" });
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({
            email,
            password: hashedPassword,
            phone
        });
        await newUser.save();
        res.status(201).json({ message: "User created successfully", user: newUser });
    }
    catch(err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post("/api/admin/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if(!email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }
        const user = await User.findOne({ email });
        if(!user) return res.status(400).json({ error: "User not found" });
        const isPassword = await bcrypt.compare(password, user.password);
        if(!isPassword) return res.status(400).json({ error: "Invalid Credentials" });
        // const token = jwt.sign(
        //     { userId: user._id },
        //     process.env.JWT_SECRET,
        //     { expiresIn: "7d" } // stays logged in for 7 days
        // );
        await sendEmail({ email, emailType: "Login", user });
        res.status(200).json({ message: "Login Successfully", user });
    }
    catch(err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post("/api/admin/verify-email", async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne(
            { email, verifyOTP: otp, verifyOTPExpiry: { $gt: Date.now() }
        });
        if(!user) return res.status(400).json({ error: "Invalid OTP" });
        user.verifyOTP = undefined;
        user.verifyOTPExpiry = undefined;
        await user.save();
        return res.status(200).json({ message: "Email verified successfully", user });
    }
    catch(err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Excel Section

app.get("/api/admin/download-excel", async (req, res) => {
    const tables = [
        "customers",
        "products",
        "bills",
        "bill_items",
        "payments",
        "debts",
        "debt_transactions",
        "dealers",
        "dealer_transactions",
        "expenses"
    ];

    const workbook = XLSX.utils.book_new();

    const getTableData = (table) => {
        return new Promise((resolve, reject) => {
            db.all(`SELECT * FROM ${table}`, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    };

    try {
        for (const table of tables) {
            const data = await getTableData(table);
            const worksheet = XLSX.utils.json_to_sheet(data);
            XLSX.utils.book_append_sheet(workbook, worksheet, table);
        }

        // Fetch MongoDB collections
        const mongoCollections = {
            "users": await User.find({}).lean(),
            "chitfunds": await Chitfund.find({}).lean(),
            "chitfunds_user": await ChitfundUser.find({}).lean(),
            "chitfund_transactions": await ChitfundTransaction.find({}).lean(),
            "rates": await Rate.find({}).lean()
        };

        for (const [colName, data] of Object.entries(mongoCollections)) {
            // Convert ObjectIDs to strings for Excel
            const formattedData = data.map(item => {
                const formattedItem = { ...item };
                if (formattedItem._id) formattedItem._id = formattedItem._id.toString();
                if (formattedItem.chitfund_id && typeof formattedItem.chitfund_id === 'object') formattedItem.chitfund_id = formattedItem.chitfund_id.toString();
                if (formattedItem.user_id && typeof formattedItem.user_id === 'object') formattedItem.user_id = formattedItem.user_id.toString();
                return formattedItem;
            });
            const worksheet = XLSX.utils.json_to_sheet(formattedData);
            XLSX.utils.book_append_sheet(workbook, worksheet, `mongo_${colName}`);
        }

        const filePath = `./db_backup_${Date.now()}.xlsx`;
        XLSX.writeFile(workbook, filePath);

        res.download(filePath, `backup_${Date.now()}.xlsx`, () => {
            // Delete file after download
            fs.unlinkSync(filePath);
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Excel Restore Route
app.post("/api/admin/upload-excel", upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    try {
        const workbook = XLSX.readFile(req.file.path);
        const sqliteTables = [
            "customers", "products", "bills", "bill_items", "payments",
            "debts", "debt_transactions", "dealers", "dealer_transactions", "expenses"
        ];
        
        // Turn off foreign keys temporarily for bulk delete/insert
        await new Promise(r => db.run("PRAGMA foreign_keys = OFF", r));
        
        for (const table of sqliteTables) {
            if (workbook.Sheets[table]) {
                const data = XLSX.utils.sheet_to_json(workbook.Sheets[table]);
                // Clear existing table
                await new Promise((resolve, reject) => {
                    db.run(`DELETE FROM ${table}`, (err) => err ? reject(err) : resolve());
                });
                
                // Insert new data
                if (data.length > 0) {
                    const columns = Object.keys(data[0]);
                    const placeholders = columns.map(() => '?').join(',');
                    const insertStmt = `INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`;
                    
                    for (const row of data) {
                        const values = columns.map(col => row[col]);
                        await new Promise((resolve, reject) => {
                            db.run(insertStmt, values, (err) => err ? reject(err) : resolve());
                        });
                    }
                }
            }
        }
        
        await new Promise(r => db.run("PRAGMA foreign_keys = ON", r));

        // Restore MongoDB collections
        const mongoMapping = {
            "mongo_users": User,
            "mongo_chitfunds": Chitfund,
            "mongo_chitfunds_user": ChitfundUser,
            "mongo_chitfund_transactions": ChitfundTransaction,
            "mongo_rates": Rate
        };

        for (const [sheetName, Model] of Object.entries(mongoMapping)) {
            if (workbook.Sheets[sheetName]) {
                const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
                await Model.deleteMany({});
                if (data.length > 0) {
                    await Model.insertMany(data);
                }
            }
        }

        fs.unlinkSync(req.file.path);
        res.status(200).json({ message: "Backup restored successfully" });
    } catch (err) {
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/admin/erase-data", async (req, res) => {
    try {
        db.run("PRAGMA foreign_keys = OFF");
        db.run("BEGIN TRANSACTION");

        const tables = [
            "customers",
            "products",
            "bills",
            "bill_items",
            "payments",
            "debts",
            "debt_transactions",
            "dealers",
            "dealer_transactions",
            "expenses"
        ];

        for (const table of tables) {
            await new Promise((resolve, reject) => {
                db.run(`DELETE FROM ${table}`, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }

        db.run("COMMIT");
        db.run("PRAGMA foreign_keys = ON");

        res.status(200).json({ message: "All data erased successfully" });
    } catch (err) {
        db.run("ROLLBACK");
        db.run("PRAGMA foreign_keys = ON");
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/admin/erase-upload", upload.single("file"), async (req, res) => {
    try {
        db.run("PRAGMA foreign_keys = OFF");
        db.run("BEGIN TRANSACTION");

        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const filePath = req.file.path;

        const workbook = XLSX.readFile(filePath);

        const tables = [
            "customers",
            "products",
            "bills",
            "bill_items",
            "payments",
            "debts",
            "debt_transactions",
            "dealers",
            "dealer_transactions",
            "expenses"
        ];

        // 🧨 DELETE ALL DATA
        for (const table of tables) {
            await new Promise((resolve, reject) => {
                db.run(`DELETE FROM ${table}`, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }

        // 🔄 INSERT DATA FROM EXCEL
        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(sheet);

            for (const row of data) {
                const columns = Object.keys(row);
                const values = Object.values(row);

                const placeholders = columns.map(() => "?").join(",");

                const query = `
                    INSERT INTO ${sheetName}
                    (${columns.join(",")})
                    VALUES (${placeholders})
                `;

                await new Promise((resolve, reject) => {
                    db.run(query, values, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }
        }

        // Enable foreign keys again
        db.run("COMMIT");
        db.run("PRAGMA foreign_keys = ON");

        res.json({ message: "Database restored successfully" });

    } catch (err) {
        db.run("ROLLBACK");
        db.run("PRAGMA foreign_keys = ON");
        res.status(500).json({ error: err.message });
    }
});

// Gold and Silver rate

app.post("/api/admin/update-rate", async (req, res) => {
    try {
        const { new_rate, type } = req.body;
        if(!new_rate || !type) {
            return res.status(400).json({ error: "Rate per gram is required" });
        }
        // Save to SQLite (primary) — works offline
        db.run(`INSERT INTO gold_rate (type, rate) VALUES (?, ?) ON CONFLICT(type) DO UPDATE SET rate = excluded.rate`,
            [type, new_rate], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.status(201).json({ message: "Rate updated successfully", rate: new_rate });
            }
        );
        // Also save to MongoDB if connected
        try {
            const rate = await Rate.findOne({ type });
            if(!rate) { await new Rate({ type, rate: new_rate }).save(); }
            else { rate.rate = new_rate; await rate.save(); }
        } catch(e) {}
    }
    catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/admin/get-rate", (req, res) => {
    db.all(`SELECT type, rate FROM gold_rate`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const gold_rate = rows.find(r => r.type === 'gold') || { rate: 0 };
        const silver_rate = rows.find(r => r.type === 'silver') || { rate: 0 };
        res.status(200).json({ gold_rate, silver_rate });
    });
});

// Dealer Section

app.post("/api/admin/add-dealer", async (req, res) => {
    try {
        const { dealer_id, name, address, phone, advance_balance, old_balance } = req.body;
        if(!name || !address || !phone) {
            return res.status(400).json({ error: "Name, address and phone are required" });
        }
        const id = dealer_id || uuidv4();
        const advBal = advance_balance ? parseFloat(advance_balance) : 0;
        const oldBal = old_balance ? parseFloat(old_balance) : 0;
        
        db.run("INSERT INTO dealers (id, name, address, phone, advance_balance, old_balance) VALUES (?, ?, ?, ?, ?, ?)", 
        [id, name, address, phone, advBal, oldBal], (err) => {
            if(err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ message: "Dealer added successfully", dealer: { id, name, address, phone, advance_balance: advBal, old_balance: oldBal } });
        });
    }
    catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/admin/get-dealers", async (req, res) => {
    try {
        db.all("SELECT * FROM dealers ORDER BY name ASC", [], (err, rows) => {
            if(err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(200).json({ dealers: rows });
        });
    }
    catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/admin/add-transaction", (req, res) => {
    const { dealer_id, type, gram, description } = req.body;
    if (!dealer_id || !type || !gram || !description) return res.status(400).json({ error: "All fields are required" });
    if (!["DEBT", "CREDIT"].includes(type)) return res.status(400).json({ error: "Type must be DEBT or CREDIT" });
    if (gram < 0) return res.status(400).json({ error: "Gram must be positive" });

    db.get("SELECT old_balance, advance_balance FROM dealers WHERE id = ?", [dealer_id], (err, dealer) => {
        if(err) return res.status(500).json({ error: err.message });
        if(!dealer) return res.status(404).json({ error: "Dealer not found" });

        let net = (dealer.old_balance || 0) - (dealer.advance_balance || 0);
        if (type === "DEBT") net += Number(gram);
        else if (type === "CREDIT") net -= Number(gram);

        let newOld = 0;
        let newAdv = 0;
        if (net > 0) newOld = net;
        else if (net < 0) newAdv = Math.abs(net);

        const id = uuidv4();
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0];

        db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            db.run(
                "INSERT INTO dealer_transactions (id, dealer_id, type, gram, description, date, time) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [id, dealer_id, type, gram, description, dateStr, timeStr]
            );
            db.run(
                "UPDATE dealers SET old_balance = ?, advance_balance = ? WHERE id = ?",
                [newOld, newAdv, dealer_id]
            );
            db.run("COMMIT", (commitErr) => {
                if(commitErr) return res.status(500).json({ error: commitErr.message });
                res.status(201).json({ message: "Transaction added successfully", transaction: { id, dealer_id, type, gram, description, date: dateStr, time: timeStr }, dealer_balances: { old_balance: newOld, advance_balance: newAdv } });
            });
        });
    });
});

app.post("/api/admin/update-transaction", (req, res) => {
    const { dealer_id, transaction_id, type, gram, description } = req.body;
    if(!dealer_id || !transaction_id || !type || !gram || !description) return res.status(400).json({ error: "All fields are required" });
    if(!["DEBT", "CREDIT"].includes(type)) return res.status(400).json({ error: "Type must be DEBT or CREDIT" });
    if(gram < 0) return res.status(400).json({ error: "Gram must be positive" });

    db.get("SELECT * FROM dealer_transactions WHERE id = ?", [transaction_id], (err, oldTx) => {
        if(err) return res.status(500).json({ error: err.message });
        if(!oldTx) return res.status(404).json({ error: "Transaction not found" });

        db.get("SELECT old_balance, advance_balance FROM dealers WHERE id = ?", [dealer_id], (err, dealer) => {
            if(err) return res.status(500).json({ error: err.message });
            if(!dealer) return res.status(404).json({ error: "Dealer not found" });

            let net = (dealer.old_balance || 0) - (dealer.advance_balance || 0);

            // Reverse old transaction impact
            if (oldTx.type === "DEBT") net -= Number(oldTx.gram);
            else if (oldTx.type === "CREDIT") net += Number(oldTx.gram);

            // Apply new transaction impact
            if (type === "DEBT") net += Number(gram);
            else if (type === "CREDIT") net -= Number(gram);

            let newOld = 0;
            let newAdv = 0;
            if (net > 0) newOld = net;
            else if (net < 0) newAdv = Math.abs(net);

            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const timeStr = now.toTimeString().split(' ')[0];

            db.serialize(() => {
                db.run("BEGIN TRANSACTION");
                db.run(
                    "UPDATE dealer_transactions SET dealer_id = ?, type = ?, gram = ?, description = ?, date = ?, time = ? WHERE id = ?",
                    [dealer_id, type, gram, description, dateStr, timeStr, transaction_id]
                );
                db.run(
                    "UPDATE dealers SET old_balance = ?, advance_balance = ? WHERE id = ?",
                    [newOld, newAdv, dealer_id]
                );
                db.run("COMMIT", (commitErr) => {
                    if(commitErr) return res.status(500).json({ error: commitErr.message });
                    res.status(200).json({ message: "Transaction updated successfully", transaction: { id: transaction_id, dealer_id, type, gram, description, date: dateStr, time: timeStr }, dealer_balances: { old_balance: newOld, advance_balance: newAdv } });
                });
            });
        });
    });
});

app.get("/api/admin/get-transactions", async (req, res) => {
    try {
        db.all("SELECT * FROM dealer_transactions ORDER BY date DESC", [], (err, rows) => {
            if(err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(200).json({ transactions: rows });
        });
    }
    catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// Expense tracker

app.post("/api/admin/expenses", async (req, res) => {
    try {
        const { amount, description, date } = req.body;
        if(!amount || !description) {
            return res.status(400).json({ error: "All fields are required" });
        }
        if(amount < 0) return res.status(400).json({ error: "Amount can't be negative" });
        const id = uuidv4();
        const now = new Date();
        const expenseDate = date || now.toISOString().split('T')[0];
        const query = `
            INSERT INTO expenses (id, amount, description, date, time)
            VALUES (?, ?, ?, ?, ?)
        `;
        db.run(query, [id, amount, description, expenseDate, now], function(err) {
            if(err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(200).json({ message: "Expense added successfully", expense: { id, amount, description, date: expenseDate } });
        });
    }
    catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/admin/expenses", async (req, res) => {
    try {
        db.all("SELECT * FROM expenses ORDER BY date DESC", [], (err, rows) => {
            if(err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(200).json({ expenses: rows });
        });
    }
    catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// Bill Display Section

app.get("/api/admin/bills", async (req, res) => {
    try {
        db.all("SELECT * FROM bills ORDER BY bill_datetime DESC", [], (err, rows) => {
            if(err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(200).json({ bills: rows });
        });
    }
    catch(err) {
        res.status(500).json({ error: err.message })
    }
});

// User List Section

app.get("/api/admin/users", async (req, res) => {
    try {
        db.all("SELECT * FROM customers ORDER BY name ASC", [], (err, rows) => {
            if(err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(200).json({ users: rows });
        });
    }
    catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// Bills list for a user

app.get("/api/admin/user-bills/:id", async (req, res) => {
    try {
        const { id } = req.params;
        db.all("SELECT * FROM bills WHERE customer_id = ? ORDER BY bill_datetime DESC", [id], (err, rows) => {
            if(err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(200).json({ bills: rows });
        });
    }
    catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// Bill Details

app.get("/api/admin/bill-details/:id", async (req, res) => {
    try {
        const { id } = req.params;
        db.all("SELECT * FROM bill_items WHERE bill_id = ?", [id], (err, row) => {
            if(err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(200).json({ bill: row });
        });
    }
    catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// Product List

app.get("/api/admin/products", async (req, res) => {
    try {
        db.all("SELECT * FROM products ORDER BY name ASC", [], (err, rows) => {
            if(err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(200).json({ products: rows });
        });
    }
    catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// Product Details

app.get("/api/admin/product-details/:id", async (req, res) => {
    try {
        const { id } = req.params;
        db.get("SELECT * FROM products WHERE product_id = ?", [id], (err, row) => {
            if(err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(200).json({ product: row });
        });
    }
    catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// Dashboard

app.get("/api/admin/todays-sales", async (req, res) => {
    try {
        db.get(
            "SELECT COALESCE(SUM(final_net_amount), 0) AS totalSales FROM bills WHERE DATE(created_at) = DATE(?)",
            [new Date().toISOString().split("T")[0]],
            (err, row) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                res.json(row);
            }
        );
        // db.all("SELECT SUM(final_net_amount) FROM bills WHERE DATE(created_at) = DATE(?)", [new Date().toISOString().split('T')[0]], (err, row) => {
        //     if(err) {
        //         return res.status(500).json({ error: err.message });
        //     }
        //     res.status(200).json({ todaysSales: row });
        // });
    }
    catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// app.get("/api/admin/weekly-data", async (req, res) => {
//     try {
//         const day = new Date().getDay();
//         const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
//         const weeklyData = [];
//         for(let i = 0; i < 7; i++) {
//             const date = new Date();
//             date.setDate(date.getDate() - day + i);
//             const dayName = days[date.getDay()];
//             const revenue = db.all("SELECT SUM(final_net_amount) FROM bills WHERE date = ?", [date.toISOString().split('T')[0]], (err, row) => {
//                 if(err) {
//                     return res.status(500).json({ error: err.message });
//                 }
//                 return row[0].sum;
//             });
//             weeklyData.push({ day: dayName, revenue });
//         }
//         res.status(200).json({ weeklyData });
//     }
//     catch(err) {
//         res.status(500).json({ error: err.message });
//     }
// });

// app.get("/api/admin/weekly-data", async (req, res) => {
//     try {
//         const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
//         const weeklyData = [];

//         const getRevenue = (date) => {
//             return new Promise((resolve, reject) => {
//                 db.all(
//                     "SELECT SUM(final_net_amount) as total FROM bills WHERE DATE(bill_datetime) = ?",
//                     [date],
//                     (err, rows) => {
//                         if (err) reject(err);
//                         else resolve(rows[0].total || 0);
//                     }
//                 );
//             });
//         };

//         const today = new Date();
//         const startOfWeek = new Date(today);
//         startOfWeek.setDate(today.getDate() - today.getDay());

//         for (let i = 0; i < 7; i++) {
//             const date = new Date(startOfWeek);
//             date.setDate(startOfWeek.getDate() + i);

//             const formattedDate = date.toISOString().split("T")[0];
//             const revenue = await getRevenue(formattedDate);

//             weeklyData.push({
//                 day: days[date.getDay()],
//                 revenue
//             });
//         }

//         res.status(200).json({ weeklyData });

//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });

app.get("/api/admin/weekly-data", async (req, res) => {
    try {
        const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
        const weeklyData = [];

        const getRevenue = (date) => {
            return new Promise((resolve, reject) => {
                db.all(
                    "SELECT SUM(final_net_amount) as total FROM bills WHERE DATE(bill_datetime) = ?",
                    [date],
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows[0].total || 0);
                    }
                );
            });
        };

        const today = new Date();
        const todayDayIndex = today.getDay();

        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - todayDayIndex);

        for (let i = 0; i <= todayDayIndex; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);

            const formattedDate = date.toISOString().split("T")[0];
            const revenue = await getRevenue(formattedDate);

            weeklyData.push({
                day: days[date.getDay()],
                date: formattedDate,
                revenue
            });
        }

        res.status(200).json({ weeklyData });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/admin/recent-transactions", async (req, res) => {
    try {
        const { recent } = req.query;
        let r;
        if(!recent) r = 5;
        else r = recent;
        db.all("SELECT * FROM bills ORDER BY bill_datetime DESC LIMIT ?", [r], (err, rows) => {
            if(err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(200).json({ recentTransactions: rows });
        });
    }
    catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// Chitfund Operations

app.post("/api/admin/chitfunds/users_register", async (req, res) => {
    try {
        const { name, phone, email, address, password } = req.body;
        if(!name || !phone || !email || !address || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const user = await ChitfundUser.findOne({ $or: [{ email }, { phone }] });
        if(user) {
            return res.status(400).json({ error: "User with this email or phone number already exists" });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new ChitfundUser({
            name,
            email,
            phone,
            address,
            password: hashedPassword
        });

        await newUser.save();
        await sendEmail({ email, emailType: "REGISTER", user: newUser });
        res.status(200).json({ message: "User registered successfully" });
    }
    catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/admin/chitfunds/users", async (req, res) => {
    try {
        const users = await ChitfundUser.find();
        res.status(200).json({ users });
    }
    catch(err) {
        res.status(400).json({ error: err.message });
    }
});

app.post("/api/admin/chitfunds/create-chit", async (req, res) => {
    try {
        const { user_id, chitfund_name, chitfund_amount, chitfund_duration, chitfund_type, start_month } = req.body;
        if(!user_id || !chitfund_name || !chitfund_amount || !chitfund_type || !start_month) {
            return res.status(400).json({ error: "Fill all mandatory fields" });
        }

        const user = await ChitfundUser.findById(user_id);
        if(!user) {
            return res.status(400).json({ error: "User not found" });
        }
        const existingChit = await Chitfund.findOne({ user_id, chitfund_name });
        if(existingChit) {
            return res.status(400).json({ error: "Chitfund with this name already exists for this user" });
        }

        // Parse start_month from YYYY-MM
        const [yearStr, monthStr] = start_month.split("-");
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const parsedMonth = monthNames[parseInt(monthStr, 10) - 1];
        const parsedYear = parseInt(yearStr, 10);

        const newChitfund = new Chitfund({
            user_id,
            chitfund_name,
            chitfund_amount,
            chitfund_duration: chitfund_duration || 12,
            chitfund_type,
            start_month: parsedMonth,
            start_year: parsedYear,
            status: "ACCEPTED",
            months_paid: 0,
            is_completed: false
        });

        await newChitfund.save();

        const notificationUser = {
            name: user.name,
            chitfund_name,
            chitfund_amount,
            chitfund_duration: newChitfund.chitfund_duration,
            chitfund_type
        };
        await sendEmail({ email: user.email, emailType: "CHITFUND_CREATED", user: notificationUser });
        res.status(200).json({ message: "Chitfund created successfully" });
    }
    catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/admin/chitfunds/users/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const user = await ChitfundUser.findById(id);
        if(!user) {
            return res.status(400).json({ error: "User not found" });
        }

        const chitfundsList = await Chitfund.find({ user_id: id, status: "ACCEPTED" }).lean();

        const chitfundsWithTransactions = await Promise.all(chitfundsList.map(async (chit) => {
            const transactions = await ChitfundTransaction.find({ chitfund_id: chit._id }).lean();
            return { ...chit, chitfund_transactions: transactions };
        }));

        res.status(200).json({ chitfunds: chitfundsWithTransactions });
    }
    catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/admin/chitfunds/mark-request", async (req, res) => {
    try {
        const { user_id, chitfund_id, isAccepted } = req.body;
        if(!user_id || !chitfund_id || isAccepted === undefined) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const user = await ChitfundUser.findById(user_id);
        if(!user) {
            return res.status(400).json({ error: "User not found" });
        }

        const chitfund = await Chitfund.findOne({ _id: chitfund_id, user_id });
        if(!chitfund) {
            return res.status(400).json({ error: "Chitfund not found" });
        }

        if(!isAccepted) {
            chitfund.status = "REJECTED";
            await chitfund.save();
            await sendEmail({ email: user.email, emailType: "CHITFUND_REJECTED", user: { name: user.name, chitfund_name: chitfund.chitfund_name } });
            return res.status(200).json({ message: "Request rejected successfully" });
        }

        chitfund.status = "ACCEPTED";
        chitfund.start_date = new Date();
        await chitfund.save();

        await sendEmail({ email: user.email, emailType: "CHITFUND_ACCEPTED", user: { name: user.name, chitfund_name: chitfund.chitfund_name, chitfund_amount: chitfund.chitfund_amount, chitfund_duration: chitfund.chitfund_duration, chitfund_type: chitfund.chitfund_type } });
        res.status(200).json({ message: "Request marked successfully" });
    }
    catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/admin/chitfunds/add-payment", async (req, res) => {
    try {
        const { user_id, chitfund_id, payment_month } = req.body;
        if(!user_id || !chitfund_id || !payment_month) {
            return res.status(400).json({ error: "All fields are required" });
        }
        const chitfund = await Chitfund.findById(chitfund_id);
        if(!chitfund) {
            return res.status(400).json({ error: "Chitfund not found" });
        }

        const amount = chitfund.chitfund_amount; // strictly enforce the amount
        const month_number = parseInt(chitfund.months_paid) + 1;
        
        // Parse payment_month from YYYY-MM
        const [yearStr, monthStr] = payment_month.split("-");
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const month_name = monthNames[parseInt(monthStr, 10) - 1];
        const year = parseInt(yearStr, 10);

        const user = await ChitfundUser.findById(user_id);
        if(!user) {
            return res.status(400).json({ error: "User not found" });
        }

        if(chitfund.status !== "ACCEPTED") {
            return res.status(400).json({ error: "Chitfund not accepted" });
        }

        const alreadyPaid = await ChitfundTransaction.findOne({ chitfund_id, month_name, year });

        if(alreadyPaid) {
            return res.status(400).json({ error: "Payment already exists for this month" });
        }

        if(chitfund.is_completed || chitfund.months_paid >= chitfund.chitfund_duration) {
            return res.status(400).json({ error: "Chitfund already completed" });
        }

        // Calculate Grams and Cumulative Grams
        // Get gold rate from SQLite (works offline)
        let grams = 0;
        if (chitfund.chitfund_type?.toUpperCase() === "GOLD") {
            const goldRateRow = await new Promise((resolve) => {
                db.get(`SELECT rate FROM gold_rate WHERE type = 'gold'`, [], (err, row) => resolve(row));
            });
            const currentGoldRate = (goldRateRow && goldRateRow.rate > 0) ? goldRateRow.rate : 0;
            if (currentGoldRate > 0) {
                grams = amount / currentGoldRate;
            }
        }

        const lastTransaction = await ChitfundTransaction.findOne({ chitfund_id }).sort({ date: -1 });
        const cumulative_grams = (lastTransaction ? lastTransaction.cumulative_grams : 0) + grams;

        const newPayment = new ChitfundTransaction({
            chitfund_id,
            amount,
            payment_method: "CASH",
            payment_status: "PAID",
            month_number,
            month_name,
            year,
            date: new Date(),
            grams: Number(grams.toFixed(3)),
            cumulative_grams: Number(cumulative_grams.toFixed(3))
        });

        await newPayment.save();

        chitfund.transactions.push({
            transaction_id: newPayment._id,
            month_number
        });

        chitfund.months_paid += 1;
        if(chitfund.months_paid === chitfund.chitfund_duration) {
            chitfund.is_completed = true;
            await sendEmail({ email: user.email, emailType: "CHITFUND_COMPLETED", user: { name: user.name, chitfund_name: chitfund.chitfund_name, chitfund_amount: chitfund.chitfund_amount, chitfund_duration: chitfund.chitfund_duration, chitfund_type: chitfund.chitfund_type } });

            await sendEmail({ email: process.env.GMAIL_USERNAME, emailType: "CHITFUND_COMPLETED_ADMIN", user: { name: user.name, email: user.email, chitfund_name: chitfund.chitfund_name, chitfund_amount: chitfund.chitfund_amount, chitfund_duration: chitfund.chitfund_duration, chitfund_type: chitfund.chitfund_type } });
        }
        await chitfund.save();

        const notificationUser = {
            name: user.name,
            chitfund_name: chitfund.chitfund_name,
            chitfund_amount: chitfund.chitfund_amount,
            chitfund_date: newPayment.date,
            months_paid: chitfund.months_paid,
            remaining_months: chitfund.chitfund_duration - chitfund.months_paid
        };

        await sendEmail({ email: user.email, emailType: "CHITFUND_PAYMENT", user: notificationUser });

        res.status(200).json({ message: "Payment added successfully" });
    }
    catch(err) {
        return res.status(500).json({ error: err.message });
    }
});

app.post("/api/admin/chitfunds/update-product-status", async (req, res) => {
    try {
        const { chitfund_id, product_issued } = req.body;
        if (!chitfund_id || product_issued === undefined) {
            return res.status(400).json({ error: "chitfund_id and product_issued are required" });
        }

        const chitfund = await Chitfund.findById(chitfund_id);
        if (!chitfund) {
            return res.status(400).json({ error: "Chitfund not found" });
        }

        chitfund.product_issued = product_issued;
        await chitfund.save();

        res.status(200).json({ message: "Product status updated successfully", chitfund });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

app.post("/api/admin/chitfund/payment-status", async (req, res) => {
    try {
        const { user_id, chitfund_id, transaction_id, status } = req.body;
        if(!user_id || !chitfund_id || !transaction_id || status === undefined) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const user = await ChitfundUser.findById(user_id);
        if(!user) {
            return res.status(400).json({ error: "User not found" });
        }

        const chitfund = await Chitfund.findOne({ _id: chitfund_id, user_id });
        if(!chitfund) {
            return res.status(400).json({ error: "Chitfund not found" });
        }

        const transaction = await ChitfundTransaction.findOne({ _id: transaction_id, chitfund_id });
        if(!transaction) {
            return res.status(400).json({ error: "Transaction not found" });
        }

        transaction.payment_status = "PAID";
        await transaction.save();

        const notificationUser = {
            name: user.name,
            chitfund_name: chitfund.chitfund_name,
            chitfund_amount: chitfund.chitfund_amount,
            chitfund_date: transaction.date,
            months_paid: chitfund.months_paid,
            remaining_months: chitfund.chitfund_duration - chitfund.months_paid
        };
        await sendEmail({ email: user.email, emailType: "CHITFUND_PAYMENT", user: notificationUser });

        res.status(200).json({ message: "Payment status updated successfully" });
    }
    catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// ────────────────────────────────────────────────────────
// EXTERNAL STOCK MANAGEMENT ROUTES
// ────────────────────────────────────────────────────────

app.get("/api/admin/stock", (req, res) => {
    const query = `SELECT * FROM products ORDER BY created_at DESC`;
    extDb.all(query, [], (err, rows) => {
        if(err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ products: rows });
    });
});

app.post("/api/admin/stock", (req, res) => {
    const { name, barcode, gross_weight, net_weight, price_per_gram, making_charge, stock, status, added_by } = req.body;
    const product_id = "INV-" + Date.now();
    const query = `INSERT INTO products (product_id, name, barcode, gross_weight, net_weight, price_per_gram, making_charge, stock, status, added_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    extDb.run(query, [product_id, name, barcode, gross_weight, net_weight, price_per_gram, making_charge, stock, status || 'in_stock', added_by || 'admin'], function(err) {
        if(err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: "Product added successfully", product_id });
    });
});

app.put("/api/admin/stock/:product_id", (req, res) => {
    const { product_id } = req.params;
    const { name, gross_weight, net_weight, price_per_gram, making_charge, stock, status } = req.body;
    const query = `UPDATE products SET name = ?, gross_weight = ?, net_weight = ?, price_per_gram = ?, making_charge = ?, stock = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?`;
    extDb.run(query, [name, gross_weight, net_weight, price_per_gram, making_charge, stock, status, product_id], function(err) {
        if(err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: "Product updated successfully" });
    });
});

app.delete("/api/admin/stock/:product_id", (req, res) => {
    const { product_id } = req.params;
    const query = `DELETE FROM products WHERE product_id = ?`;
    extDb.run(query, [product_id], function(err) {
        if(err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: "Product deleted successfully" });
    });
});

// ────────────────────────────────────────────────────────
// REPORTING & ADJUSTMENTS ROUTES
// ────────────────────────────────────────────────────────

app.post("/api/admin/adjustments", (req, res) => {
    const { date, name, description, grams, amount } = req.body;
    if (!date || !name || !description) return res.status(400).json({ error: "Missing required fields" });
    const id = uuidv4();
    const query = `INSERT INTO other_adjustments (id, date, name, description, grams, amount) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(query, [id, date, name, description, grams || 0, amount || 0], function(err) {
        if(err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: "Adjustment added", id });
    });
});

app.get("/api/admin/adjustments", (req, res) => {
    db.all("SELECT * FROM other_adjustments ORDER BY date DESC", [], (err, rows) => {
        if(err) return res.status(500).json({ error: err.message });
        res.status(200).json({ adjustments: rows });
    });
});

app.delete("/api/admin/adjustments/:id", (req, res) => {
    db.run("DELETE FROM other_adjustments WHERE id = ?", [req.params.id], function(err) {
        if(err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: "Adjustment deleted" });
    });
});

app.get("/api/admin/monthly-report", async (req, res) => {
    try {
        const { month } = req.query; // YYYY-MM
        if (!month) return res.status(400).json({ error: "Month parameter (YYYY-MM) is required" });

        // 1. Stock (External DB)
        const stockData = await new Promise((resolve) => {
            extDb.all("SELECT * FROM products WHERE status = 'in_stock'", [], (err, rows) => {
                if(err) resolve({ total_grams: 0, total_items: 0 });
                const total_grams = rows.reduce((sum, p) => sum + (p.net_weight || 0), 0);
                resolve({ total_grams, total_items: rows.length });
            });
        });

        // 2. Dealers (Debt Receivable & Payable)
        const dealers = await new Promise((resolve) => {
            db.all("SELECT * FROM dealers", [], (err, rows) => {
                if(err) resolve([]);
                resolve(rows);
            });
        });
        const debtReceivable = dealers.filter(d => d.old_balance > 0);
        const debtPayable = dealers.filter(d => d.advance_balance > 0);

        // 3. Sales for the month
        const bills = await new Promise((resolve) => {
            db.all("SELECT * FROM bills WHERE bill_datetime LIKE ?", [month + '%'], (err, rows) => {
                if(err) resolve([]);
                resolve(rows);
            });
        });
        const billIds = bills.map(b => b.bill_id);
        
        let billItems = [];
        if (billIds.length > 0) {
            const placeholders = billIds.map(() => '?').join(',');
            billItems = await new Promise((resolve) => {
                db.all(`SELECT * FROM bill_items WHERE bill_id IN (${placeholders})`, billIds, (err, rows) => {
                    if(err) resolve([]);
                    resolve(rows);
                });
            });
        }

        // 4. Expenses for the month
        const expenses = await new Promise((resolve) => {
            db.all("SELECT * FROM expenses WHERE date LIKE ?", [month + '%'], (err, rows) => {
                if(err) resolve([]);
                resolve(rows);
            });
        });

        // 5. Adjustments for the month
        const adjustments = await new Promise((resolve) => {
            db.all("SELECT * FROM other_adjustments WHERE date LIKE ?", [month + '%'], (err, rows) => {
                if(err) resolve([]);
                resolve(rows);
            });
        });

        // 6. Chit Funds for the month (MongoDB - graceful fallback if offline)
        let enhancedChitfunds = [];
        try {
            const [yyyyStr, mmStr] = month.split('-');
            const year = parseInt(yyyyStr);
            const month_number = parseInt(mmStr);
            const chitTransactions = await ChitfundTransaction.find({ year, month_number, payment_status: "PAID" }).populate('chitfund_id').lean();
            const chitfundUserIds = [...new Set(chitTransactions.map(t => t.chitfund_id?.user_id).filter(Boolean))];
            const chitUsers = await ChitfundUser.find({ _id: { $in: chitfundUserIds } }).lean();
            const userMap = {};
            chitUsers.forEach(u => userMap[u._id.toString()] = u.name);
            enhancedChitfunds = chitTransactions.map(t => ({
                ...t,
                customer_name: t.chitfund_id ? (userMap[t.chitfund_id.user_id?.toString()] || 'Unknown') : 'Unknown'
            }));
        } catch(e) {
            enhancedChitfunds = [];
        }

        // 7. Cash Balance Calculation (All Time)
        const allPayments = await new Promise((resolve) => {
            db.all("SELECT amount FROM payments WHERE payment_type = 'CASH'", [], (err, rows) => {
                if(err) resolve([]);
                resolve(rows || []);
            });
        });
        const totalCashInBills = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        
        const allExpenses = await new Promise((resolve) => {
            db.all("SELECT amount FROM expenses", [], (err, rows) => {
                if(err) resolve([]);
                resolve(rows || []);
            });
        });
        const totalCashOutExpenses = allExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        
        // Sum all cash from chit funds
        const allChitCash = await ChitfundTransaction.aggregate([
            { $match: { payment_status: "PAID", payment_method: "CASH" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalChitCash = allChitCash.length > 0 ? allChitCash[0].total : 0;
        
        const cash_balance = totalCashInBills + totalChitCash - totalCashOutExpenses;

        res.status(200).json({
            stock: stockData,
            sales: { bills, items: billItems },
            debt_receivable: debtReceivable,
            debt_payable: debtPayable,
            expenses,
            chit_funds: enhancedChitfunds,
            adjustments,
            cash_balance
        });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    dbConnect();
    console.log(`Server is running on port ${PORT}`);
});
