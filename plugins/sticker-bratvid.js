const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const crypto = require("crypto");

global.stickpack = "Ytb Vynaa Valerie"; // Nama paket stiker
global.stickauth = "S U B S C R I B E"; // Nama pembuat stiker

// Fungsi untuk mengunduh video dari URL
async function downloadVideo(url, outputPath) {
    const response = await axios({
        url,
        responseType: "arraybuffer",
    });
    fs.writeFileSync(outputPath, response.data);
    return outputPath;
}

// Fungsi untuk mengubah video menjadi stiker GIF
async function convertToGifSticker(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        exec(`ffmpeg -i ${inputPath} -vf scale=512:-1 -c:v libwebp -loop 0 -an -vsync 0 ${outputPath}`, (error) => {
            if (error) return reject(error);
            resolve(outputPath);
        });
    });
}

// Handler untuk Brat Video Sticker
module.exports = (bot, config, database, saveDatabase) => {
    bot.onText(/^\/bratvid (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id.toString();
        const senderName = msg.from.first_name;
        const text = match[1];

        if (!text) return bot.sendMessage(chatId, "Gunakan format: /bratvid teks kamu");

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
            bot.sendChatAction(chatId, "upload_video");

            const apiUrl = `https://api.botcahx.eu.org/api/maker/brat-video?text=${encodeURIComponent(text)}&apikey=${global.api.btch}`;
            const uniqueId = crypto.randomBytes(8).toString("hex");
            const inputPath = path.join(__dirname, `bratvid_${uniqueId}.mp4`);
            const outputPath = path.join(__dirname, `bratvid_${uniqueId}.webp`);

            // Unduh video dari API
            await downloadVideo(apiUrl, inputPath);

            // Konversi video ke stiker GIF (WebP)
            await convertToGifSticker(inputPath, outputPath);

            // Kirim stiker GIF ke pengguna
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
            console.error("Error membuat Brat Video Sticker:", error);
            bot.sendMessage(chatId, "Gagal membuat stiker video.");
        }
    });
};