const axios = require('axios');

module.exports = (bot, config, database, saveDatabase) => {
  bot.onText(/^\/katadilan/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();

    if (!database[userId]) {
      database[userId] = { limit: 0, premium: false, premiumExpiry: null };
    }

    if (!database[userId].premium && database[userId].limit >= config.globallimit) {
      return bot.sendMessage(
        chatId,
        `🚫 Anda telah mencapai batas penggunaan gratis sebanyak ${config.globallimit} kali. Silakan upgrade ke premium untuk terus menggunakan fitur ini.`
      );
    }

    bot.sendMessage(chatId, '⏱️ Memuat kata-kata Dilan, mohon tunggu...', { reply_to_message_id: msg.message_id });

    try {
      const apiUrl = `https://api.botcahx.eu.org/api/random/katadilan?apikey=${global.api.btch}`;
      const response = await axios.get(apiUrl);

      if (!response.data.dilan) {
        return bot.sendMessage(chatId, '❌ Gagal memuat kata-kata Dilan. Silakan coba lagi nanti.', { reply_to_message_id: msg.message_id });
      }

      bot.sendMessage(chatId, `📖 *Kata-Kata Dilan:*\n\n_"${response.data.dilan}"_`, {
        parse_mode: 'Markdown',
        reply_to_message_id: msg.message_id
      });

      if (!database[userId].premium) {
        database[userId].limit += 1;
        saveDatabase();
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
      bot.sendMessage(chatId, '❌ Terjadi kesalahan saat memuat kata-kata Dilan. Silakan coba lagi nanti.', { reply_to_message_id: msg.message_id });
    }
  });
};