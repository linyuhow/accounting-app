const mongoose = require('mongoose');

const RecordSchema = new mongoose.Schema({
    // 📌 這筆帳是誰記的？（連結到 User 的 ID）
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // 金額
    amount: {
        type: Number,
        required: true
    },
    // 消費項目說明
    description: {
        type: String,
        required: true,
        trim: true
    },
    // 分類（例如：飲食、交通、娛樂、其他）
    category: {
        type: String,
        default: '其他'
    },
    // 記帳日期
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Record', RecordSchema);