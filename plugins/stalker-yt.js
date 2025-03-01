const axios = require('axios');

module.exports = (bot, config, database, saveDatabase) => {
  bot.onText(/^\/stalkyt(?:\s(.+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const username = match[1];

    if (!username) {
      return bot.sendMessage(chatId, "⚠️ Masukkan username YouTube.\n\nContoh: `/stalkyt VynaaChan`", {
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

    bot.sendMessage(chatId, `🔍 Mencari informasi channel YouTube *${username}*...`, {
      parse_mode: "Markdown",
      reply_to_message_id: msg.message_id
    });

    try {
      const apiUrl = `https://api.botcahx.eu.org/api/stalk/yt?username=${encodeURIComponent(username)}&apikey=${global.api.btch}`;
      const response = await axios.get(apiUrl);

      console.log("API Response:", response.data); // Debugging

      if (!response.data || !response.data.result || !response.data.result.data || response.data.result.data.length === 0) {
        return bot.sendMessage(chatId, "❌ Channel tidak ditemukan.\n\n🔹 Pastikan username yang dimasukkan benar.\n🔹 Coba cari langsung di YouTube.\n🔹 Jika masih gagal, API mungkin sedang mengalami gangguan.", {
          reply_to_message_id: msg.message_id
        });
      }

      const channel = response.data.result.data[0];
      const { channelId, url, channelName, avatar, isVerified, subscriberH, description } = channel;
      
      const verificationStatus = isVerified ? "✅ Terverifikasi" : "❌ Tidak Terverifikasi";
      const caption = `📺 *Stalking YouTube*\n\n🎥 *Nama Channel:* ${channelName}\n🔗 *Link:* [Klik Disini](${url})\n📌 *Channel ID:* ${channelId}\n✔️ *Status:* ${verificationStatus}\n👥 *Subscribers:* ${subscriberH}\n📝 *Deskripsi:* ${description || "Tidak tersedia"}`;

      bot.sendPhoto(chatId, avatar, {
        caption,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        reply_to_message_id: msg.message_id
      });

      if (!database[userId].premium) {
        database[userId].limit += 1;
        saveDatabase();
      }
    } catch (error) {
      console.error("Error fetching YouTube data:", error.response ? error.response.data : error);
      bot.sendMessage(chatId, "❌ Terjadi kesalahan saat mencari channel YouTube. Silakan coba lagi nanti.", {
        reply_to_message_id: msg.message_id
      });
    }
  });
};