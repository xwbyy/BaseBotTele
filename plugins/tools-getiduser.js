module.exports = (bot, config, database, saveDatabase) => {
  // 1️⃣ Dapatkan ID berdasarkan username: /getiduser @username
  bot.onText(/\/getiduser (@\w+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const senderName = msg.from.first_name;

    // Cek apakah perintah digunakan di private chat
    if (msg.chat.type !== 'private') {
      return bot.sendMessage(chatId, '❌ Perintah ini hanya dapat digunakan di private chat.', {
        reply_to_message_id: msg.message_id,
      });
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
        { reply_to_message_id: msg.message_id }
      );
    }

    if (!msg.entities || msg.entities[0].type !== 'mention') {
      return bot.sendMessage(
        chatId,
        '⚠️ Gunakan format yang benar: `/getiduser @username`',
        { parse_mode: 'Markdown' }
      );
    }

    const targetUsername = match[1].replace('@', '');

    bot.getChat(`@${targetUsername}`)
      .then((chat) => {
        bot.sendMessage(
          chatId,
          `✅ ID Telegram dari @${targetUsername} adalah: \`${chat.id}\``,
          { parse_mode: 'Markdown' }
        );

        // Tambah limit jika pengguna bukan premium
        if (!database[userId].premium) {
          database[userId].limit += 1;
          saveDatabase();
        }
      })
      .catch(() => {
        bot.sendMessage(chatId, '❌ Username tidak ditemukan atau akun tersebut private.');
      });
  });

  // 2️⃣ Dapatkan ID dari forward pesan dan reply /getiduser
  bot.onText(/\/getiduser$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const senderName = msg.from.first_name;
    const replyMsg = msg.reply_to_message;

    // Cek apakah perintah digunakan di private chat
    if (msg.chat.type !== 'private') {
      return bot.sendMessage(chatId, '❌ Perintah ini hanya dapat digunakan di private chat.', {
        reply_to_message_id: msg.message_id,
      });
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
        { reply_to_message_id: msg.message_id }
      );
    }

    if (!replyMsg) {
      return bot.sendMessage(
        chatId,
        '⚠️ Gunakan perintah ini dengan membalas pesan pengguna.',
        { parse_mode: 'Markdown' }
      );
    }

    const targetId = replyMsg.forward_from ? replyMsg.forward_from.id : replyMsg.from.id;
    const targetUsername = replyMsg.forward_from ? replyMsg.forward_from.username : replyMsg.from.username;

    bot.sendMessage(
      chatId,
      `✅ ID Telegram ${targetUsername ? '@' + targetUsername : 'pengguna ini'} adalah: \`${targetId}\``,
      { parse_mode: 'Markdown' }
    );

    // Tambah limit jika pengguna bukan premium
    if (!database[userId].premium) {
      database[userId].limit += 1;
      saveDatabase();
    }
  });

  // 3️⃣ Dapatkan ID pengguna dari setiap pesan (hanya jika menggunakan /getiduser di private chat)
  bot.onText(/\/getiduser$/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const senderName = msg.from.first_name;

    // Cek apakah perintah digunakan di private chat
    if (msg.chat.type !== 'private') {
      return bot.sendMessage(chatId, '❌ Perintah ini hanya dapat digunakan di private chat.', {
        reply_to_message_id: msg.message_id,
      });
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
        { reply_to_message_id: msg.message_id }
      );
    }

    bot.sendMessage(
      chatId,
      `✅ ID Telegram dari ${msg.from.username || 'pengguna ini'} adalah: \`${userId}\``,
      { parse_mode: 'Markdown' }
    );

    // Tambah limit jika pengguna bukan premium
    if (!database[userId].premium) {
      database[userId].limit += 1;
      saveDatabase();
    }
  });
};