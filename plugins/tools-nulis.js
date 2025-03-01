const axios = require('axios');

module.exports = (bot, config, database, saveDatabase) => {
  bot.onText(/^\/nulis(?:\s(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    const userId = msg.from.id.toString();
    const senderName = msg.from.first_name;
    const input = match[1]?.trim();

    // Jika tidak ada input, minta pengguna memasukkan teks
    if (!input) {
      return bot.sendMessage(
        chatId,
        'Silakan masukkan teks yang ingin ditulis.\n\nContoh:\n`/nulis Vyna|10A|Halo semuanya!`',
        { reply_to_message_id: messageId, parse_mode: 'Markdown' }
      );
    }

    // Pisahkan input berdasarkan "|"
    const parts = input.split('|').map(part => part.trim());
    if (parts.length < 3) {
      return bot.sendMessage(
        chatId,
        'Format salah! Gunakan format: /nulis nama|kelas|text\n\nContoh: `/nulis Vyna|10A|Halo semuanya!`',
        { reply_to_message_id: messageId, parse_mode: 'Markdown' }
      );
    }

    const [name, kelas, text] = parts;

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

    bot.sendMessage(chatId, '✍️ Sedang menulis, harap tunggu...');

    try {
      const apiUrl = `https://api.siputzx.my.id/api/m/nulis?text=${encodeURIComponent(text)}&name=${encodeURIComponent(name)}&class=${encodeURIComponent(kelas)}`;

      // Ambil gambar hasil dari API
      const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

      // Kirim hasil tulisan sebagai foto ke pengguna
      await bot.sendPhoto(chatId, Buffer.from(response.data), {
        reply_to_message_id: messageId,
      });

      // Tambah limit jika pengguna bukan premium
      if (!database[userId].premium) {
        database[userId].limit += 1;
        saveDatabase();
      }
    } catch (error) {
      console.error('Error occurred:', error?.response?.data || error.message);
      bot.sendMessage(chatId, '⚠️ Gagal membuat tulisan. Coba lagi nanti.', {
        reply_to_message_id: messageId,
      });
    }
  });
};