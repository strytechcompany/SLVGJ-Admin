import mongoose, { Schema } from "mongoose";

const chitfundSchema = new Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ChitfundUser",
        required: true
    },
    chitfund_name: {
        type: String,
        required: true
    },
    chitfund_amount: {
        type: Number,
        required: true
    },
    chitfund_duration: {
        type: Number,
        default: 12
    },
    chitfund_type: {
        type: String,
        enum: ["GOLD", "SILVER", "CASH"],
        required: true
    },
    status: {
        type: String,
        enum: ["PENDING", "ACCEPTED", "REJECTED", "COMPLETED"],
        default: "PENDING"
    },
    months_paid: {
        type: Number,
        default: 0
    },
    is_completed: {
        type: Boolean,
        default: false
    },
    start_date: {
        type: Date,
        default: Date.now
    },
    transactions: [
        {
            transaction_id: {
                type: String,
                required: true
            },
            month_number: {
                type: Number,
                required: true
            }
        }
    ]
});

// Enforce unique chitfund names per user
chitfundSchema.index({ user_id: 1, chitfund_name: 1 }, { unique: true });

export default mongoose.model.Chitfund || mongoose.model("Chitfund", chitfundSchema);
