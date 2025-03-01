const axios = require('axios');
const fs = require('fs');
const path = require('path');

const MAX_FILE_SIZE = 50 * 1024 * 1024; // Maksimum 50MB

module.exports = (bot, config, database, saveDatabase) => {
    // Handler untuk perintah /github (GitHub Gist)
    bot.onText(/^\/github$/, (msg) => {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, 'Silakan kirim link GitHub Gist yang ingin Anda download.\nContoh: /github https://gist.github.com/user/gist_id', { parse_mode: 'Markdown' });
    });

    bot.onText(/^\/github (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const messageId = msg.message_id;
        const url = match[1].trim();
        const userId = msg.from.id.toString();
        const senderName = msg.from.first_name;

        // Cek apakah URL valid (harus dari GitHub Gist)
        const gistRegex = /^https:\/\/gist\.github\.com\/[\w-]+\/[\w-]+$/;
        if (!gistRegex.test(url)) {
            return bot.sendMessage(chatId, '⚠️ URL tidak valid! Harap masukkan URL GitHub Gist yang benar.\nContoh: /github https://gist.github.com/user/gist_id', { reply_to_message_id: messageId });
        }

        // Inisialisasi pengguna dalam database jika belum ada
        if (!database[userId]) {
            database[userId] = { limit: 0, premium: false };
        }

        // Cek limit pengguna (hanya berlaku untuk pengguna non-premium)
        if (!database[userId].premium && database[userId].limit >= config.globallimit) {
            return bot.sendMessage(
                chatId,
                `❌ ${senderName}, Anda telah mencapai batas penggunaan gratis (${config.globallimit} kali). Silakan upgrade ke premium.`,
                { reply_to_message_id: messageId }
            );
        }

        bot.sendMessage(chatId, '🔄 Mengambil data Gist dari GitHub, harap tunggu...');

        try {
            const apiUrl = `https://api.siputzx.my.id/api/d/github?url=${encodeURIComponent(url)}`;
            const response = await axios.get(apiUrl);
            const data = response.data;

            if (!data.files || data.files.length === 0) {
                throw new Error('Gagal mendapatkan data Gist.');
            }

            const { owner, gist_id, description, files } = data;
            let message = `✅ *GitHub Gist Downloader*\n\n📂 *Pemilik:* ${owner}\n🆔 *Gist ID:* \`${gist_id}\`\n📝 *Deskripsi:* ${description || 'Tidak ada deskripsi'}\n\n📜 *Daftar File:*\n`;

            files.forEach((file) => {
                message += `📄 *${file.name}* (${file.size} bytes)\n🔗 [Download](${file.raw_url})\n\n`;
            });

            await bot.sendMessage(chatId, message, { parse_mode: 'Markdown', reply_to_message_id: messageId });

            for (const file of files) {
                if (file.size > MAX_FILE_SIZE) {
                    await bot.sendMessage(chatId, `⚠️ File *${file.name}* terlalu besar (${file.size} bytes).`, { parse_mode: 'Markdown', reply_to_message_id: messageId });
                    continue;
                }

                await bot.sendMessage(chatId, `📥 Mengunduh file *${file.name}*, harap tunggu...`, { parse_mode: 'Markdown' });

                const tempFilePath = path.join(__dirname, file.name);
                const writer = fs.createWriteStream(tempFilePath);
                const fileResponse = await axios({
                    url: file.raw_url,
                    method: 'GET',
                    responseType: 'stream',
                });

                fileResponse.data.pipe(writer);

                writer.on('finish', async () => {
                    await bot.sendDocument(chatId, tempFilePath, {
                        caption: `📂 *${file.name}* (${file.size} bytes)`,
                        parse_mode: 'Markdown',
                        reply_to_message_id: messageId,
                    });

                    // Hapus file setelah dikirim
                    if (fs.existsSync(tempFilePath)) {
                        fs.unlinkSync(tempFilePath);
                    }

                    // Tambah limit jika pengguna bukan premium
                    if (!database[userId].premium) {
                        database[userId].limit += 1;
                        saveDatabase();
                    }
                });

                writer.on('error', (err) => {
                    console.error('Gagal mengunduh file:', err);
                    bot.sendMessage(chatId, `❌ Gagal mengunduh file *${file.name}* dari GitHub Gist.`, { reply_to_message_id: messageId });
                });
            }
        } catch (error) {
            console.error('Error occurred:', error);
            bot.sendMessage(chatId, '❌ Gagal mengambil data dari GitHub Gist. Pastikan URL yang dimasukkan benar.', { reply_to_message_id: messageId });
        }
    });

    // Handler untuk perintah /githubrepo (GitHub Repository)
    bot.onText(/^\/githubrepo$/, (msg) => {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, 'Silakan kirim link GitHub Repository yang ingin Anda download.\nContoh: /githubrepo https://github.com/user/repo', { parse_mode: 'Markdown' });
    });

    bot.onText(/^\/githubrepo (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const messageId = msg.message_id;
        const url = match[1].trim();
        const userId = msg.from.id.toString();
        const senderName = msg.from.first_name;

        // Cek apakah URL valid (harus dari GitHub Repository)
        const repoRegex = /^(https:\/\/github\.com\/[\w-]+\/[\w-]+)(\.git)?$/i;
        if (!repoRegex.test(url)) {
            return bot.sendMessage(chatId, '⚠️ URL tidak valid! Harap masukkan URL GitHub Repository yang benar.\nContoh: /githubrepo https://github.com/user/repo', { reply_to_message_id: messageId });
        }

        // Inisialisasi pengguna dalam database jika belum ada
        if (!database[userId]) {
            database[userId] = { limit: 0, premium: false };
        }

        // Cek limit pengguna (hanya berlaku untuk pengguna non-premium)
        if (!database[userId].premium && database[userId].limit >= config.globallimit) {
            return bot.sendMessage(
                chatId,
                `❌ ${senderName}, Anda telah mencapai batas penggunaan gratis (${config.globallimit} kali). Silakan upgrade ke premium.`,
                { reply_to_message_id: messageId }
            );
        }

        bot.sendMessage(chatId, '🔄 Mengambil data Repository dari GitHub, harap tunggu...');

        try {
            const [_, repoUrl] = url.match(repoRegex);
            const [user, repo] = repoUrl.replace('https://github.com/', '').split('/');
            const zipUrl = `https://api.github.com/repos/${user}/${repo}/zipball`;

            // Mendapatkan nama file dari header
            const response = await axios.head(zipUrl);
            const contentDisposition = response.headers['content-disposition'];
            const filename = contentDisposition.match(/filename=(.*)/)[1];

            bot.sendMessage(chatId, '📥 Mengunduh repository, harap tunggu...');

            const tempFilePath = path.join(__dirname, filename);
            const writer = fs.createWriteStream(tempFilePath);
            const fileResponse = await axios({
                url: zipUrl,
                method: 'GET',
                responseType: 'stream',
            });

            fileResponse.data.pipe(writer);

            writer.on('finish', async () => {
                await bot.sendDocument(chatId, tempFilePath, {
                    caption: `📂 *${filename}*`,
                    parse_mode: 'Markdown',
                    reply_to_message_id: messageId,
                });

                // Hapus file setelah dikirim
                if (fs.existsSync(tempFilePath)) {
                    fs.unlinkSync(tempFilePath);
                }

                // Tambah limit jika pengguna bukan premium
                if (!database[userId].premium) {
                    database[userId].limit += 1;
                    saveDatabase();
                }
            });

            writer.on('error', (err) => {
                console.error('Gagal mengunduh repository:', err);
                bot.sendMessage(chatId, '❌ Gagal mengunduh repository dari GitHub.', { reply_to_message_id: messageId });
            });
        } catch (error) {
            console.error('Error occurred:', error);
            bot.sendMessage(chatId, '❌ Gagal mengambil data dari GitHub Repository. Pastikan URL yang dimasukkan benar.', { reply_to_message_id: messageId });
        }
    });
};