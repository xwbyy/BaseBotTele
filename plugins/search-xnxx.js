const axios = require('axios');

module.exports = (bot, config, database, saveDatabase) => {
  const handleXnxxSearchCommand = async (msg, match) => {
    if (!msg || !msg.chat) return;

    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const senderName = msg.from.first_name;
    const messageId = msg.message_id;
    const text = match[1] ? match[1].trim() : null;

    if (!text) {
      return bot.sendMessage(
        chatId,
        'Masukkan kata kunci pencarian setelah perintah.\n\nContoh: `/xnxxsearch sister`',
        {
          parse_mode: 'Markdown',
          reply_to_message_id: messageId,
        }
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

    try {
      bot.sendChatAction(chatId, 'typing');

      // Fetch data from XNXX API
      const apiUrl = `https://api.agatz.xyz/api/xnxx?message=${encodeURIComponent(text)}`;
      const response = await axios.get(apiUrl);

      if (response.status !== 200 || !response.data.data.status) {
        return bot.sendMessage(
          chatId,
          '❌ Gagal mengambil data dari API.',
          { reply_to_message_id: messageId }
        );
      }

      const videos = response.data.data.result.slice(0, 5); // Ambil 5 hasil teratas

      if (videos.length === 0) {
        return bot.sendMessage(
          chatId,
          '❌ Video tidak ditemukan!',
          { reply_to_message_id: messageId }
        );
      }

      let message = '🔎 *Hasil Pencarian XNXX:*\n\n';

      videos.forEach((video, index) => {
        message += `${index + 1}️⃣ *${video.title}*\n`;
        message += `   ℹ️ Info: ${video.info}\n`;
        message += `   🔗 Link: [Klik Disini](${video.link})\n\n`;
      });

      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        reply_to_message_id: messageId,
      });

      // Tambah limit jika pengguna bukan premium
      if (!database[userId].premium) {
        database[userId].limit += 1;
        saveDatabase();
      }
    } catch (error) {
      console.error('Error:', error);
      bot.sendMessage(
        chatId,
        '❌ Terjadi kesalahan, coba lagi nanti.',
        { reply_to_message_id: messageId }
      );
    }
  };

  bot.onText(/\/xnxxsearch(\s+.+)?/, (msg, match) => handleXnxxSearchCommand(msg, match));
};