const fetch = require('node-fetch');

module.exports = (bot, config, database, saveDatabase) => {
  // Handler untuk perintah /kodepos
  bot.onText(/^\/kodepos\s+(.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const daerah = match[1].trim();
    const messageId = msg.message_id;

    // Periksa apakah pengguna ada di database
    if (!database[userId]) {
      database[userId] = { limit: 0, premium: false, premiumExpiry: null };
    }

    // Periksa batas limit untuk pengguna gratis
    if (!database[userId].premium && database[userId].limit >= config.globallimit) {
      return bot.sendMessage(
        chatId,
        `🚫 Anda telah mencapai batas penggunaan gratis (${config.globallimit}). Upgrade ke premium untuk akses lebih lanjut.`
      );
    }

    try {
      // Kirim pesan "Loading..."
      bot.sendMessage(chatId, '🔄 Mencari kode pos, mohon tunggu...', { reply_to_message_id: messageId });

      // Ambil data dari API
      const apiUrl = `https://api.siputzx.my.id/api/tools/kodepos?form=${encodeURIComponent(daerah)}`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      // Periksa apakah data ditemukan
      if (data.status && data.data.length > 0) {
        const lokasi = data.data[0];

        // Format pesan
        const message = `
📮 *Kode Pos Ditemukan!*  
📌 *Desa:* ${lokasi.desa}  
🏘️ *Kecamatan:* ${lokasi.kecamatan}  
🏢 *Kota/Kabupaten:* ${lokasi.kota}  
🌍 *Provinsi:* ${lokasi.provinsi}  
🔢 *Kode Pos:* \`${lokasi.kodepos}\`
        `.trim();

        // Kirim hasil
        bot.sendMessage(chatId, message, {
          parse_mode: 'Markdown',
          reply_to_message_id: messageId,
        });

        // Tambah limit jika bukan premium
        if (!database[userId].premium) {
          database[userId].limit += 1;
          saveDatabase();
        }
      } else {
        bot.sendMessage(chatId, '❌ Kode pos tidak ditemukan untuk daerah tersebut.', { reply_to_message_id: messageId });
      }
    } catch (error) {
      console.error('Error fetching postal code data:', error);
      bot.sendMessage(chatId, '❌ Terjadi kesalahan saat mengambil data kode pos. Silakan coba lagi nanti.', { reply_to_message_id: messageId });
    }
  });
};