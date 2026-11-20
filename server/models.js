import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true }, mobile: { type: String, required: true, unique: true },
  role: { type: String, enum: ['farmer', 'consumer', 'admin'], required: true },
  nameHi: String, village: String, district: String, state: String,
  verificationStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected', 'reupload'], default: 'none' },
  favorites: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
}, { timestamps: true });

const productSchema = new Schema({
  name: { type: String, required: true, trim: true }, nameHi: String,
  category: { type: String, enum: ['vegetables', 'grains', 'pulses', 'fruits', 'other'], default: 'vegetables' },
  price: { type: Number, required: true, min: 1 }, quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, default: 'kg' }, image: { type: String, default: '🌱' },
  farmer: { type: Schema.Types.ObjectId, ref: 'User', required: true }, active: { type: Boolean, default: true },
}, { timestamps: true });

const verificationSchema = new Schema({
  farmer: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  application: { type: String, enum: ['pending', 'approved', 'rejected', 'reupload'], default: 'pending' },
  // Prototype only: never store real Aadhaar numbers or identity documents.
  aadhaarLast4: { type: String, maxlength: 4 }, kisanId: String, khasra: String,
  village: String, district: String, state: String,
  documents: { aadhaar: { type: Boolean, default: false }, landProof: { type: Boolean, default: false }, farmerPhoto: { type: Boolean, default: false } },
  adminNote: String, submittedAt: Date, reviewedAt: Date,
}, { timestamps: true });

const orderSchema = new Schema({
  checkoutId: { type: String, required: true, index: true },
  consumer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  farmer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{ product: { type: Schema.Types.ObjectId, ref: 'Product' }, name: String, quantity: Number, unitPrice: Number, unit: String }],
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['placed', 'accepted', 'packed', 'in_transit', 'delivered', 'cancelled'], default: 'placed' },
  paymentMethod: { type: String, enum: ['UPI', 'Wallet', 'COD', 'Bank Transfer'], required: true },
  paymentStatus: { type: String, enum: ['simulated', 'pending'], default: 'simulated' },
  timeline: [{ status: String, at: Date }],
}, { timestamps: true });

const paymentSchema = new Schema({
  checkoutId: { type: String, required: true, index: true }, consumer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true }, method: String,
  status: { type: String, enum: ['simulated', 'pending'], default: 'simulated' },
  transactionId: { type: String, required: true, unique: true },
}, { timestamps: true });

const reviewSchema = new Schema({
  farmer: { type: Schema.Types.ObjectId, ref: 'User', required: true }, consumer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: Schema.Types.ObjectId, ref: 'Order', required: true }, rating: { type: Number, min: 1, max: 5, required: true },
  quality: Number, delivery: Number, packaging: Number, communication: Number,
  text: { type: String, maxlength: 1000 }, reported: { type: Boolean, default: false }, moderated: { type: Boolean, default: false },
}, { timestamps: true });
reviewSchema.index({ order: 1, consumer: 1 }, { unique: true });

const disputeSchema = new Schema({
  order: { type: Schema.Types.ObjectId, ref: 'Order' }, consumer: String, farmer: String,
  issue: { type: String, required: true }, status: { type: String, enum: ['open', 'investigating', 'resolved'], default: 'open' },
}, { timestamps: true });

export const User = model('User', userSchema);
export const Product = model('Product', productSchema);
export const Verification = model('Verification', verificationSchema);
export const Order = model('Order', orderSchema);
export const Payment = model('Payment', paymentSchema);
export const Review = model('Review', reviewSchema);
export const Dispute = model('Dispute', disputeSchema);
