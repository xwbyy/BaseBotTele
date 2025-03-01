const fetch = require('node-fetch');

module.exports = (bot, config, database, saveDatabase) => {
  // Command /ppcouple atau /ppcp
  bot.onText(/\/(ppcouple|ppcp)/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const senderName = msg.from.first_name;
    const messageId = msg.message_id;

    // Periksa apakah pengguna ada di database
    if (!database[userId]) {
      database[userId] = { limit: 0, premium: false };
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
      bot.sendMessage(chatId, '🔄 Mengambil foto profil couple, mohon tunggu...', { reply_to_message_id: messageId });

      // Ambil data dari JSON
      const response = await fetch('https://raw.githubusercontent.com/KazukoGans/database/main/anime/ppcouple.json');
      const data = await response.json();
      
      // Pilih pasangan secara acak
      const randomPair = data[Math.floor(Math.random() * data.length)];

      // Ambil buffer gambar cowok dan cewek
      const cowok = await fetch(randomPair.cowo);
      const cewek = await fetch(randomPair.cewe);

      const cowokBuffer = await cowok.buffer();
      const cewekBuffer = await cewek.buffer();

      // Kirim gambar cowok
      await bot.sendPhoto(chatId, cowokBuffer, { caption: '♂️ Foto Profil Couple Cowok', reply_to_message_id: messageId });

      // Kirim gambar cewek
      await bot.sendPhoto(chatId, cewekBuffer, { caption: '♀️ Foto Profil Couple Cewek', reply_to_message_id: messageId });

      // Tambah limit jika bukan premium
      if (!database[userId].premium) {
        database[userId].limit += 1;
        saveDatabase();
      }
    } catch (error) {
      console.error('Error mengambil gambar couple:', error);
      await bot.sendMessage(chatId, '❌ Terjadi kesalahan saat mengambil foto profil couple.', { reply_to_message_id: messageId });
    }
  });
};