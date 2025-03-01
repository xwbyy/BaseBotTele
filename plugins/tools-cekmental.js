module.exports = (bot, config, database, saveDatabase) => {
  const questions = [
    'Dalam 2 minggu terakhir, seberapa sering kamu merasa kurang senang atau tertarik dalam kegiatan sehari-hari?',
    'Merasa sedih, muram, dan putus asa?',
    'Sulit tidur atau tidur nyenyak; atau terlalu banyak tidur?',
    'Merasa lelah atau kekurangan energi?',
    'Tidak napsu makan, atau terlalu banyak makan?',
    'Merasa buruk tentang diri sendiri, atau merasa gagal atau mengecewakan diri atau keluargamu?',
    'Kesulitan berkonsentrasi, seperti saat membaca atau menonton TV?',
    'Bergerak atau berbicara dengan lambat hingga orang lain menyadarinya? Atau merasa tidak bisa diam lebih dari biasanya?',
    'Merasa lebih baik mati, atau berpikir ingin menyakiti diri sendiri?'
  ];

  const userAnswers = {};
  const userProgress = {};
  const userMessageIds = {};

  bot.onText(/\/cekmental/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const chatType = msg.chat.type;

    if (chatType !== 'private') {
      return bot.sendMessage(chatId, '⚠️ Perintah ini hanya bisa digunakan di private chat.');
    }

    if (!database[userId]) {
      database[userId] = { limit: 0, premium: false, premiumExpiry: null };
    }

    if (!database[userId].premium && database[userId].limit >= config.globallimit) {
      return bot.sendMessage(chatId, `Anda telah mencapai batas penggunaan gratis sebanyak ${config.globallimit} kali. Silakan upgrade ke premium untuk terus menggunakan fitur ini.`);
    }

    // Inisialisasi jawaban dan progress pengguna
    userAnswers[userId] = [];
    userProgress[userId] = 0;

    // Kirim pertanyaan pertama
    sendQuestion(bot, chatId, userId, 0);

    if (!database[userId].premium) {
      database[userId].limit += 1;
      saveDatabase();
    }
  });

  bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id.toString();
    const answer = callbackQuery.data;

    // Pastikan callback query berasal dari fitur cek mental
    if (answer === '1' || answer === '2' || answer === '3' || answer === '4' || answer === 'restart_test') {
      // Logika fitur cek mental
      if (answer === 'restart_test') {
        delete userAnswers[userId];
        delete userProgress[userId];
        delete userMessageIds[userId];
        return bot.sendMessage(chatId, '🔄 Ketik /cekmental untuk memulai tes ulang.');
      }

      // Hapus pesan pertanyaan sebelumnya jika ada
      if (userMessageIds[userId]) {
        try {
          await bot.deleteMessage(chatId, userMessageIds[userId]);
        } catch (error) {
          console.error('Gagal menghapus pesan:', error);
        }
      }

      // Simpan jawaban pengguna
      userAnswers[userId].push(parseInt(answer));
      userProgress[userId] += 1;

      if (userProgress[userId] < questions.length) {
        sendQuestion(bot, chatId, userId, userProgress[userId]);
      } else {
        // Hitung skor
        const score = (userAnswers[userId].reduce((a, b) => a + b, 0) / (questions.length * 4)) * 100;
        let resultMessage = `Tes selesai! Skor Anda: ${score.toFixed(2)}%\n\n`;

        if (score < 25) {
          resultMessage += '😊 Anda tampaknya baik-baik saja. Tetap lakukan kegiatan positif!';
        } else if (score < 50) {
          resultMessage += '😐 Anda mungkin merasa sedikit tertekan. Cobalah berbicara dengan seseorang yang Anda percaya.';
        } else if (score < 75) {
          resultMessage += '😞 Anda mungkin mengalami tekanan yang cukup berat. Jaga kesehatan mental Anda dan pertimbangkan mencari bantuan.';
        } else {
          resultMessage += '⚠️ Anda sangat membutuhkan dukungan. Jangan ragu untuk mencari bantuan profesional.';
        }

        bot.sendMessage(chatId, resultMessage, {
          reply_markup: { inline_keyboard: [[{ text: '🔄 Tes Ulang', callback_data: 'restart_test' }]] }
        });

        // Hapus data pengguna dari memori
        delete userAnswers[userId];
        delete userProgress[userId];
        delete userMessageIds[userId];
      }

      bot.answerCallbackQuery(callbackQuery.id);
    }
  });

  function sendQuestion(bot, chatId, userId, index) {
    bot.sendMessage(chatId, `Pertanyaan ${index + 1}: ${questions[index]}`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '1: Tidak pernah', callback_data: '1' }],
          [{ text: '2: Beberapa Hari', callback_data: '2' }],
          [{ text: '3: Sebagian Besar Hari', callback_data: '3' }],
          [{ text: '4: Hampir Setiap Hari', callback_data: '4' }]
        ]
      }
    }).then((sentMessage) => {
      userMessageIds[userId] = sentMessage.message_id;
    });
  }
};