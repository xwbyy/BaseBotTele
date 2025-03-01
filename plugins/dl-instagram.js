const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = (bot, config, database, saveDatabase) => {
  const handleInstagramCommand = async (msg, match) => {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    const url = match[1] ? match[1].trim() : null;
    const userId = msg.from.id.toString();
    const senderName = msg.from.first_name;

    if (!url || !url.startsWith('http')) {
      return bot.sendMessage(
        chatId,
        'Masukkan URL Instagram yang valid setelah perintah. Contoh: /ig https://www.instagram.com/p/ByxKbUSnubS/',
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

    try {
      bot.sendChatAction(chatId, 'typing');

      // Mengambil data dari API Instagram Downloader
      const apiUrl = `https://api.botcahx.eu.org/api/dowloader/igdowloader?url=${encodeURIComponent(url)}&apikey=${global.api.btch}`;
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (!data.status || !data.result || data.result.length === 0) {
        return bot.sendMessage(
          chatId,
          'Gagal mengambil data dari Instagram. Pastikan URL benar.',
          { reply_to_message_id: messageId }
        );
      }

      const { wm, thumbnail, url: mediaUrl } = data.result[0];

      // Unduh media
      const mediaResponse = await axios.get(mediaUrl, { responseType: 'stream' });
      const mediaPath = path.join(__dirname, 'temp_instagram.mp4');
      const writer = fs.createWriteStream(mediaPath);

      mediaResponse.data.pipe(writer);

      writer.on('finish', async () => {
        try {
          // Kirim media ke pengguna dengan caption
          const caption = `
📷 *Instagram Download*
🔖 *Watermark:*
          `.trim();

          await bot.sendVideo(chatId, mediaPath, {
            caption,
            parse_mode: 'Markdown',
            reply_to_message_id: messageId,
            thumb: thumbnail, // Thumbnail video
          });

          // Hapus file setelah dikirim
          await fs.promises.unlink(mediaPath);

          // Tambah limit jika pengguna bukan premium
          if (!database[userId].premium) {
            database[userId].limit += 1;
            saveDatabase();
          }
        } catch (err) {
          console.error('Error saat mengirim media:', err);
          bot.sendMessage(
            chatId,
            'Terjadi kesalahan saat mengirim media.',
            { reply_to_message_id: messageId }
          );
        }
      });

      writer.on('error', (err) => {
        console.error('Error menulis file media:', err);
        bot.sendMessage(
          chatId,
          'Terjadi kesalahan saat mengunduh media.',
          { reply_to_message_id: messageId }
        );
      });
    } catch (error) {
      console.error('Error terjadi:', error);
      bot.sendMessage(
        chatId,
        'Terjadi kesalahan saat mencoba mengambil data dari Instagram.',
        { reply_to_message_id: messageId }
      );
    }
  };

  // Menambahkan handler untuk perintah /ig dan /instagram
  bot.onText(/\/ig(?: (.+))?/, handleInstagramCommand);
  bot.onText(/\/instagram(?: (.+))?/, handleInstagramCommand);
};