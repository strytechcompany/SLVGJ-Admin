import mongoose, { Schema } from "mongoose";

const rateSchema = new Schema({
    type: {
        type: String,
        enum: ["gold", "silver"],
        required: true
    },
    rate: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.models.Rate || mongoose.model('Rate', rateSchema);
