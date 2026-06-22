// 確保 dotenv 在最頂端第一行執行，這樣後面所有程式才讀得到雲端環境變數
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;

// 解析 JSON 請求體的中間件
app.use(express.json());

// 設定靜態檔案資料夾（前端畫面）
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// 1. 測試用 API：確認伺服器有活著
// ==========================================
app.get('/api/test', (req, res) => {
    res.json({ message: '後端伺服器運作正常！' });
});

// ==========================================
// 2. 會員註冊 API
// ==========================================
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 檢查帳號密碼有沒有填寫
        if (!username || !password) {
            return res.status(400).json({ message: '帳號與密碼皆為必填項目！' });
        }

        // 檢查資料庫有沒有成功連上
        if (mongoose.connection.readyState !== 1) {
            return res.status(500).json({ message: '伺服器目前與資料庫失去連線，請稍後再試。' });
        }

        // 檢查帳號是否已經被註冊過
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: '此帳號已被註冊！' });
        }

        // 密碼安全加密 (bcrypt 自動加鹽)
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 新增使用者到資料庫
        const newUser = new User({
            username,
            password: hashedPassword
        });

        await newUser.save();
        res.status(201).json({ message: '註冊成功！' });

    } catch (err) {
        console.error('註冊 API 發生錯誤:', err);
        res.status(500).json({ message: '伺服器錯誤，請稍後再試。' });
    }
});

// ==========================================
// 3. 會員登入 API
// ==========================================
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 檢查欄位
        if (!username || !password) {
            return res.status(400).json({ message: '帳號與密碼皆為必填項目！' });
        }

        // 檢查資料庫連線
        if (mongoose.connection.readyState !== 1) {
            return res.status(500).json({ message: '伺服器目前與資料庫失去連線，請稍後再試。' });
        }

        // 尋找使用者
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: '帳號或密碼錯誤！' }); // 找不到帳號
        }

        // 比較加密後的密碼是否相符
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: '帳號或密碼錯誤！' }); // 密碼對不起來
        }

        // 驗證成功
        res.json({ message: '登入成功！', user: { id: user._id, username: user.username } });

    } catch (err) {
        console.error('登入 API 發生錯誤:', err);
        res.status(500).json({ message: '伺服器錯誤，請稍後再試。' });
    }
});

// ==========================================
// 4. 啟動伺服器並綁定 Port
// ==========================================
app.listen(PORT, () => {
    console.log(`=== 伺服器啟動成功 ===`);
    console.log(`本機預覽網址: http://localhost:${PORT}`);
    console.log(`雲端環境連接埠: ${PORT}`);
});

// ==========================================
// 5. 連接 MongoDB 資料庫
// ==========================================
console.log("=== 雲端環境變數檢查 ===");
if (!process.env.MONGODB_URI) {
    console.error("❌ 警告: 找不到 MONGODB_URI 環境變數！");
} else {
    console.log("✅ 成功讀取 MONGODB_URI，字串長度為:", process.env.MONGODB_URI.length);
}

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('💚 MONGODB 資料庫連線成功！');
    })
    .catch(err => {
        console.error('❌ MONGODB 資料庫連線失敗！');
        console.error('失敗原因資訊:', err.message);
    });