const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize, User, Item, Order, Chat, Message, Transaction, Review } = require('./models');
const { uploadToSupabase } = require('./utils/supabase');
const { Op } = require('sequelize');
require('dotenv').config();

const app = express();
const JWT_SECRET = "super_secret_hackathon_key"; 
const ADMIN_ID = 9999; 

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../client/dist')));
const upload = multer({ storage: multer.memoryStorage() });

// --- MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Access Denied" });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid Token" });
    req.user = user;
    next();
  });
};

const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (user && user.is_admin) next();
        else res.status(403).json({ error: "Admin Only" });
    } catch (e) { res.status(500).json({ error: "Auth Check Failed" }); }
};

const requireVerification = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(401).json({ error: "User not found" });
        if (user.is_admin) return next();
        if (!user.is_verified) return res.status(403).json({ error: "Verification Required" });
        next();
    } catch (e) { res.status(500).json({ error: "Verification Check Failed" }); }
};

// --- ORDER REQUEST (FIXED CALCULATION) ---
app.post('/api/orders/request', authenticateToken, requireVerification, async (req, res) => {
    try {
        const { total_cost, start_date, duration, ...rest } = req.body;
        const item = await Item.findByPk(req.body.item_id);
        
        if (!item) return res.status(404).json({ error: "Item not found" });
        if (item.UserId === req.user.id) return res.status(400).json({error: "Cannot rent own item"});
        
        // Recalculate on Server for Safety
        const pricePerDay = item.price_day;
        const isSale = item.listing_type === 'SELL';
        
        // Base Price: If Rent, multiply by days. If Sale, flat price.
        const basePrice = isSale ? pricePerDay : (pricePerDay * (parseInt(duration) || 1));
        const platformFee = Math.round(basePrice * 0.02);
        const finalTotal = basePrice + platformFee;
        const ownerAmount = basePrice; 
        
        let endDate = null;
        if (start_date && duration) { 
            const d = new Date(start_date); 
            d.setDate(d.getDate() + parseInt(duration)); 
            endDate = d; 
        }

        const newOrder = await Order.create({
            status: 'PENDING_APPROVAL',
            total_amount: finalTotal, 
            platform_fee: platformFee, 
            owner_amount: ownerAmount, 
            start_date: start_date || null,
            duration_days: duration || 0,
            end_date: endDate,
            BuyerId: req.user.id,
            SellerId: item.UserId,
            ItemId: item.id,
            project_details: rest.project_details,
            buyer_details: rest.buyer_details
        });
        res.json({ success: true, order_id: newOrder.id });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: err.message }); 
    }
});

// --- ORDER CONFIRMATION (FIXED: DELETE SOLD ITEM) ---
app.post('/api/orders/:id/confirm', authenticateToken, async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);
        if (!order) return res.status(404).json({ error: "Order not found" });
        
        if (order.status === 'COMPLETED') {
            return res.json({ success: true, message: "Order already completed" });
        }

        // Update Confirmation Flags
        if (order.BuyerId === req.user.id) await order.update({ buyer_confirmed: true });
        if (order.SellerId === req.user.id) await order.update({ seller_confirmed: true });
        
        const updated = await Order.findByPk(req.params.id);

        // Execute Transfer ONLY if both confirmed AND in Escrow
        if (updated.buyer_confirmed && updated.seller_confirmed && updated.status === 'IN_ESCROW') {
            
            await sequelize.transaction(async (t) => {
                const seller = await User.findByPk(updated.SellerId);
                const admin = await User.findOne({ where: { id: ADMIN_ID } });
                
                // Credit Seller & Admin
                await seller.update({ wallet_balance: seller.wallet_balance + updated.owner_amount }, { transaction: t });
                if (admin) {
                    await admin.update({ wallet_balance: admin.wallet_balance + updated.platform_fee }, { transaction: t });
                }
                
                await Transaction.create({ type: 'CREDIT', amount: updated.owner_amount, description: `Earnings: Order #${updated.id}`, UserId: seller.id }, { transaction: t });
                await updated.update({ status: 'COMPLETED' }, { transaction: t });

                // --- NEW: DELETE ITEM IF SOLD ---
                const item = await Item.findByPk(updated.ItemId);
                if (item && item.listing_type === 'SELL') {
                    console.log(`🔥 Item Sold! Removing "${item.title}" from listings...`);
                    await item.destroy({ transaction: t });
                }
            });
        }
        res.json({ success: true });
    } catch (e) { 
        console.error("Confirm Error:", e);
        res.status(500).json({ error: e.message }); 
    }
});

