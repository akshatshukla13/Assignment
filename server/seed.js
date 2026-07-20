import User from './models/User.js';
import Customer from './models/Customer.js';
import Product from './models/Product.js';
import StockMovement from './models/StockMovement.js';
import Challan from './models/Challan.js';
import bcrypt from 'bcryptjs';

export default async function seedData() {
  try {
    // ── USERS ──────────────────────────────────────────────
    const userDefs = [
      { username: 'admin',     password: 'admin123',     role: 'Admin' },
      { username: 'sales1',    password: 'sales123',     role: 'Sales' },
      { username: 'warehouse1',password: 'warehouse123', role: 'Warehouse' },
      { username: 'accounts1', password: 'accounts123',  role: 'Accounts' },
    ];

    const userMap = {};
    for (const u of userDefs) {
      let user = await User.findOne({ username: u.username });
      if (!user) {
        const hashed = await bcrypt.hash(u.password, 10);
        user = await User.create({ username: u.username, password: hashed, role: u.role });
        console.log(`Seed: Created user ${u.username} (${u.role})`);
      }
      userMap[u.username] = user._id;
    }

    const adminId = userMap['admin'];
    const salesId = userMap['sales1'];

    // ── CUSTOMERS ──────────────────────────────────────────
    const customerCount = await Customer.countDocuments();
    let customerIds = [];
    if (customerCount === 0) {
      const customers = await Customer.insertMany([
        { name: 'Rajesh Kumar',    mobile: '9876543210', email: 'rajesh@gmail.com',      businessName: 'Kumar Traders',         gstNumber: '27AAPFK1234A1Z5', type: 'Wholesale',   address: 'MG Road, Mumbai',           status: 'Active',   followUpDate: new Date('2026-08-01'), notes: 'Prefers morning calls', followUpNotes: [{ note: 'Interested in bulk order next month', addedBy: 'sales1', date: new Date() }] },
        { name: 'Priya Sharma',    mobile: '9812345678', email: 'priya@sharmastores.in', businessName: 'Sharma Stores',         gstNumber: '07BBBPL5678B2Z1', type: 'Retail',      address: 'Connaught Place, Delhi',    status: 'Active',   followUpDate: new Date('2026-07-25'), notes: 'Monthly payment cycle' },
        { name: 'Amit Patel',      mobile: '9898989898', email: 'amit@pateldist.com',    businessName: 'Patel Distributors',    gstNumber: '24CCCPD9012C3Z8', type: 'Distributor', address: 'Navrangpura, Ahmedabad',    status: 'Active',   followUpDate: new Date('2026-07-30'), notes: 'Covers entire Gujarat region' },
        { name: 'Sunita Reddy',    mobile: '9700001234', email: 'sunita@reddyent.com',   businessName: 'Reddy Enterprises',    gstNumber: '36DDDRE3456D4Z2', type: 'Wholesale',   address: 'Banjara Hills, Hyderabad',  status: 'Active',   followUpDate: new Date('2026-08-05') },
        { name: 'Vikram Singh',    mobile: '9988776655', email: 'vikram@vsingh.co',      businessName: 'V Singh & Co.',        gstNumber: '',                type: 'Retail',      address: 'Civil Lines, Jaipur',       status: 'Lead',     followUpDate: new Date('2026-07-22'), notes: 'Contacted via cold call', followUpNotes: [{ note: 'Sent product catalogue on WhatsApp', addedBy: 'sales1', date: new Date() }] },
        { name: 'Kavitha Nair',    mobile: '9446557788', email: 'kavitha@nairwhole.in',  businessName: 'Nair Wholesale Hub',   gstNumber: '32EEENW7890E5Z9', type: 'Wholesale',   address: 'Kochi, Kerala',             status: 'Active' },
        { name: 'Deepak Joshi',    mobile: '9321456789', email: 'deepak@joshitrade.com', businessName: 'Joshi Trading Co.',    gstNumber: '27FFFJT2345F6Z3', type: 'Distributor', address: 'Pune, Maharashtra',         status: 'Active',   followUpDate: new Date('2026-08-10') },
        { name: 'Meena Agarwal',   mobile: '9711234567', email: 'meena@agarwal.net',     businessName: 'Agarwal Retail',       gstNumber: '',                type: 'Retail',      address: 'Varanasi, UP',              status: 'Inactive', notes: 'On hold due to payment issues' },
        { name: 'Ravi Malhotra',   mobile: '9501122334', email: 'ravi@malhotra.biz',     businessName: 'Malhotra Brothers',    gstNumber: '03GGHMB4567G7Z6', type: 'Wholesale',   address: 'Amritsar, Punjab',          status: 'Active' },
        { name: 'Anita Desai',     mobile: '9664433221', email: 'anita@desaimart.in',    businessName: 'Desai Mart',           gstNumber: '24HHHDA8901H8Z0', type: 'Retail',      address: 'Surat, Gujarat',            status: 'Lead',     followUpDate: new Date('2026-07-28') },
        { name: 'Suresh Iyer',     mobile: '9445566778', email: 'suresh@iyercorp.com',   businessName: 'Iyer Corporation',     gstNumber: '33IIICI1234I9Z4', type: 'Distributor', address: 'Chennai, Tamil Nadu',       status: 'Active' },
        { name: 'Pooja Mehta',     mobile: '9876012345', email: 'pooja@mehtastore.co',   businessName: 'Mehta Store',          gstNumber: '',                type: 'Retail',      address: 'Gandhinagar, Gujarat',      status: 'Lead' },
        { name: 'Kiran Bhat',      mobile: '9980011223', email: 'kiran@bhattrade.in',    businessName: 'Bhat Trade Links',     gstNumber: '29JJJBT5678J0Z7', type: 'Wholesale',   address: 'Mangalore, Karnataka',      status: 'Active' },
        { name: 'Harish Yadav',    mobile: '9721345678', email: 'harish@yadavdist.com',  businessName: 'Yadav Distributors',   gstNumber: '09KKKYD9012K1Z1', type: 'Distributor', address: 'Lucknow, UP',               status: 'Active',   followUpDate: new Date('2026-08-15') },
        { name: 'Suman Chopra',    mobile: '9811223344', email: 'suman@chopra.net',      businessName: 'Chopra & Sons',        gstNumber: '06LLLCS3456L2Z5', type: 'Wholesale',   address: 'Gurugram, Haryana',         status: 'Active' },
      ]);
      customerIds = customers.map(c => c._id);
      console.log(`Seed: Created ${customers.length} customers`);
    } else {
      const existing = await Customer.find({}).select('_id').limit(15);
      customerIds = existing.map(c => c._id);
    }

    // ── PRODUCTS ───────────────────────────────────────────
    const productCount = await Product.countDocuments();
    let productDocs = [];
    if (productCount === 0) {
      const products = await Product.insertMany([
        { name: 'Basmati Rice (5kg)',     sku: 'GR-001', category: 'Grains',      unitPrice: 480,  currentStock: 200, minStockAlert: 30,  location: 'Warehouse A' },
        { name: 'Refined Oil (1L)',       sku: 'OL-001', category: 'Oils',        unitPrice: 140,  currentStock: 350, minStockAlert: 50,  location: 'Warehouse A' },
        { name: 'Atta (10kg)',            sku: 'GR-002', category: 'Grains',      unitPrice: 380,  currentStock: 180, minStockAlert: 40,  location: 'Warehouse B' },
        { name: 'Toor Dal (1kg)',         sku: 'PL-001', category: 'Pulses',      unitPrice: 130,  currentStock: 15,  minStockAlert: 20,  location: 'Warehouse A' },
        { name: 'Moong Dal (1kg)',        sku: 'PL-002', category: 'Pulses',      unitPrice: 120,  currentStock: 90,  minStockAlert: 25,  location: 'Warehouse A' },
        { name: 'Sugar (1kg)',            sku: 'SU-001', category: 'Sugar',       unitPrice: 45,   currentStock: 500, minStockAlert: 80,  location: 'Warehouse B' },
        { name: 'Rock Salt (1kg)',        sku: 'SA-001', category: 'Spices',      unitPrice: 25,   currentStock: 8,   minStockAlert: 30,  location: 'Warehouse C' },
        { name: 'Turmeric Powder (200g)', sku: 'SP-001', category: 'Spices',      unitPrice: 55,   currentStock: 75,  minStockAlert: 20,  location: 'Warehouse C' },
        { name: 'Red Chilli Powder (200g)',sku:'SP-002', category: 'Spices',      unitPrice: 65,   currentStock: 60,  minStockAlert: 15,  location: 'Warehouse C' },
        { name: 'Coriander Powder (200g)',sku: 'SP-003', category: 'Spices',      unitPrice: 50,   currentStock: 55,  minStockAlert: 15,  location: 'Warehouse C' },
        { name: 'Tea Leaves (500g)',      sku: 'BV-001', category: 'Beverages',   unitPrice: 200,  currentStock: 120, minStockAlert: 20,  location: 'Warehouse D' },
        { name: 'Coffee Powder (200g)',   sku: 'BV-002', category: 'Beverages',   unitPrice: 180,  currentStock: 6,   minStockAlert: 15,  location: 'Warehouse D' },
        { name: 'Biscuits Pack (200g)',   sku: 'SN-001', category: 'Snacks',      unitPrice: 30,   currentStock: 300, minStockAlert: 60,  location: 'Warehouse B' },
        { name: 'Ghee (500ml)',           sku: 'DY-001', category: 'Dairy',       unitPrice: 350,  currentStock: 80,  minStockAlert: 15,  location: 'Warehouse A' },
        { name: 'Butter (100g)',          sku: 'DY-002', category: 'Dairy',       unitPrice: 60,   currentStock: 150, minStockAlert: 30,  location: 'Warehouse A' },
        { name: 'Maida (5kg)',            sku: 'GR-003', category: 'Grains',      unitPrice: 220,  currentStock: 100, minStockAlert: 20,  location: 'Warehouse B' },
        { name: 'Sooji (1kg)',            sku: 'GR-004', category: 'Grains',      unitPrice: 45,   currentStock: 110, minStockAlert: 25,  location: 'Warehouse B' },
        { name: 'Mustard Seeds (200g)',   sku: 'SP-004', category: 'Spices',      unitPrice: 40,   currentStock: 200, minStockAlert: 30,  location: 'Warehouse C' },
        { name: 'Sunflower Oil (5L)',     sku: 'OL-002', category: 'Oils',        unitPrice: 680,  currentStock: 70,  minStockAlert: 10,  location: 'Warehouse A' },
        { name: 'Vermicelli (200g)',      sku: 'SN-002', category: 'Snacks',      unitPrice: 35,   currentStock: 250, minStockAlert: 40,  location: 'Warehouse B' },
      ]);
      productDocs = products;
      console.log(`Seed: Created ${products.length} products`);

      // Log initial stock movements
      const movements = products.map(p => ({
        product: p._id,
        quantity: p.currentStock,
        type: 'IN',
        reason: 'Initial Stock',
        createdBy: adminId,
        timestamp: new Date()
      }));
      await StockMovement.insertMany(movements);
    } else {
      productDocs = await Product.find({}).limit(20);
    }

    // ── CHALLANS ───────────────────────────────────────────
    const challanCount = await Challan.countDocuments();
    if (challanCount === 0 && customerIds.length > 0 && productDocs.length > 0) {
      const challanDefs = [
        { customer: customerIds[0], products: [
            { productId: productDocs[0]._id, name: productDocs[0].name, sku: productDocs[0].sku, unitPrice: productDocs[0].unitPrice, quantity: 10 },
            { productId: productDocs[1]._id, name: productDocs[1].name, sku: productDocs[1].sku, unitPrice: productDocs[1].unitPrice, quantity: 20 },
          ], status: 'Confirmed' },
        { customer: customerIds[1], products: [
            { productId: productDocs[2]._id, name: productDocs[2].name, sku: productDocs[2].sku, unitPrice: productDocs[2].unitPrice, quantity: 5 },
            { productId: productDocs[5]._id, name: productDocs[5].name, sku: productDocs[5].sku, unitPrice: productDocs[5].unitPrice, quantity: 15 },
          ], status: 'Draft' },
        { customer: customerIds[2], products: [
            { productId: productDocs[3]._id, name: productDocs[3].name, sku: productDocs[3].sku, unitPrice: productDocs[3].unitPrice, quantity: 8 },
            { productId: productDocs[7]._id, name: productDocs[7].name, sku: productDocs[7].sku, unitPrice: productDocs[7].unitPrice, quantity: 12 },
          ], status: 'Confirmed' },
        { customer: customerIds[3], products: [
            { productId: productDocs[10]._id, name: productDocs[10].name, sku: productDocs[10].sku, unitPrice: productDocs[10].unitPrice, quantity: 6 },
          ], status: 'Cancelled' },
        { customer: customerIds[4], products: [
            { productId: productDocs[12]._id, name: productDocs[12].name, sku: productDocs[12].sku, unitPrice: productDocs[12].unitPrice, quantity: 50 },
            { productId: productDocs[13]._id, name: productDocs[13].name, sku: productDocs[13].sku, unitPrice: productDocs[13].unitPrice, quantity: 10 },
          ], status: 'Draft' },
        { customer: customerIds[5], products: [
            { productId: productDocs[4]._id, name: productDocs[4].name, sku: productDocs[4].sku, unitPrice: productDocs[4].unitPrice, quantity: 30 },
          ], status: 'Confirmed' },
        { customer: customerIds[6], products: [
            { productId: productDocs[14]._id, name: productDocs[14].name, sku: productDocs[14].sku, unitPrice: productDocs[14].unitPrice, quantity: 25 },
            { productId: productDocs[16]._id, name: productDocs[16].name, sku: productDocs[16].sku, unitPrice: productDocs[16].unitPrice, quantity: 40 },
          ], status: 'Confirmed' },
        { customer: customerIds[0], products: [
            { productId: productDocs[18]._id, name: productDocs[18].name, sku: productDocs[18].sku, unitPrice: productDocs[18].unitPrice, quantity: 5 },
            { productId: productDocs[19]._id, name: productDocs[19].name, sku: productDocs[19].sku, unitPrice: productDocs[19].unitPrice, quantity: 20 },
          ], status: 'Draft' },
      ];

      for (let i = 0; i < challanDefs.length; i++) {
        const def = challanDefs[i];
        const challanNumber = `CH-${new Date().getFullYear()}-${(i + 1).toString().padStart(4, '0')}`;
        const totalQuantity = def.products.reduce((s, p) => s + p.quantity, 0);

        const challan = await Challan.create({
          challanNumber,
          customer: def.customer,
          products: def.products,
          totalQuantity,
          status: def.status,
          createdBy: salesId
        });

        // Deduct stock for confirmed challans
        if (def.status === 'Confirmed') {
          for (const item of def.products) {
            await Product.findByIdAndUpdate(item.productId, { $inc: { currentStock: -item.quantity } });
            await StockMovement.create({
              product: item.productId,
              quantity: item.quantity,
              type: 'OUT',
              reason: `Sales Challan: ${challanNumber}`,
              createdBy: salesId,
              timestamp: new Date()
            });
          }
        }
      }
      console.log(`Seed: Created ${challanDefs.length} challans`);
    }

    console.log('✅ Seed complete!');
  } catch (error) {
    console.error('Seed error:', error.message);
  }
}
