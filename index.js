const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// --- CONFIGURATION ---
const MONGO_URI = process.env.MONGO_URI || '';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// --- DATABASE CONNECTION ---
mongoose.connect(MONGO_URI).then(() => {
    console.log('MongoDB Connected');
}).catch(err => {
    console.error('MongoDB Connection Error:', err);
});

// --- MOVIE SCHEMA & MODEL ---
const movieSchema = new mongoose.Schema({
    title: { type: String, required: true },
    file_url: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Movie = mongoose.model('Movie', movieSchema);

// --- TELEGRAM BOT SETUP ---
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Bot message handler
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const caption = msg.caption;

    let title = '';
    let file_url = '';

    // Server ka base URL (Koyeb URL) automatic ya environment variable se
    const hostUrl = process.env.RENDER_EXTERNAL_URL || process.env.KOYEB_PUBLIC_URL || `https://${process.env.KOYEB_SERVICE_NAME || 'yappy-berti-new11-38bf5e99'}.koyeb.app`;

    // Case 1: Video ya Document forward kiya gaya hai
    if (msg.video || msg.document) {
        const file = msg.video || msg.document;
        title = caption || file.file_name || 'Untitled Video';
        
        // Hamara khud ka stream proxy link banega jo kabhi expire nahi hoga
        file_url = `${hostUrl}/stream/${file.file_id}`;
    } 
    // Case 2: Text me bheja hai -> Name | Link
    else if (text && text.includes('|')) {
        const parts = text.split('|');
        title = parts[0].trim();
        file_url = parts[1].trim();
    }

    // Database me save karna
    if (title && file_url) {
        try {
            const newMovie = new Movie({ title, file_url });
            await newMovie.save();
            bot.sendMessage(chatId, `✅ Success! Movie added to website:\n👉 ${title}`);
        } catch (err) {
            bot.sendMessage(chatId, `❌ Error saving movie: ${err.message}`);
        }
    } else if (msg.video || msg.document || text) {
        bot.sendMessage(chatId, `⚠️ Please send in format: 'Movie Name | Link' OR forward a video with caption!`);
    }
});

// --- STREAMING PROXY ROUTE (Bina expire hone wala video stream) ---
app.get('/stream/:fileId', async (req, res) => {
    try {
        const fileId = req.params.fileId;
        
        // Telegram API se file ka path nikalna
        const fileResponse = await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`);
        const filePath = fileResponse.data.result.file_path;
        const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;

        // Video stream ko client/browser par redirect ya pipe karna
        const response = await axios({
            method: 'get',
            url: fileUrl,
            responseType: 'stream'
        });

        res.setHeader('Content-Type', response.headers['content-type'] || 'video/mp4');
        response.data.pipe(res);
    } catch (err) {
        console.error('Streaming error:', err.message);
        res.status(404).send('File not found or expired on Telegram server.');
    }
});

// --- API ROUTES FOR WEBSITE ---
app.get('/', (req, res) => {
    res.send('SPY STREAM Backend & Telegram Bot is running successfully!');
});

app.get('/movies', async (req, res) => {
    try {
        const movies = await Movie.find().sort({ createdAt: -1 });
        res.json(movies);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
