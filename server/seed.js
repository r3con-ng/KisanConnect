import 'dotenv/config';
import mongoose from 'mongoose';
import { Dispute, Order, Payment, Product, Review, User, Verification } from './models.js';

const farmersData = [
  { key: '9876543210', name: 'Ram Kumar', nameHi: 'राम कुमार', village: 'Barkheda', district: 'Bhopal', state: 'Madhya Pradesh', verificationStatus: 'approved' },
  { key: '9876543211', name: 'Suresh Patel', nameHi: 'सुरेश पटेल', village: 'Hoshangabad', district: 'Hoshangabad', state: 'Madhya Pradesh', verificationStatus: 'approved' },
  { key: '9876543212', name: 'Mahesh Yadav', nameHi: 'महेश यादव', village: 'Sehore', district: 'Sehore', state: 'Madhya Pradesh', verificationStatus: 'pending' },
  { key: '9123456789', name: 'Gopal Verma', nameHi: 'गोपाल वर्मा', village: 'Vidisha', district: 'Vidisha', state: 'Madhya Pradesh', verificationStatus: 'pending' },
  { key: '9234567890', name: 'Lakshmi Devi', nameHi: 'लक्ष्मी देवी', village: 'Raisen', district: 'Raisen', state: 'Madhya Pradesh', verificationStatus: 'pending' },
  { key: '9345678901', name: 'Ravi Singh', nameHi: 'रवि सिंह', village: 'Betul', district: 'Betul', state: 'Madhya Pradesh', verificationStatus: 'rejected' },
];
const crops = [
  ['Potato','आलू','vegetables',25,500,0,'🥔'], ['Onion','प्याज़','vegetables',30,300,0,'🧅'], ['Wheat','गेहूँ','grains',22,1000,0,'🌾'], ['Soyabean','सोयाबीन','pulses',40,200,0,'🫘'], ['Pulses','दाल','pulses',80,150,0,'🫘'],
  ['Tomato','टमाटर','vegetables',35,400,1,'🍅'], ['Rice','चावल','grains',45,800,1,'🍚'], ['Carrot','गाजर','vegetables',40,250,2,'🥕'], ['Soyabean','सोयाबीन','pulses',38,180,2,'🫘'],
  ['Pulses','दाल','pulses',75,100,3,'🫘'], ['Wheat','गेहूँ','grains',24,600,3,'🌾'], ['Soyabean','सोयाबीन','pulses',42,220,4,'🫘'],
];

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kisanconnect');
try {
  if (await User.exists({})) {
    console.log('Seed skipped: the database already has users.');
    process.exitCode = 0;
  } else {
    const farmers = await User.insertMany(farmersData.map(({ key, ...farmer }) => ({ ...farmer, mobile: key, role: 'farmer' })));
    const consumer = await User.create({ name: 'Shyam', mobile: '9999999999', role: 'consumer' });
    await User.create({ name: 'Admin', mobile: '8888888888', role: 'admin' });
    const products = await Product.insertMany(crops.map(([name, nameHi, category, price, quantity, farmer, image]) => ({ name, nameHi, category, price, quantity, farmer: farmers[farmer]._id, image, unit: 'kg' })));
    const [ramPotato, ramOnion, ramWheat, sureshTomato] = [products[0], products[1], products[2], products[5]];
    const delivered = await Order.create({ checkoutId: 'CHK-DEMO01', consumer: consumer._id, farmer: farmers[0]._id, items: [{ product: ramPotato._id, name: 'Potato', quantity: 10, unitPrice: 25, unit: 'kg' }], total: 250, status: 'delivered', paymentMethod: 'UPI', paymentStatus: 'simulated', timeline: [{ status: 'placed', at: new Date('2026-05-01') }, { status: 'delivered', at: new Date('2026-05-03') }], createdAt: new Date('2026-05-01') });
    const order2 = await Order.create({ checkoutId: 'CHK-DEMO02', consumer: consumer._id, farmer: farmers[0]._id, items: [{ product: ramOnion._id, name: 'Onion', quantity: 5, unitPrice: 30, unit: 'kg' }], total: 150, status: 'in_transit', paymentMethod: 'Wallet', paymentStatus: 'simulated', timeline: [{ status: 'placed', at: new Date('2026-05-05') }, { status: 'in_transit', at: new Date('2026-05-07') }], createdAt: new Date('2026-05-05') });
    const sureshDelivered = await Order.create({ checkoutId: 'CHK-DEMO03', consumer: consumer._id, farmer: farmers[1]._id, items: [{ product: sureshTomato._id, name: 'Tomato', quantity: 8, unitPrice: 35, unit: 'kg' }], total: 280, status: 'delivered', paymentMethod: 'UPI', paymentStatus: 'simulated', timeline: [{ status: 'placed', at: new Date('2026-05-03') }, { status: 'delivered', at: new Date('2026-05-05') }], createdAt: new Date('2026-05-03') });
    await Payment.insertMany([
      { checkoutId: 'CHK-DEMO01', consumer: consumer._id, amount: 250, method: 'UPI', status: 'simulated', transactionId: 'DEMO-TXN001', createdAt: new Date('2026-05-01') },
      { checkoutId: 'CHK-DEMO02', consumer: consumer._id, amount: 150, method: 'Wallet', status: 'simulated', transactionId: 'DEMO-TXN002', createdAt: new Date('2026-05-05') },
      { checkoutId: 'CHK-DEMO03', consumer: consumer._id, amount: 280, method: 'UPI', status: 'simulated', transactionId: 'DEMO-TXN003', createdAt: new Date('2026-05-03') },
    ]);
    await Review.create({ farmer: farmers[0]._id, consumer: consumer._id, order: delivered._id, rating: 5, quality: 5, delivery: 5, packaging: 4, communication: 5, text: 'Fresh produce and a smooth delivery.' });
    await Review.create({ farmer: farmers[1]._id, consumer: consumer._id, order: sureshDelivered._id, rating: 4, quality: 4, delivery: 5, packaging: 4, communication: 4, text: 'Fresh tomatoes and clear communication.' });
    await Verification.insertMany([
      ...farmers.slice(0, 2).map(farmer => ({ farmer: farmer._id, application: 'approved', aadhaarLast4: '0001', kisanId: `DEMO-${farmer.mobile.slice(-4)}`, khasra: 'SAMPLE-01', village: farmer.village, district: farmer.district, state: farmer.state, submittedAt: new Date('2026-03-15'), reviewedAt: new Date('2026-03-16'), documents: { aadhaar: true, landProof: true, farmerPhoto: true } })),
      ...farmers.slice(2, 5).map((farmer, i) => ({ farmer: farmer._id, application: 'pending', aadhaarLast4: `000${i + 2}`, kisanId: `DEMO-${farmer.mobile.slice(-4)}`, khasra: `SAMPLE-0${i + 2}`, village: farmer.village, district: farmer.district, state: farmer.state, submittedAt: new Date(`2026-05-0${i + 6}`), documents: { aadhaar: true, landProof: true, farmerPhoto: true } })),
      { farmer: farmers[5]._id, application: 'rejected', aadhaarLast4: '0006', kisanId: 'DEMO-8901', khasra: 'SAMPLE-06', village: farmers[5].village, district: farmers[5].district, state: farmers[5].state, adminNote: 'Sample rejection for demo.', submittedAt: new Date('2026-04-15'), reviewedAt: new Date('2026-04-17') },
    ]);
    await Dispute.insertMany([
      { order: delivered._id, consumer: 'Shyam', farmer: 'Ram Kumar', issue: 'Sample issue: quality not as expected', status: 'open' },
      { order: order2._id, consumer: 'Shyam', farmer: 'Ram Kumar', issue: 'Sample issue: delivery timing', status: 'investigating' },
    ]);
    console.log('Demo seed created. Login OTP for every account: 123456.');
  }
} finally {
  await mongoose.disconnect();
}
