import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { authenticate, allow } from './middleware.js';
import { Dispute, Order, Payment, Product, Review, User, Verification } from './models.js';

const api = Router();
const tokenFor = (user) => jwt.sign({ sub: user.id }, process.env.JWT_SECRET || 'local-demo-secret-change-me', { expiresIn: '7d' });
const userView = (user) => ({ id: user.id, name: user.name, mobile: user.mobile, role: user.role, nameHi: user.nameHi, village: user.village, district: user.district, state: user.state, verificationStatus: user.verificationStatus });
const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

api.post('/auth/demo-login', asyncRoute(async (req, res) => {
  const mobile = String(req.body.mobile || '').replace(/\D/g, '');
  if (!/^\d{10}$/.test(mobile) || req.body.otp !== '123456') return res.status(400).json({ message: 'Enter a valid 10-digit mobile number and demo OTP 123456.' });
  const existing = await User.findOne({ mobile });
  const role = existing?.role || 'consumer';
  const user = existing || await User.create({ mobile, role, name: `Consumer ${mobile.slice(-4)}` });
  res.json({ token: tokenFor(user), user: userView(user) });
}));

api.get('/auth/me', authenticate, (req, res) => res.json({ user: userView(req.user) }));

api.get('/products', asyncRoute(async (req, res) => {
  const filter = { active: true, quantity: { $gt: 0 } };
  if (req.query.category && req.query.category !== 'all') filter.category = req.query.category;
  if (req.query.farmer) filter.farmer = req.query.farmer;
  if (req.query.search) filter.$or = [
    { name: { $regex: escapeRegex(String(req.query.search).slice(0, 80)), $options: 'i' } },
    { nameHi: { $regex: escapeRegex(String(req.query.search).slice(0, 80)), $options: 'i' } },
  ];
  const products = await Product.find(filter).populate('farmer', 'name nameHi village district verificationStatus');
  const farmerIds = [...new Set(products.map(product => String(product.farmer._id)))];
  const ratings = await Review.aggregate([
    { $match: { farmer: { $in: farmerIds.map(id => new Product.base.Types.ObjectId(id)) }, moderated: false } },
    { $group: { _id: '$farmer', rating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } },
  ]);
  const byFarmer = new Map(ratings.map(row => [String(row._id), row]));
  res.json(products.map(product => {
    const farmer = product.farmer.toObject();
    const stats = byFarmer.get(String(farmer._id));
    const rating = Number((stats?.rating || 0).toFixed(1));
    return { ...product.toObject(), farmer: { ...farmer, rating, totalReviews: stats?.totalReviews || 0, trustScore: Math.min(100, Math.round((farmer.verificationStatus === 'approved' ? 65 : 20) + rating * 7)) } };
  }));
}));

api.get('/farmers', asyncRoute(async (_req, res) => {
  const farmers = await User.find({ role: 'farmer' }).select('name nameHi village district state verificationStatus');
  const result = await Promise.all(farmers.map(async farmer => {
    const [ratings, products, orders] = await Promise.all([
      Review.find({ farmer: farmer._id, moderated: false }).select('rating'),
      Product.countDocuments({ farmer: farmer._id, active: true }),
      Order.countDocuments({ farmer: farmer._id, status: 'delivered' }),
    ]);
    const rating = ratings.length ? ratings.reduce((sum, row) => sum + row.rating, 0) / ratings.length : 0;
    return { ...userView(farmer), rating: Number(rating.toFixed(1)), totalReviews: ratings.length, totalOrders: orders, trustScore: Math.min(100, Math.round((farmer.verificationStatus === 'approved' ? 65 : 20) + rating * 7)), products };
  }));
  res.json(result);
}));

api.get('/reviews', asyncRoute(async (req, res) => {
  const filter = req.query.farmer ? { farmer: req.query.farmer, moderated: false } : {};
  res.json(await Review.find(filter).populate('consumer', 'name').populate('farmer', 'name').sort({ createdAt: -1 }));
}));

