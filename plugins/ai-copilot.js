const axios = require('axios');

module.exports = (bot, config, database, saveDatabase) => {
  const handleCopilotCommand = async (msg, match) => {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    const question = match[1] ? match[1].trim() : null;
    const userId = msg.from.id.toString();
    const senderName = msg.from.first_name;

    if (!question) {
      return bot.sendMessage(
        chatId,
        'Masukkan teks setelah perintah, contoh: /copilot Hello',
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
      console.log('Fetching response from Copilot API...');

      const data = {
        message: question,
        conversation_id: null,
        tone: 'BALANCED',
        markdown: false,
        photo_url: null
      };

      const response = await axios.post('https://copilot5.p.rapidapi.com/copilot', data, {
        headers: {
          'x-rapidapi-key': '6cf87a7b36mshe268db0435aae4ep198271jsn6d6dbeb1c212',
          'x-rapidapi-host': 'copilot5.p.rapidapi.com',
          'Content-Type': 'application/json'
        }
      });

      console.log('Response from Copilot:', response.data);

      const copilotMessage = response.data.data.message.trim();
      await bot.sendMessage(chatId, copilotMessage, {
        reply_to_message_id: messageId,
      });

      // Tambah limit jika pengguna bukan premium
      if (!database[userId].premium) {
        database[userId].limit += 1;
        saveDatabase();
      }
    } catch (error) {
      console.error('Error occurred:', error);

      if (error.response) {
        await bot.sendMessage(
          chatId,
          `❌ Terjadi kesalahan dari server Copilot. Status: ${error.response.status}`,
          { reply_to_message_id: messageId }
        );
      } else if (error.request) {
        await bot.sendMessage(
          chatId,
          '❌ Tidak dapat menghubungi server Copilot. Coba lagi nanti.',
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

  // Menangkap perintah /copilot
  bot.onText(/\/copilot(\s+.+)?/, handleCopilotCommand);
};