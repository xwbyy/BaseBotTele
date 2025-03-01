const now = require('performance-now');

module.exports = (bot, config, database, saveDatabase) => {
    bot.onText(/^\/ping$/, async (msg) => {  // Hanya merespons jika pesan persis "/ping"
        const chatId = msg.chat.id;
        const startTime = now(); // Waktu awal sebelum bot merespons

        // Kirim pesan sementara
        bot.sendMessage(chatId, '🏓 **Mengukur ping...**', { parse_mode: 'Markdown' })
            .then(async (sentMsg) => {
                // Gunakan process.uptime() untuk uptime yang lebih akurat
                let muptime = clockString(process.uptime() * 1000);

                // Hitung latensi (ping)
                const endTime = now();
                const pingTime = (endTime - startTime).toFixed(2); // Waktu respons dalam ms

                // Format pesan
                const message = `
🏓 **Pong!**
⏱️ **Ping:** ${pingTime} ms
⏳ **Uptime:** ${muptime}
                `;

                // Edit pesan sementara dengan hasil ping
                bot.editMessageText(message.trim(), {
                    chat_id: chatId,
                    message_id: sentMsg.message_id,
                    parse_mode: 'Markdown',
                });
            })
            .catch((err) => {
                console.error('Gagal mengirim pesan ping:', err);
                bot.sendMessage(chatId, '❌ Gagal mengukur ping. Silakan coba lagi.', { parse_mode: 'Markdown' });
            });
    });
};

// Fungsi untuk mengubah ms menjadi format waktu (hari, jam, menit, detik)
function clockString(ms) {
    if (isNaN(ms) || ms <= 0) return '0 Hari 00 Jam 00 Menit 00 Detik';

    let d = Math.floor(ms / 86400000);
    let h = Math.floor(ms / 3600000) % 24;
    let m = Math.floor(ms / 60000) % 60;
    let s = Math.floor(ms / 1000) % 60;

    return `${d} Hari ${h.toString().padStart(2, '0')} Jam ${m.toString().padStart(2, '0')} Menit ${s.toString().padStart(2, '0')} Detik`;
}