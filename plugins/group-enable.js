const fs = require('fs');
const path = require('path');
const config = require('../settings/vynaa.js'); // Update path ke vynaa.js di settings directory

module.exports = (bot) => {
    const databasePath = path.join(__dirname, '../settings/_enable.json');
    let database = {};

    if (fs.existsSync(databasePath)) {
        try {
            database = JSON.parse(fs.readFileSync(databasePath, 'utf8'));
        } catch (err) {
            console.error('Gagal membaca _enable.json:', err);
        }
    } else {
        fs.writeFileSync(databasePath, JSON.stringify(database, null, 2), 'utf8');
    }

    const saveFeatures = () => {
        fs.writeFileSync(databasePath, JSON.stringify(database, null, 2), 'utf8');
    };

    const toggleFeature = (chatId, feature, state) => {
        if (!database[chatId]) {
            database[chatId] = {};
        }
        database[chatId][feature] = state;
        saveFeatures();
        bot.sendMessage(chatId, `Fitur ${feature} ${state ? 'diaktifkan' : 'dinonaktifkan'}.`);
    };

    bot.onText(/^\/(on|off) (antilink|antifoto|antitoxic|antivideo|antipromosi|antifile|antivn|antistiker|antibot|antiaudio|antispam|antihyperlink|antimention|antiforward|antifakelink)$/, (msg, match) => {
        const chatId = msg.chat.id;
        const command = match[1];
        const feature = match[2];
        const state = command === 'on';

        bot.getChatMember(chatId, msg.from.id).then((member) => {
            if (member.status === 'administrator' || member.status === 'creator' || msg.from.id.toString() === config.ownerID.toString()) {
                toggleFeature(chatId, feature, state);
            } else {
                bot.sendMessage(chatId, "Maaf, hanya admin atau pemilik bot yang dapat mengubah pengaturan fitur.");
            }
        });
    });

    bot.onText(/^\/enable$/, (msg) => {
        const chatId = msg.chat.id;
        
        const featuresList = [
            "antilink",
            "antifoto",
            "antitoxic",
            "antivideo",
            "antipromosi",
            "antifile",
            "antivn",
            "antistiker",
            "antibot",
            "antiaudio",
            "antispam",
            "antihyperlink",
            "antimention",
            "antiforward",
            "antifakelink"
        ];

        let message = "⚙️ *Fitur Keamanan Grup*\n\n• Format /on antilink /off antilink\n\nBerikut adalah fitur keamanan untuk menjaga grupmu:\n";
        
        featuresList.forEach(feature => {
            const status = database[chatId] && database[chatId][feature] ? "✅ Aktif" : "❌ Nonaktif";
            message += `- *${feature}* → ${status}\n`;
        });

        bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    });

    bot.on('message', (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text || '';
        const userId = msg.from.id;

        if (!database[chatId]) {
            database[chatId] = {};
        }

        const features = database[chatId];

        bot.getChatMember(chatId, userId).then((member) => {
            const isAdmin = member.status === 'administrator' || member.status === 'creator' || userId.toString() === config.ownerID.toString();
            if (isAdmin) return;

            const linkPatterns = [/http[s]?:\/\/[^\s]+/, /wa\.me\/[^\s]+/, /bit\.ly\/[^\s]+/];
            if (features.antilink && linkPatterns.some(pattern => pattern.test(text))) {
                bot.deleteMessage(chatId, msg.message_id);
                bot.sendMessage(chatId, "Tautan tidak diperbolehkan di grup ini.");
            }

            if (features.antifoto && msg.photo) {
                bot.deleteMessage(chatId, msg.message_id);
                bot.sendMessage(chatId, "Foto tidak diperbolehkan di grup ini.");
            }

            const toxicWords = ['anjing', 'Anjing', 'anj'];
            if (features.antitoxic && toxicWords.some(word => text.includes(word))) {
                bot.deleteMessage(chatId, msg.message_id);
                bot.sendMessage(chatId, "Kata-kata kasar tidak diperbolehkan di grup ini.");
            }

            if (features.antivideo && msg.video) {
                bot.deleteMessage(chatId, msg.message_id);
                bot.sendMessage(chatId, "Video tidak diperbolehkan di grup ini.");
            }

            if (features.antipromosi && text.length > 200) {
                bot.deleteMessage(chatId, msg.message_id);
                bot.sendMessage(chatId, "Pesan promosi tidak diperbolehkan di grup ini.");
            }

            if (features.antifile && (msg.document || msg.audio || msg.video_note)) {
                bot.deleteMessage(chatId, msg.message_id);
                bot.sendMessage(chatId, "File tidak diperbolehkan di grup ini.");
            }

            if (features.antivn && (msg.voice || msg.audio)) {
                bot.deleteMessage(chatId, msg.message_id);
                bot.sendMessage(chatId, "Voice note tidak diperbolehkan di grup ini.");
            }

            if (features.antistiker && msg.sticker) {
                bot.deleteMessage(chatId, msg.message_id);
                bot.sendMessage(chatId, "Stiker tidak diperbolehkan di grup ini.");
            }

            if (features.antibot && msg.new_chat_members) {
                msg.new_chat_members.forEach(member => {
                    if (member.is_bot) {
                        bot.kickChatMember(chatId, member.id);
                        bot.sendMessage(chatId, "Bot tidak diperbolehkan di grup ini.");
                    }
                });
            }

            if (features.antiaudio && msg.audio) {
                bot.deleteMessage(chatId, msg.message_id);
                bot.sendMessage(chatId, "Audio tidak diperbolehkan di grup ini.");
            }

            if (!database[chatId].spamDetection) {
                database[chatId].spamDetection = {};
            }

            const userMessages = database[chatId].spamDetection[userId] || [];
            const now = Date.now();
            userMessages.push(now);
            database[chatId].spamDetection[userId] = userMessages.filter(time => now - time < 5000);

            if (features.antispam && database[chatId].spamDetection[userId].length > 3) {
                bot.deleteMessage(chatId, msg.message_id);
                bot.sendMessage(chatId, "Spam tidak diperbolehkan di grup ini.");
            }

            if (features.antihyperlink && /<a href=/.test(text)) {
                bot.deleteMessage(chatId, msg.message_id);
                bot.sendMessage(chatId, "Hyperlink tidak diperbolehkan di grup ini.");
            }

            if (features.antimention && text.includes("@all")) {
                bot.deleteMessage(chatId, msg.message_id);
                bot.sendMessage(chatId, "Mention massal tidak diperbolehkan di grup ini.");
            }

            if (features.antiforward && msg.forward_from) {
                bot.deleteMessage(chatId, msg.message_id);
                bot.sendMessage(chatId, "Pesan yang diteruskan tidak diperbolehkan di grup ini.");
            }

        }).catch((err) => console.error('Gagal mendapatkan status member:', err));
    });
};