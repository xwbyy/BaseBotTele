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

// Fungsi untuk memproses gambar dengan API Jadianime
const jadianime = async (imageUrl) => {
  const apiUrl = `https://api.botcahx.eu.org/api/maker/jadianime?url=${imageUrl}&apikey=${global.api.btch}`;
  const response = await fetch(apiUrl);
  const data = await response.json();
  if (!data.status) throw new Error('Gagal memproses gambar dengan API Jadianime');
  return data.result.img_crop_single; // Mengembalikan URL gambar hasil anime
};

module.exports = (bot, config, database, saveDatabase) => {
  // Handler untuk perintah /jadianime
  bot.onText(/\/jadianime/, async (msg) => {
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
    const mime = (q.photo) ? true : false;

    if (!mime) {
      return bot.sendMessage(
        chatId,
        '🚫 Silakan balas atau kirim foto untuk diubah menjadi gambar anime.',
        { reply_to_message_id: messageId }
      );
    }

    // Kirim pesan "Loading..."
    bot.sendMessage(chatId, '🔄 Mengubah foto menjadi gambar anime, mohon tunggu...', { reply_to_message_id: messageId });

    try {
      // Download file foto
      const fileId = q.photo[q.photo.length - 1].file_id; // Ambil foto dengan resolusi tertinggi
      const fileUrl = await bot.getFileLink(fileId);
      const response = await fetch(fileUrl);
      const buffer = await response.buffer();

      // Upload foto ke Catbox.moe
      const urlCatbox = await catbox(buffer);

      // Proses foto dengan API Jadianime
      const animeUrl = await jadianime(urlCatbox);

      // Kirim hasil gambar anime
      bot.sendPhoto(chatId, animeUrl, {
        caption: '🎉 *Foto berhasil diubah menjadi gambar anime!*',
        reply_to_message_id: messageId,
        parse_mode: 'Markdown'
      });

      // Tambah limit jika bukan pengguna premium
      if (!database[userId].premium) {
        database[userId].limit += 1;
        saveDatabase(); // Simpan perubahan ke database
      }
    } catch (error) {
      console.error('Error processing image:', error);
      bot.sendMessage(
        chatId,
        '❌ Gagal memproses foto. Pastikan foto valid atau coba lagi nanti.',
        { reply_to_message_id: messageId }
      );
    }
  });
};