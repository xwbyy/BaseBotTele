const axios = require("axios");
const fs = require("fs");

async function getEmojiMix(emoji1, emoji2) {
    try {
        const url = `https://api.botcahx.eu.org/api/emoji/emojimix?emoji1=${encodeURIComponent(emoji1)}&emoji2=${encodeURIComponent(emoji2)}&apikey=${global.api.btch}`;
        const response = await axios.get(url);
        
        if (response.data && response.data.status && response.data.result.results.length > 0) {
            return response.data.result.results[0].url; // URL gambar emoji mix
        } else {
            return null;
        }
    } catch (error) {
        console.error("❌ Error fetching EmojiMix:", error);
        return null;
    }
}

module.exports = (bot, config, database, saveDatabase) => {
    bot.onText(/^\/emojimix(?: (.+)\+(.+))?$/, async (msg, match) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id.toString();
        const senderName = msg.from.first_name || "Pengguna";

        // Kalau user cuma ketik "/emojimix" tanpa emoji
        if (!match[1] || !match[2]) {
            return bot.sendMessage(chatId, "⚠️ Format salah!\nGunakan contoh: `/emojimix 😉+😜`");
        }

        const emoji1 = match[1].trim();
        const emoji2 = match[2].trim();

        // Inisialisasi pengguna dalam database jika belum ada
        if (!database[userId]) {
            database[userId] = { limit: 0, premium: false };
        }

        // Cek limit pengguna (hanya berlaku untuk pengguna non-premium)
        if (!database[userId].premium && database[userId].limit >= config.globallimit) {
            return bot.sendMessage(chatId, `❌ ${senderName}, Anda telah mencapai batas penggunaan gratis (${config.globallimit} kali). Silakan upgrade ke premium.`);
        }

        try {
            await bot.sendMessage(chatId, "⏳ Sedang membuat EmojiMix, harap tunggu...");

            const imageUrl = await getEmojiMix(emoji1, emoji2);

            if (!imageUrl) {
                return bot.sendMessage(chatId, "❌ Gagal membuat EmojiMix. Mungkin kombinasi emoji ini tidak tersedia.");
            }

            // Download gambar emoji mix
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const stickerPath = `sticker_${Date.now()}.webp`;
            fs.writeFileSync(stickerPath, response.data);

            // Kirim sebagai stiker
            await bot.sendSticker(chatId, stickerPath);
            fs.unlinkSync(stickerPath); // Bersihkan file sementara

            // Tambah limit jika pengguna bukan premium
            if (!database[userId].premium) {
                database[userId].limit += 1;
                saveDatabase();
            }

        } catch (error) {
            console.error("❌ Error saat membuat EmojiMix:", error);
            bot.sendMessage(chatId, "❌ Terjadi kesalahan saat membuat EmojiMix.");
        }
    });
};