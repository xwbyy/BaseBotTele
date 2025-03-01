const axios = require("axios");

module.exports = (bot, config, database, saveDatabase) => {
  bot.onText(/\/deepseek(\s+.+)?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    const question = match[1] ? match[1].trim() : null;
    const userId = msg.from.id.toString();
    const senderName = msg.from.first_name;

    if (!question) {
      return bot.sendMessage(
        chatId,
        'Masukkan pertanyaan setelah perintah, contoh: /deepseek siapa namamu',
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
      console.log('Fetching response from DeepSeek API...');

      const response = await axios.get('https://api.siputzx.my.id/api/ai/deepseek-llm-67b-chat', {
        params: { content: question }
      });

      if (response.data?.status && response.data?.data) {
        await bot.sendMessage(chatId, response.data.data.trim(), { reply_to_message_id: messageId });

        // Tambah limit jika pengguna bukan premium
        if (!database[userId].premium) {
          database[userId].limit += 1;
          saveDatabase();
        }
      } else {
        await bot.sendMessage(chatId, 'Gagal mendapatkan jawaban dari DeepSeek.', {
          reply_to_message_id: messageId,
        });
      }
    } catch (error) {
      console.error('Error occurred:', error?.response?.data || error.message);
      await bot.sendMessage(chatId, 'Terjadi kesalahan saat mencoba mengambil jawaban.', {
        reply_to_message_id: messageId,
      });
    }
  });
};