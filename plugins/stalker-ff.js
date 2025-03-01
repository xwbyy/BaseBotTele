const axios = require('axios');

module.exports = (bot, config, database, saveDatabase) => {
  bot.onText(/^\/stalkff(?:\s(.+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const input = match[1];

    if (!input) {
      return bot.sendMessage(chatId, "⚠️ Masukkan ID Free Fire.\n\nContoh: `/stalkff 919044185`", {
        parse_mode: "Markdown",
        reply_to_message_id: msg.message_id
      });
    }

    const id = input.trim();

    if (!id.match(/^\d+$/)) {
      return bot.sendMessage(chatId, "⚠️ Format salah. Gunakan angka saja.\n\nContoh: `/stalkff 919044185`", {
        parse_mode: "Markdown",
        reply_to_message_id: msg.message_id
      });
    }

    if (!database[userId]) {
      database[userId] = { limit: 0, premium: false, premiumExpiry: null };
    }

    if (!database[userId].premium && database[userId].limit >= config.globallimit) {
      return bot.sendMessage(
        chatId,
        `🚫 Anda telah mencapai batas penggunaan gratis sebanyak ${config.globallimit} kali. Silakan upgrade ke premium untuk terus menggunakan fitur ini.`,
        { reply_to_message_id: msg.message_id }
      );
    }

    if (!global.api || !global.api.btch) {
      return bot.sendMessage(chatId, "❌ API Key tidak ditemukan. Hubungi admin untuk memperbaikinya.", {
        reply_to_message_id: msg.message_id
      });
    }

    bot.sendMessage(chatId, `🔍 Mencari informasi akun Free Fire dengan ID *${id}*...`, {
      parse_mode: "Markdown",
      reply_to_message_id: msg.message_id
    });

    try {
      const apiUrl = `https://api.botcahx.eu.org/api/stalk/ff?id=${encodeURIComponent(id)}&apikey=${global.api.btch}`;
      const response = await axios.get(apiUrl);

      console.log("API Response:", response.data); // Debugging

      if (!response.data || !response.data.result || !response.data.result.userNameGame) {
        return bot.sendMessage(chatId, "❌ ID tidak ditemukan.\n\n🔹 Pastikan ID yang dimasukkan benar.\n🔹 Coba cek langsung di game.\n🔹 Jika masih gagal, API mungkin sedang mengalami gangguan.", {
          reply_to_message_id: msg.message_id
        });
      }

      const { userNameGame } = response.data.result;

      bot.sendMessage(chatId, `🔥 *Stalking Free Fire*\n\n📌 *ID:* ${id}\n👤 *Username:* ${userNameGame}`, {
        parse_mode: "Markdown",
        reply_to_message_id: msg.message_id
      });

      if (!database[userId].premium) {
        database[userId].limit += 1;
        saveDatabase();
      }
    } catch (error) {
      console.error("Error fetching FF data:", error.response ? error.response.data : error);
      bot.sendMessage(chatId, "❌ Terjadi kesalahan saat mencari data akun Free Fire. Silakan coba lagi nanti.", {
        reply_to_message_id: msg.message_id
      });
    }
  });
};