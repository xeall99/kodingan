const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

let items = [];
let bids = [];
let wishlist = [];
let users = [];

app.get('/api/items', (req, res) => {
    res.json(items);
});

app.post('/api/items', (req, res) => {
    const item = req.body;
    items.push(item);
    res.json(item);
});

app.delete('/api/items/:id', (req, res) => {
    const id = parseInt(req.params.id);
    items = items.filter(item => item.id !== id);
    bids = bids.filter(bid => bid.itemId !== id);
    wishlist = wishlist.filter(w => w !== id);
    res.json({ success: true });
});

app.get('/api/bids', (req, res) => {
    res.json(bids);
});

app.post('/api/bids', (req, res) => {
    const bid = req.body;
    bids.push(bid);
    // Update item price
    const item = items.find(i => i.id === bid.itemId);
    if (item) item.price = bid.amount;
    res.json(bid);
});

app.get('/api/wishlist', (req, res) => {
    res.json(wishlist);
});

app.post('/api/wishlist', (req, res) => {
    const { itemId } = req.body;
    if (!wishlist.includes(itemId)) wishlist.push(itemId);
    res.json({ success: true });
});

app.delete('/api/wishlist/:id', (req, res) => {
    const id = parseInt(req.params.id);
    wishlist = wishlist.filter(w => w !== id);
    res.json({ success: true });
});

app.listen(3000, () => console.log('Backend running on http://localhost:3000'));
