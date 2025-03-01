const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = (bot, config, database, saveDatabase) => {
  const handleFacebookCommand = async (msg, match) => {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    const url = match[1] ? match[1].trim() : null;
    const userId = msg.from.id.toString();
    const senderName = msg.from.first_name;

    if (!url || !url.startsWith('https://www.facebook.com/')) {
      return bot.sendMessage(
        chatId,
        'Masukkan URL Facebook yang valid setelah perintah. Contoh: /fbdl https://www.facebook.com/reel/947495549897838',
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
      console.log('Fetching Facebook data...');

      const response = await axios.get('https://api.agatz.xyz/api/facebook', {
        params: { url },
        timeout: 5000,
      });

      const data = response.data;
      console.log('Response from Facebook API:', data);

      if (data.status !== 200 || !data.data) {
        return bot.sendMessage(
          chatId,
          'Gagal mengambil data dari Facebook. Pastikan URL benar.',
          { reply_to_message_id: messageId }
        );
      }

      const { sd, hd, title, thumbnail } = data.data;
      const videoUrl = hd || sd;
      if (!videoUrl) {
        return bot.sendMessage(
          chatId,
          'Tidak dapat menemukan video untuk URL ini.',
          { reply_to_message_id: messageId }
        );
      }

      console.log(`Downloading video: ${videoUrl}`);
      const videoResponse = await axios.get(videoUrl, { responseType: 'stream' });
      const videoPath = path.join(__dirname, 'temp_video.mp4');
      const writer = fs.createWriteStream(videoPath);
      videoResponse.data.pipe(writer);

      writer.on('finish', async () => {
        try {
          await bot.sendVideo(chatId, videoPath, {
            caption: `🔗 Video Facebook ditemukan! Title: ${title}`,
            reply_to_message_id: messageId,
            thumb: thumbnail,
          });

          // Tambah limit jika pengguna bukan premium
          if (!database[userId].premium) {
            database[userId].limit += 1;
            saveDatabase();
          }
        } catch (error) {
          console.error('Error sending video:', error);
        } finally {
          // Hapus file setelah dikirim
          if (fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);
          }
        }
      });

      writer.on('error', (error) => {
        console.error('Error downloading video:', error);
        bot.sendMessage(
          chatId,
          'Terjadi kesalahan saat mengunduh video.',
          { reply_to_message_id: messageId }
        );
      });
    } catch (error) {
      console.error('Error occurred:', error);
      let errorMessage = 'Terjadi kesalahan yang tidak terduga.';
      if (error.response) {
        errorMessage = `Gagal mengambil data dari Facebook. Status: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Tidak dapat menghubungi server Facebook. Coba lagi nanti.';
      }
      bot.sendMessage(chatId, errorMessage, { reply_to_message_id: messageId });
    }
  };

  // Menangkap perintah /fbdl, /facebook, dan /fb
  bot.onText(/\/fbdl(\s+.+)?/, handleFacebookCommand);
  bot.onText(/\/facebook(\s+.+)?/, handleFacebookCommand);
  bot.onText(/\/fb(\s+.+)?/, handleFacebookCommand);
};