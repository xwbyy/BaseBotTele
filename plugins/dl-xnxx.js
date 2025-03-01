const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

module.exports = (bot, config, database, saveDatabase) => {
  bot.onText(/\/xnxxdl/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Silakan kirim link video XNXX yang ingin Anda download. Contoh: /xnxxdl https://www.xnxx.com/video-141ewlbb/free_use_anytime_sex_big_ass_latina_milf_step_mom_after_deal_with_step_son');
  });

  bot.onText(/\/xnxxdl (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    const url = match[1].trim();
    const userId = msg.from.id.toString();
    const senderName = msg.from.first_name;

    if (!/^https?:\/\//.test(url)) {
      return bot.sendMessage(
        chatId,
        'Masukkan URL yang valid. Contoh: /xnxxdl https://www.xnxx.com/video-141ewlbb/free_use_anytime_sex_big_ass_latina_milf_step_mom_after_deal_with_step_son',
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

    bot.sendMessage(chatId, 'Mengambil data video, harap tunggu...');

    try {
      const apiUrl = `https://api.agatz.xyz/api/xnxxdown?url=${encodeURIComponent(url)}`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.status !== 200 || !data.data.status) {
        throw new Error('Gagal mengambil data dari API XNXX.');
      }

      const { files, title, duration, info, image } = data.data;
      const videoUrl = files.high || files.low || files.HLS;
      const caption = `📹 *XNXX Video Downloader*\n\n📂 *Judul:* ${title}\n⏱️ *Durasi:* ${duration}\nℹ️ *Info:* ${info}`;

      // Unduh video ke file sementara
      const videoResponse = await fetch(videoUrl);
      const videoPath = path.join(__dirname, 'temp_video.mp4');
      const writer = fs.createWriteStream(videoPath);
      videoResponse.body.pipe(writer);

      writer.on('finish', async () => {
        try {
          // Kirim video ke pengguna
          await bot.sendVideo(chatId, videoPath, {
            caption: caption,
            parse_mode: 'Markdown',
            reply_to_message_id: messageId,
          });

          // Kirim thumbnail ke pengguna
          await bot.sendPhoto(chatId, image, {
            caption: '🖼️ Thumbnail Video',
            reply_to_message_id: messageId,
          });

          // Tambah limit jika pengguna bukan premium
          if (!database[userId].premium) {
            database[userId].limit += 1;
            saveDatabase();
          }
        } catch (error) {
          console.error('Error sending video:', error);
        } finally {
          // Hapus file sementara setelah dikirim
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
      bot.sendMessage(
        chatId,
        'Gagal mengambil data video. Pastikan URL benar atau coba lagi nanti.',
        { reply_to_message_id: messageId }
      );
    }
  });
};