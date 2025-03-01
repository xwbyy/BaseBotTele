const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

module.exports = (bot, config, database, saveDatabase) => {
  bot.onText(/^\/apkdl(?:\s(.+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    const query = match[1] ? match[1].trim() : null;
    const userId = msg.from.id.toString();
    const senderName = msg.from.first_name;

    if (!query) {
      return bot.sendMessage(
        chatId,
        `Gunakan contoh:\n/apkdl <nama atau id APK>\nContoh:\n/apkdl whatsapp\n/apkdl com.whatsapp`,
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

      // Mengambil data APK dari API
      const apiUrl = `https://vihangayt.me/download/apk?id=${encodeURIComponent(query)}`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!data.status || !data.data) {
        return bot.sendMessage(
          chatId,
          'Tidak dapat menemukan informasi APK. Pastikan nama atau ID APK benar.',
          { reply_to_message_id: messageId }
        );
      }

      const apkData = data.data;
      const message = `
📱 *Informasi APK*

📂 *Nama:* ${apkData.name}
📅 *Last Update:* ${apkData.lastup}
📦 *Package:* ${apkData.package}
📏 *Ukuran:* ${apkData.size}
🔗 *Download Link:* ${apkData.dllink}
      `.trim();

      // Kirim informasi APK ke pengguna
      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_to_message_id: messageId,
      });

      // Unduh file APK
      const apkResponse = await fetch(apkData.dllink);
      const apkPath = path.join(__dirname, `${apkData.name}.apk`);
      const writer = fs.createWriteStream(apkPath);

      apkResponse.body.pipe(writer);

      writer.on('finish', async () => {
        try {
          // Kirim file APK ke pengguna
          await bot.sendDocument(chatId, apkPath, {
            caption: `📂 *${apkData.name}* (${apkData.size})`,
            parse_mode: 'Markdown',
            reply_to_message_id: messageId,
          });

          // Hapus file setelah dikirim
          fs.unlinkSync(apkPath);

          // Tambah limit jika pengguna bukan premium
          if (!database[userId].premium) {
            database[userId].limit += 1;
            saveDatabase();
          }
        } catch (error) {
          console.error('Gagal mengirim file APK:', error);
          if (fs.existsSync(apkPath)) fs.unlinkSync(apkPath);
          bot.sendMessage(
            chatId,
            'Gagal mengirim file APK. Pastikan file tidak melebihi batas ukuran yang diizinkan.',
            { reply_to_message_id: messageId }
          );
        }
      });

      writer.on('error', (err) => {
        console.error('Gagal mengunduh file APK:', err);
        if (fs.existsSync(apkPath)) fs.unlinkSync(apkPath);
        bot.sendMessage(
          chatId,
          'Gagal mengunduh file APK.',
          { reply_to_message_id: messageId }
        );
      });
    } catch (error) {
      console.error('Error occurred:', error);
      bot.sendMessage(
        chatId,
        'Terjadi kesalahan saat mencoba mengambil data APK.',
        { reply_to_message_id: messageId }
      );
    }
  });
};