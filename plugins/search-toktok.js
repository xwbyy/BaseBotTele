const fetch = require('node-fetch');

module.exports = (bot, config, database, saveDatabase) => {
  // Fungsi untuk memeriksa apakah pengguna adalah premium
  const isPremiumUser = (userId) => {
    return database[userId]?.premium || false;
  };

  // Fungsi untuk mengecek dan menambah counter penggunaan
  const checkAndUpdateUsage = (userId) => {
    if (!database[userId]) {
      database[userId] = { limit: 0, premium: false };
    }

    if (!isPremiumUser(userId)) {
      database[userId].limit += 1;
      saveDatabase();
      return database[userId].limit <= config.globallimit;
    }
    return true; // Pengguna premium tidak dibatasi
  };

  // /searchtt command untuk mencari video TikTok
  bot.onText(/\/searchtt(?: (.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const senderName = msg.from.first_name;
    const query = match[1];

    if (!query) {
      return bot.sendMessage(chatId, "Gunakan format: /searchtt <kata kunci>. Contoh: /searchtt tapera");
    }

    // Cek batasan penggunaan
    if (!checkAndUpdateUsage(userId)) {
      return bot.sendMessage(
        chatId,
        `❌ ${senderName}, Anda telah mencapai batas penggunaan gratis (${config.globallimit} kali). Silakan upgrade ke premium.`
      );
    }

    bot.sendMessage(chatId, 'Memproses pencarian, mohon tunggu sebentar...');

    try {
      const apiUrl = `https://api.agatz.xyz/api/tiktoksearch?message=${encodeURIComponent(query)}`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.status === 200 && data.data && data.data.no_watermark) {
        const videoUrl = data.data.no_watermark;
        const musicUrl = data.data.music;

        // Kirim video ke pengguna
        await bot.sendVideo(chatId, videoUrl, {
          caption: `Video TikTok\n\n🎵 Musik: ${musicUrl}`,
        });
      } else {
        await bot.sendMessage(chatId, 'Maaf, video tidak ditemukan. Silakan coba lagi dengan kata kunci yang berbeda.');
      }
    } catch (error) {
      await bot.sendMessage(chatId, 'Terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi nanti.');
      console.error('Error fetching TikTok data:', error);
    }
  });

  // /tts command untuk mengirim video TikTok berdasarkan URL
  bot.onText(/\/tts(?: (.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const senderName = msg.from.first_name;
    const url = match[1];

    if (!url) {
      return bot.sendMessage(chatId, "Gunakan format: /tts <URL TikTok>. Contoh: /tts https://tiktok.com/...");
    }

    // Cek batasan penggunaan
    if (!checkAndUpdateUsage(userId)) {
      return bot.sendMessage(
        chatId,
        `❌ ${senderName}, Anda telah mencapai batas penggunaan gratis (${config.globallimit} kali). Silakan upgrade ke premium.`
      );
    }

    bot.sendMessage(chatId, 'Memproses permintaan, mohon tunggu sebentar...');

    try {
      const apiUrl = `https://api.agatz.xyz/api/tiktok?url=${encodeURIComponent(url)}`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.status === 200 && data.data && data.data.no_watermark) {
        const videoUrl = data.data.no_watermark;
        const musicUrl = data.data.music;

        // Kirim video ke pengguna
        await bot.sendVideo(chatId, videoUrl, {
          caption: `Video TikTok\n\n🎵 Musik: ${musicUrl}`,
        });
      } else {
        await bot.sendMessage(chatId, 'Maaf, video tidak ditemukan. Pastikan URL yang Anda masukkan valid.');
      }
    } catch (error) {
      await bot.sendMessage(chatId, 'Terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi nanti.');
      console.error('Error fetching TikTok data:', error);
    }
  });
};