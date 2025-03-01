const axios = require('axios');

module.exports = (bot, config, database, saveDatabase) => {
  bot.onText(/^\/gcwa(?:\s(.+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const query = match[1];

    if (!query) {
      return bot.sendMessage(chatId, "⚠️ Silakan masukkan teks pencarian.\n\nContoh: `/gcwa bot wa`", {
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

    bot.sendMessage(chatId, `🔍 Mencari grup WhatsApp dengan kata kunci: *${query}*`, {
      parse_mode: "Markdown",
      reply_to_message_id: msg.message_id
    });

    try {
      const apiUrl = `https://api.botcahx.eu.org/api/search/linkgroupwa?text1=${encodeURIComponent(query)}&apikey=${global.api.btch}`;
      const response = await axios.get(apiUrl);

      if (!response.data.result || response.data.result.length === 0) {
        return bot.sendMessage(chatId, "❌ Tidak ditemukan grup WhatsApp yang sesuai dengan pencarian Anda.", {
          reply_to_message_id: msg.message_id
        });
      }

      // **Filter grup NSFW atau yang mengandung kata tidak pantas**
      const filterKata = ["bokep", "18+", "vcs", "porno", "dewasa", "sex", "mesum", "sange", "colmek", "crot"];
      let hasil = response.data.result.filter(group => 
        !filterKata.some(kata => group.title.toLowerCase().includes(kata) || (group.desc && group.desc.toLowerCase().includes(kata)))
      );

      if (hasil.length === 0) {
        return bot.sendMessage(chatId, "❌ Tidak ada grup yang sesuai atau semua hasil telah difilter karena konten tidak pantas.", {
          reply_to_message_id: msg.message_id
        });
      }

      let message = "📌 *Hasil Pencarian Grup WhatsApp:*\n\n";
      hasil.slice(0, 5).forEach((group) => {
        let title = group.title.replace(/[_*[\]()`]/g, ""); // Hapus karakter yang bikin error
        let desc = group.desc ? group.desc.replace(/[_*[\]()`]/g, "") : "Tidak ada deskripsi.";
        let link = group.link.replace(/[\]()]/g, ""); // Hapus karakter yang bikin error

        message += `🔹 *${title}*\n📜 ${desc}\n🔗 [Join Grup](${link})\n\n`;
      });

      bot.sendMessage(chatId, message, {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        reply_to_message_id: msg.message_id
      });

      if (!database[userId].premium) {
        database[userId].limit += 1;
        saveDatabase();
      }
    } catch (error) {
      console.error("Error fetching group links:", error);
      bot.sendMessage(chatId, "❌ Terjadi kesalahan saat mencari grup. Silakan coba lagi nanti.", {
        reply_to_message_id: msg.message_id
      });
    }
  });
};