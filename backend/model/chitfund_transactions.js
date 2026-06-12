import mongoose, { Schema } from "mongoose";

const transactionSchema = new Schema(
    {
        chitfund_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chitfund",
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 1
        },
        payment_method: {
            type: String,
            enum: ["CASH", "UPI", "CARD"],
            required: true
        },
        payment_status: {
            type: String,
            enum: ["PAID", "FAILED", "PENDING"],
            default: "PENDING"
        },
        payment_reference: String,
        month_number: {
            type: Number,
            required: true
        },
        month_name: {
            type: String,
            required: true,
            enum: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
        },
        year: {
            type: Number,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        }
    }
);

export default mongoose.model.ChitfundTransaction || mongoose.model("ChitfundTransaction", transactionSchema);
