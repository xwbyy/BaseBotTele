const fetch = require('node-fetch');

module.exports = (bot, config, database, saveDatabase) => {
  // Handler untuk perintah /cekcuaca
  bot.onText(/^\/cekcuaca\s+(.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString(); // Ambil ID pengguna
    const daerah = match[1].trim(); // Ambil nama daerah dari pesan pengguna
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

    try {
      // Kirim pesan "Loading..."
      bot.sendMessage(chatId, '🔄 Mengambil data cuaca, mohon tunggu...', { reply_to_message_id: messageId });

      // Ambil data cuaca dari API
      const apiUrl = `https://api.siputzx.my.id/api/info/cuaca?q=${encodeURIComponent(daerah)}`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      // Periksa apakah data cuaca tersedia
      if (data.status === true && data.data && data.data.length > 0) {
        const lokasi = data.data[0].lokasi;
        const cuaca = data.data[0].cuaca[0][0]; // Ambil data cuaca terbaru

        // Format pesan cuaca lengkap
        const message = `
🌤️ *Info Cuaca Lengkap untuk ${lokasi.kecamatan}, ${lokasi.kotkab}, ${lokasi.provinsi}*

📌 *Lokasi:*
   - Provinsi: ${lokasi.provinsi}
   - Kot/Kab: ${lokasi.kotkab}
   - Kecamatan: ${lokasi.kecamatan}
   - Desa: ${lokasi.desa}
   - Koordinat: (${lokasi.lat}, ${lokasi.lon})
   - Zona Waktu: ${lokasi.timezone}

📅 *Tanggal dan Waktu:*
   - UTC: ${cuaca.utc_datetime}
   - Lokal: ${cuaca.local_datetime}

🌡️ *Kondisi Cuaca:*
   - Suhu: ${cuaca.t}°C
   - Cuaca: ${cuaca.weather_desc} (${cuaca.weather_desc_en})
   - Probabilitas Hujan: ${cuaca.tp}%
   - Tutupan Awan: ${cuaca.tcc}%
   - Kelembaban: ${cuaca.hu}%
   - Arah Angin: ${cuaca.wd} (${cuaca.wd_deg}°)
   - Kecepatan Angin: ${cuaca.ws} m/s
   - Jarak Pandang: ${cuaca.vs_text}

🖼️ *Gambar Cuaca:* [Lihat Gambar](${cuaca.image})
`.trim();

        // Kirim pesan cuaca lengkap
        bot.sendMessage(chatId, message, {
          parse_mode: 'Markdown',
          reply_to_message_id: messageId,
        });

        // Tambah limit jika bukan pengguna premium
        if (!database[userId].premium) {
          database[userId].limit += 1;
          saveDatabase(); // Simpan perubahan ke database
        }
      } else {
        bot.sendMessage(chatId, '❌ Data cuaca tidak ditemukan untuk daerah tersebut.', { reply_to_message_id: messageId });
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
      bot.sendMessage(chatId, '❌ Terjadi kesalahan saat mengambil data cuaca. Silakan coba lagi nanti.', { reply_to_message_id: messageId });
    }
  });
};