api.use(authenticate);

api.patch('/users/me/favorites/:productId', allow('consumer'), asyncRoute(async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) return res.status(404).json({ message: 'Product not found.' });
  const has = req.user.favorites.some(id => id.equals(product._id));
  req.user.favorites = has ? req.user.favorites.filter(id => !id.equals(product._id)) : [...req.user.favorites, product._id];
  await req.user.save();
  res.json({ favorites: req.user.favorites.map(String) });
}));
api.get('/users/me/favorites', allow('consumer'), asyncRoute(async (req, res) => {
  const user = await User.findById(req.user._id).populate({ path: 'favorites', populate: { path: 'farmer', select: 'name village district verificationStatus' } });
  res.json(user.favorites);
}));

api.get('/products/mine', allow('farmer'), asyncRoute(async (req, res) => res.json(await Product.find({ farmer: req.user._id }).sort({ createdAt: -1 }))));
api.post('/products', allow('farmer'), asyncRoute(async (req, res) => {
  const product = await Product.create({ ...req.body, farmer: req.user._id });
  res.status(201).json(product);
}));
api.patch('/products/:id', allow('farmer'), asyncRoute(async (req, res) => {
  const fields = ['name', 'nameHi', 'category', 'price', 'quantity', 'unit', 'image', 'active'];
  const updates = Object.fromEntries(fields.filter(key => req.body[key] !== undefined).map(key => [key, req.body[key]]));
  const product = await Product.findOneAndUpdate({ _id: req.params.id, farmer: req.user._id }, updates, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ message: 'Listing not found.' });
  res.json(product);
}));
api.delete('/products/:id', allow('farmer'), asyncRoute(async (req, res) => {
  const product = await Product.findOneAndUpdate({ _id: req.params.id, farmer: req.user._id }, { active: false }, { new: true });
  if (!product) return res.status(404).json({ message: 'Listing not found.' });
  res.json({ message: 'Listing removed.' });
}));

api.post('/orders/checkout', allow('consumer'), asyncRoute(async (req, res) => {
  const method = req.body.paymentMethod;
  if (!['UPI', 'Wallet', 'COD', 'Bank Transfer'].includes(method)) return res.status(400).json({ message: 'Choose a supported demo payment method.' });
  if (!Array.isArray(req.body.items) || !req.body.items.length) return res.status(400).json({ message: 'Your cart is empty.' });
  const quantities = new Map();
  for (const item of req.body.items) {
    const id = String(item.productId || ''); const qty = Number(item.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 10000) return res.status(400).json({ message: 'Item quantities must be whole numbers above zero.' });
    quantities.set(id, (quantities.get(id) || 0) + qty);
  }
  const productIds = [...quantities.keys()];
  const products = await Product.find({ _id: { $in: productIds }, active: true }).populate('farmer', 'name');
  if (products.length !== productIds.length) return res.status(409).json({ message: 'A listing in your cart is no longer available. Refresh your cart.' });
  const byFarmer = new Map(); let total = 0;
  for (const product of products) {
    const quantity = quantities.get(String(product._id));
    if (product.quantity < quantity) return res.status(409).json({ message: `${product.name} only has ${product.quantity} ${product.unit} available.` });
    const key = String(product.farmer._id);
    if (!byFarmer.has(key)) byFarmer.set(key, { farmer: product.farmer._id, items: [], total: 0 });
    const group = byFarmer.get(key); const subtotal = product.price * quantity;
    group.items.push({ product: product._id, name: product.name, quantity, unitPrice: product.price, unit: product.unit });
    group.total += subtotal; total += subtotal;
  }
  const checkoutId = `CHK-${randomUUID().slice(0, 8).toUpperCase()}`;
  const decremented = [];
  const created = [];
  try {
    for (const product of products) {
      const quantity = quantities.get(String(product._id));
      const updated = await Product.findOneAndUpdate({ _id: product._id, active: true, quantity: { $gte: quantity } }, { $inc: { quantity: -quantity } }, { new: true });
      if (!updated) throw Object.assign(new Error(`${product.name} stock changed during checkout. Please try again.`), { status: 409 });
      decremented.push([product._id, quantity]);
    }
    for (const group of byFarmer.values()) {
      created.push(await Order.create({ checkoutId, consumer: req.user._id, ...group, paymentMethod: method, paymentStatus: method === 'COD' ? 'pending' : 'simulated', timeline: [{ status: 'placed', at: new Date() }] }));
    }
    const payment = await Payment.create({ checkoutId, consumer: req.user._id, amount: total, method, status: method === 'COD' ? 'pending' : 'simulated', transactionId: `DEMO-${randomUUID().slice(0, 10).toUpperCase()}` });
    res.status(201).json({ checkoutId, orders: created, payment, message: 'Demo checkout completed.' });
  } catch (error) {
    if (created.length) await Order.deleteMany({ _id: { $in: created.map(order => order._id) } });
    for (const [id, quantity] of decremented) await Product.updateOne({ _id: id }, { $inc: { quantity } });
    throw error;
  }
}));

