const cron = require('node-cron');

module.exports = (bot, config, database, saveDatabase) => {
    // Fungsi untuk reset limit semua pengguna
    const resetLimit = () => {
        for (const userId in database) {
            if (database[userId]) {
                database[userId].limit = 0; // Reset limit ke 0
            }
        }

        // Simpan perubahan ke database
        saveDatabase();

        // Kirim pesan ke Owner
        bot.sendMessage(config.ownerID, '✅ Limit semua pengguna telah direset otomatis.');
    };

    // Jalankan reset otomatis setiap jam 12:00 siang & 12:00 malam WIB
    cron.schedule('0 0,12 * * *', () => {
        resetLimit();
    }, {
        timezone: "Asia/Jakarta"
    });

    // Perintah manual untuk memicu autoreset
    bot.onText(/\/autoresetlimit/, (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id.toString();

        // Cek apakah pengguna adalah Owner
        if (userId !== config.ownerID.toString()) {
            return bot.sendMessage(chatId, '🚫 Hanya Owner yang dapat menggunakan perintah ini.');
        }

        resetLimit();
        bot.sendMessage(chatId, '✅ Autoreset limit telah dijalankan secara manual.');
    });
};