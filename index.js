const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const mongoose = require('mongoose');

// Environment Variables se credentials lena
const token = process.env.BOT_TOKEN;
const mongoURI = process.env.MONGO_URI;

const bot = new TelegramBot(token, { polling: true });
const app = express();
app.use(express.json());

// MongoDB Connection
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));

// Movie Schema Database ke liye
const movieSchema = new mongoose.Schema({
    title: String,
    fileId: String,
    fileType: String,
    caption: String
});
const Movie = mongoose.model('Movie', movieSchema);

// Jab Telegram par koi video/document bhejein
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const movieTitle = msg.text || msg.caption;

    if (msg.video || msg.document) {
        const fileId = msg.video ? msg.video.file_id : msg.document.file_id;
        const title = movieTitle || "Untitled Movie";

        try {
            // Database me save karna
            await Movie.create({ title, fileId, fileType: msg.video ? 'video' : 'document' });
            bot.sendMessage(chatId, `✅ Movie Successfully Website par add ho gayi!\nTitle: ${title}`);
        } catch (error) {
            bot.sendMessage(chatId, `❌ Error: ${error.message}`);
        }
    } else {
        bot.sendMessage(chatId, "Kripya koi Movie (Video ya File) bhejein sath me naam likh kar.");
    }
});

// Website ke liye API (Jahan se Vercel website movies fetch karegi)
app.get('/api/movies', async (req, res) => {
    try {
        const movies = await Movie.find().sort({ _id: -1 });
        res.json(movies);
    } catch (err) {
        res.status(500).json({ error: "Server Error" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

