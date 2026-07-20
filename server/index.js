import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customers.js';
import productRoutes from './routes/products.js';
import challanRoutes from './routes/challans.js';
import userRoutes from './routes/users.js';
import seedData from './seed.js';

dotenv.config();

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://assignment-sigma-ivory-46.vercel.app'
];

if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/challans', challanRoutes);
app.use('/api/users', userRoutes);

// Root Showcase Landing Page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mini ERP + CRM API Portal • Akshat Shukla</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.15), transparent 35%),
                            radial-gradient(circle at bottom left, rgba(16, 185, 129, 0.1), transparent 30%),
                            linear-gradient(135deg, #090d16 0%, #030712 100%);
                color: #f8fafc;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                overflow-x: hidden;
            }
            .card {
                background: rgba(17, 24, 39, 0.7);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 28px;
                padding: 3rem 2rem;
                max-width: 440px;
                width: 90%;
                text-align: center;
                box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6),
                            inset 0 1px 1px rgba(255, 255, 255, 0.1);
                animation: floatIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            @keyframes floatIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .avatar {
                width: 84px;
                height: 84px;
                background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%);
                border-radius: 24px;
                margin: 0 auto 1.5rem;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 2.2rem;
                font-weight: 800;
                color: white;
                box-shadow: 0 10px 25px rgba(99, 102, 241, 0.35);
                transform: rotate(-3deg);
                transition: transform 0.3s ease;
            }
            .card:hover .avatar {
                transform: rotate(0deg) scale(1.05);
            }
            h1 {
                font-size: 2rem;
                margin: 0 0 0.4rem;
                font-weight: 800;
                letter-spacing: -0.03em;
                background: linear-gradient(to right, #ffffff, #94a3b8);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            p.role {
                color: #818cf8;
                font-size: 0.9rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.15em;
                margin: 0 0 1.5rem;
            }
            p.desc {
                color: #94a3b8;
                font-size: 0.95rem;
                line-height: 1.6;
                margin: 0 0 2rem;
            }
            .btn-group {
                display: flex;
                flex-direction: column;
                gap: 0.85rem;
            }
            .btn {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.65rem;
                padding: 0.9rem;
                border-radius: 14px;
                text-decoration: none;
                font-weight: 600;
                font-size: 0.95rem;
                transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .btn-primary {
                background: linear-gradient(135deg, #4f46e5 0%, #2563eb 100%);
                color: white;
                box-shadow: 0 4px 15px rgba(79, 70, 229, 0.25);
            }
            .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(79, 70, 229, 0.45);
                filter: brightness(1.1);
            }
            .btn-secondary {
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.08);
                color: #e2e8f0;
            }
            .btn-secondary:hover {
                background: rgba(255, 255, 255, 0.08);
                border-color: rgba(255, 255, 255, 0.15);
                transform: translateY(-2px);
            }
            .footer {
                margin-top: 2rem;
                font-size: 0.75rem;
                color: #4b5563;
                border-top: 1px solid rgba(255, 255, 255, 0.05);
                padding-top: 1.5rem;
            }
            .pulse-dot {
                display: inline-block;
                width: 7px;
                height: 7px;
                background-color: #10b981;
                border-radius: 50%;
                margin-right: 6px;
                box-shadow: 0 0 8px #10b981;
                animation: pulse 1.8s infinite;
            }
            @keyframes pulse {
                0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
                100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
            }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="avatar">AS</div>
            <h1>Akshat Shukla</h1>
            <p class="role">Full Stack Developer</p>
            <p class="desc">Mini ERP + CRM Operations Portal backend system deployment. Constructed using Node.js, Express, and MongoDB.</p>
            <div class="btn-group">
                <a href="https://github.com/akshatshukla13/Assignment/blob/main/README.md" target="_blank" class="btn btn-primary">📖 View README Documentation</a>
                <a href="https://github.com/akshatshukla13" target="_blank" class="btn btn-secondary">💻 Visit GitHub Profile</a>
                <a href="mailto:akshatvijay1302@gmail.com" class="btn btn-secondary">✉️ Get In Touch</a>
            </div>
            <div class="footer">
                <span class="pulse-dot"></span> API Gateway Online & Secure
            </div>
        </div>
    </body>
    </html>
  `);
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mini-erp-crm';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    await seedData();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection error:', err));

export default app;
