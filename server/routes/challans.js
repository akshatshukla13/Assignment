import express from 'express';
import Challan from '../models/Challan.js';
import Product from '../models/Product.js';
import StockMovement from '../models/StockMovement.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

const generateChallanNumber = async () => {
  const count = await Challan.countDocuments();
  return `CH-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;
};

// GET /api/challans?status=&customer=&page=&limit=
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const query = {};
    if (status) query.status = status;

    const total = await Challan.countDocuments(query);
    const challans = await Challan.find(query)
      .populate('customer', 'name businessName mobile')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ challans, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/challans/:id
router.get('/:id', async (req, res) => {
  try {
    const challan = await Challan.findById(req.params.id)
      .populate('customer', 'name businessName mobile address gstNumber')
      .populate('createdBy', 'username');
    if (!challan) return res.status(404).json({ message: 'Challan not found' });
    res.json(challan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/challans
router.post('/', authorize('Admin', 'Sales'), async (req, res) => {
  try {
    const { customer, products, status } = req.body;
    if (!customer) return res.status(400).json({ message: 'Customer is required' });
    if (!products || products.length === 0) return res.status(400).json({ message: 'At least one product is required' });

    if (status === 'Confirmed') {
      for (let item of products) {
        const product = await Product.findById(item.productId);
        if (!product) return res.status(404).json({ message: `Product not found: ${item.name}` });
        if (product.currentStock < item.quantity) {
          return res.status(400).json({ message: `Insufficient stock for "${product.name}". Available: ${product.currentStock}, Requested: ${item.quantity}` });
        }
      }
    }

    const challanNumber = await generateChallanNumber();
    const totalQuantity = products.reduce((sum, p) => sum + Number(p.quantity), 0);

    const challan = await Challan.create({
      challanNumber,
      customer,
      products,
      totalQuantity,
      status: status || 'Draft',
      createdBy: req.user.id
    });

    if (challan.status === 'Confirmed') {
      for (let item of products) {
        const product = await Product.findById(item.productId);
        product.currentStock -= Number(item.quantity);
        await product.save();
        await StockMovement.create({
          product: product._id,
          quantity: Number(item.quantity),
          type: 'OUT',
          reason: `Sales Challan: ${challanNumber}`,
          createdBy: req.user.id
        });
      }
    }

    res.status(201).json(challan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PATCH /api/challans/:id/cancel
router.patch('/:id/cancel', authorize('Admin', 'Sales'), async (req, res) => {
  try {
    const challan = await Challan.findById(req.params.id);
    if (!challan) return res.status(404).json({ message: 'Challan not found' });
    if (challan.status === 'Cancelled') return res.status(400).json({ message: 'Challan is already cancelled' });
    if (challan.status === 'Confirmed') {
      // Restore stock
      for (let item of challan.products) {
        const product = await Product.findById(item.productId);
        if (product) {
          product.currentStock += Number(item.quantity);
          await product.save();
          await StockMovement.create({
            product: product._id,
            quantity: Number(item.quantity),
            type: 'IN',
            reason: `Challan Cancelled: ${challan.challanNumber}`,
            createdBy: req.user.id
          });
        }
      }
    }
    challan.status = 'Cancelled';
    await challan.save();
    res.json(challan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
