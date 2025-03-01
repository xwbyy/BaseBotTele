const axios = require('axios');

module.exports = (bot, config, database, saveDatabase) => {
  const handleAiporn = async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const chatType = msg.chat.type;

    // Cek apakah chat adalah private chat
    if (chatType !== 'private') {
      return bot.sendMessage(chatId, '⚠️ Perintah ini hanya bisa digunakan di private chat.');
    }

    // Inisialisasi pengguna jika belum ada di database
    if (!database[userId]) {
      database[userId] = { limit: 0, premium: false };
    }

    // Cek limit pengguna
    if (!database[userId].premium && database[userId].limit >= config.globallimit) {
      return bot.sendMessage(chatId, `❌ Anda telah mencapai batas penggunaan gratis (${config.globallimit} kali). Silakan upgrade ke premium.`);
    }

    // Kirim peringatan sebelum menampilkan gambar
    bot.sendMessage(chatId, '⚠️ Konten ini mengandung gambar eksplisit. Lanjutkan? (Ketik "ya" untuk melanjutkan)')
      .then(() => {
        bot.once('message', async (response) => {
          if (response.text.toLowerCase() === 'ya') {
            try {
              const apiResponse = await axios.get('https://porn-image1.p.rapidapi.com/?type=Pink%20', {
                headers: {
                  'x-rapidapi-key': '6cf87a7b36mshe268db0435aae4ep198271jsn6d6dbeb1c212',
                  'x-rapidapi-host': 'porn-image1.p.rapidapi.com',
                },
              });

              const imageUrl = apiResponse.data.url;
              bot.sendPhoto(chatId, imageUrl, { caption: 'Ini adalah gambar yang kamu minta.' });

              // Tambah limit pengguna jika bukan premium
              if (!database[userId].premium) {
                database[userId].limit += 1;
                saveDatabase();
              }
            } catch (error) {
              console.error('Error fetching image:', error);
              bot.sendMessage(chatId, '❌ Terjadi kesalahan saat mengambil gambar.');
            }
          } else {
            bot.sendMessage(chatId, '❌ Permintaan dibatalkan.');
          }
        });
      });
  };

  bot.onText(/\/aiporn/, handleAiporn);
};