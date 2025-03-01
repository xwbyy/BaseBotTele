const axios = require("axios");
const fs = require("fs");
const sharp = require("sharp");
const ffmpeg = require("fluent-ffmpeg");
const { exec } = require("child_process");

async function convertStickerToImage(buffer, outputFilePath) {
    await sharp(buffer).png().toFile(outputFilePath);
    return outputFilePath;
}

async function convertStickerToGif(buffer, outputFilePath) {
    return new Promise((resolve, reject) => {
        const inputFile = `temp_${Date.now()}.webp`;
        fs.writeFileSync(inputFile, buffer);
        exec(`ffmpeg -i ${inputFile} ${outputFilePath}`, (error) => {
            fs.unlinkSync(inputFile);
            if (error) return reject(error);
            resolve(outputFilePath);
        });
    });
}

module.exports = (bot, config, database, saveDatabase) => {
    const handleStickerConversion = async (msg, type) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id.toString();
        const senderName = msg.from.first_name;

        if (!msg.reply_to_message || !msg.reply_to_message.sticker) {
            return bot.sendMessage(chatId, `Silakan balas stiker dengan perintah /${type}.`);
        }

        // Inisialisasi pengguna dalam database jika belum ada
        if (!database[userId]) {
            database[userId] = { limit: 0, premium: false };
        }

        // Cek limit pengguna (hanya berlaku untuk pengguna non-premium)
        if (!database[userId].premium && database[userId].limit >= config.globallimit) {
            return bot.sendMessage(
                chatId,
                `❌ ${senderName}, Anda telah mencapai batas penggunaan gratis (${config.globallimit} kali). Silakan upgrade ke premium.`
            );
        }

        const fileId = msg.reply_to_message.sticker.file_id;
        const isAnimated = msg.reply_to_message.sticker.is_animated;

        try {
            const file = await bot.getFile(fileId);
            const filePath = file.file_path;
            const url = `https://api.telegram.org/file/bot${bot.token}/${filePath}`;
            const response = await axios.get(url, { responseType: "arraybuffer" });
            const imgBuffer = Buffer.from(response.data);
            const outputFilePath = `output_${Date.now()}.${type === "toimg" ? "png" : "gif"}`;

            if (type === "toimg") {
                await convertStickerToImage(imgBuffer, outputFilePath);
                await bot.sendPhoto(chatId, outputFilePath);
            } else {
                if (!isAnimated) return bot.sendMessage(chatId, "Stiker ini bukan stiker bergerak.");
                await convertStickerToGif(imgBuffer, outputFilePath);
                await bot.sendDocument(chatId, outputFilePath);
            }

            // Hapus file setelah dikirim
            fs.unlinkSync(outputFilePath);

            // Tambah limit jika pengguna bukan premium
            if (!database[userId].premium) {
                database[userId].limit += 1;
                saveDatabase();
            }
        } catch (error) {
            console.error(error);
            bot.sendMessage(chatId, `Terjadi kesalahan saat mengonversi stiker ke ${type === "toimg" ? "gambar" : "GIF"}.`);
        }
    };

    bot.onText(/\/toimg/, (msg) => handleStickerConversion(msg, "toimg"));
    bot.onText(/\/togif/, (msg) => handleStickerConversion(msg, "togif"));
};