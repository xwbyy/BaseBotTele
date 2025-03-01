const activeChatSessions = {}; // Menyimpan sesi chat yang sedang berlangsung
const waitingUsers = []; // Menyimpan pengguna yang sedang menunggu pasangan

module.exports = (bot, config, database, saveDatabase) => {
  const startSearch = async (msg) => {
    const userId = msg.from.id.toString();
    const chatId = msg.chat.id;

    // Cek apakah perintah digunakan di private chat
    if (msg.chat.type !== 'private') {
      return bot.sendMessage(
        chatId,
        '❌ Perintah ini hanya bisa digunakan di private chat.',
        { reply_to_message_id: msg.message_id }
      );
    }

    // Cek apakah pengguna sudah dalam sesi chat
    if (activeChatSessions[userId]) {
      return bot.sendMessage(
        chatId,
        '⚠️ Anda sudah dalam sesi chat. Gunakan /next untuk mencari pasangan baru atau /stop untuk menghentikan chat.',
        { reply_to_message_id: msg.message_id }
      );
    }

    // Tambahkan pengguna ke antrian
    waitingUsers.push(userId);
    bot.sendMessage(chatId, '🔍 Mencari pasangan...');

    // Cari pasangan
    if (waitingUsers.length >= 2) {
      const user1 = waitingUsers.pop();
      const user2 = waitingUsers.pop();

      // Buat sesi chat
      activeChatSessions[user1] = user2;
      activeChatSessions[user2] = user1;

      // Kirim pesan ke kedua pengguna
      bot.sendMessage(user1, '😺 Pasangan ditemukan! Mulai mengobrol secara anonim.\n\n/next — Cari pasangan baru\n/stop — Hentikan chat');
      bot.sendMessage(user2, '😺 Pasangan ditemukan! Mulai mengobrol secara anonim.\n\n/next — Cari pasangan baru\n/stop — Hentikan chat');
    }
  };

  const handleMessage = (msg) => {
    const senderId = msg.from.id.toString();

    if (activeChatSessions[senderId]) {
      const recipientId = activeChatSessions[senderId];

      // Kirim pesan ke pasangan
      if (msg.text) {
        bot.sendMessage(recipientId, msg.text); // Tanpa teks "📩 Pesan anonim"
      } else if (msg.photo) {
        const photo = msg.photo[msg.photo.length - 1].file_id;
        bot.sendPhoto(recipientId, photo);
      } else if (msg.sticker) {
        bot.sendSticker(recipientId, msg.sticker.file_id);
      } else if (msg.video) {
        bot.sendVideo(recipientId, msg.video.file_id);
      } else if (msg.document) {
        bot.sendDocument(recipientId, msg.document.file_id);
      }
    }
  };

  const stopChat = (msg) => {
    const userId = msg.from.id.toString();

    if (activeChatSessions[userId]) {
      const partnerId = activeChatSessions[userId];

      // Hapus sesi chat
      delete activeChatSessions[userId];
      delete activeChatSessions[partnerId];

      // Kirim pesan ke kedua pengguna
      bot.sendMessage(userId, '🛑 Chat dihentikan. Terima kasih telah menggunakan layanan ini!\n\nBerikan feedback tentang pasangan Anda untuk membantu kami meningkatkan kualitas chat.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '👍', callback_data: 'feedback_good' }, { text: '👎', callback_data: 'feedback_bad' }]
          ]
        }
      });
      bot.sendMessage(partnerId, '🛑 Pasangan Anda menghentikan chat. Terima kasih telah menggunakan layanan ini!\n\nBerikan feedback tentang pasangan Anda untuk membantu kami meningkatkan kualitas chat.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '👍', callback_data: 'feedback_good' }, { text: '👎', callback_data: 'feedback_bad' }]
          ]
        }
      });
    } else {
      bot.sendMessage(userId, '⚠️ Tidak ada sesi chat yang aktif.');
    }
  };

  const nextPartner = (msg) => {
    const userId = msg.from.id.toString();

    if (activeChatSessions[userId]) {
      const partnerId = activeChatSessions[userId];

      // Hentikan chat sebelumnya
      delete activeChatSessions[userId];
      delete activeChatSessions[partnerId];

      bot.sendMessage(partnerId, '🛑 Pasangan Anda memilih untuk mencari pasangan baru.');
    }

    // Mulai mencari pasangan baru
    startSearch(msg);
  };

  const handleFeedback = (callbackQuery) => {
    const userId = callbackQuery.from.id.toString();
    const feedback = callbackQuery.data;

    // Pastikan callback query berasal dari fitur anonymous chat
    if (feedback === 'feedback_good' || feedback === 'feedback_bad') {
      // Hapus tombol feedback setelah diklik
      bot.editMessageReplyMarkup(
        { inline_keyboard: [] },
        { chat_id: callbackQuery.message.chat.id, message_id: callbackQuery.message.message_id }
      );

      bot.sendMessage(userId, `Terima kasih atas feedback Anda (${feedback === 'feedback_good' ? '👍' : '👎'})!`);
      bot.answerCallbackQuery(callbackQuery.id);
    }
  };

  // Command handlers
  bot.onText(/\/search/, startSearch);
  bot.onText(/\/stop/, stopChat);
  bot.onText(/\/next/, nextPartner);
  bot.on('message', handleMessage);
  bot.on('callback_query', handleFeedback);
};