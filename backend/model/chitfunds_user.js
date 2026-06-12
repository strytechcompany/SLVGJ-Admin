import mongoose, { Schema } from "mongoose";

const chitfundUserSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    address: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

// const chitfundSchema = new Schema({
//     name: {
//         type: String,
//         required: true
//     },
//     email: {
//         type: String,
//         required: true,
//         unique: true
//     },
//     phone: {
//         type: String,
//         required: true,
//         unique: true
//     },
//     address: {
//         type: String,
//         required: true
//     },
//     password: {
//         type: String,
//         required: true
//     },
//     chitfund: [
//         {
//             chitfund_id: {
//                 type: String,
//                 required: true
//             },
//             chitfund_name: {
//                 type: String,
//                 required: true
//             },
//             chitfund_amount: {
//                 type: Number,
//                 required: true
//             },
//             chitfund_duration: {
//                 type: Number,
//                 default: 12
//             },
//             chitfund_type: {
//                 type: String,
//                 enum: ["GOLD", "SILVER", "CASH"]
//             },
//             status: {
//                 type: String,
//                 enum: ["PENDING", "ACCEPTED", "REJECTED"],
//                 default: "PENDING"
//             },
//             months_paid: {
//                 type: Number,
//                 default: 0
//             },
//             is_completed: {
//                 type: Boolean,
//                 default: false
//             },
//             start_date: {
//                 type: Date,
//                 default: Date.now
//             },
//             chitfund_transactions: [
//                 {
//                     month_number: {
//                         type: Number,
//                         required: true
//                     },
//                     month_name: {
//                         type: String,
//                         required: true
//                     },
//                     payment_method: {
//                         type: String,
//                         required: true,
//                         enum: ["CASH", "UPI", "CARD"]
//                     },
//                     amount: {
//                         type: Number,
//                         required: true
//                     },
//                     date: {
//                         type: Date,
//                         default: Date.now
//                     }
//                 }
//             ]
//         }
//     ]
// });

export default mongoose.model.ChitfundUser || mongoose.model("ChitfundUser", chitfundUserSchema);
