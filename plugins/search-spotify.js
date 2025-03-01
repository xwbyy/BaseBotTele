const axios = require('axios');

module.exports = (bot, config, database, saveDatabase) => {
  const handleSpotifySearchCommand = async (msg, match) => {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    const query = match[1] ? match[1].trim() : null;
    const userId = msg.from.id.toString();
    const senderName = msg.from.first_name;

    if (!query) {
      return bot.sendMessage(
        chatId,
        'Masukkan judul lagu setelah perintah. Contoh: /spotifysearch Ada Aku',
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

    try {
      bot.sendChatAction(chatId, 'typing');
      console.log('Searching Spotify for song:', query);

      // Panggil API Spotify
      const response = await axios.get('https://api.agatz.xyz/api/spotify', {
        params: { message: query },
        timeout: 5000, // Timeout untuk menghindari bot freeze
      });

      const data = response.data;
      console.log('Response from Spotify API:', data);

      if (data.status === 200 && data.data && data.data.length > 0) {
        let message = `🔍 Hasil pencarian untuk: *${query}*\n\n`;

        data.data.forEach(track => {
          message += `🎵 *${track.trackName}* - ${track.artistName}\n`;
          message += `💿 Album: ${track.albumName}\n⏱️ Durasi: ${track.duration}\n`;
          message += `🔗 [Dengarkan di Spotify](${track.externalUrl})\n\n`;
        });

        await bot.sendMessage(chatId, message, {
          parse_mode: 'Markdown',
          reply_to_message_id: messageId,
        });

        // Tambah limit jika pengguna bukan premium
        if (!database[userId].premium) {
          database[userId].limit += 1;
          saveDatabase();
        }
      } else {
        await bot.sendMessage(
          chatId,
          'Tidak ditemukan lagu dengan judul tersebut di Spotify.',
          { reply_to_message_id: messageId }
        );
      }
    } catch (error) {
      console.error('Error occurred:', error);

      if (error.response) {
        await bot.sendMessage(
          chatId,
          `Terjadi kesalahan saat mengambil data dari Spotify. Status: ${error.response.status}`,
          { reply_to_message_id: messageId }
        );
      } else if (error.request) {
        await bot.sendMessage(
          chatId,
          'Tidak dapat menghubungi server Spotify. Coba lagi nanti.',
          { reply_to_message_id: messageId }
        );
      } else {
        await bot.sendMessage(
          chatId,
          'Terjadi kesalahan yang tidak terduga.',
          { reply_to_message_id: messageId }
        );
      }
    }
  };

  // Mendaftarkan command /spotifysearch
  bot.onText(/\/spotifysearch(\s+.+)?/, handleSpotifySearchCommand);
};