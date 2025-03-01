const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const crypto = require("crypto");

global.stickpack = "Ytb Vynaa Valerie"; // Nama paket stiker
global.stickauth = "S U B S C R I B E"; // Nama pembuat stiker

// Fungsi untuk mengunduh gambar dari URL
async function downloadImage(url, outputPath) {
    const response = await axios({
        url,
        responseType: "arraybuffer",
    });
    fs.writeFileSync(outputPath, response.data);
    return outputPath;
}

// Fungsi untuk mengubah gambar menjadi stiker WebP
async function convertToSticker(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        exec(`ffmpeg -i ${inputPath} -vf scale=512:512 -c:v libwebp -lossless 1 -preset default -an -vsync 0 ${outputPath}`, (error) => {
            if (error) return reject(error);
            resolve(outputPath);
        });
    });
}

// Handler untuk Brat Text Sticker
module.exports = (bot, config, database, saveDatabase) => {
    bot.onText(/^\/brat(?: (.+))?/, async (msg, match) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id.toString();
        const senderName = msg.from.first_name;
        const text = match[1];

        if (!text) {
            return bot.sendMessage(chatId, "Gunakan format: /brat teks kamu. Contoh: /brat Hello World");
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

        try {
            bot.sendChatAction(chatId, "upload_photo");

            const imageUrl = `https://ochinpo-helper.hf.space/brat?text=${encodeURIComponent(text)}`;
            const uniqueId = crypto.randomBytes(8).toString("hex");
            const inputPath = path.join(__dirname, `brat_${uniqueId}.png`);
            const outputPath = path.join(__dirname, `brat_${uniqueId}.webp`);

            await downloadImage(imageUrl, inputPath);
            await convertToSticker(inputPath, outputPath);

            await bot.sendSticker(chatId, outputPath);

            // Hapus file setelah dikirim
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);

            // Tambah limit jika pengguna bukan premium
            if (!database[userId].premium) {
                database[userId].limit += 1;
                saveDatabase();
            }
        } catch (error) {
            console.error("Error membuat Brat Text Sticker:", error);
            bot.sendMessage(chatId, "Gagal membuat stiker.");
        }
    });
};