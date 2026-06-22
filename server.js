// 確保 dotenv 在最頂端第一行執行
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Record = require('./models/Record'); // 📌 引入剛剛建立的記帳模型

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// 1. 會員註冊與登入 API
// ==========================================
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ message: '帳號與密碼皆為必填項目！' });
        if (mongoose.connection.readyState !== 1) return res.status(500).json({ message: '資料庫未連線' });

        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: '此帳號已被註冊！' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: '註冊成功！' });
    } catch (err) {
        res.status(500).json({ message: '伺服器錯誤' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ message: '帳號與密碼皆為必填項目！' });

        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: '帳號或密碼錯誤！' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: '帳號或密碼錯誤！' });

        // 登入成功，把使用者的 ID 和 帳號 回傳給前端
        res.json({ message: '登入成功！', user: { id: user._id, username: user.username } });
    } catch (err) {
        res.status(500).json({ message: '伺服器錯誤' });
    }
});

// ==========================================
// 2. 記帳核心 API
// ==========================================

// ➕ A. 新增一筆記帳紀錄
app.post('/api/records', async (req, res) => {
    try {
        const { userId, amount, description, category } = req.body;

        if (!userId || !amount || !description) {
            return res.status(400).json({ message: '金額與消費項目為必填欄位！' });
        }

        const newRecord = new Record({
            userId,
            amount: Number(amount),
            description,
            category: category || '其他'
        });

        await newRecord.save();
        res.status(201).json({ message: '記帳成功！', record: newRecord });
    } catch (err) {
        console.error('新增記帳錯誤:', err);
        res.status(500).json({ message: '無法儲存記帳資料' });
    }
});

// 🔍 B. 撈取該會員的所有記帳紀錄
app.get('/api/records/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        // 依照時間由新到舊排序 (.sort({ date: -1 }))
        const records = await Record.find({ userId }).sort({ date: -1 });
        res.json(records);
    } catch (err) {
        console.error('撈取記帳錯誤:', err);
        res.status(500).json({ message: '無法讀取歷史紀錄' });
    }
});

// ==========================================
// 3. 啟動與連線
// ==========================================
app.listen(PORT, () => console.log(`=== 伺服器啟動成功，連接埠: ${PORT} ===`));

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('💚 MONGODB 資料庫連線成功！'))
    .catch(err => console.error('❌ MONGODB 連線失敗:', err.message));