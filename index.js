const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');

// --- CONFIGURATION ---
const MONGO_URI = process.env.MONGO_URI || 'YAHAN_APNI_MONGODB_URI_DAALEIN';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YAHAN_APNA_BOT_TOKEN_DAALEIN';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// --- DATABASE CONNECTION ---
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
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

// --- TELEGRAM BOT SETUP (POLLING MODE) ---
// Sabse pehle 'bot' ko yahan define kiya gaya hai
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Bot message handler - Ab 'bot' pehle define hai toh error nahi aayegi
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const caption = msg.caption;

    let title = '';
    let file_url = '';

    // Case 1: Agar video ya document forward kiya hai
    if (msg.video || msg.document) {
        const file = msg.video || msg.document;
        title = caption || file.file_name || 'Untitled Video';
        file_url = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${file.file_id}`;
    } 
    // Case 2: Agar text me bheja hai -> Name | Link
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
            bot.sendMessage(chatId, `Success! Movie added to website: \n👉 ${title}`);
        } catch (err) {
            bot.sendMessage(chatId, `Error saving movie: ${err.message}`);
        }
    } else if (msg.video || msg.document || text) {
        bot.sendMessage(chatId, `Please send in format: 'Movie Name | Link' OR forward a video with caption!`);
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
