const axios = require('axios');
const fs = require('fs');
const path = require('path');

const MAX_FILE_SIZE = 50 * 1024 * 1024; // Maksimum 50MB

module.exports = (bot, config, database, saveDatabase) => {
  bot.onText(/^\/drivedl(?:\s(.+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    const url = match[1] ? match[1].trim() : null;
    const userId = msg.from.id.toString();
    const senderName = msg.from.first_name;

    if (!url) {
      return bot.sendMessage(
        chatId,
        'Silakan kirim link Google Drive yang ingin Anda download. Contoh: `/drivedl https://drive.google.com/file/d/xxxx/view`',
        {
          parse_mode: 'Markdown',
          reply_to_message_id: messageId,
        }
      );
    }

    if (!url.startsWith('http')) {
      return bot.sendMessage(
        chatId,
        'Masukkan URL Google Drive yang valid setelah perintah.',
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

    bot.sendChatAction(chatId, 'typing');

    try {
      const apiUrl = `https://api.agatz.xyz/api/drivedl?url=${encodeURIComponent(url)}`;
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (!data.status || !data.data) {
        throw new Error('Gagal mendapatkan data file.');
      }

      const { name, download } = data.data;

      bot.sendMessage(chatId, 'Mengunduh file, harap tunggu...');

      const tempFilePath = path.join(__dirname, name);
      const writer = fs.createWriteStream(tempFilePath);
      const fileResponse = await axios({
        url: download,
        method: 'GET',
        responseType: 'stream',
      });

      fileResponse.data.pipe(writer);

      writer.on('finish', async () => {
        try {
          // Periksa ukuran file
          const stats = fs.statSync(tempFilePath);
          const fileSizeBytes = stats.size;

          if (fileSizeBytes > MAX_FILE_SIZE) {
            return bot.sendMessage(
              chatId,
              `✅ *Google Drive Downloader*\n\n📂 Nama File: *${name}*\n📏 Ukuran: *${(fileSizeBytes / 1024 / 1024).toFixed(2)} MB*\n🔗 [Klik untuk Download](${download})`,
              {
                parse_mode: 'Markdown',
                reply_to_message_id: messageId,
              }
            );
          }

          // Kirim file ke pengguna
          await bot.sendDocument(chatId, tempFilePath, {
            caption: `📂 *${name}* (${(fileSizeBytes / 1024 / 1024).toFixed(2)} MB)`,
            parse_mode: 'Markdown',
            reply_to_message_id: messageId,
          });

          // Hapus file setelah dikirim
          fs.unlinkSync(tempFilePath);

          // Tambah limit jika pengguna bukan premium
          if (!database[userId].premium) {
            database[userId].limit += 1;
            saveDatabase();
          }
        } catch (error) {
          console.error('Gagal mengirim file:', error);
          if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
          bot.sendMessage(
            chatId,
            'Gagal mengirim file. Pastikan file tidak melebihi batas ukuran yang diizinkan.',
            { reply_to_message_id: messageId }
          );
        }
      });

      writer.on('error', (err) => {
        console.error('Gagal mengunduh file:', err);
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        bot.sendMessage(
          chatId,
          'Gagal mengunduh file dari Google Drive.',
          { reply_to_message_id: messageId }
        );
      });
    } catch (error) {
      console.error('Error occurred:', error);
      bot.sendMessage(
        chatId,
        'Gagal mengambil data dari Google Drive. Pastikan URL yang dimasukkan benar.',
        { reply_to_message_id: messageId }
      );
    }
  });
};