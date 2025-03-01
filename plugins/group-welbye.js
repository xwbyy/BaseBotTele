module.exports = (bot, config, database, saveDatabase) => {
    const WELCOME_IMAGE = "https://files.catbox.moe/dvqd2j.png";
    const BYE_IMAGE = "https://files.catbox.moe/hkep21.png";

    // Set default welcome & bye ON
    if (!database.settings) {
        database.settings = { welcome: true, bye: true };
    }

    bot.onText(/\/welcome (on|off)/, (msg, match) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        // Cek apakah user adalah admin
        bot.getChatAdministrators(chatId).then(admins => {
            if (!admins.some(admin => admin.user.id === userId)) {
                return bot.sendMessage(chatId, "🚫 Anda tidak memiliki izin untuk mengubah pengaturan ini.");
            }

            database.settings.welcome = match[1] === "on";
            saveDatabase();
            bot.sendMessage(chatId, `✅ Welcome telah ${match[1] === "on" ? "diaktifkan" : "dinonaktifkan"}.`);
        });
    });

    bot.onText(/\/bye (on|off)/, (msg, match) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        bot.getChatAdministrators(chatId).then(admins => {
            if (!admins.some(admin => admin.user.id === userId)) {
                return bot.sendMessage(chatId, "🚫 Anda tidak memiliki izin untuk mengubah pengaturan ini.");
            }

            database.settings.bye = match[1] === "on";
            saveDatabase();
            bot.sendMessage(chatId, `✅ Bye telah ${match[1] === "on" ? "diaktifkan" : "dinonaktifkan"}.`);
        });
    });

    bot.on("new_chat_members", (msg) => {
        if (!database.settings.welcome) return;
        const chatId = msg.chat.id;
        const newUser = msg.new_chat_member;
        const userName = newUser.username ? `@${newUser.username}` : newUser.first_name;
        const userId = newUser.id;
        const date = new Date().toLocaleDateString("id-ID");
        const time = new Date().toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" });

        const welcomeText = `👋 Selamat datang di grup!  
📌 ID: \`${userId}\`  
👤 Username: ${userName}  
📅 Tanggal: ${date}  
⏰ Waktu: ${time} (Asia/Jakarta)`;

        const options = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🎥 YouTube", url: "https://youtube.com/@VynaaChan" }],
                    [{ text: "🌐 Website", url: "https://linkbio.co/VLShop" }],
                    [{ text: "🎮 Discord", url: "https://discord.gg/c6wYDZfhhc" }],
                    [{ text: "📸 Instagram", url: "https://instagram.com/vynaa_valerie" }],
                    [{ text: "📲 WhatsApp Group", url: "https://chat.whatsapp.com/E4mlqRRbWPdIzhOI7JnIgx" }]
                ]
            }
        };

        bot.sendPhoto(chatId, WELCOME_IMAGE, { caption: welcomeText, ...options });
    });

    bot.on("left_chat_member", (msg) => {
        if (!database.settings.bye) return;
        const chatId = msg.chat.id;
        const leftUser = msg.left_chat_member;
        const userName = leftUser.username ? `@${leftUser.username}` : leftUser.first_name;
        const userId = leftUser.id;
        const date = new Date().toLocaleDateString("id-ID");
        const time = new Date().toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" });

        const byeText = `😢 Seseorang telah meninggalkan grup!  
📌 ID: \`${userId}\`  
👤 Username: ${userName}  
📅 Tanggal: ${date}  
⏰ Waktu: ${time}`;

        bot.sendPhoto(chatId, BYE_IMAGE, { caption: byeText });
    });
};