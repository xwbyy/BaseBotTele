const axios = require('axios');

module.exports = (bot, config, database, saveDatabase) => {
  bot.onText(/^\/katazaynn/, async (msg) => {
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

    bot.sendMessage(chatId, '⏱️ Memuat kata-kata Zaynn, mohon tunggu...', { reply_to_message_id: msg.message_id });

    try {
      const apiUrl = `https://api.botcahx.eu.org/api/random/katailham?apikey=${global.api.btch}`;
      const response = await axios.get(apiUrl);

      if (!response.data.hasil) {
        return bot.sendMessage(chatId, '❌ Gagal memuat kata-kata Zaynn. Silakan coba lagi nanti.', { reply_to_message_id: msg.message_id });
      }

      const kataZaynn = response.data.hasil.replace(/– kata Ilham/i, '– Kata Zaynn');

      bot.sendMessage(chatId, `📖 *Kata-Kata Zaynn:*\n\n_"${kataZaynn}"_`, {
        parse_mode: 'Markdown',
        reply_to_message_id: msg.message_id
      });

      if (!database[userId].premium) {
        database[userId].limit += 1;
        saveDatabase();
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
      bot.sendMessage(chatId, '❌ Terjadi kesalahan saat memuat kata-kata Zaynn. Silakan coba lagi nanti.', { reply_to_message_id: msg.message_id });
    }
  });
};