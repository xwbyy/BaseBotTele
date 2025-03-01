const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = (bot, config, database, saveDatabase) => {
  const handleCapcutCommand = async (msg, match) => {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    const url = match[1] ? match[1].trim() : null;
    const userId = msg.from.id.toString();
    const senderName = msg.from.first_name;

    if (!url || !url.startsWith('http')) {
      return bot.sendMessage(
        chatId,
        'Masukkan URL Capcut yang valid. Contoh: /cc https://www.capcut.com/t/Zs8MPAKjG/',
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
      console.log('Fetching Capcut data...');

      // Mengambil data video Capcut dari API baru
      const apiUrl = `https://api.botcahx.eu.org/api/dowloader/capcut?url=${encodeURIComponent(url)}&apikey=${global.api.btch}`;
      const response = await axios.get(apiUrl);
      const data = response.data;

      console.log('Response from Capcut API:', data);

      if (data.status && data.code === 200 && data.result) {
        const { title, usage_amount, play_amount, like_count, comment_count, video, thumbnail, author } = data.result;

        if (video) {
          const videoResponse = await axios.get(video, { responseType: 'stream' });
          const videoPath = path.join(__dirname, 'temp_video.mp4');
          const writer = fs.createWriteStream(videoPath);

          videoResponse.data.pipe(writer);

          writer.on('finish', () => {
            // Kirim video ke pengguna dengan caption lengkap
            bot.sendVideo(chatId, videoPath, {
              caption: `🔗 *Video Capcut Ditemukan*\n\n` +
                       `📝 *Judul*: ${title}\n` +
                       `👤 *Pembuat*: ${author.name} (@${author.unique_id})\n` +
                       `👀 *Penonton*: ${play_amount.toLocaleString()} views\n` +
                       `❤️ *Suka*: ${like_count.toLocaleString()}\n` +
                       `💬 *Komentar*: ${comment_count.toLocaleString()}\n` +
                       `📥 *Penggunaan*: ${usage_amount.toLocaleString()} kali\n\n` +
                       `_Video dikirim oleh bot._`,
              parse_mode: 'Markdown',
              thumb: thumbnail,
              reply_to_message_id: messageId,
            }).then(() => {
              // Hapus file setelah dikirim
              fs.unlinkSync(videoPath);

              // Tambah limit jika pengguna bukan premium
              if (!database[userId].premium) {
                database[userId].limit += 1;
                saveDatabase();
              }
            }).catch(error => {
              console.error('Error sending video:', error);
              bot.sendMessage(chatId, 'Terjadi kesalahan saat mengirim video.', { reply_to_message_id: messageId });
            });
          });

          writer.on('error', error => {
            console.error('Error downloading video:', error);
            bot.sendMessage(chatId, 'Terjadi kesalahan saat mengunduh video.', { reply_to_message_id: messageId });
          });
        } else {
          bot.sendMessage(chatId, 'Tidak dapat menemukan video untuk URL ini.', { reply_to_message_id: messageId });
        }
      } else {
        bot.sendMessage(chatId, 'Gagal mengambil data dari Capcut. Pastikan URL benar.', { reply_to_message_id: messageId });
      }
    } catch (error) {
      console.error('Error occurred:', error);

      if (error.response) {
        bot.sendMessage(chatId, `Kesalahan saat mengambil data Capcut. Status: ${error.response.status}`, { reply_to_message_id: messageId });
      } else if (error.request) {
        bot.sendMessage(chatId, 'Tidak dapat menghubungi server Capcut. Coba lagi nanti.', { reply_to_message_id: messageId });
      } else {
        bot.sendMessage(chatId, 'Terjadi kesalahan yang tidak terduga.', { reply_to_message_id: messageId });
      }
    }
  };

  // Menambahkan handler untuk perintah /cc dan /capcut
  bot.onText(/\/cc(\s+.+)?/, handleCapcutCommand);
  bot.onText(/\/capcut(\s+.+)?/, handleCapcutCommand);
};