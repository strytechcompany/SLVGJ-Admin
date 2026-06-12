// main/server.js
import express from "express";
import multer from "multer";
import sqlite3 from "sqlite3";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";

// import sendEmail from "./sendEmail.js";
// import User from "./models/user.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({ dest: "./db" });

// Better SQLite path for Electron
const dbPath = "./db/gold.db";
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("SQLite Error:", err);
    else console.log("✅ SQLite Database connected");
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS - Fixed for Vite dev server
app.use(cors({
    origin: "http://localhost:5173",   // Vite default port
    credentials: true
}));

// ====================== ROUTES (FIXED) ======================
app.post("/api/admin/register", async (req, res) => {
    try {
        const { email, password, phone } = req.body;
        if (!email || !password || !phone) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            email,
            password: hashedPassword,
            phone
        });

        await newUser.save();
        res.status(201).json({ 
            message: "User created successfully", 
            user: { email: newUser.email, phone: newUser.phone } 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post("/api/admin/login", async (req, res) => {
    try {
        const { email, password } = req.body;   // phone not needed for login

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        if (email === "admin@gold.com" && password === "admin123") {
            console.log("✅ Test login successful");
        
        }

        //TEMPORARILY COMMENTED FOR TESTING WITHOUT DB
        // const user = await User.findOne({ email });
        // if (!user) return res.status(400).json({ error: "User not found" });

        // const isPasswordValid = await bcrypt.compare(password, user.password);
        // if (!isPasswordValid) return res.status(400).json({ error: "Invalid Credentials" });

        // Send email (non-blocking)
        // sendEmail({ email, emailType: "Login", user }).catch(err => 
        //     console.log("Email sending failed:", err)
        // );

        // res.status(200).json({ 
        //     message: "Login Successfully", 
        //     user: { email: user.email, phone: user.phone } 
        // });

           return res.status(200).json({
                message: "Login Successfully",
                user: { 
                    email: "admin@gold.com", 
                    phone: "9876543210" 
                }});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post("/api/admin/verify-email", async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({
            email,
            verifyOTP: otp,
            verifyOTPExpiry: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ error: "Invalid OTP" });

        user.verifyOTP = undefined;
        user.verifyOTPExpiry = undefined;
        await user.save();

        res.status(200).json({ 
            message: "Email verified successfully", 
            user 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ====================== START SERVER ======================
const startServer = () => {
    app.listen(PORT, () => {
        console.log(`🚀 Express Server running on http://localhost:${PORT}`);
        dbConnect();
    });
};

const dbConnect = async () => {
    console.log("⏭️ MongoDB connection skipped for testing");
    // try {
    //     await mongoose.connect(process.env.MONGO_URI);
    //     console.log("✅ MongoDB connected");
    // } catch (error) {
    //     console.error("MongoDB connection error:", error);
    // }
};

export default startServer;