module.exports = (bot, config, database, saveDatabase) => {
    bot.onText(/\/addprem (\d+) (\d+)/, (msg, match) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id.toString();
        const targetUserId = match[1];
        const days = parseInt(match[2]);

        // Cek apakah pengguna adalah owner
        if (userId !== config.ownerID.toString()) {
            return bot.sendMessage(chatId, '🚫 Hanya owner yang dapat menggunakan perintah ini.');
        }

        // Cek apakah pengguna target ada di database
        if (!database[targetUserId]) {
            database[targetUserId] = { limit: 0, premium: false, premiumExpiry: null };
        }

        // Hitung tanggal kedaluwarsa
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + days);
        database[targetUserId].premium = true;
        database[targetUserId].premiumExpiry = expiryDate.toISOString();

        // Simpan perubahan ke database
        saveDatabase();

        // Ambil username pengguna target (jika ada)
        const targetUser = database[targetUserId];
        const username = targetUser.username ? `@${targetUser.username}` : `ID: ${targetUserId}`;

        // Format tanggal kedaluwarsa
        const formattedExpiryDate = expiryDate.toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });

        // Hitung mundur waktu tersisa
        const now = new Date();
        const timeRemaining = expiryDate - now;
        const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

        // Buat pesan yang lebih informatif
        const message = `
🎉 **Berhasil Menambahkan Premium** 🎉

👤 **Pengguna**: ${username}
⏳ **Durasi**: ${days} hari
📅 **Kedaluwarsa**: ${formattedExpiryDate}
⏳ **Waktu Tersisa**: ${daysRemaining} hari, ${hoursRemaining} jam, ${minutesRemaining} menit
        `;

        // Kirim pesan ke owner
        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    });
};