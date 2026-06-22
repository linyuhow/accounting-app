const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

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