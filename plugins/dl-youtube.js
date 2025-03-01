const axios = require('axios');

module.exports = (bot, config, database, saveDatabase) => {
    // Fungsi untuk memeriksa batasan penggunaan
    const checkUsageLimit = (userId) => {
        if (!database[userId]) {
            database[userId] = { limit: 0, premium: false, premiumExpiry: null };
        }

        if (!database[userId].premium && database[userId].limit >= config.globallimit) {
            return false; // Pengguna telah mencapai batas
        }
        return true; // Pengguna masih bisa menggunakan fitur
    };

    // Fungsi untuk menambah counter penggunaan
    const incrementUsage = (userId) => {
        if (!database[userId].premium) {
            database[userId].limit += 1;
            saveDatabase();
        }
    };

    // /ytmp3 command for downloading YouTube audio
    bot.onText(/\/ytmp3(?:\s+(.+))?/, async (msg, match) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id.toString();
        const url = match[1];

        if (!url) {
            return bot.sendMessage(chatId, 'Silakan masukkan link YouTube yang valid!');
        }

        if (!checkUsageLimit(userId)) {
            return bot.sendMessage(chatId, `Anda telah mencapai batas penggunaan gratis sebanyak ${config.globallimit} kali. Silakan upgrade ke premium untuk terus menggunakan fitur ini.`);
        }

        try {
            const apiUrl = `https://api.botcahx.eu.org/api/dowloader/yt?url=${url}&apikey=${global.api.btch}`;
            const response = await axios.get(apiUrl);

            if (!response.data || !response.data.status || !response.data.result || !response.data.result.mp3) {
                return bot.sendMessage(chatId, 'Gagal mengunduh audio: Respons API tidak valid.');
            }

            bot.sendAudio(chatId, response.data.result.mp3, {
                caption: `🎶 Audio berhasil diunduh!`,
                parse_mode: 'Markdown'
            });

            incrementUsage(userId);
        } catch (error) {
            console.error('Error:', error);
            bot.sendMessage(chatId, 'Terjadi kesalahan saat mengunduh audio. Silakan coba lagi.');
        }
    });

    // /ytmp4 command for downloading YouTube video
    bot.onText(/\/ytmp4(?:\s+(.+))?/, async (msg, match) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id.toString();
        const url = match[1];

        if (!url) {
            return bot.sendMessage(chatId, 'Silakan masukkan link YouTube yang valid!');
        }

        if (!checkUsageLimit(userId)) {
            return bot.sendMessage(chatId, `Anda telah mencapai batas penggunaan gratis sebanyak ${config.globallimit} kali. Silakan upgrade ke premium untuk terus menggunakan fitur ini.`);
        }

        try {
            const apiUrl = `https://api.botcahx.eu.org/api/dowloader/yt?url=${url}&apikey=${global.api.btch}`;
            const response = await axios.get(apiUrl);

            if (!response.data || !response.data.status || !response.data.result || !response.data.result.mp4) {
                return bot.sendMessage(chatId, 'Gagal mengunduh video: Respons API tidak valid.');
            }

            bot.sendVideo(chatId, response.data.result.mp4, {
                caption: `🎬 Video berhasil diunduh: ${response.data.result.title}`,
                parse_mode: 'Markdown'
            });

            incrementUsage(userId);
        } catch (error) {
            console.error('Error:', error);
            bot.sendMessage(chatId, 'Terjadi kesalahan saat mengunduh video. Silakan coba lagi.');
        }
    });
};