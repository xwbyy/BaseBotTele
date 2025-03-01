const fetch = require('node-fetch');

module.exports = (bot, config, database, saveDatabase) => {
  bot.onText(/\/bingimg (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const senderName = msg.from.first_name;
    const messageId = msg.message_id;
    const query = match[1].trim();

    // Periksa apakah pengguna ada di database
    if (!database[userId]) {
      database[userId] = { limit: 0, premium: false };
    }

    // Periksa batas limit untuk pengguna gratis
    if (!database[userId].premium && database[userId].limit >= config.globallimit) {
      return bot.sendMessage(
        chatId,
        `🚫 ${senderName}, Anda telah mencapai batas penggunaan gratis (${config.globallimit} kali). Silakan upgrade ke premium.`,
        { reply_to_message_id: messageId }
      );
    }

    try {
      bot.sendMessage(chatId, `🔍 Mencari gambar untuk: *${query}*...`, { 
        reply_to_message_id: messageId,
        parse_mode: "Markdown"
      });

      // Panggil API Bing Image Search
      const response = await fetch(`https://api.botcahx.eu.org/api/search/bing-img?text=${encodeURIComponent(query)}&apikey=${global.api.btch}`);
      const data = await response.json();

      if (!data.status || !data.result || data.result.length === 0) {
        return bot.sendMessage(chatId, '❌ Tidak ditemukan gambar untuk kata kunci tersebut.', { reply_to_message_id: messageId });
      }

      // Kirim semua gambar yang ditemukan
      for (const imgUrl of data.result) {
        await bot.sendPhoto(chatId, imgUrl, { reply_to_message_id: messageId });
      }

      // Tambah limit jika bukan premium
      if (!database[userId].premium) {
        database[userId].limit += 1;
        saveDatabase();
      }
    } catch (error) {
      console.error('Error mengambil gambar Bing:', error);
      await bot.sendMessage(chatId, '❌ Terjadi kesalahan saat mencari gambar.', { reply_to_message_id: messageId });
    }
  });

  bot.onText(/\/bingimg$/, (msg) => {
    bot.sendMessage(msg.chat.id, '⚠️ Gunakan format: `/bingimg <kata kunci>`\n\nContoh: `/bingimg kucing lucu`', {
      parse_mode: "Markdown",
      reply_to_message_id: msg.message_id
    });
  });
};