const fetch = require('node-fetch');

module.exports = (bot, config, database, saveDatabase) => {
  // Handler untuk perintah /longtext
  bot.onText(/^\/longtext/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString(); // Ambil ID pengguna

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

    // Kirim pesan "Loading..."
    bot.sendMessage(chatId, '⏱️ Memuat teks panjang, mohon tunggu...', { reply_to_message_id: msg.message_id });

    try {
      // Ambil data teks panjang dari file JSON di GitHub
      const response = await fetch('https://raw.githubusercontent.com/Lanaxdev/hehehe/main/gaktau/longtext.json');
      const data = await response.json();

      // Periksa apakah data valid
      if (data && Array.isArray(data) && data.length > 0) {
        // Pilih teks secara acak
        const randomText = data[Math.floor(Math.random() * data.length)];

        // Kirim teks ke pengguna
        bot.sendMessage(chatId, randomText, { reply_to_message_id: msg.message_id });

        // Tambah limit jika bukan pengguna premium
        if (!database[userId].premium) {
          database[userId].limit += 1;
          saveDatabase(); // Simpan perubahan ke database
        }
      } else {
        bot.sendMessage(chatId, '❌ Gagal memuat teks. Silakan coba lagi nanti.', { reply_to_message_id: msg.message_id });
      }
    } catch (error) {
      console.error('Error fetching long text:', error);
      bot.sendMessage(chatId, '❌ Terjadi kesalahan saat memuat teks. Silakan coba lagi nanti.', { reply_to_message_id: msg.message_id });
    }
  });
};