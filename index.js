// Bot message handler - Handles both Text links and Forwarded Videos/Files
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const caption = msg.caption;

    let title = '';
    let file_url = '';

    // Case 1: Agar aapne video ya file forward ki hai
    if (msg.video || msg.document) {
        const file = msg.video || msg.document;
        title = caption || file.file_name || 'Untitled Video';
        // Telegram file ko web par play/download karne ke liye file_id use karenge
        file_url = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${file.file_id}`; 
        
        // Note: Direct Telegram file link ki jagah agar aap apna custom stream link chahte hain toh wo bhi de sakte hain
    } 
    // Case 2: Agar aapne text me bheja hai -> Name | Link
    else if (text && text.includes('|')) {
        const parts = text.split('|');
        title = parts[0].trim();
        file_url = parts[1].trim();
    }

    // Agar title aur file_url mil gaya, toh database me save kar do
    if (title && file_url) {
        try {
            const newMovie = new Movie({ title, file_url });
            await newMovie.save();
            bot.sendMessage(chatId, `Success! Movie added to website: \n👉 ${title}`);
        } catch (err) {
            bot.sendMessage(chatId, `Error saving movie: ${err.message}`);
        }
    } else if (msg.video || msg.document || text) {
        // Agar format match nahi hua
        bot.sendMessage(chatId, `Please send in format: 'Movie Name | Link' OR forward a video with caption!`);
    }
});

