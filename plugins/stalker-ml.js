const axios = require('axios');

module.exports = (bot, config, database, saveDatabase) => {
  bot.onText(/^\/stalkml(?:\s(.+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const input = match[1];

    if (!input) {
      return bot.sendMessage(chatId, "⚠️ Masukkan ID dan server Mobile Legends.\n\nContoh: `/stalkml 1617241919|16844`", {
        parse_mode: "Markdown",
        reply_to_message_id: msg.message_id
      });
    }

    const [id, server] = input.split("|").map(s => s.trim());

    if (!id || !server) {
      return bot.sendMessage(chatId, "⚠️ Format salah. Gunakan format: `/stalkml ID|Server`\n\nContoh: `/stalkml 1617241919|16844`", {
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

    bot.sendMessage(chatId, `🔍 Mencari informasi akun ML dengan ID *${id}* dan server *${server}*...`, {
      parse_mode: "Markdown",
      reply_to_message_id: msg.message_id
    });

    try {
      const apiUrl = `https://api.botcahx.eu.org/api/stalk/ml?id=${encodeURIComponent(id)}&server=${encodeURIComponent(server)}&apikey=${global.api.btch}`;
      const response = await axios.get(apiUrl);

      console.log("API Response:", response.data); // Debugging

      if (!response.data || !response.data.result || !response.data.result.userName) {
        return bot.sendMessage(chatId, "❌ ID atau server tidak ditemukan.\n\n🔹 Pastikan ID dan server yang dimasukkan benar.\n🔹 Coba cek langsung di game untuk memastikan ID dan server.\n🔹 Jika masih gagal, API mungkin sedang mengalami gangguan.", {
          reply_to_message_id: msg.message_id
        });
      }

      const { userName } = response.data.result;

      bot.sendMessage(chatId, `🎮 *Stalking Mobile Legends*\n\n📌 *ID:* ${id}\n📌 *Server:* ${server}\n👤 *Username:* ${userName}`, {
        parse_mode: "Markdown",
        reply_to_message_id: msg.message_id
      });

      if (!database[userId].premium) {
        database[userId].limit += 1;
        saveDatabase();
      }
    } catch (error) {
      console.error("Error fetching ML data:", error.response ? error.response.data : error);
      bot.sendMessage(chatId, "❌ Terjadi kesalahan saat mencari data akun ML. Silakan coba lagi nanti.", {
        reply_to_message_id: msg.message_id
      });
    }
  });
};