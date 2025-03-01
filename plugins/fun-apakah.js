module.exports = (bot, config, database, saveDatabase) => {
  // Handler untuk perintah /apakah
  bot.onText(/^\/apakah\s+(.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString(); // Ambil ID pengguna
    const question = match[1].trim(); // Ambil pertanyaan dari pesan pengguna

    // Periksa apakah pengguna ada di database
    if (!database[userId]) {
      database[userId] = { limit: 0, premium: false, premiumExpiry: null };
    }

    // Periksa apakah pengguna telah mencapai batas limit
    if (!database[userId].premium && database[userId].limit >= config.globallimit) {
      return bot.sendMessage(
        chatId,
        `Anda telah mencapai batas penggunaan gratis sebanyak ${config.globallimit} kali. Silakan upgrade ke premium untuk terus menggunakan fitur ini.`
      );
    }

    // Daftar jawaban acak
    const answers = [
      'Ya', 
      'Mungkin iya', 
      'Mungkin', 
      'Mungkin tidak', 
      'Tidak', 
      'Tidak mungkin'
    ];

    // Pilih jawaban acak
    const answer = answers[Math.floor(Math.random() * answers.length)];

    // Kirim jawaban ke pengguna
    bot.sendMessage(
      chatId,
      `🎱 *Pertanyaan:* ${question}\n*Jawaban:* ${answer}`,
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