api.get('/orders', asyncRoute(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : req.user.role === 'farmer' ? { farmer: req.user._id } : { consumer: req.user._id };
  res.json(await Order.find(filter).populate('farmer', 'name mobile village').populate('consumer', 'name mobile').sort({ createdAt: -1 }));
}));
api.patch('/orders/:id/status', allow('farmer', 'admin'), asyncRoute(async (req, res) => {
  const allowed = ['accepted', 'packed', 'in_transit', 'delivered', 'cancelled'];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ message: 'Invalid order status.' });
  const filter = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, farmer: req.user._id };
  const order = await Order.findOne(filter);
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  const nextAllowed = { placed: ['accepted', 'cancelled'], accepted: ['packed', 'cancelled'], packed: ['in_transit', 'cancelled'], in_transit: ['delivered'], delivered: [], cancelled: [] };
  if (!nextAllowed[order.status].includes(req.body.status)) return res.status(409).json({ message: `Order cannot move from ${order.status} to ${req.body.status}.` });
  order.status = req.body.status; order.timeline.push({ status: order.status, at: new Date() }); await order.save();
  res.json(order);
}));

api.get('/payments', asyncRoute(async (req, res) => {
  if (req.user.role === 'farmer') {
    const orders = await Order.find({ farmer: req.user._id }).select('checkoutId total paymentMethod paymentStatus createdAt');
    const checkouts = [...new Set(orders.map(order => order.checkoutId))];
    const payments = await Payment.find({ checkoutId: { $in: checkouts } }).sort({ createdAt: -1 });
    const byCheckout = new Map(payments.map(payment => [payment.checkoutId, payment]));
    return res.json(orders.map(order => {
      const payment = byCheckout.get(order.checkoutId);
      return payment ? { ...payment.toObject(), amount: order.total, transactionId: `${payment.transactionId}-${String(order._id).slice(-5)}`, paymentStatus: order.paymentStatus } : null;
    }).filter(Boolean));
  }
  const filter = req.user.role === 'admin' ? {} : { consumer: req.user._id };
  res.json(await Payment.find(filter).sort({ createdAt: -1 }));
}));

api.post('/reviews', allow('consumer'), asyncRoute(async (req, res) => {
  const order = await Order.findOne({ _id: req.body.orderId, consumer: req.user._id, status: 'delivered' });
  if (!order) return res.status(400).json({ message: 'You can review an order after it has been delivered.' });
  const review = await Review.create({ farmer: order.farmer, consumer: req.user._id, order: order._id, rating: req.body.rating, quality: req.body.quality, delivery: req.body.delivery, packaging: req.body.packaging, communication: req.body.communication, text: req.body.text });
  res.status(201).json(review);
}));

