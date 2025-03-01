const axios = require('axios');

module.exports = (bot, config, database, saveDatabase) => {
    bot.onText(/\/txtsound(?: (.+))?/, async (msg, match) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id.toString();
        const text = match[1];

        if (!text) {
            return bot.sendMessage(chatId, 'Silakan masukkan teks setelah perintah /txtsound. Contoh: /txtsound Halo, apa kabar?');
        }

        if (!database[userId]) {
            database[userId] = { limit: 0, premium: false, premiumExpiry: null };
        }

        if (!database[userId].premium && database[userId].limit >= config.globallimit) {
            return bot.sendMessage(chatId, `Anda telah mencapai batas penggunaan gratis sebanyak ${config.globallimit} kali. Silakan upgrade ke premium untuk terus menggunakan fitur ini.`);
        }

        try {
            const apiUrl = `https://api.botcahx.eu.org/api/sound/texttosound?text1=${encodeURIComponent(text)}&lang=id-ID&apikey=${global.api.btch}`;
            const response = await axios.get(apiUrl);

            if (!response.data.result) {
                return bot.sendMessage(chatId, 'Gagal mengonversi teks ke suara!');
            }

            bot.sendAudio(chatId, response.data.result, {
                caption: `🔊 Suara dari teks: "${text}"`,
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