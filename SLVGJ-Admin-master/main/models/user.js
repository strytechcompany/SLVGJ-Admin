import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: Number,
        required: true
    },
    verifyOTP: {
        type: Number,
        default: null
    },
    verifyOTPExpiry: {
        type: Date,
        default: null
    },
    otpOff: {
        type: Boolean,
        default: false
    }
});

export default mongoose.models.User || mongoose.model('User', userSchema);