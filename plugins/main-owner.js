module.exports = (bot, config, database, saveDatabase) => {
    bot.onText(/\/owner/, (msg) => {
        const chatId = msg.chat.id;

        // Buat inline keyboard dengan dua tombol
        const keyboard = {
            inline_keyboard: [
                [
                    { text: '📞 WhatsApp', url: 'https://wa.me/message/2MOJNXNC45Y5E1' },
                    { text: '📩 Telegram', url: 'https://t.me/VLShop2' }
                ]
            ]
        };

        // Kirim pesan dengan tampilan lebih rapi
        const message = `👋 *Hubungi Owner*\n\nSilakan pilih salah satu opsi di bawah ini untuk menghubungi owner:`;

        bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            reply_markup: keyboard
        });
    });
};