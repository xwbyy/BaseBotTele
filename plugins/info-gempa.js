const fetch = require('node-fetch');

let lastEarthquake = null; // Variabel untuk menyimpan data gempa terakhir

module.exports = (bot, config, database, saveDatabase) => {
  // Fungsi untuk mengecek update gempa terbaru
  async function checkForEarthquakeUpdates() {
    try {
      const response = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json');
      const res = await response.json();

      if (res.Infogempa && res.Infogempa.gempa) {
        let newEarthquake = res.Infogempa.gempa;

        if (!lastEarthquake || newEarthquake.DateTime !== lastEarthquake.DateTime) {
          lastEarthquake = newEarthquake;

          let message = `
          乂 *Info Gempa Terkini*

          ❃ *Tanggal:* ${newEarthquake.Tanggal}
          ❃ *Jam:* ${newEarthquake.Jam}
          ❃ *Coordinates:* ${newEarthquake.Coordinates} (${newEarthquake.Lintang}, ${newEarthquake.Bujur})
          ❃ *Magnitude:* ${newEarthquake.Magnitude}
          ❃ *Kedalaman:* ${newEarthquake.Kedalaman}
          ❃ *Wilayah:* ${newEarthquake.Wilayah}
          ❃ *Potensi:* ${newEarthquake.Potensi}
          ❃ *Dirasakan:* ${newEarthquake.Dirasakan}
          `.trim();

          let imageUrl = `https://data.bmkg.go.id/DataMKG/TEWS/${newEarthquake.Shakemap}`;

          if (Array.isArray(config.chatIds)) {
            config.chatIds.forEach(chatId => {
              bot.sendPhoto(chatId, imageUrl, { caption: message, parse_mode: 'Markdown' });
            });
          } else {
            console.error('Chat IDs are not properly configured.');
          }
        }
      } else {
        console.error('Unexpected API response structure:', res);
      }
    } catch (error) {
      console.error('Error checking earthquake updates:', error);
    }
  }

  // Set interval untuk cek gempa tiap 5 menit
  setInterval(checkForEarthquakeUpdates, 5 * 60 * 1000);

  // Command /infogempa dengan logika limit
  bot.onText(/\/infogempa/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const senderName = msg.from.first_name;
    const messageId = msg.message_id;

    // Periksa apakah pengguna ada di database
    if (!database[userId]) {
      database[userId] = { limit: 0, premium: false, premiumExpiry: null };
    }

    // Periksa batas limit untuk pengguna gratis
    if (!database[userId].premium && database[userId].limit >= config.globallimit) {
      return bot.sendMessage(
        chatId,
        `🚫 ${senderName}, Anda telah mencapai batas penggunaan gratis (${config.globallimit} kali). Silakan upgrade ke premium.`,
        { reply_to_message_id: messageId }
      );
    }

    try {
      bot.sendMessage(chatId, '🔄 Mengambil data gempa terbaru, mohon tunggu...', { reply_to_message_id: messageId });

      const response = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json');
      const res = await response.json();

      if (res.Infogempa && res.Infogempa.gempa) {
        let data = res.Infogempa.gempa;

        let teks = `
        乂 *Info Gempa Terkini*

        ❃ *Tanggal:* ${data.Tanggal}
        ❃ *Jam:* ${data.Jam}
        ❃ *Coordinates:* ${data.Coordinates} (${data.Lintang}, ${data.Bujur})
        ❃ *Magnitude:* ${data.Magnitude}
        ❃ *Kedalaman:* ${data.Kedalaman}
        ❃ *Wilayah:* ${data.Wilayah}
        ❃ *Potensi:* ${data.Potensi}
        ❃ *Dirasakan:* ${data.Dirasakan}
        `.trim();

        let imageUrl = `https://data.bmkg.go.id/DataMKG/TEWS/${data.Shakemap}`;
        await bot.sendPhoto(chatId, imageUrl, { caption: teks, parse_mode: 'Markdown' });

        // Tambah limit jika bukan premium
        if (!database[userId].premium) {
          database[userId].limit += 1;
          saveDatabase();
        }
      } else {
        await bot.sendMessage(chatId, 'Data gempa tidak tersedia.', { reply_to_message_id: messageId });
      }
    } catch (error) {
      console.error(error);
      await bot.sendMessage(chatId, '❌ Terjadi kesalahan saat mengambil data gempa.', { reply_to_message_id: messageId });
    }
  });
};