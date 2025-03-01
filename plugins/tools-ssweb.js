const axios = require('axios');

const API_KEY = 'freeApikey'; // API key baru

module.exports = (bot, config, database, saveDatabase) => {
  bot.onText(/\/ssweb/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Silakan kirim link yang ingin Anda ambil screenshot-nya. Contoh: /ssweb https://www.vynaachan-api.shop');
  });

  bot.onText(/\/ssweb (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    const url = match[1].trim();
    const userId = msg.from.id.toString();
    const senderName = msg.from.first_name;

    if (!/^https?:\/\//.test(url)) {
      return bot.sendMessage(
        chatId,
        'Masukkan URL yang valid. Contoh: /ssweb https://example.com',
        { reply_to_message_id: messageId }
      );
    }

    // Inisialisasi pengguna dalam database jika belum ada
    if (!database[userId]) {
      database[userId] = { limit: 0, premium: false };
    }

    // Cek limit pengguna (hanya berlaku untuk pengguna non-premium)
    if (!database[userId].premium && database[userId].limit >= config.globallimit) {
      return bot.sendMessage(
        chatId,
        `❌ ${senderName}, Anda telah mencapai batas penggunaan gratis (${config.globallimit} kali). Silakan upgrade ke premium.`,
        { reply_to_message_id: messageId }
      );
    }

    bot.sendMessage(chatId, 'Mengambil screenshot, harap tunggu...');

    try {
      const apiUrl = `https://anabot.my.id/api/tools/ssweb?url=${encodeURIComponent(url)}&fullScreen=true&apikey=${API_KEY}`;

      const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

      await bot.sendPhoto(chatId, Buffer.from(response.data), { reply_to_message_id: messageId });

      // Tambah limit jika pengguna bukan premium
      if (!database[userId].premium) {
        database[userId].limit += 1;
        saveDatabase();
      }
    } catch (error) {
      console.error('Error occurred:', error);
      bot.sendMessage(
        chatId,
        'Gagal mengambil screenshot. Pastikan URL benar atau coba lagi nanti.',
        { reply_to_message_id: messageId }
      );
    }
  });
};