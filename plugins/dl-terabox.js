const axios = require('axios');

module.exports = (bot, config, database, saveDatabase) => {
  const handleTeraboxCommand = async (msg, match) => {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    const url = match[1] ? match[1].trim() : null;
    const userId = msg.from.id.toString();
    const senderName = msg.from.first_name;

    if (!url || !url.startsWith('http')) {
      return bot.sendMessage(
        chatId,
        'Masukkan URL Terabox yang valid setelah perintah.\n\nContoh:\n/terabox https://www.terabox.app/wap/share/filelist?surl=ZsxiFVgudFvU8tJxKJ9YZA',
        { reply_to_message_id: messageId }
      );
    }

    if (!database[userId]) {
      database[userId] = { limit: 0, premium: false };
    }

    if (!database[userId].premium && database[userId].limit >= config.globallimit) {
      return bot.sendMessage(
        chatId,
        `❌ ${senderName}, Anda telah mencapai batas penggunaan gratis (${config.globallimit} kali). Silakan upgrade ke premium.`,
        { reply_to_message_id: messageId }
      );
    }

    try {
      bot.sendChatAction(chatId, 'typing');

      // API Terabox
      const apiUrl = `https://api.botcahx.eu.org/api/download/terabox?url=${encodeURIComponent(url)}&apikey=${global.api.btch}`;
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (!data.status || !data.result || data.result.length === 0) {
        return bot.sendMessage(
          chatId,
          'Gagal mengambil data dari Terabox. Pastikan URL benar.',
          { reply_to_message_id: messageId }
        );
      }

      let count = 1;
      for (const item of data.result) {
        const file = item.files[0];
        const fileUrl = file.url;
        const filename = file.filename.replace(/[_*[\]()~`>#+-=|{}.!]/g, ''); // Escape karakter markdown
        const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);

        const caption = `📂 *File:* ${filename}\n📦 Ukuran: ${fileSizeMB} MB`;

        // Cek apakah file berupa video, foto, atau dokumen
        if (filename.match(/\.(mp4|mkv|mov|avi)$/i)) {
          await bot.sendVideo(chatId, fileUrl, {
            caption: caption,
            parse_mode: 'Markdown',
            reply_to_message_id: messageId
          });
        } else if (filename.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
          await bot.sendPhoto(chatId, fileUrl, {
            caption: caption,
            parse_mode: 'Markdown',
            reply_to_message_id: messageId
          });
        } else {
          await bot.sendDocument(chatId, fileUrl, {
            caption: caption,
            parse_mode: 'Markdown',
            reply_to_message_id: messageId
          });
        }

        count++;
      }

      if (!database[userId].premium) {
        database[userId].limit += 1;
        saveDatabase();
      }
    } catch (error) {
      console.error('Error terjadi:', error);
      bot.sendMessage(
        chatId,
        'Terjadi kesalahan saat mencoba mengambil data dari Terabox.',
        { reply_to_message_id: messageId }
      );
    }
  };

  bot.onText(/\/terabox(?: (.+))?/, handleTeraboxCommand);
};