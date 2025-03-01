const axios = require("axios");
const fs = require("fs");
const sharp = require("sharp");
const { exec } = require("child_process");

// Konversi Gambar ke Sticker
async function convertImageToSticker(buffer, outputFilePath) {
    await sharp(buffer)
        .resize(512, 512, { fit: 'inside' })
        .webp({ quality: 100 })
        .toFile(outputFilePath);
    return outputFilePath;
}

// Konversi Video ke Sticker
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

// Konversi Teks ke Quote Sticker
async function convertTextToSticker(text, senderName, senderPhoto) {
    const obj = {
        "type": "quote",
        "format": "png",
        "backgroundColor": "#ffffffff",
        "width": 512,
        "height": 768,
        "scale": 2,
        "messages": [{
            "entities": [],
            "avatar": true,
            "from": {
                "id": 1,
                "name": senderName,
                "photo": { "url": senderPhoto }
            },
            "text": text,
            "replyMessage": {}
        }]
    };

    try {
        console.log("Mengirim request ke API...");
        const response = await axios.post("https://btzqc.betabotz.eu.org/generate", obj, {
            headers: { "Content-Type": "application/json" }
        });

        console.log("Respons API:", response.data);

        if (response.data && response.data.result && response.data.result.image) {
            return Buffer.from(response.data.result.image, "base64");
        } else {
            console.error("Respons API tidak sesuai:", response.data);
            throw new Error("Gagal mendapatkan gambar dari API.");
        }
    } catch (error) {
        console.error("Error dalam pembuatan Quote Sticker:", error.response ? error.response.data : error.message);
        return null;
    }
}

// Handler Telegram Bot
module.exports = (bot, config, database, saveDatabase) => {
    bot.onText(/^\/b$|^\/sqc|^\/qc/, async (msg) => {
        const chatId = msg.chat.id;
        const senderId = msg.from.id.toString();
        const senderName = msg.from.first_name;

        // Inisialisasi pengguna dalam database jika belum ada
        if (!database[senderId]) {
            database[senderId] = { limit: 0, premium: false };
        }

        // Cek limit pengguna (hanya berlaku untuk pengguna non-premium)
        if (!database[senderId].premium && database[senderId].limit >= config.globallimit) {
            return bot.sendMessage(chatId, `❌ ${senderName}, Anda telah mencapai batas penggunaan gratis (${config.globallimit} kali). Silakan upgrade ke premium.`);
        }

        if (msg.text.startsWith("/qc")) {
            // Membuat Quote Sticker
            const text = msg.text.replace("/qc", "").trim();
            if (!text) return bot.sendMessage(chatId, "Teksnya mana sayang? contoh /qc aku sayang Vynaa");

            const senderPhoto = await getUserProfilePhoto(bot, senderId);
            const stickerBuffer = await convertTextToSticker(text, senderName, senderPhoto);
            if (!stickerBuffer) return bot.sendMessage(chatId, "Gagal membuat stiker.");

            await bot.sendSticker(chatId, stickerBuffer);

            // Tambah limit jika pengguna bukan premium
            if (!database[senderId].premium) {
                database[senderId].limit += 1;
                saveDatabase();
            }

            return;
        }

        // Cek apakah ada gambar/video yang di-reply
        if (!msg.reply_to_message || (!msg.reply_to_message.photo && !msg.reply_to_message.video)) {
            return bot.sendMessage(chatId, "Balas gambar/video dengan /s atau /stiker.");
        }

        const fileId = msg.reply_to_message.photo
            ? msg.reply_to_message.photo[msg.reply_to_message.photo.length - 1].file_id
            : msg.reply_to_message.video.file_id;

        const isVideo = !!msg.reply_to_message.video;

        try {
            const file = await bot.getFile(fileId);
            const filePath = file.file_path;
            const url = `https://api.telegram.org/file/bot${bot.token}/${filePath}`;

            const response = await axios.get(url, { responseType: "arraybuffer" });
            const mediaBuffer = Buffer.from(response.data);

            const outputFilePath = `sticker_${Date.now()}.webp`;

            if (isVideo) {
                await bot.sendMessage(chatId, "Mengonversi video menjadi stiker...");
                await convertVideoToSticker(mediaBuffer, outputFilePath);
            } else {
                await bot.sendMessage(chatId, "Mengonversi gambar menjadi stiker...");
                await convertImageToSticker(mediaBuffer, outputFilePath);
            }

            await bot.sendSticker(chatId, outputFilePath);
            fs.unlinkSync(outputFilePath);

            // Tambah limit jika pengguna bukan premium
            if (!database[senderId].premium) {
                database[senderId].limit += 1;
                saveDatabase();
            }

        } catch (error) {
            console.error("Error:", error);
            bot.sendMessage(chatId, "Terjadi kesalahan saat mengonversi media.");
        }
    });
};

// Fungsi untuk mendapatkan foto profil user
async function getUserProfilePhoto(bot, userId) {
    try {
        const userPhotos = await bot.getUserProfilePhotos(userId);
        if (userPhotos.total_count > 0) {
            const fileId = userPhotos.photos[0][0].file_id;
            const file = await bot.getFile(fileId);
            return `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
        }
    } catch (error) {
        console.error("Gagal mendapatkan foto profil:", error.message);
    }
    return null;
}