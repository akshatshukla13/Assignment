import express from 'express';
import Product from '../models/Product.js';
import StockMovement from '../models/StockMovement.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

// GET /api/products?search=&category=&lowStock=true&page=&limit=
router.get('/', async (req, res) => {
  try {
    const { search, category, lowStock, page = 1, limit = 50 } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) query.category = category;

    const total = await Product.countDocuments(query);
    let products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    if (lowStock === 'true') {
      products = products.filter(p => p.currentStock <= p.minStockAlert);
    }

    res.json({ products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/products
router.post('/', authorize('Admin', 'Warehouse'), async (req, res) => {
  try {
    const { name, sku, unitPrice, currentStock, minStockAlert } = req.body;
    if (!name) return res.status(400).json({ message: 'Product name is required' });
    if (!sku) return res.status(400).json({ message: 'SKU is required' });
    if (unitPrice === undefined) return res.status(400).json({ message: 'Unit price is required' });
    if (currentStock === undefined) return res.status(400).json({ message: 'Current stock is required' });

    const product = await Product.create(req.body);
    if (product.currentStock > 0) {
      await StockMovement.create({
        product: product._id,
        quantity: product.currentStock,
        type: 'IN',
        reason: 'Initial Stock',
        createdBy: req.user.id
      });
    }
    res.status(201).json(product);
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'SKU already exists' });
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/products/:id
router.put('/:id', authorize('Admin', 'Warehouse'), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST /api/products/:id/stock — Manual stock adjustment
router.post('/:id/stock', authorize('Admin', 'Warehouse'), async (req, res) => {
  try {
    const { quantity, type, reason } = req.body;
    if (!quantity || !type) return res.status(400).json({ message: 'Quantity and type are required' });
    if (!['IN', 'OUT'].includes(type)) return res.status(400).json({ message: 'Type must be IN or OUT' });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (type === 'OUT' && product.currentStock < quantity) {
      return res.status(400).json({ message: `Insufficient stock. Available: ${product.currentStock}` });
    }

    product.currentStock = type === 'IN' ? product.currentStock + Number(quantity) : product.currentStock - Number(quantity);
    await product.save();

    const movement = await StockMovement.create({
      product: product._id,
      quantity: Number(quantity),
      type,
      reason: reason || 'Manual Adjustment',
      createdBy: req.user.id
    });

    res.status(201).json({ product, movement });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET /api/products/:id/movements
router.get('/:id/movements', async (req, res) => {
  try {
    const movements = await StockMovement.find({ product: req.params.id })
      .populate('createdBy', 'username')
      .sort({ timestamp: -1 })
      .limit(50);
    res.json(movements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
