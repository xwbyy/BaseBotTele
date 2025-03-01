const axios = require("axios");
const fs = require("fs");
const sharp = require("sharp");
const ffmpeg = require("fluent-ffmpeg");
const { exec } = require("child_process");

async function convertImageToSticker(buffer, outputFilePath) {
    await sharp(buffer)
        .resize(512, 512, { fit: 'inside' })  // Resize agar sesuai dengan ukuran stiker
        .webp({ quality: 100 })  // Convert ke format WebP untuk stiker
        .toFile(outputFilePath);
    return outputFilePath;
}

async function convertVideoToSticker(buffer, outputFilePath) {
    return new Promise((resolve, reject) => {
        const inputFile = `temp_${Date.now()}.mp4`;
        fs.writeFileSync(inputFile, buffer);
        exec(`ffmpeg -i ${inputFile} -t 10 -vf scale=512:512 -c:v libwebp -lossless 1 -loop 0 -preset default -an -vsync 0 ${outputFilePath}`, (error) => {
            fs.unlinkSync(inputFile);
            if (error) return reject(error);
            resolve(outputFilePath);
        });
    });
}

module.exports = (bot, config, database, saveDatabase) => {
    bot.onText(/^\/s$|^\/sticker/, async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id.toString();
        const senderName = msg.from.first_name || "Pengguna";

        // Inisialisasi pengguna dalam database jika belum ada
        if (!database[userId]) {
            database[userId] = { limit: 0, premium: false };
        }

        // Cek limit pengguna (hanya berlaku untuk pengguna non-premium)
        if (!database[userId].premium && database[userId].limit >= config.globallimit) {
            return bot.sendMessage(chatId, `❌ ${senderName}, Anda telah mencapai batas penggunaan gratis (${config.globallimit} kali). Silakan upgrade ke premium.`);
        }

        // Pastikan pengguna membalas media
        if (!msg.reply_to_message || (!msg.reply_to_message.photo && !msg.reply_to_message.video)) {
            return bot.sendMessage(chatId, "⚠️ Silakan balas gambar atau video dengan perintah /s atau /stiker.");
        }

        const fileId = msg.reply_to_message.photo
            ? msg.reply_to_message.photo[msg.reply_to_message.photo.length - 1].file_id
            : msg.reply_to_message.video.file_id;

        const isVideo = !!msg.reply_to_message.video;

        try {
            const file = await bot.getFile(fileId);
            const filePath = file.file_path;
            const url = `https://api.telegram.org/file/bot${bot.token}/${filePath}`;

            // Download media dari Telegram
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const mediaBuffer = Buffer.from(response.data);

            const outputFilePath = `sticker_${Date.now()}.webp`;

            if (isVideo) {
                await bot.sendMessage(chatId, "⏳ Mengonversi video menjadi stiker (maksimal 10 detik)...");
                await convertVideoToSticker(mediaBuffer, outputFilePath);
            } else {
                await bot.sendMessage(chatId, "⏳ Mengonversi gambar menjadi stiker...");
                await convertImageToSticker(mediaBuffer, outputFilePath);
            }

            await bot.sendSticker(chatId, outputFilePath);
            fs.unlinkSync(outputFilePath);  // Bersihkan file sementara

            // Tambah limit jika pengguna bukan premium
            if (!database[userId].premium) {
                database[userId].limit += 1;
                saveDatabase();
            }

        } catch (error) {
            console.error("❌ Error saat mengonversi media menjadi stiker:", error);
            bot.sendMessage(chatId, "❌ Terjadi kesalahan saat mengonversi media menjadi stiker.");
        }
    });
};