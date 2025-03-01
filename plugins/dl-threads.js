const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = (bot, config, database, saveDatabase) => {
  const handleThreadsCommand = async (msg, match) => {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    const url = match[1] ? match[1].trim() : null;
    const userId = msg.from.id.toString();
    const senderName = msg.from.first_name;

    if (!url || !url.startsWith('http')) {
      return bot.sendMessage(
        chatId,
        'Masukkan URL Threads yang valid setelah perintah. Contoh: /threads https://www.threads.net/@imaginationstation001/post/DGWHTU0MLMu',
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

      // Mengambil data Threads dari API Agat
      const apiUrl = `https://api.agatz.xyz/api/threads?url=${encodeURIComponent(url)}`;
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (!data.status || !data.data || (!data.data.image_urls && !data.data.video_urls)) {
        return bot.sendMessage(
          chatId,
          'Gagal mengambil data dari Threads. Pastikan URL benar.',
          { reply_to_message_id: messageId }
        );
      }

      const { image_urls, video_urls } = data.data;

      // Jika ada video, kirim video
      if (video_urls && video_urls.length > 0) {
        const videoUrl = video_urls[0].download_url;

        // Unduh video
        const videoResponse = await axios.get(videoUrl, { responseType: 'stream' });
        const videoPath = path.join(__dirname, 'temp_video.mp4');
        const writer = fs.createWriteStream(videoPath);

        videoResponse.data.pipe(writer);

        writer.on('finish', async () => {
          try {
            await bot.sendVideo(chatId, videoPath, {
              reply_to_message_id: messageId,
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
      }

      // Jika ada gambar, kirim gambar
      else if (image_urls && image_urls.length > 0) {
        for (const imageUrl of image_urls) {
          try {
            // Unduh gambar
            const imageResponse = await axios.get(imageUrl, { responseType: 'stream' });
            const imagePath = path.join(__dirname, 'temp_image.jpg');
            const writer = fs.createWriteStream(imagePath);

            imageResponse.data.pipe(writer);

            writer.on('finish', async () => {
              try {
                await bot.sendPhoto(chatId, imagePath, {
                  reply_to_message_id: messageId,
                });

                // Hapus file setelah dikirim
                await fs.promises.unlink(imagePath);
              } catch (err) {
                console.error('Error saat mengirim gambar:', err);
                bot.sendMessage(
                  chatId,
                  'Terjadi kesalahan saat mengirim gambar.',
                  { reply_to_message_id: messageId }
                );
              }
            });

            writer.on('error', (err) => {
              console.error('Error menulis file gambar:', err);
              bot.sendMessage(
                chatId,
                'Terjadi kesalahan saat mengunduh gambar.',
                { reply_to_message_id: messageId }
              );
            });
          } catch (err) {
            console.error('Error mengunduh gambar:', err);
            bot.sendMessage(
              chatId,
              'Terjadi kesalahan saat mengunduh gambar.',
              { reply_to_message_id: messageId }
            );
          }
        }

        // Tambah limit jika pengguna bukan premium
        if (!database[userId].premium) {
          database[userId].limit += 1;
          saveDatabase();
        }
      } else {
        bot.sendMessage(
          chatId,
          'Tidak ada media yang ditemukan di URL ini.',
          { reply_to_message_id: messageId }
        );
      }
    } catch (error) {
      console.error('Error terjadi:', error);
      bot.sendMessage(
        chatId,
        'Terjadi kesalahan saat mencoba mengambil data dari Threads.',
        { reply_to_message_id: messageId }
      );
    }
  };

  // Menambahkan handler untuk perintah /threads
  bot.onText(/\/threads\s+(.+)/, handleThreadsCommand);
};