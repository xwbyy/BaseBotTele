const fs = require('fs');
const path = require('path');
const cron = require('node-cron'); // Modul untuk menjadwalkan tugas

module.exports = (bot, config, database, saveDatabase) => {
    // Direktori file database.json
    const dbFilePath = path.join('/home/container', 'database.json');

    // Fungsi untuk mengirim database.json ke pengguna
    const sendDatabaseFile = (chatId) => {
        if (!fs.existsSync(dbFilePath)) {
            return bot.sendMessage(chatId, '❌ File database.json tidak ditemukan.');
        }

        // Kirim file database.json
        bot.sendDocument(chatId, dbFilePath)
            .then(() => {
                console.log(`File database.json berhasil dikirim ke chat ${chatId}`);
            })
            .catch(err => {
                console.error('Gagal mengirim file database.json:', err);
                bot.sendMessage(chatId, '❌ Gagal mengirim file database.json.');
            });
    };

    // Perintah /autodb untuk mengaktifkan pengiriman otomatis
    bot.onText(/\/autodb/, (msg) => {
        const chatId = msg.chat.id;

        // Cek apakah pengguna adalah admin atau memiliki akses untuk menggunakan perintah ini
        const isAdmin = true; // Ganti dengan logika pemeriksaan admin yang sesuai

        if (!isAdmin) {
            return bot.sendMessage(chatId, '🚫 Anda tidak memiliki izin untuk menggunakan perintah ini.');
        }

        // Kirim pesan konfirmasi
        bot.sendMessage(chatId, '✅ Fitur autodb diaktifkan. File database.json akan dikirim setiap 20 menit.');

        // Jadwalkan pengiriman otomatis setiap 20 menit
        cron.schedule('*/20 * * * *', () => {
            sendDatabaseFile(chatId);
        });
    });
};