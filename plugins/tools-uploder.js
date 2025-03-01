const FormData = require('form-data');
const fetch = require('node-fetch');

// Fungsi untuk mengunggah file ke Catbox.moe
const catbox = async (buffer) => {
  // Dynamic import file-type
  const { fileTypeFromBuffer } = await import('file-type');
  const fileType = await fileTypeFromBuffer(buffer);
  if (!fileType) throw new Error('File type tidak dikenali');
  const ext = fileType.ext; // Ekstensi file
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

module.exports = (bot, config, database, saveDatabase) => {
  // Handler untuk perintah /upload atau /tourl
  bot.onText(/\/upload|\/tourl/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString(); // Ambil ID pengguna
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
    const mime = (q.document || q.photo || q.video || q.audio || q.voice) ? true : false;

    if (!mime) {
      return bot.sendMessage(
        chatId,
        '🚫 Silakan balas atau kirim file media (gambar, video, dokumen, dll.) untuk diunggah.',
        { reply_to_message_id: messageId }
      );
    }

    // Kirim pesan "Loading..."
    bot.sendMessage(chatId, '🔄 Mengunggah file, mohon tunggu...', { reply_to_message_id: messageId });

    try {
      // Download file media
      let fileId;
      if (q.document) fileId = q.document.file_id;
      else if (q.photo) fileId = q.photo[q.photo.length - 1].file_id;
      else if (q.video) fileId = q.video.file_id;
      else if (q.audio) fileId = q.audio.file_id;
      else if (q.voice) fileId = q.voice.file_id;

      const fileUrl = await bot.getFileLink(fileId);
      const response = await fetch(fileUrl);
      const buffer = await response.buffer();

      // Upload file ke Catbox.moe
      const urlCatbox = await catbox(buffer);

      // Kirim hasil tautan
      bot.sendMessage(
        chatId,
        `🌐 *File Uploaded Successfully!*\n📤 *Download Link:* ${urlCatbox}`,
        { reply_to_message_id: messageId, parse_mode: 'Markdown' }
      );

      // Tambah limit jika bukan pengguna premium
      if (!database[userId].premium) {
        database[userId].limit += 1;
        saveDatabase(); // Simpan perubahan ke database
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      bot.sendMessage(
        chatId,
        '❌ Gagal mengunggah file. Pastikan file tidak terlalu besar atau coba lagi nanti.',
        { reply_to_message_id: messageId }
      );
    }
  });
};