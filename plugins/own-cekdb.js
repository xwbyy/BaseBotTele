module.exports = (bot, config, database, saveDatabase) => {
    bot.onText(/\/cekdb/, (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id.toString();

        // Cek apakah pengguna adalah owner
        if (userId !== config.ownerID.toString()) {
            return bot.sendMessage(chatId, '🚫 Hanya owner yang dapat menggunakan perintah ini.');
        }

        // Ambil semua data pengguna dari database
        const users = Object.keys(database).map(userId => {
            const user = database[userId];
            return {
                id: userId,
                name: user.username ? `@${user.username}` : `ID: ${userId}`,
                limit: user.limit || 0,
                premium: user.premium ? '✅' : '❌',
                premiumExpiry: user.premiumExpiry ? new Date(user.premiumExpiry).toLocaleString('id-ID') : 'Tidak Ada'
            };
        });

        if (users.length === 0) {
            return bot.sendMessage(chatId, '📂 Database kosong. Tidak ada pengguna terdaftar.');
        }

        sendPaginatedMessage(bot, chatId, users, 1);
    });

    bot.on('callback_query', (callbackQuery) => {
        const data = callbackQuery.data.split(':');
        const action = data[0];
        const chatId = callbackQuery.message.chat.id;
        const page = parseInt(data[1]);

        if (action === 'nextPage' || action === 'prevPage') {
            const users = Object.keys(database).map(userId => {
                const user = database[userId];
                return {
                    id: userId,
                    name: user.username ? `@${user.username}` : `ID: ${userId}`,
                    limit: user.limit || 0,
                    premium: user.premium ? '✅' : '❌',
                    premiumExpiry: user.premiumExpiry ? new Date(user.premiumExpiry).toLocaleString('id-ID') : 'Tidak Ada'
                };
            });

            sendPaginatedMessage(bot, chatId, users, page, callbackQuery.message.message_id);
        }

        bot.answerCallbackQuery(callbackQuery.id);
    });
};

// Fungsi untuk menampilkan database dalam bentuk paginasi
function sendPaginatedMessage(bot, chatId, users, currentPage, messageId = null) {
    const usersPerPage = 5;
    const totalPages = Math.ceil(users.length / usersPerPage);
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    const usersToShow = users.slice(startIndex, endIndex);

    let message = `📊 **Database Pengguna** 📊\n\n`;
    message += `👥 **Total Pengguna**: ${users.length}\n`;
    message += `📄 **Halaman ${currentPage} dari ${totalPages}**\n\n`;

    usersToShow.forEach(user => {
        message += `👤 **Nama**: ${user.name}\n`;
        message += `🆔 **ID**: ${user.id}\n`;
        message += `📊 **Limit**: ${user.limit}\n`;
        message += `🎟️ **Premium**: ${user.premium}\n`;
        message += `📅 **Kedaluwarsa Premium**: ${user.premiumExpiry}\n`;
        message += `────────────────────\n`;
    });

    // Tombol navigasi
    const buttons = [];
    if (currentPage > 1) {
        buttons.push({ text: '⬅️ Sebelumnya', callback_data: `prevPage:${currentPage - 1}` });
    }
    if (currentPage < totalPages) {
        buttons.push({ text: '➡️ Berikutnya', callback_data: `nextPage:${currentPage + 1}` });
    }

    const keyboard = {
        inline_keyboard: buttons.length > 0 ? [buttons] : []
    };

    if (messageId) {
        bot.editMessageText(message, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: keyboard
        }).catch(err => console.error('Error editing message:', err));
    } else {
        bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            reply_markup: keyboard
        });
    }
}