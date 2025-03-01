const fetch = require('node-fetch');

module.exports = (bot, config, database, saveDatabase) => {
  // Fungsi untuk memeriksa apakah pengguna adalah premium
  const isPremiumUser = (userId) => {
    return database[userId]?.premium || false;
  };

  // Fungsi untuk mengecek dan menambah counter penggunaan
  const checkAndUpdateUsage = (userId) => {
    if (!database[userId]) {
      database[userId] = { limit: 0, premium: false };
    }

    if (!isPremiumUser(userId)) {
      database[userId].limit += 1;
      saveDatabase();
      return database[userId].limit <= config.globallimit;
    }
    return true; // Pengguna premium tidak dibatasi
  };

  // /pindl command for downloading Pinterest media
  bot.onText(/^\/pindl(?: (.+))?$/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const senderName = msg.from.first_name;
    const url = match[1];

    if (!url) {
      return bot.sendMessage(chatId, "Gunakan format: /pindl <link Pinterest>. Contoh: /pindl https://pinterest.com/pin/12345");
    }

    // Cek batasan penggunaan
    if (!checkAndUpdateUsage(userId)) {
      return bot.sendMessage(
        chatId,
        `❌ ${senderName}, Anda telah mencapai batas penggunaan gratis (${config.globallimit} kali). Silakan upgrade ke premium.`
      );
    }

    bot.sendMessage(chatId, 'Memproses permintaan, mohon tunggu sebentar...');

    const apiUrl = `https://api.agatz.xyz/api/pinterest?url=${url}`;

    fetch(apiUrl)
      .then(response => response.json())
      .then(data => {
        if (data.status === 200 && data.data && data.data.data && data.data.data.result) {
          const resultUrl = data.data.data.result;
          bot.sendMessage(chatId, `Berikut link downloadnya: ${resultUrl}`);
        } else {
          bot.sendMessage(chatId, 'Maaf, terjadi kesalahan dalam memproses permintaan Anda. Silakan coba lagi.');
        }
      })
      .catch(error => {
        bot.sendMessage(chatId, 'Terjadi kesalahan saat menghubungi server. Silakan coba lagi nanti.');
        console.error('Error fetching data:', error);
      });
  });

  // /pin command for searching Pinterest images
  bot.onText(/^\/pin(?: (.+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const senderName = msg.from.first_name;
    const query = match[1];

    if (!query) {
      return bot.sendMessage(chatId, "Gunakan format: /pin <kata kunci>. Contoh: /pin Megawati");
    }

    // Cek batasan penggunaan
    if (!checkAndUpdateUsage(userId)) {
      return bot.sendMessage(
        chatId,
        `❌ ${senderName}, Anda telah mencapai batas penggunaan gratis (${config.globallimit} kali). Silakan upgrade ke premium.`
      );
    }

    bot.sendMessage(chatId, 'Memproses pencarian, mohon tunggu sebentar...');

    try {
      const imageUrl = await pinterest(query);
      const caption = `乂 P I N T E R E S T\nResult: ${query}`;
      bot.sendPhoto(chatId, imageUrl, { caption });
    } catch (error) {
      bot.sendMessage(chatId, `Maaf, terjadi kesalahan atau hasil pencarian tidak ditemukan. Silakan coba lagi.`);
      console.error('Error fetching Pinterest data:', error);
    }
  });

  // /pinlink command for getting a list of 10 Pinterest URLs
  bot.onText(/^\/pinlink(?: (.+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const senderName = msg.from.first_name;
    const query = match[1];

    if (!query) {
      return bot.sendMessage(chatId, "Gunakan format: /pinlink <kata kunci>. Contoh: /pinlink Megawati");
    }

    // Cek batasan penggunaan
    if (!checkAndUpdateUsage(userId)) {
      return bot.sendMessage(
        chatId,
        `❌ ${senderName}, Anda telah mencapai batas penggunaan gratis (${config.globallimit} kali). Silakan upgrade ke premium.`
      );
    }

    bot.sendMessage(chatId, 'Memproses pencarian, mohon tunggu sebentar...');

    try {
      const links = await pinterestLinks(query, 10);
      const caption = `乂 P I N T E R E S T\n*Hasil*: ${query}\n\n` + links.map((link, index) => `${index + 1}.\n${link}\n---------------`).join('\n');
      bot.sendMessage(chatId, caption);
    } catch (error) {
      bot.sendMessage(chatId, `Maaf, terjadi kesalahan atau hasil pencarian tidak ditemukan. Silakan coba lagi.`);
      console.error('Error fetching Pinterest links:', error);
    }
  });

  async function pinterest(query) {
    const apiUrl = `https://www.pinterest.com/resource/BaseSearchResource/get/?source_url=%2Fsearch%2Fpins%2F%3Fq%3D${encodeURIComponent(query)}&data=%7B%22options%22%3A%7B%22isPrefetch%22%3Afalse%2C%22query%22%3A%22${encodeURIComponent(query)}%22%2C%22scope%22%3A%22pins%22%2C%22no_fetch_context_on_resource%22%3Afalse%7D%2C%22context%22%3A%7B%7D%7D&_=1619980301559`;

    const res = await fetch(apiUrl);
    const json = await res.json();
    const data = json.resource_response.data.results;

    if (!data.length) {
      throw new Error(`Query "${query}" tidak ditemukan :/`);
    }

    // Return a random image from the results
    return data[Math.floor(Math.random() * data.length)].images.orig.url;
  }

  async function pinterestLinks(query, limit = 10) {
    const apiUrl = `https://www.pinterest.com/resource/BaseSearchResource/get/?source_url=%2Fsearch%2Fpins%2F%3Fq%3D${encodeURIComponent(query)}&data=%7B%22options%22%3A%7B%22isPrefetch%22%3Afalse%2C%22query%22%3A%22${encodeURIComponent(query)}%22%2C%22scope%22%3A%22pins%22%2C%22no_fetch_context_on_resource%22%3Afalse%7D%2C%22context%22%3A%7B%7D%7D&_=1619980301559`;

    const res = await fetch(apiUrl);
    const json = await res.json();
    const data = json.resource_response.data.results;

    if (!data.length) {
      throw new Error(`Query "${query}" tidak ditemukan :/`);
    }

    // Return a list of URLs, up to the specified limit
    return data.slice(0, limit).map(item => item.images.orig.url);
  }
};