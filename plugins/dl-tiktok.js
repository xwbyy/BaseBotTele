const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = (bot, config, database, saveDatabase) => {
  const handleTiktokCommand = async (msg, match) => {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    const url = match[1] ? match[1].trim() : null;
    const userId = msg.from.id.toString();
    const senderName = msg.from.first_name;

    if (!url || !url.startsWith('http')) {
      return bot.sendMessage(
        chatId,
        'Masukkan URL TikTok yang valid setelah perintah. Contoh: /tiktok https://vt.tiktok.com/ZS24ShS1n/',
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

      // Mengambil data video TikTok dari API
      const apiUrl = `https://api.agatz.xyz/api/tiktok?url=${encodeURIComponent(url)}`;
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (!data.status || !data.data || !data.data.data) {
        return bot.sendMessage(
          chatId,
          'Gagal mengambil data dari TikTok. Pastikan URL benar.',
          { reply_to_message_id: messageId }
        );
      }

      const { title, cover, data: videoData, music_info, stats, author } = data.data;

      // Pilih video tanpa watermark (nowatermark)
      const videoUrl = videoData.find((item) => item.type === 'nowatermark')?.url;

      if (!videoUrl) {
        return bot.sendMessage(
          chatId,
          'Tidak dapat menemukan video untuk URL ini.',
          { reply_to_message_id: messageId }
        );
      }

      // Unduh video
      const videoResponse = await axios.get(videoUrl, { responseType: 'stream' });
      const videoPath = path.join(__dirname, 'temp_video.mp4');
      const writer = fs.createWriteStream(videoPath);

      videoResponse.data.pipe(writer);

      writer.on('finish', async () => {
        try {
          // Kirim video ke pengguna dengan caption yang informatif
          const caption = `
🎥 *${title}*

🎵 *Musik:* [${music_info.title}](${music_info.url}) - ${music_info.author}
👤 *Pembuat:* [${author.nickname}](${author.avatar})
📊 *Statistik:*
   👀 ${stats.views} Views
   ❤️ ${stats.likes} Likes
   💬 ${stats.comment} Komentar
   🔗 ${stats.share} Shares
   📥 ${stats.download} Downloads
          `.trim();

          await bot.sendVideo(chatId, videoPath, {
            caption,
            parse_mode: 'Markdown',
            reply_to_message_id: messageId,
            thumb: cover, // Thumbnail video
          });

          // Hapus file setelah dikirim
          await fs.promises.unlink(videoPath);

          // Tambah limit jika pengguna bukan premium
          if (!database[userId].premium) {
            database[userId].limit += 1;
            saveDatabase();
          }
        } catch (err) {
          console.error('Error saat mengirim video:', err);
          bot.sendMessage(
            chatId,
            'Terjadi kesalahan saat mengirim video.',
            { reply_to_message_id: messageId }
          );
        }
      });

      writer.on('error', (err) => {
        console.error('Error menulis file video:', err);
        bot.sendMessage(
          chatId,
          'Terjadi kesalahan saat mengunduh video.',
          { reply_to_message_id: messageId }
        );
      });
    } catch (error) {
      console.error('Error terjadi:', error);
      bot.sendMessage(
        chatId,
        'Terjadi kesalahan saat mencoba mengambil data dari TikTok.',
        { reply_to_message_id: messageId }
      );
    }
  };

  // Menambahkan handler untuk perintah /tiktok dan /tt
  bot.onText(/\/tiktok(?: (.+))?/, handleTiktokCommand);
  bot.onText(/\/tt(?: (.+))?/, handleTiktokCommand);
};