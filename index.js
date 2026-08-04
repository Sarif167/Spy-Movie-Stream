const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');

// --- CONFIGURATION ---
// Apni MongoDB URI aur Telegram Bot Token yahan daalein (ya environment variables use karein)
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

// --- TELEGRAM BOT SETUP ---
// polling: true rakha hai, ensure karein ki yeh bot kisi aur jagah run na ho raha ho
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Bot se movie/file add karne ka logic (Aap apne hisab se command ya text handler customize kar sakte hain)
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Example format: Agar aap bot ko bhejein -> MovieName | FileUrl
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

// Root route taaki direct link kholne par error na aaye
app.get('/', (req, res) => {
    res.send('SPY STREAM Backend & Telegram Bot is running successfully!');
});

// Get all movies route for frontend (Vercel website)
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
