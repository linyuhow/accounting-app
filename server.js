const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();
const bcrypt = require('bcrypt');
const User = require('./models/User');
const app = express();
const PORT = process.env.PORT || 3000;

// 解析前端傳來的 JSON 資料
app.use(express.json());

// 讓前端可以讀取 public 資料夾裡的網頁檔案
app.use(express.static(path.join(__dirname, 'public')));

// 測試用 API：確認伺服器有活著
app.get('/api/test', (req, res) => {
    res.json({ message: '後端伺服器運作正常！' });
});
// 會員註冊 API
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. 檢查帳號密碼有沒有填寫
        if (!username || !password) {
            return res.status(400).json({ message: '帳號與密碼皆為必填項目！' });
        }

        // 2. 檢查帳號是否已經被註冊過
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: '此帳號已被註冊！' });
        }

        // 3. 密碼安全加密 (bcrypt 自動加鹽，生成符合規格的 $2b$ 開頭長字串)
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 4. 新增使用者到資料庫
        const newUser = new User({
            username,
            password: hashedPassword
        });

        await newUser.save();
        res.status(201).json({ message: '註冊成功！' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '伺服器錯誤，請稍後再試。' });
    }
});
// 先讓伺服器啟動，把 Port 綁定好給 Render 偵測
app.listen(PORT, () => {
    console.log(`伺服器成功啟動在：http://localhost:${PORT}`);
});

// 獨立連接 MongoDB 資料庫
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('MongoDB 資料庫連線成功！');
    })
    .catch(err => {
        console.error('資料庫連線失敗：', err);
    });