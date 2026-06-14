import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./model/user.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
        const bcrypt = (await import("bcryptjs")).default;
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);
        await User.create({
            email: adminEmail,
            password: hashedPassword,
            phone: process.env.ADMIN_PHONE || "1234567890"
        });
        console.log("Default admin user created");
    } else {
        console.log("User already exists");
    }
    process.exit(0);
});