// --- WALLET PAY ---
app.post('/api/wallet/pay', authenticateToken, async (req, res) => {
    const { order_id } = req.body;
    try {
        const order = await Order.findByPk(order_id);
        
        if (order.status !== 'APPROVED_PAY_PENDING') {
             return res.status(400).json({ error: "Order not ready or already paid" });
        }

        const buyer = await User.findByPk(req.user.id);
        if (buyer.wallet_balance < order.total_amount) {
            return res.status(400).json({ error: "Insufficient Funds" });
        }

        await sequelize.transaction(async (t) => {
            await buyer.update({ wallet_balance: buyer.wallet_balance - order.total_amount }, { transaction: t });
            await Transaction.create({ type: 'DEBIT', amount: order.total_amount, description: `Payment: Order #${order.id}`, UserId: buyer.id }, { transaction: t });
            await order.update({ status: 'IN_ESCROW' }, { transaction: t });
        });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});


// --- OTHER ROUTES ---

// Auth
app.post('/api/auth/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = await User.create({ ...req.body, password: hashedPassword });
    res.json({ success: true, user: { id: user.id, name: user.name } });
  } catch (err) { res.status(400).json({ error: "User exists" }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const user = await User.findOne({ where: { name: req.body.username } });
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: user.id, name: user.name }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, is_verified: user.is_verified, is_admin: user.is_admin, verification_status: user.verification_status } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/user/me', authenticateToken, async (req, res) => {
    const user = await User.findByPk(req.user.id);
    res.json(user);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Verification
const otpStore = {}; 
app.post('/api/otp/send', (req, res) => {
    // In production, we don't send real SMS. 
    // We tell the frontend to use the Magic OTP.
    console.log(`OTP Generated for ${req.body.mobile}: 123456`);
    res.json({ success: true, message: "OTP Sent" });
});

app.post('/api/otp/verify', (req, res) => {
    const { otp } = req.body;
    
    // Allow the Magic OTP "123456" OR the generated one (for local testing)
    if (otp === "123456" || (otpStore[req.body.mobile] == otp)) {
        if (otpStore[req.body.mobile]) delete otpStore[req.body.mobile];
        res.json({ success: true });
    } else {
        res.status(400).json({ error: "Invalid OTP" });
    }
});
app.post('/api/verify/submit', authenticateToken, upload.fields([{ name: 'selfie' }, { name: 'id_proof' }]), async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        let selfieUrl = null, idUrl = null;
        if (req.files['selfie']) selfieUrl = await uploadToSupabase(req.files['selfie'][0]);
        if (req.files['id_proof']) idUrl = await uploadToSupabase(req.files['id_proof'][0]);
        await user.update({ selfie_url: selfieUrl, id_proof_url: idUrl, mobile_number: req.body.mobile, verification_status: 'PENDING' });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin
app.get('/api/admin/pending', authenticateToken, isAdmin, async (req, res) => res.json(await User.findAll({ where: { verification_status: 'PENDING' } })));
app.get('/api/admin/verified', authenticateToken, isAdmin, async (req, res) => res.json(await User.findAll({ where: { verification_status: 'APPROVED' } })));
app.post('/api/admin/approve-user/:id', authenticateToken, isAdmin, async (req, res) => {
    await User.update({ verification_status: 'APPROVED', is_verified: true }, { where: { id: req.params.id } });
    res.json({ success: true });
});
app.post('/api/admin/user/:id/status', authenticateToken, isAdmin, async (req, res) => {
    const { status } = req.body;
    const isVerified = status === 'APPROVED';
    await User.update({ verification_status: status, is_verified: isVerified }, { where: { id: req.params.id } });
    res.json({ success: true });
});
app.get('/api/admin/wallet', authenticateToken, isAdmin, async (req, res) => {
    const admin = await User.findByPk(ADMIN_ID);
    res.json({ balance: admin ? admin.wallet_balance : 0 });
});

// Items
app.get('/api/parts', async (req, res) => {
  const { location, search, category, user_id, sort, type } = req.query;
  const whereClause = {};
  if (user_id) whereClause.UserId = user_id;
  if (location) whereClause.location = { [Op.iLike]: `%${location}%` };
  if (category) whereClause.category = category;
  if (type) whereClause.listing_type = type;
  if (search) {
      whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
          { part_number: { [Op.iLike]: `%${search}%` } }
      ];
  }
  let orderClause = [['createdAt', 'DESC']];
  if (sort === 'price_asc') orderClause = [['price_day', 'ASC']];
  if (sort === 'price_desc') orderClause = [['price_day', 'DESC']];

  const parts = await Item.findAll({ where: whereClause, include: [{ model: User, attributes: ['name', 'is_verified', 'avg_rating'] }], order: orderClause });
  res.json(parts);
});

app.post('/api/parts', authenticateToken, requireVerification, upload.single('image'), async (req, res) => {
  try {
    let imageUrl = null;
    if (req.file) imageUrl = await uploadToSupabase(req.file);
    const newItem = await Item.create({ ...req.body, price_day: parseFloat(req.body.price_day)||0, image_url: imageUrl, UserId: req.user.id });
    res.json(newItem);
  } catch(e) { res.status(500).json({error: e.message}) }
});
app.delete('/api/parts/:id', authenticateToken, async (req, res) => {
    await Item.destroy({ where: { id: req.params.id, UserId: req.user.id }});
    res.json({success: true});
});
app.put('/api/parts/:id', authenticateToken, async (req, res) => {
    await Item.update(req.body, { where: { id: req.params.id, UserId: req.user.id }});
    res.json({success: true});
});

app.get('/api/orders', authenticateToken, async (req, res) => {
    const orders = await Order.findAll({
        where: { [Op.or]: [{ BuyerId: req.user.id }, { SellerId: req.user.id }] },
        include: [{ model: Item }, { model: User, as: 'Buyer' }, { model: User, as: 'Seller' }],
        order: [['createdAt', 'DESC']]
    });
    res.json(orders);
});
app.post('/api/orders/:id/approve', authenticateToken, async (req, res) => {
    await Order.update({ status: 'APPROVED_PAY_PENDING' }, { where: { id: req.params.id } });
    res.json({ success: true });
});

// Bank Logic
const bankOtpStore = {}; 
app.post('/api/bank/otp', (req, res) => {
    const otp = Math.floor(1000 + Math.random() * 9000);
    bankOtpStore['latest'] = otp; 
    console.log(`\n🔵 BANK OTP: ${otp}\n`);
    res.json({ success: true });
});
app.post('/api/wallet/deposit', authenticateToken, async (req, res) => {
    const { amount, otp } = req.body;
    if (parseInt(bankOtpStore['latest']) !== parseInt(otp)) return res.status(400).json({ error: "Invalid OTP" });
    try {
        await sequelize.transaction(async (t) => {
            const user = await User.findByPk(req.user.id);
            await user.update({ wallet_balance: user.wallet_balance + amount }, { transaction: t });
            await Transaction.create({ type: 'CREDIT', amount: amount, description: `Deposit`, UserId: user.id }, { transaction: t });
        });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/wallet/withdraw', authenticateToken, async (req, res) => {
    const { amount } = req.body;
    try {
        const user = await User.findByPk(req.user.id);
        if (user.wallet_balance < amount) return res.status(400).json({ error: "Insufficient Balance" });
        await sequelize.transaction(async (t) => {
            await user.update({ wallet_balance: user.wallet_balance - amount }, { transaction: t });
            await Transaction.create({ type: 'DEBIT', amount: amount, description: `Withdrawal`, UserId: user.id }, { transaction: t });
        });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Chat
app.get('/api/chats', authenticateToken, async (req, res) => {
    const chats = await Chat.findAll({ where: { [Op.or]: [{ User1Id: req.user.id }, { User2Id: req.user.id }] }, include: [{ model: User, as: 'User1' }, { model: User, as: 'User2' }, { model: Item }] });
    res.json(chats);
});
app.get('/api/chats/:id/messages', authenticateToken, async (req, res) => {
    const messages = await Message.findAll({ where: { ChatId: req.params.id }, order: [['createdAt', 'ASC']] });
    res.json(messages);
});
app.post('/api/messages', authenticateToken, async (req, res) => {
    const { chat_id, content } = req.body;
    const chat = await Chat.findByPk(chat_id);
    await Message.create({ ChatId: chat_id, SenderId: req.user.id, content });
    await chat.update({ last_message: content, last_message_at: new Date() });
    res.json({ success: true });
});
app.post('/api/support/chat', authenticateToken, async (req, res) => {
    let chat = await Chat.findOne({ where: { [Op.or]: [{ User1Id: req.user.id, User2Id: ADMIN_ID }, { User1Id: ADMIN_ID, User2Id: req.user.id }] }, include: [{ model: User, as: 'User1' }, { model: User, as: 'User2' }] });
    if (!chat) chat = await Chat.create({ User1Id: req.user.id, User2Id: ADMIN_ID, last_message: "Ticket Created" });
    res.json(chat);
});
app.get('/api/admin/support-chats', authenticateToken, isAdmin, async (req, res) => {
    const chats = await Chat.findAll({ where: { [Op.or]: [{ User1Id: ADMIN_ID }, { User2Id: ADMIN_ID }] }, include: [{ model: User, as: 'User1' }, { model: User, as: 'User2' }], order: [['updatedAt', 'DESC']] });
    res.json(chats);
});

// Reviews
app.post('/api/reviews', authenticateToken, async (req, res) => {
    const { order_id, rating, comment } = req.body;
    try {
        const order = await Order.findByPk(order_id);
        if (order.is_reviewed) return res.status(400).json({ error: "Reviewed" });
        const target = await User.findByPk(order.SellerId);
        const newSum = target.rating_sum + rating;
        const newCount = target.rating_count + 1;
        await target.update({ rating_sum: newSum, rating_count: newCount, avg_rating: (newSum/newCount).toFixed(1) });
        await Review.create({ rating, comment, OrderId: order_id, TargetUserId: order.SellerId });
        await order.update({ is_reviewed: true });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Calendar
app.get('/api/items/:id/bookings', async (req, res) => {
    const bookings = await Order.findAll({ where: { ItemId: req.params.id, status: { [Op.not]: 'CANCELLED' }, start_date: { [Op.not]: null } }, attributes: ['start_date', 'duration_days'] });
    let blockedDates = [];
    bookings.forEach(b => { const start = new Date(b.start_date); for (let i = 0; i < b.duration_days; i++) { const date = new Date(start); date.setDate(start.getDate() + i); blockedDates.push(date.toISOString().split('T')[0]); } });
    res.json(blockedDates);
});

sequelize.sync({ alter: true }).then(async () => {
    await User.findOrCreate({ where: { id: ADMIN_ID }, defaults: { name: 'Admin', email: 'admin@ps.com', password: await bcrypt.hash('admin123', 10), is_admin: true, wallet_balance: 0, is_verified: true } });
    console.log('PartSphere Server Running');
    app.listen(5000, () => console.log('Server 5000'));
});