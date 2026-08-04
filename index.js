const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');

// --- CONFIGURATION ---
const MONGO_URI = process.env.MONGO_URI || 'YAHAN_APNI_MONGODB_URI_DAALEIN';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YAHAN_APNA_BOT_TOKEN_DAALEIN';
const APP_URL = process.env.RENDER_EXTERNAL_URL || process.env.KOYEB_PUBLIC_URL || 'https://yappy-berti-new11-38bf5e99.koyeb.app';

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

// --- TELEGRAM BOT SETUP (WEBHOOK MODE) ---
// Yahan polling: true ki jagah webhook use kiya hai taaki 409 conflict error kabhi na aaye
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);

// Set webhook to your Koyeb app URL
const webhookPath = `/bot${TELEGRAM_BOT_TOKEN}`;
bot.setWebHook(`${APP_URL}${webhookPath}`);

// Express route to handle incoming Telegram updates
app.post(webhookPath, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Bot message handler
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text && text.includes('|')) {
        const parts = text.split('|');
        const title = parts[0].trim();
        const file_url = parts[1].trim();

        try {
            const newMovie = new Movie({ title, file_url });
            await newMovie.save();
            bot.sendMessage(chatId, `Success! Movie added: ${title}`);
        } catch (err) {
            bot.sendMessage(chatId, `Error saving movie: ${err.message}`);
        }
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
