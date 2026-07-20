import express from 'express';
import Customer from '../models/Customer.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

// GET /api/customers?search=&status=&type=&page=&limit=
router.get('/', async (req, res) => {
  try {
    const { search, status, type, page = 1, limit = 50 } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) query.status = status;
    if (type) query.type = type;

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ customers, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/customers/:id
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/customers
router.post('/', authorize('Admin', 'Sales'), async (req, res) => {
  try {
    const { name, mobile } = req.body;
    if (!name) return res.status(400).json({ message: 'Customer name is required' });
    if (!mobile) return res.status(400).json({ message: 'Mobile number is required' });
    const customer = await Customer.create(req.body);
    res.status(201).json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/customers/:id
router.put('/:id', authorize('Admin', 'Sales'), async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST /api/customers/:id/notes — Add a follow-up note
router.post('/:id/notes', authorize('Admin', 'Sales'), async (req, res) => {
  try {
    const { note } = req.body;
    if (!note) return res.status(400).json({ message: 'Note text is required' });
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    customer.followUpNotes.unshift({ note, addedBy: req.user.username });
    await customer.save();
    res.status(201).json(customer.followUpNotes);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
