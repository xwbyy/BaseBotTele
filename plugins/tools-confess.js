const activeConfessSessions = {}; // Menyimpan sesi confess yang sedang berlangsung

module.exports = (bot, config, database, saveDatabase) => {
  const handleConfess = async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const senderName = msg.from.first_name;
    const messageText = msg.text ? msg.text.split(' ') : [];

    // Cek apakah perintah digunakan di private chat
    if (msg.chat.type !== 'private') {
      return bot.sendMessage(
        chatId,
        '❌ Perintah ini hanya bisa digunakan di private chat.',
        { reply_to_message_id: msg.message_id }
      );
    }

    // Cek format perintah
    if (messageText.length < 3) {
      return bot.sendMessage(
        chatId,
        '⚠️ Format salah. Gunakan:\n\n`/confess id_atau_username pesan`\n\nContoh: `/confess @username Aku suka kamu!`',
        { parse_mode: 'Markdown' }
      );
    }

    const targetIdentifier = messageText[1]; // Username atau user ID target
    const confessMessage = messageText.slice(2).join(' '); // Isi pesan

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

    // Simpan sesi confess dengan kedua arah
    activeConfessSessions[userId] = targetIdentifier;
    activeConfessSessions[targetIdentifier] = userId;

    // Kirim pesan confess ke target
    bot.sendMessage(
      targetIdentifier,
      `💌 Hai kak, kamu menerima pesan rahasia dari seseorang:\n\n"${confessMessage}"\n\n🔄 Balas pesan ini untuk merespon secara anonim.\n\n🛑 Gunakan /stopconfess untuk menghentikan sesi.`
    );

    // Beri konfirmasi ke pengirim
    bot.sendMessage(
      chatId,
      '✅ Pesan confess berhasil dikirim.\n\n🔄 Target bisa membalas secara anonim.\n🛑 Gunakan /stopconfess jika ingin menghentikan sesi.'
    );

    // Tambah limit jika pengguna bukan premium
    if (!database[userId].premium) {
      database[userId].limit += 1;
      saveDatabase();
    }
  };

  const handleReply = (msg) => {
    const senderId = msg.from.id.toString();

    if (activeConfessSessions[senderId]) {
      const recipientId = activeConfessSessions[senderId];

      // Kirim balasan dalam format yang sesuai
      if (msg.text) {
        bot.sendMessage(recipientId, `📩 Balasan dari target:\n\n"${msg.text}"`);
      } else if (msg.photo) {
        const photo = msg.photo[msg.photo.length - 1].file_id;
        bot.sendPhoto(recipientId, photo, { caption: '📩 Balasan dari target (Foto)' });
      } else if (msg.sticker) {
        bot.sendSticker(recipientId, msg.sticker.file_id);
      } else if (msg.video) {
        bot.sendVideo(recipientId, msg.video.file_id, { caption: '📩 Balasan dari target (Video)' });
      } else if (msg.document) {
        bot.sendDocument(recipientId, msg.document.file_id, { caption: '📩 Balasan dari target (Dokumen)' });
      }

      bot.sendMessage(senderId, '✅ Pesanmu telah dikirim secara anonim.');
    }
  };

  const handleStopConfess = (msg) => {
    const userId = msg.from.id.toString();

    if (activeConfessSessions[userId]) {
      const targetId = activeConfessSessions[userId];

      // Hapus sesi confess
      delete activeConfessSessions[userId];
      delete activeConfessSessions[targetId];

      bot.sendMessage(userId, '🛑 Sesi confess telah dihentikan.');
      bot.sendMessage(targetId, '🛑 Sesi confess telah dihentikan oleh pengguna.');
    } else {
      bot.sendMessage(userId, '⚠️ Tidak ada sesi confess yang aktif.');
    }
  };

  bot.onText(/\/confess (.+) (.+)/, handleConfess);
  bot.on('message', handleReply);
  bot.onText(/\/stopconfess/, handleStopConfess);
};