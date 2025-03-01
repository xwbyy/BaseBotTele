const axios = require('axios');

module.exports = (bot, config, database, saveDatabase) => {
  const handleSpotifyCommand = async (msg, match) => {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    const url = match[1] ? match[1].trim() : null;
    const userId = msg.from.id.toString();
    const senderName = msg.from.first_name;

    // Validasi URL Spotify
    if (!url || !url.startsWith('https://open.spotify.com/track/')) {
      return bot.sendMessage(
        chatId,
        '❌ Masukkan URL Spotify yang valid setelah perintah.\n\nContoh: `/Spotifydl https://open.spotify.com/track/630DpnzdfjdVqv2yLfPbAX`',
        { reply_to_message_id: messageId, parse_mode: 'Markdown' }
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
      console.log('Fetching Spotify data...');

      // Request ke API
      const response = await axios.get('https://api.agatz.xyz/api/spotifydl', {
        params: { url },
        timeout: 5000, // Timeout untuk menghindari bot freeze
      });

      const data = response.data;
      console.log('Response from Spotify API:', data);

      if (data.status === 200 && data.data) {
        let trackData;
        try {
          trackData = JSON.parse(data.data);
        } catch (err) {
          return bot.sendMessage(chatId, '❌ Terjadi kesalahan saat memproses data.', { reply_to_message_id: messageId });
        }

        const audioUrl = trackData.url_audio_v1;
        const trackName = trackData.judul;
        const artist = trackData.nama_channel;
        const artwork = trackData.gambar_kecil?.[0]?.url || null;

        if (audioUrl) {
          await bot.sendMessage(
            chatId,
            `🎵 *${trackName}* by *${artist}*\n\n🔗 [Download MP3](${audioUrl})`,
            { parse_mode: 'Markdown', reply_to_message_id: messageId }
          );

          if (artwork) {
            await bot.sendPhoto(chatId, artwork, {
              caption: '🎨 Cover Art',
              reply_to_message_id: messageId,
            });
          }

          // Tambah limit jika pengguna bukan premium
          if (!database[userId].premium) {
            database[userId].limit += 1;
            saveDatabase();
          }
        } else {
          await bot.sendMessage(chatId, '❌ Tidak dapat menemukan MP3 untuk URL ini.', { reply_to_message_id: messageId });
        }
      } else {
        await bot.sendMessage(chatId, '❌ Gagal mengambil data dari Spotify. Pastikan URL benar.', { reply_to_message_id: messageId });
      }
    } catch (error) {
      console.error('Error occurred:', error);

      if (error.response) {
        await bot.sendMessage(
          chatId,
          `❌ Terjadi kesalahan dari server Spotify. Status: ${error.response.status}`,
          { reply_to_message_id: messageId }
        );
      } else if (error.request) {
        await bot.sendMessage(
          chatId,
          '❌ Tidak dapat menghubungi server Spotify. Coba lagi nanti.',
          { reply_to_message_id: messageId }
        );
      } else {
        await bot.sendMessage(
          chatId,
          '❌ Terjadi kesalahan yang tidak terduga.',
          { reply_to_message_id: messageId }
        );
      }
    }
  };

  // Menangkap perintah /Spotifydl atau /spotifydl
  bot.onText(/\/spotifydl(\s+.+)?/i, handleSpotifyCommand);
};