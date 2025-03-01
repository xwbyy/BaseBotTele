const axios = require('axios');

module.exports = (bot, config, database, saveDatabase) => {
  bot.onText(/^\/stalkig(?:\s(.+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const username = match[1];

    if (!username) {
      return bot.sendMessage(chatId, "⚠️ Masukkan username Instagram.\n\nContoh: `/stalkig vynaa_valerie`", {
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

    bot.sendMessage(chatId, `🔍 Mencari informasi akun Instagram *@${username}*...`, {
      parse_mode: "Markdown",
      reply_to_message_id: msg.message_id
    });

    try {
      const apiUrl = `https://api.botcahx.eu.org/api/stalk/ig?username=${encodeURIComponent(username)}&apikey=${global.api.btch}`;
      const response = await axios.get(apiUrl);

      console.log("API Response:", response.data); // Debugging

      if (!response.data || !response.data.result || !response.data.result.username) {
        return bot.sendMessage(chatId, "❌ Username tidak ditemukan.\n\n🔹 Pastikan username yang dimasukkan benar.\n🔹 Coba cek langsung di Instagram.\n🔹 Jika masih gagal, API mungkin sedang mengalami gangguan.", {
          reply_to_message_id: msg.message_id
        });
      }

      const { username: uname, fullName, bio, followers, following, postsCount, photoUrl } = response.data.result;

      const caption = `📸 *Stalking Instagram*\n\n📌 *Username:* @${uname}\n👤 *Nama:* ${fullName || "Tidak tersedia"}\n📖 *Bio:* ${bio || "Tidak tersedia"}\n👥 *Followers:* ${followers}\n👣 *Following:* ${following}\n📸 *Jumlah Post:* ${postsCount}`;

      bot.sendPhoto(chatId, photoUrl, {
        caption,
        parse_mode: "Markdown",
        reply_to_message_id: msg.message_id
      });

      if (!database[userId].premium) {
        database[userId].limit += 1;
        saveDatabase();
      }
    } catch (error) {
      console.error("Error fetching IG data:", error.response ? error.response.data : error);
      bot.sendMessage(chatId, "❌ Terjadi kesalahan saat mencari data akun Instagram. Silakan coba lagi nanti.", {
        reply_to_message_id: msg.message_id
      });
    }
  });
};