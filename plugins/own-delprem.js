module.exports = (bot, config, database, saveDatabase) => {
    bot.onText(/\/delprem (\d+)/, (msg, match) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id.toString();
        const targetUserId = match[1];

        // Cek apakah pengguna adalah owner
        if (userId !== config.ownerID.toString()) {
            return bot.sendMessage(chatId, '🚫 Hanya owner yang dapat menggunakan perintah ini.');
        }

        // Cek apakah pengguna target ada di database
        if (!database[targetUserId]) {
            return bot.sendMessage(chatId, `🚫 User ${targetUserId} tidak ditemukan.`);
        }

        const targetUser = database[targetUserId];
        const username = targetUser.username ? `@${targetUser.username}` : 'Tidak ada username';

        // Hapus status premium
        targetUser.premium = false;
        targetUser.premiumExpiry = null;

        // Simpan perubahan ke database
        saveDatabase();

        // Buat pesan konfirmasi
        const message = `
🎉 **Berhasil Menghapus Premium** 🎉

👤 **ID Pengguna**: ${targetUserId}
👤 **Username**: ${username}
📅 **Status Premium**: Nonaktif
        `;

        // Kirim pesan ke owner
        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    });
};