api.get('/kyc/me', allow('farmer'), asyncRoute(async (req, res) => res.json(await Verification.findOne({ farmer: req.user._id }))));
api.post('/kyc', allow('farmer'), asyncRoute(async (req, res) => {
  const fields = ['aadhaarLast4', 'kisanId', 'khasra', 'village', 'district', 'state'];
  const details = Object.fromEntries(fields.filter(key => req.body[key] !== undefined).map(key => [key, req.body[key]]));
  const application = await Verification.findOneAndUpdate({ farmer: req.user._id }, {
    ...details, application: 'pending', submittedAt: new Date(), adminNote: '',
    documents: { aadhaar: Boolean(req.body.documents?.aadhaar), landProof: Boolean(req.body.documents?.landProof), farmerPhoto: Boolean(req.body.documents?.farmerPhoto) },
  }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
  req.user.verificationStatus = 'pending'; await req.user.save();
  res.status(201).json(application);
}));
api.get('/admin/overview', allow('admin'), asyncRoute(async (_req, res) => {
  const [farmers, consumers, products, orders, pending, payments, reviews, disputes] = await Promise.all([
    User.countDocuments({ role: 'farmer' }), User.countDocuments({ role: 'consumer' }), Product.countDocuments({ active: true }), Order.countDocuments(),
    Verification.countDocuments({ application: 'pending' }), Payment.aggregate([{ $group: { _id: null, revenue: { $sum: '$amount' } } }]), Review.countDocuments(), Dispute.countDocuments({ status: { $ne: 'resolved' } }),
  ]);
  res.json({ farmers, consumers, products, orders, pendingVerifications: pending, simulatedPaymentVolume: payments[0]?.revenue || 0, reviews, activeDisputes: disputes });
}));
api.get('/admin/verifications', allow('admin'), asyncRoute(async (req, res) => {
  const filter = req.query.status ? { application: req.query.status } : {};
  res.json(await Verification.find(filter).populate('farmer', 'name mobile village district state').sort({ submittedAt: -1 }));
}));
api.patch('/admin/verifications/:id', allow('admin'), asyncRoute(async (req, res) => {
  if (!['approved', 'rejected', 'reupload'].includes(req.body.application)) return res.status(400).json({ message: 'Choose approve, reject, or request re-upload.' });
  const verification = await Verification.findByIdAndUpdate(req.params.id, { application: req.body.application, adminNote: String(req.body.adminNote || '').slice(0, 500), reviewedAt: new Date() }, { new: true }).populate('farmer');
  if (!verification) return res.status(404).json({ message: 'Application not found.' });
  verification.farmer.verificationStatus = verification.application; await verification.farmer.save();
  res.json(verification);
}));
api.get('/admin/reviews', allow('admin'), asyncRoute(async (_req, res) => res.json(await Review.find().populate('consumer farmer', 'name').populate('order', 'checkoutId').sort({ createdAt: -1 }))));
api.patch('/admin/reviews/:id', allow('admin'), asyncRoute(async (req, res) => {
  const review = await Review.findByIdAndUpdate(req.params.id, { moderated: Boolean(req.body.moderated), reported: Boolean(req.body.reported) }, { new: true });
  if (!review) return res.status(404).json({ message: 'Review not found.' });
  res.json(review);
}));
api.get('/admin/disputes', allow('admin'), asyncRoute(async (_req, res) => res.json(await Dispute.find().sort({ createdAt: -1 }))));
api.patch('/admin/disputes/:id', allow('admin'), asyncRoute(async (req, res) => {
  if (!['open', 'investigating', 'resolved'].includes(req.body.status)) return res.status(400).json({ message: 'Invalid dispute status.' });
  const dispute = await Dispute.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!dispute) return res.status(404).json({ message: 'Dispute not found.' });
  res.json(dispute);
}));

export default api;
