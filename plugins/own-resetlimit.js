module.exports = (bot, config, database, saveDatabase) => {
    bot.onText(/\/resetlimit/, (msg) => {
        const chatId = msg.chat.id;

        // Cek apakah pengguna adalah admin atau memiliki akses untuk mereset limit
        // Anda bisa menambahkan logika untuk memeriksa apakah pengguna adalah admin
        const isAdmin = true; // Ganti dengan logika pemeriksaan admin yang sesuai

        if (!isAdmin) {
            return bot.sendMessage(chatId, '🚫 Anda tidak memiliki izin untuk menggunakan perintah ini.');
        }

        // Reset limit semua pengguna
        for (const userId in database) {
            if (database[userId]) {
                database[userId].limit = 0; // Reset limit ke 0 atau nilai default yang diinginkan
            }
        }

        // Simpan perubahan ke database
        saveDatabase();

        // Kirim pesan konfirmasi
        bot.sendMessage(chatId, '✅ Limit semua pengguna telah direset kembali ke normal.');
    });
};