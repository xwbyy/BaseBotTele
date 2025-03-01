module.exports = (bot, config, database, saveDatabase) => {
  // Handler untuk perintah /tololcek atau /cektolol
  bot.onText(/^\/(tololcek|cektolol)/, async (msg) => {
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

    // Daftar level ketololan
    const tolol = [
      'Tolol Level : 4%\n\nAMAN BANGET!',
      'Tolol Level : 7%\n\nMasih Aman',
      'Tolol Level : 12%\n\nAman Kok',
      'Tolol Level : 22%\n\nHampir Aman',
      'Tolol Level : 27%\n\nTolol dikit',
      'Tolol Level : 35%\n\nTolol ¼',
      'Tolol Level : 41%\n\nDah lewat dri Aman',
      'Tolol Level : 48%\n\nSetengah Tolol',
      'Tolol Level : 56%\n\nLu Tolol juga',
      'Tolol Level : 64%\n\nLumayan Tolol',
      'Tolol Level : 71%\n\nHebatnya ketololan lu',
      'Tolol Level : 1%\n\n99% LU GAK TOLOL!',
      'Tolol Level : 77%\n\nGak akan Salah Lagi dah tololnya lu',
      'Tolol Level : 83%\n\nDijamin tololnyan',
      'Tolol Level : 89%\n\nTolol Banget!',
      'Tolol Level : 94%\n\nSetolol Om Deddy😂',
      'Tolol Level : 100%\n\nLU ORANG TERTOLOL YANG PERNAH ADA!!!',
      'Tolol Level : 100%\n\nLU ORANG TERTOLOL YANG PERNAH ADA!!!',
      'Tolol Level : 100%\n\nLU ORANG TERTOLOL YANG PERNAH ADA!!!',
      'Tolol Level : 100%\n\nLU ORANG TERTOLOL YANG PERNAH ADA!!!',
    ];

    // Pilih hasil acak dari daftar tolol
    const result = tolol[Math.floor(Math.random() * tolol.length)];

    // Kirim hasil ke pengguna
    bot.sendMessage(
      chatId,
      `🎱 *Hasil Cek Tolol:*\n${result}`,
      {
        parse_mode: 'Markdown',
        reply_to_message_id: msg.message_id,
      }
    );

    // Tambah limit jika bukan pengguna premium
    if (!database[userId].premium) {
      database[userId].limit += 1;
      saveDatabase(); // Simpan perubahan ke database
    }
  });
};