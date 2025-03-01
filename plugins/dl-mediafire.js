const axios = require('axios');
const fs = require('fs');
const path = require('path');

const MAX_FILE_SIZE = 50 * 1024 * 1024; // Maksimum 50MB

module.exports = (bot, config, database, saveDatabase) => {
  bot.onText(/^\/mediafire(?:\s(.+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    const url = match[1] ? match[1].trim() : null;
    const userId = msg.from.id.toString();
    const senderName = msg.from.first_name;

    if (!url) {
      return bot.sendMessage(
        chatId,
        'Silakan kirim link MediaFire yang ingin Anda download. Contoh: `/mediafire https://www.mediafire.com/file/xxxx`',
        {
          parse_mode: 'Markdown',
          reply_to_message_id: messageId,
        }
      );
    }

    if (!url.startsWith('http')) {
      return bot.sendMessage(
        chatId,
        'Masukkan URL MediaFire yang valid setelah perintah.',
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
      const apiUrl = `https://api.agatz.xyz/api/mediafire?url=${encodeURIComponent(url)}`;
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (!data.status || !data.data || !data.data[0]) {
        throw new Error('Gagal mendapatkan data file.');
      }

      const { nama, size, link } = data.data[0];
      let fileSizeBytes = parseFloat(size.replace(/[^0-9.]/g, '')) * 1024;
      if (size.includes('MB')) fileSizeBytes *= 1024;

      // Jika file lebih besar dari 50MB, kirim link download saja
      if (fileSizeBytes > MAX_FILE_SIZE) {
        return bot.sendMessage(
          chatId,
          `✅ *MediaFire Downloader*\n\n📂 Nama File: *${nama}*\n📏 Ukuran: *${size}*\n🔗 [Klik untuk Download](${link})`,
          {
            parse_mode: 'Markdown',
            reply_to_message_id: messageId,
          }
        );
      }

      bot.sendMessage(chatId, 'Mengunduh file, harap tunggu...');

      const tempFilePath = path.join(__dirname, nama);
      const writer = fs.createWriteStream(tempFilePath);
      const fileResponse = await axios({
        url: link,
        method: 'GET',
        responseType: 'stream',
      });

      fileResponse.data.pipe(writer);

      writer.on('finish', async () => {
        try {
          // Kirim file ke pengguna
          await bot.sendDocument(chatId, tempFilePath, {
            caption: `📂 *${nama}* (${size})`,
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
          'Gagal mengunduh file dari MediaFire.',
          { reply_to_message_id: messageId }
        );
      });
    } catch (error) {
      console.error('Error occurred:', error);
      bot.sendMessage(
        chatId,
        'Gagal mengambil data dari MediaFire. Pastikan URL yang dimasukkan benar.',
        { reply_to_message_id: messageId }
      );
    }
  });
};