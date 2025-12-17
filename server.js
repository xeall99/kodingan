require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'auctionation',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// uploads
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(path.join(__dirname)));

// UTIL
async function getCategoriesForItem(conn, itemId) {
  const [rows] = await conn.query(
    `SELECT c.name FROM item_categories ic
     JOIN categories c ON ic.categoryId = c.id
     WHERE ic.itemId = ?`, [itemId]
  );
  return rows.map(r => r.name);
}

// AUTH

// Ensure password reset columns exist (safe on startup)
(async function ensureResetColumns() {
  try {
    const [cols] = await pool.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME IN ('resetToken','resetTokenExpiry')");
    const existing = cols.map(c => c.COLUMN_NAME);
    if (!existing.includes('resetToken')) await pool.query("ALTER TABLE users ADD COLUMN resetToken VARCHAR(255) DEFAULT NULL");
    if (!existing.includes('resetTokenExpiry')) await pool.query("ALTER TABLE users ADD COLUMN resetTokenExpiry DATETIME DEFAULT NULL");
  } catch (err) {
    console.warn('Could not ensure reset columns (non-fatal):', err.message);
  }
})();

app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email & password diperlukan' });
  try {
    const conn = await pool.getConnection();
    const [exist] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
    if (exist.length) { conn.release(); return res.status(400).json({ error: 'Email sudah terdaftar' }); }
    const hash = await bcrypt.hash(password, 10);
    const [r] = await conn.query('INSERT INTO users (name,email,password) VALUES (?, ?, ?)', [name || '', email, hash]);
    const userId = r.insertId;
    conn.release();
    res.json({ message: 'Registrasi berhasil', user: { id: userId, name: name || '', email } });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email & password diperlukan' });
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT id, name, email, password, phone, address, instagram, twitter, photo FROM users WHERE email = ?', [email]);
    conn.release();
    if (!rows.length) return res.status(401).json({ error: 'Email atau password salah' });
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Email atau password salah' });
    delete user.password;
    res.json({ user });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// PASSWORD RESET
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email diperlukan' });
  try {
    res.json({ message: 'Jika email terdaftar, Anda dapat langsung memasukkan password baru.' });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.post('/api/reset-password', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email dan password baru diperlukan' });
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
    if (!rows.length) { conn.release(); 
      return res.json({ message: 'Jika email terdaftar, password telah diperbarui.' }); }
    const user = rows[0];
    const hash = await bcrypt.hash(password, 10);
    await conn.query('UPDATE users SET password = ? WHERE id = ?', [hash, user.id]);
    conn.release();
    res.json({ message: 'Password berhasil direset. Silakan login dengan password baru Anda.' });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, phone, address, instagram, twitter, photo FROM users WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json({ user: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/users/:id', upload.single('photo'), async (req, res) => {
  try {
    const id = req.params.id;
    const { name, phone, address, instagram, twitter } = req.body;
    let photoPath = null;
    if (req.file) photoPath = `/uploads/${req.file.filename}`;
    const conn = await pool.getConnection();
    await conn.query('UPDATE users SET name=?, phone=?, address=?, instagram=?, twitter=?, photo=COALESCE(?, photo) WHERE id=?',
      [name, phone, address, instagram, twitter, photoPath, id]);
    const [rows] = await conn.query('SELECT id, name, email, phone, address, instagram, twitter, photo FROM users WHERE id = ?', [id]);
    conn.release();
    res.json({ user: rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ITEMS
app.get('/api/items', async (req, res) => {
  try {
    const [items] = await pool.query(`SELECT i.*, u.name AS sellerName, u.phone AS sellerPhone, u.photo AS sellerPhoto
      FROM items i LEFT JOIN users u ON i.sellerId = u.id
      WHERE i.status IN ('active','pending_payment') ORDER BY i.id DESC`);
    for (const it of items) {
      it.categories = await getCategoriesForItem(pool, it.id);
    }
    res.json(items);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.get('/api/items/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await pool.query(`SELECT i.*, u.name AS sellerName, u.phone AS sellerPhone, u.photo AS sellerPhoto
      FROM items i LEFT JOIN users u ON i.sellerId = u.id
      WHERE i.id = ?`, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Item tidak ditemukan' });
    const item = rows[0];
    item.categories = await getCategoriesForItem(pool, item.id);
    res.json({ item });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.post('/api/items', upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, endTime, sellerId, categories } = req.body;
    if (!name || !price || !endTime || !sellerId) return res.status(400).json({ error: 'Nama, harga, endTime dan sellerId diperlukan' });
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    const conn = await pool.getConnection();
    const [r] = await conn.query('INSERT INTO items (name,image,description,price,endTime,sellerId,status) VALUES (?,?,?,?,?,?, "active")',
      [name, image, description || '', price, endTime, sellerId]);
    const itemId = r.insertId;
    const catList = categories ? JSON.parse(categories) : [];
    for (const catName of catList) {
      const [cRow] = await conn.query('SELECT id FROM categories WHERE name = ?', [catName]);
      let catId;
      if (cRow.length) catId = cRow[0].id;
      else {
        const [nr] = await conn.query('INSERT INTO categories (name) VALUES (?)', [catName]);
        catId = nr.insertId;
      }
      await conn.query('INSERT INTO item_categories (itemId, categoryId) VALUES (?,?)', [itemId, catId]);
    }
    conn.release();
    res.json({ message: 'Item ditambahkan', itemId });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.delete('/api/items/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query('DELETE FROM item_categories WHERE itemId = ?', [id]);
    await pool.query('DELETE FROM bids WHERE itemId = ?', [id]);
    await pool.query('DELETE FROM wishlist WHERE itemId = ?', [id]);
    await pool.query('DELETE FROM items WHERE id = ?', [id]);
    res.json({ message: 'Item dihapus' });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.put('/api/items/:id', upload.single('image'), async (req, res) => {
  try {
    const id = req.params.id;
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT * FROM items WHERE id = ?', [id]);
    if (!rows.length) { conn.release(); return res.status(404).json({ error: 'Item tidak ditemukan' }); }
    const item = rows[0];
    const sellerId = req.body.sellerId || req.body.ownerId;
    if (!sellerId || parseInt(sellerId) !== item.sellerId) { conn.release(); return res.status(403).json({ error: 'Hanya penjual dapat mengedit item ini' }); }

    const { name, description, price, endTime, categories } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : item.image;

    await conn.query('UPDATE items SET name=?, image=?, description=?, price=?, endTime=? WHERE id = ?', [name || item.name, image, description || item.description, price || item.price, endTime || item.endTime, id]);

    if (categories) {
      await conn.query('DELETE FROM item_categories WHERE itemId = ?', [id]);
      const catList = JSON.parse(categories || '[]');
      for (const catName of catList) {
        const [cRow] = await conn.query('SELECT id FROM categories WHERE name = ?', [catName]);
        let catId;
        if (cRow.length) catId = cRow[0].id;
        else {
          const [nr] = await conn.query('INSERT INTO categories (name) VALUES (?)', [catName]);
          catId = nr.insertId;
        }
        await conn.query('INSERT INTO item_categories (itemId, categoryId) VALUES (?,?)', [id, catId]);
      }
    }

    conn.release();
    res.json({ message: 'Item diperbarui' });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.post('/api/items/:id/select-winner', async (req, res) => {
  try {
    const id = req.params.id;
    const { sellerId, winnerId, bidId } = req.body;
    if (!sellerId) return res.status(400).json({ error: 'sellerId diperlukan' });
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT * FROM items WHERE id = ?', [id]);
    if (!rows.length) { conn.release(); return res.status(404).json({ error: 'Item tidak ditemukan' }); }
    const item = rows[0];
    if (parseInt(sellerId) !== item.sellerId) { conn.release(); return res.status(403).json({ error: 'Hanya penjual dapat memilih pemenang' }); }

    let resolvedWinner = winnerId;
    if (!resolvedWinner && bidId) {
      const [brows] = await conn.query('SELECT * FROM bids WHERE id = ?', [bidId]);
      if (!brows.length) { conn.release(); return res.status(404).json({ error: 'Bid tidak ditemukan' }); }
      resolvedWinner = brows[0].userId;
    }
    if (!resolvedWinner) { conn.release(); return res.status(400).json({ error: 'winnerId atau bidId diperlukan' }); }

    const paymentDeadline = new Date(Date.now() + 24*60*60*1000);
    await conn.query("UPDATE items SET status='pending_payment', winnerId=?, paymentDeadline=? WHERE id=?", [resolvedWinner, paymentDeadline, id]);
    const [itRows] = await conn.query('SELECT * FROM items WHERE id = ?', [id]);
    const it = itRows[0];
    const msg = `Selamat! Anda dipilih sebagai pemenang untuk item \"${it.name || 'barang'}\". Mohon selesaikan pembayaran dalam 24 jam.`;
    await conn.query('INSERT INTO notifications (userId, itemId, type, message) VALUES (?,?,?,?)', [resolvedWinner, id, 'won_manual', msg]);
    const sellerMsg = `Anda telah memilih userId ${resolvedWinner} sebagai pemenang untuk item \"${it.name || 'barang'}\"`;
    await conn.query('INSERT INTO notifications (userId, itemId, type, message) VALUES (?,?,?,?)', [it.sellerId, id, 'winner_selected', sellerMsg]);
    conn.release();
    res.json({ message: 'Pemenang dipilih', winnerId: resolvedWinner });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// BIDS
app.post('/api/bids', async (req, res) => {
  try {
    const { userId, itemId, amount } = req.body;
    if (!userId || !itemId || !amount) return res.status(400).json({ error: 'userId, itemId, amount diperlukan' });
    const [items] = await pool.query('SELECT * FROM items WHERE id = ?', [itemId]);
    if (!items.length) return res.status(404).json({ error: 'Item tidak ditemukan' });
    const item = items[0];
    // cek status dan ownership
    if (item.status && item.status !== 'active') return res.status(400).json({ error: 'Lelang tidak aktif' });
    if (parseInt(item.sellerId) === parseInt(userId)) return res.status(400).json({ error: 'Anda tidak dapat menawar item Anda sendiri' });
    if (new Date(item.endTime) <= new Date()) return res.status(400).json({ error: 'Lelang sudah berakhir' });
    if (parseFloat(amount) <= parseFloat(item.price)) return res.status(400).json({ error: 'Bid harus lebih besar dari harga sekarang' });

    const [prev] = await pool.query('SELECT userId, amount FROM bids WHERE itemId = ? ORDER BY amount DESC LIMIT 1', [itemId]);

    await pool.query('INSERT INTO bids (userId, itemId, amount) VALUES (?,?,?)', [userId, itemId, amount]);
    await pool.query('UPDATE items SET price = ? WHERE id = ?', [amount, itemId]);

    const [urows] = await pool.query('SELECT name FROM users WHERE id = ?', [userId]);
    const bidderName = urows.length ? urows[0].name : `User ${userId}`;
    const sellerMsg = `Pengguna ${bidderName} menawar item "${item.name || 'barang'}" sebesar Rp ${amount}`;
    await pool.query('INSERT INTO notifications (userId, itemId, type, message) VALUES (?,?,?,?)', [item.sellerId, itemId, 'new_bid', sellerMsg]);

    if (prev.length && prev[0].userId && parseInt(prev[0].userId) !== parseInt(userId)) {
      const prevMsg = `Anda ter-outbid pada item "${item.name || 'barang'}". Penawaran baru: Rp ${amount}`;
      await pool.query('INSERT INTO notifications (userId, itemId, type, message) VALUES (?,?,?,?)', [prev[0].userId, itemId, 'outbid', prevMsg]);
    }

    res.json({ message: 'Bid berhasil' });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.get('/api/bids', async (req, res) => {
  try {
    const { userId, itemId } = req.query;
    if (userId) {

      const [rows] = await pool.query(`
        SELECT b.*, i.name AS itemTitle, i.image AS itemImage, i.description AS itemDescription,
               i.price AS currentPrice, i.status AS itemStatus, i.winnerId AS itemWinnerId,
               u.name AS sellerName, u.phone AS sellerPhone,
               (SELECT MAX(amount) FROM bids WHERE itemId = b.itemId) AS highestBid
        FROM bids b
        JOIN items i ON b.itemId = i.id
        LEFT JOIN users u ON i.sellerId = u.id
        WHERE b.userId = ?
        ORDER BY b.time DESC
      `, [userId]);
      return res.json({ bids: rows });
    }
    if (itemId) {
      const [rows] = await pool.query('SELECT * FROM bids WHERE itemId = ? ORDER BY amount DESC, time DESC', [itemId]);
      return res.json(rows);
    }
    const [rows] = await pool.query('SELECT * FROM bids ORDER BY id DESC');
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// WISHLIST
app.post('/api/wishlist', async (req, res) => {
  try {
    const { userId, itemId } = req.body;
    if (!userId || !itemId) return res.status(400).json({ error: 'userId & itemId diperlukan' });
    const [exist] = await pool.query('SELECT id FROM wishlist WHERE userId = ? AND itemId = ?', [userId, itemId]);
    if (exist.length) {
      await pool.query('DELETE FROM wishlist WHERE id = ?', [exist[0].id]);
      return res.json({ message: 'Dihapus dari wishlist' });
    }
    await pool.query('INSERT INTO wishlist (userId, itemId) VALUES (?,?)', [userId, itemId]);
    res.json({ message: 'Ditambahkan ke wishlist' });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.get('/api/wishlist/:userId', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT i.* FROM wishlist w JOIN items i ON w.itemId = i.id WHERE w.userId = ?', [req.params.userId]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

  app.post('/api/payments', upload.single('proof'), async (req, res) => {
    try {
      const { itemId, userId, amount, method } = req.body;
      if (!itemId || !userId) return res.status(400).json({ error: 'itemId & userId diperlukan' });
      const proofPath = req.file ? `/uploads/${req.file.filename}` : null;
      const conn = await pool.getConnection();

      await conn.query('INSERT INTO payments (itemId,userId,amount,method,proof,time) VALUES (?,?,?,?,?,NOW())',
        [itemId, userId, amount || 0, method || 'unknown', proofPath]);
  
      await conn.query("UPDATE items SET status='sold', winnerId=? WHERE id=?", [userId, itemId]);
      
      const [itRows] = await conn.query('SELECT * FROM items WHERE id = ?', [itemId]);
      if (itRows.length) {
        const it = itRows[0];
        const buyerMsg = `Pembayaran diterima untuk item \"${it.name || 'barang'}\". Terima kasih.`;
        const sellerMsg = `Item Anda \"${it.name || 'barang'}\" telah terjual kepada userId ${userId}.`;
        await conn.query('INSERT INTO notifications (userId, itemId, type, message) VALUES (?,?,?,?)', [userId, itemId, 'payment_received', buyerMsg]);
        await conn.query('INSERT INTO notifications (userId, itemId, type, message) VALUES (?,?,?,?)', [it.sellerId, itemId, 'sold', sellerMsg]);
      }
      conn.release();
      res.json({ message: 'Pembayaran diterima' });
    } catch (err) {
      console.error('payments error', err);
      res.status(500).json({ error: err.message });
    }
  });


// AUTO CHECK
setInterval(async () => {
  try {
    const now = new Date();
    const [items] = await pool.query("SELECT * FROM items WHERE status = 'active'");
    for (const it of items) {
      if (new Date(it.endTime) <= now) {
        const [hb] = await pool.query('SELECT userId, MAX(amount) AS maxBid FROM bids WHERE itemId = ? GROUP BY itemId', [it.id]);
        if (hb.length) {
          await pool.query("UPDATE items SET status='pending_payment', winnerId=?, paymentDeadline=? WHERE id=?", [hb[0].userId, new Date(now.getTime() + 24*60*60*1000), it.id]);
          const [itRows] = await pool.query('SELECT * FROM items WHERE id = ?', [it.id]);
          const item = itRows[0];
          const winnerMsg = `Selamat! Anda terpilih sebagai pemenang otomatis untuk item \"${item.name || 'barang'}\". Mohon selesaikan pembayaran dalam 24 jam.`;
          const sellerMsg = `Item Anda \"${item.name || 'barang'}\" telah berakhir dan pemenang dipilih (userId ${hb[0].userId}).`;
          await pool.query('INSERT INTO notifications (userId, itemId, type, message) VALUES (?,?,?,?)', [hb[0].userId, it.id, 'won_auto', winnerMsg]);
          await pool.query('INSERT INTO notifications (userId, itemId, type, message) VALUES (?,?,?,?)', [item.sellerId, it.id, 'winner_selected', sellerMsg]);
        } else {
          await pool.query("UPDATE items SET status='expired' WHERE id=?", [it.id]);
        }
      }
    }
  } catch (err) { console.error('Auto-check error', err); }
}, 60 * 1000);

// ADMIN AUTHENTICATION
const ADMIN_ID = 'ADMIN-12345';

function isAdmin(req) {
    // Cek dari header atau session
    return req.headers['x-admin-id'] === ADMIN_ID || 
           req.query.adminId === ADMIN_ID;
}

// ADMIN: ITEMS MANAGEMENT
app.delete('/api/admin/items/:id', async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Unauthorized' });
    
    try {
        const id = req.params.id;
        const conn = await pool.getConnection();
        
        await conn.query('DELETE FROM item_categories WHERE itemId = ?', [id]);
        await conn.query('DELETE FROM bids WHERE itemId = ?', [id]);
        await conn.query('DELETE FROM wishlist WHERE itemId = ?', [id]);
        const [result] = await conn.query('DELETE FROM items WHERE id = ?', [id]);
        
        conn.release();
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Item tidak ditemukan' });
        }
        
        res.json({ message: 'Item berhasil dihapus', deletedId: id });
    } catch (err) {
        console.error('DELETE /api/admin/items error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/items/:id', async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Unauthorized' });
    
    try {
        const id = req.params.id;
        const { status, isRecommended, recommendedPriority } = req.body;
        const conn = await pool.getConnection();
        
        let query = 'UPDATE items SET';
        let values = [];
        
        if (status) {
            query += ' status = ?,';
            values.push(status);
        }
        if (typeof isRecommended !== 'undefined') {
            query += ' isRecommended = ?,';
            values.push(isRecommended ? 1 : 0);
        }
        if (recommendedPriority) {
            query += ' recommendedPriority = ?,';
            values.push(recommendedPriority);
        }
        
        // Remove trailing comma
        query = query.slice(0, -1);
        query += ' WHERE id = ?';
        values.push(id);
        
        await conn.query(query, values);
        const [updated] = await conn.query('SELECT * FROM items WHERE id = ?', [id]);
        
        conn.release();
        
        res.json({ message: 'Item updated', item: updated[0] });
    } catch (err) {
        console.error('PUT /api/admin/items error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ADMIN: USERS MANAGEMENT
app.get('/api/admin/users', async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Unauthorized' });
    
    try {
        const conn = await pool.getConnection();
        const [users] = await conn.query(
            'SELECT id, name, email, phone, address, photo, createdAt FROM users ORDER BY id DESC'
        );
        conn.release();
        
        res.json({ users });
    } catch (err) {
        console.error('GET /api/admin/users error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/users/:id', async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Unauthorized' });
    
    try {
        const id = req.params.id;
        const conn = await pool.getConnection();
        
        await conn.query('DELETE FROM wishlist WHERE userId = ? OR itemId IN (SELECT id FROM items WHERE sellerId = ?)', [id, id]);
        await conn.query('DELETE FROM bids WHERE userId = ? OR itemId IN (SELECT id FROM items WHERE sellerId = ?)', [id, id]);
        await conn.query('DELETE FROM item_categories WHERE itemId IN (SELECT id FROM items WHERE sellerId = ?)', [id]);
        await conn.query('DELETE FROM items WHERE sellerId = ?', [id]);
        const [result] = await conn.query('DELETE FROM users WHERE id = ?', [id]);
        
        conn.release();
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User tidak ditemukan' });
        }
        
        res.json({ message: 'User berhasil dihapus', deletedId: id });
    } catch (err) {
        console.error('DELETE /api/admin/users error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/users/inactive', async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Unauthorized' });
    
    try {
        const conn = await pool.getConnection();
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        const [inactiveUsers] = await conn.query(`
            SELECT u.id, u.name, u.email, u.phone, MAX(GREATEST(
                (SELECT MAX(time) FROM bids WHERE userId = u.id),
                (SELECT MAX(endTime) FROM items WHERE sellerId = u.id),
                u.createdAt
            )) as lastActivity
            FROM users u
            WHERE (SELECT MAX(time) FROM bids WHERE userId = u.id) < ?
            OR ((SELECT MAX(endTime) FROM items WHERE sellerId = u.id) < ? AND (SELECT COUNT(*) FROM items WHERE sellerId = u.id) = 0)
            GROUP BY u.id
            ORDER BY lastActivity DESC
        `, [thirtyDaysAgo, thirtyDaysAgo]);
        
        conn.release();
        
        res.json({ inactiveUsers: inactiveUsers || [] });
    } catch (err) {
        console.error('GET /api/admin/users/inactive error:', err);
        res.status(500).json({ error: err.message });
    }
});

// NOTIFICATIONS
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const [rows] = await pool.query('SELECT * FROM notifications WHERE userId = ? ORDER BY time DESC', [userId]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query('UPDATE notifications SET readFlag = 1 WHERE id = ?', [id]);
    res.json({ message: 'Notification marked read' });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// HISTORY 
app.get('/api/items/history', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId diperlukan' });
    const [rows] = await pool.query("SELECT * FROM items WHERE (winnerId = ? OR sellerId = ?) AND status IN ('ended','sold','pending_payment') ORDER BY id DESC", [userId, userId]);
    for (const it of rows) {
      it.categories = await getCategoriesForItem(pool, it.id);
    }
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ADMIN: STATISTICS
app.get('/api/admin/stats', async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Unauthorized' });
    
    try {
        const conn = await pool.getConnection();
        
        // Total items
        const [itemStats] = await conn.query(
            'SELECT COUNT(*) as total, SUM(CASE WHEN status = "active" THEN 1 ELSE 0 END) as active FROM items'
        );
        
        // Total users
        const [userStats] = await conn.query('SELECT COUNT(*) as total FROM users');
        
        // Total bids
        const [bidStats] = await conn.query('SELECT COUNT(*) as total, SUM(amount) as totalValue FROM bids');
        
        // Total payments
        const [paymentStats] = await conn.query('SELECT COUNT(*) as total, SUM(amount) as totalValue FROM payments');
        
        // Top sellers
        const [topSellers] = await conn.query(`
            SELECT u.id, u.name, COUNT(i.id) as itemCount, MAX(i.price) as highestBid
            FROM users u
            LEFT JOIN items i ON u.id = i.sellerId
            GROUP BY u.id
            ORDER BY itemCount DESC
            LIMIT 5
        `);
        
        conn.release();
        
        res.json({
            stats: {
                items: {
                    total: itemStats[0].total,
                    active: itemStats[0].active,
                    expired: itemStats[0].total - (itemStats[0].active || 0)
                },
                users: {
                    total: userStats[0].total
                },
                bids: {
                    total: bidStats[0].total,
                    totalValue: bidStats[0].totalValue || 0
                },
                payments: {
                    total: paymentStats[0].total,
                    totalValue: paymentStats[0].totalValue || 0
                },
                topSellers
            }
        });
    } catch (err) {
        console.error('GET /api/admin/stats error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ADMIN: RECOMMENDATIONS
app.post('/api/admin/items/:id/recommend', async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Unauthorized' });
    
    try {
        const id = req.params.id;
        const { priority } = req.body;
        const conn = await pool.getConnection();
        
        await conn.query(
            'UPDATE items SET isRecommended = 1, recommendedPriority = ?, recommendedDate = NOW() WHERE id = ?',
            [priority || 1, id]
        );
        
        const [updated] = await conn.query('SELECT * FROM items WHERE id = ?', [id]);
        conn.release();
        
        res.json({ message: 'Item ditambahkan ke rekomendasi', item: updated[0] });
    } catch (err) {
        console.error('POST /api/admin/items/recommend error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/items/recommended', async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Unauthorized' });
    
    try {
        const conn = await pool.getConnection();
        const [items] = await conn.query(`
            SELECT * FROM items 
            WHERE isRecommended = 1 
            ORDER BY recommendedPriority ASC, recommendedDate DESC
        `);
        conn.release();
        
        res.json({ items });
    } catch (err) {
        console.error('GET /api/admin/items/recommended error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
