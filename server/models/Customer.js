import mongoose from 'mongoose';

const followUpNoteSchema = new mongoose.Schema({
  note: { type: String, required: true },
  addedBy: { type: String },
  date: { type: Date, default: Date.now }
});

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String },
  businessName: { type: String },
  gstNumber: { type: String },
  type: { type: String, enum: ['Retail', 'Wholesale', 'Distributor'], default: 'Retail' },
  address: { type: String },
  status: { type: String, enum: ['Lead', 'Active', 'Inactive'], default: 'Lead' },
  followUpDate: { type: Date },
  notes: { type: String },
  followUpNotes: [followUpNoteSchema]
}, { timestamps: true });

export default mongoose.model('Customer', customerSchema);
