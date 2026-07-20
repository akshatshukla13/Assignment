import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  category: { type: String },
  unitPrice: { type: Number, required: true },
  currentStock: { type: Number, required: true, default: 0 },
  minStockAlert: { type: Number, default: 10 },
  location: { type: String },
  imageBase64: { type: String, default: null }   // optional base64 product image
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
