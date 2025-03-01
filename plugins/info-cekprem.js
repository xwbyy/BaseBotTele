module.exports = (bot, config, database, saveDatabase) => {
    bot.onText(/\/cekprem/, (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id.toString();

        // Cek apakah pengguna terdaftar dalam database
        if (!database[userId]) {
            return bot.sendMessage(chatId, '🚫 Anda belum terdaftar dalam database.');
        }

        const userData = database[userId];
        const username = userData.username ? `@${userData.username}` : 'Tidak ada username';
        const userID = userId; // ID pengguna

        // Cek status premium
        if (userData.premium && userData.premiumExpiry) {
            const expiryDate = new Date(userData.premiumExpiry);
            const now = new Date();

            // Jika premium sudah kedaluwarsa
            if (now > expiryDate) {
                userData.premium = false;
                userData.premiumExpiry = null;
                saveDatabase();
                return bot.sendMessage(chatId, `⏳ Premium Anda sudah kedaluwarsa.`);
            }

            // Hitung waktu tersisa
            const timeRemaining = expiryDate - now;
            const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
            const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
            const secondsRemaining = Math.floor((timeRemaining % (1000 * 60)) / 1000);

            // Format tanggal kedaluwarsa
            const formattedExpiryDate = expiryDate.toLocaleString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });

            // Buat pesan informasi premium
            const message = `
🎉 **Status Premium** 🎉

👤 **ID Pengguna**: ${userID}
👤 **Username**: ${username}
📅 **Kedaluwarsa**: ${formattedExpiryDate}
⏳ **Waktu Tersisa**: ${daysRemaining} hari, ${hoursRemaining} jam, ${minutesRemaining} menit, ${secondsRemaining} detik
            `;

            // Kirim pesan ke pengguna
            bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        } else {
            bot.sendMessage(chatId, '🚫 Anda bukan pengguna premium.');
        }
    });
};