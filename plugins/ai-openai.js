const axios = require('axios');

module.exports = (bot, config, database, saveDatabase) => {
    bot.onText(/\/ai(?: (.+))?/, async (msg, match) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id.toString();
        const question = match[1];

        if (!question) {
            return bot.sendMessage(chatId, 'Silakan masukkan teks setelah perintah /ai. Contoh: /ai Apa itu AI?');
        }

        if (!database[userId]) {
            database[userId] = { limit: 0, premium: false, premiumExpiry: null };
        }

        if (!database[userId].premium && database[userId].limit >= config.globallimit) {
            return bot.sendMessage(chatId, `Anda telah mencapai batas penggunaan gratis sebanyak ${config.globallimit} kali. Silakan upgrade ke premium untuk terus menggunakan fitur ini.`);
        }

        try {
            const response = await axios.get(`https://api.siputzx.my.id/api/ai/blackboxai-pro?content=${encodeURIComponent(question)}`);
            const data = response.data;

            if (data.status === true && data.data) {
                bot.sendMessage(chatId, data.data.trim());
            } else {
                bot.sendMessage(chatId, 'Maaf, terjadi kesalahan saat memproses pertanyaan Anda.');
            }

            if (!database[userId].premium) {
                database[userId].limit += 1;
                saveDatabase();
            }
        } catch (error) {
            console.error('Error:', error);
            bot.sendMessage(chatId, 'Terjadi kesalahan saat mengambil jawaban.');
        }
    });
};