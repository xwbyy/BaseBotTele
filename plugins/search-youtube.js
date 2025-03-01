const ytSearch = require('yt-search'); // Pastikan modul yt-search sudah diinstal

module.exports = (bot, config, database, saveDatabase) => {
  const handleYtSearchCommand = async (msg, match) => {
    if (!msg || !msg.chat) return;

    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const messageId = msg.message_id;
    const text = match[1] ? match[1].trim() : null;
    const senderName = msg.from.first_name;

    if (!text) {
      return bot.sendMessage(
        chatId,
        'Masukkan judul atau link YouTube setelah perintah.\n\nContoh: `/ytsearch Alan Walker Faded`',
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

      const searchResult = await ytSearch(text);
      const videos = searchResult.videos.slice(0, 5); // Ambil 5 hasil teratas

      if (videos.length === 0) {
        return bot.sendMessage(chatId, '❌ Video tidak ditemukan!', { reply_to_message_id: messageId });
      }

      let message = '🔎 *Hasil Pencarian YouTube:*\n\n';

      videos.forEach((video, index) => {
        message += `${index + 1}️⃣ *[${video.title}](${video.url})*\n`;
        message += `   ⏳ Durasi: ${video.timestamp} | 👀 Views: ${video.views} | 📅 Upload: ${video.ago} | 🎬 Channel: ${video.author.name}\n\n`;
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
      bot.sendMessage(chatId, '❌ Terjadi kesalahan, coba lagi nanti.', { reply_to_message_id: messageId });
    }
  };

  bot.onText(/\/ytsearch(\s+.+)?/, (msg, match) => handleYtSearchCommand(msg, match));
};