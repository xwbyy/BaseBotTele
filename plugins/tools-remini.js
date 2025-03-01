const FormData = require('form-data');
const fetch = require('node-fetch');

// Fungsi untuk mengunggah file ke Catbox.moe
const catbox = async (buffer) => {
  const { fileTypeFromBuffer } = await import('file-type');
  const fileType = await fileTypeFromBuffer(buffer);
  if (!fileType) throw new Error('File type tidak dikenali');
  const ext = fileType.ext; 
  const bodyForm = new FormData();
  bodyForm.append("fileToUpload", buffer, `file.${ext}`);
  bodyForm.append("reqtype", "fileupload");
  const res = await fetch("https://catbox.moe/user/api.php", {
    method: "POST",
    body: bodyForm,
  });
  const data = await res.text();
  return data;
};

// Fungsi untuk memproses gambar dengan API Remini
const remini = async (imageUrl) => {
  const apiUrl = `https://api.botcahx.eu.org/api/tools/remini?url=${imageUrl}&apikey=${global.api.btch}`;
  const response = await fetch(apiUrl);
  const data = await response.json();
  if (!data.status) throw new Error('Gagal meningkatkan kualitas gambar dengan API Remini');
  return data.url; // Mengembalikan URL gambar hasil HD
};

module.exports = (bot, config, database, saveDatabase) => {
  // Handler untuk perintah /remini atau /hd
  bot.onText(/\/(remini|hd)/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const messageId = msg.message_id;

    // Periksa apakah pengguna ada di database
    if (!database[userId]) {
      database[userId] = { limit: 0, premium: false, premiumExpiry: null };
    }

    // Periksa apakah pengguna telah mencapai batas limit
    if (!database[userId].premium && database[userId].limit >= config.globallimit) {
      return bot.sendMessage(
        chatId,
        `🚫 Anda telah mencapai batas penggunaan gratis sebanyak ${config.globallimit} kali. Silakan upgrade ke premium untuk terus menggunakan fitur ini.`
      );
    }

    // Cek apakah ada media yang di-reply
    const q = msg.reply_to_message ? msg.reply_to_message : msg;
    const mime = (q.photo) ? true : false;

    if (!mime) {
      return bot.sendMessage(
        chatId,
        '🚫 Silakan balas atau kirim foto untuk ditingkatkan kualitasnya.',
        { reply_to_message_id: messageId }
      );
    }

    // Kirim pesan "Loading..."
    bot.sendMessage(chatId, '🔄 Meningkatkan kualitas gambar, mohon tunggu...', { reply_to_message_id: messageId });

    try {
      // Download file foto
      const fileId = q.photo[q.photo.length - 1].file_id; // Ambil foto dengan resolusi tertinggi
      const fileUrl = await bot.getFileLink(fileId);
      const response = await fetch(fileUrl);
      const buffer = await response.buffer();

      // Upload foto ke Catbox.moe
      const urlCatbox = await catbox(buffer);

      // Proses foto dengan API Remini
      const hdUrl = await remini(urlCatbox);

      // Kirim hasil gambar HD
      bot.sendPhoto(chatId, hdUrl, {
        caption: '🎉 *Foto berhasil ditingkatkan kualitasnya!*',
        reply_to_message_id: messageId,
        parse_mode: 'Markdown'
      });

      // Tambah limit jika bukan pengguna premium
      if (!database[userId].premium) {
        database[userId].limit += 1;
        saveDatabase();
      }
    } catch (error) {
      console.error('Error processing image:', error);
      bot.sendMessage(
        chatId,
        '❌ Gagal meningkatkan kualitas gambar. Pastikan foto valid atau coba lagi nanti.',
        { reply_to_message_id: messageId }
      );
    }
  });
};