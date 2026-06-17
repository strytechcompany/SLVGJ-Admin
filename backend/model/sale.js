import mongoose, { Schema } from "mongoose";

const issuedItemSchema = new Schema({
  billNo: String,
  serialNo: String,
  itemName: String,
  purity: String,
  grossWeight: Number,
  stoneWeight: Number,
  netWeight: Number,
  weight: Number,
  currentCount: Number,
  purchaseCount: Number,
  sriCost: Number,
  sriBill: Number,
  plus: Number,
  paymentMode: String,
  date: Date
});

const saleSchema = new Schema({
  saleType: String,
  customerDetails: {
    name: String,
    phone: String,
    lastTransaction: String
  },
  date: String,
  time: String,
  issuedItems: [issuedItemSchema],
  totalIssuedValue: Number,
  status: String,
  receiptItems: [Schema.Types.Mixed],
  createdAt: Date,
  updatedAt: Date
}, { collection: 'sales' });

// We export a function to get the model using a specific connection database
export const getSaleModel = () => {
    const sriDb = mongoose.connection.useDb('SriVaishnaviJewellers', { useCache: true });
    return sriDb.model('Sale', saleSchema);
};
