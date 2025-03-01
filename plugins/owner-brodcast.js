module.exports = (bot, config, database, saveDatabase) => {
    let broadcastMode = {}; // Simpan status broadcast

    // Perintah untuk memulai broadcast
    bot.onText(/\/bc/, (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id.toString();

        if (userId !== config.ownerID.toString()) {
            return bot.sendMessage(chatId, '🚫 Hanya owner yang dapat menggunakan perintah ini.');
        }

        // Aktifkan mode broadcast
        broadcastMode[userId] = true;
        bot.sendMessage(chatId, '✅ Sekarang balas atau forward pesan yang ingin di-broadcast.');
    });

    // Menangani pesan yang dibalas atau diforward
    bot.on('message', async (msg) => {
        const userId = msg.from.id.toString();
        const replyToMessage = msg.reply_to_message;

        if (userId !== config.ownerID.toString() || !broadcastMode[userId]) {
            return;
        }

        // Matikan mode broadcast setelah pesan diterima
        delete broadcastMode[userId];

        // Ambil semua pengguna dari database
        const users = Object.keys(database);
        const totalUsers = users.length;
        let successCount = 0;
        let failedCount = 0;

        bot.sendMessage(msg.chat.id, `⏳ Sedang mengirim broadcast ke ${totalUsers} pengguna...`);

        for (const user of users) {
            const chatId = user;

            try {
                // Jika pesan merupakan **balasan** ke suatu pesan
                if (replyToMessage) {
                    if (replyToMessage.text) {
                        await bot.sendMessage(chatId, replyToMessage.text);
                    } else if (replyToMessage.photo) {
                        const photoId = replyToMessage.photo[replyToMessage.photo.length - 1].file_id;
                        await bot.sendPhoto(chatId, photoId, { caption: replyToMessage.caption || '' });
                    } else if (replyToMessage.video) {
                        const videoId = replyToMessage.video.file_id;
                        await bot.sendVideo(chatId, videoId, { caption: replyToMessage.caption || '' });
                    } else if (replyToMessage.sticker) {
                        const stickerId = replyToMessage.sticker.file_id;
                        await bot.sendSticker(chatId, stickerId);
                    } else if (replyToMessage.document) {
                        const documentId = replyToMessage.document.file_id;
                        await bot.sendDocument(chatId, documentId);
                    } else if (replyToMessage.voice) {
                        const voiceId = replyToMessage.voice.file_id;
                        await bot.sendVoice(chatId, voiceId);
                    } else if (replyToMessage.audio) {
                        const audioId = replyToMessage.audio.file_id;
                        await bot.sendAudio(chatId, audioId);
                    } else {
                        await bot.sendMessage(chatId, '⚠️ Jenis pesan tidak didukung untuk broadcast.');
                    }
                }

                // Jika pesan merupakan **forwarded message**
                else if (msg.forward_from_chat || msg.forward_from) {
                    await bot.forwardMessage(chatId, msg.chat.id, msg.message_id);
                }

                // Jika pesan adalah teks biasa
                else if (msg.text) {
                    await bot.sendMessage(chatId, msg.text);
                }

                successCount++;
            } catch (error) {
                console.error(`Gagal mengirim ke ${chatId}:`, error);
                failedCount++;
            }

            // Delay 1 detik per pesan untuk menghindari rate limit
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // Kirim laporan broadcast
        const report = `
📊 **Laporan Broadcast**:
✅ Total Terkirim: ${successCount}
❌ Total Gagal: ${failedCount}
👥 Total Pengguna: ${totalUsers}
        `;

        bot.sendMessage(msg.chat.id, report, { parse_mode: 'Markdown' });
    });
};