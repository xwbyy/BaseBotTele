const ytSearch = require('yt-search');
const axios = require('axios');

module.exports = (bot, config, database, saveDatabase) => {
    bot.onText(/\/play(?: (.+))?/, async (msg, match) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id.toString();
        const query = match[1];

        if (!query) {
            return bot.sendMessage(chatId, 'Silakan masukkan teks setelah perintah /play. Contoh: /play Vynaa Valerie cover song');
        }

        if (!database[userId]) {
            database[userId] = { limit: 0, premium: false, premiumExpiry: null };
        }

        if (!database[userId].premium && database[userId].limit >= config.globallimit) {
            return bot.sendMessage(chatId, `Anda telah mencapai batas penggunaan gratis sebanyak ${config.globallimit} kali. Silakan upgrade ke premium untuk terus menggunakan fitur ini.`);
        }

        try {
            const searchResult = await ytSearch(query);
            const video = searchResult.videos[0];

            if (!video) {
                return bot.sendMessage(chatId, 'Video tidak ditemukan!');
            }

            if (video.seconds >= 3600) {
                return bot.sendMessage(chatId, 'Video terlalu panjang! Maksimal 1 jam.');
            }

            bot.sendMessage(chatId, `🎵 *${video.title}*\n⏳ Durasi: ${video.timestamp}\n👀 Views: ${video.views}\n📅 Upload: ${video.ago}\n🎬 Channel: ${video.author.name}\n🔗 [Tonton Video](${video.url})`, {
                parse_mode: 'Markdown'
            });

            const apiUrl = `https://api.botcahx.eu.org/api/dowloader/yt?url=${video.url}&apikey=${global.api.btch}`;
            const response = await axios.get(apiUrl);

            if (!response.data.result || !response.data.result.mp3) {
                return bot.sendMessage(chatId, 'Gagal mengunduh audio!');
            }

            bot.sendAudio(chatId, response.data.result.mp3, {
                caption: `🎶 *${video.title}*`,
                parse_mode: 'Markdown'
            });

            if (!database[userId].premium) {
                database[userId].limit += 1;
                saveDatabase();
            }
        } catch (error) {
            console.error('Error:', error);
            bot.sendMessage(chatId, 'Terjadi kesalahan saat memproses permintaan. Silakan coba lagi nanti.');
        }
    });
};