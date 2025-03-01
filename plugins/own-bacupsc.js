const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

function formatBytes(bytes, decimalPlaces = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimalPlaces < 0 ? 0 : decimalPlaces;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

module.exports = (bot) => {
    bot.onText(/\/backupsc/, async (msg) => {
        const chatId = msg.chat.id;
        const ownerId = '1618920755'; // Ganti dengan ID owner

        if (msg.from.id.toString() !== ownerId) {
            return bot.sendMessage(chatId, '🚫 Anda tidak memiliki izin untuk menggunakan perintah ini.');
        }

        bot.sendMessage(chatId, '🔧 Sedang membuat backup...');

        const backupFileName = `VynaaAI(${new Date().toISOString().slice(0, 10)}).zip`;
        const backupFilePath = path.join(__dirname, backupFileName);

        const output = fs.createWriteStream(backupFilePath);
        const archive = archiver('zip', { zlib: { level: 6 } });

        output.on('close', async () => {
            let fileSize = formatBytes(archive.pointer());
            console.log(`Backup selesai (${fileSize})`);

            const maxFileSize = 50 * 1024 * 1024; // 50MB limit Telegram
            if (archive.pointer() > maxFileSize) {
                bot.sendMessage(chatId, `❌ File backup terlalu besar (${fileSize}).`);
                fs.unlinkSync(backupFilePath);
            } else {
                try {
                    await bot.sendDocument(ownerId, backupFilePath);
                    bot.sendMessage(chatId, `✅ Backup berhasil dikirim ke owner (${fileSize}).`);
                } catch (err) {
                    console.error('Gagal mengirim backup:', err);
                    bot.sendMessage(chatId, '❌ Gagal mengirim file backup.');
                } finally {
                    fs.unlinkSync(backupFilePath);
                }
            }
        });

        archive.on('error', (err) => {
            console.error('Error saat membuat backup:', err);
            bot.sendMessage(chatId, '❌ Terjadi kesalahan saat membuat backup.');
        });

        archive.pipe(output);

        // **Hanya memasukkan folder dan file yang ada di gambar**
        const foldersToBackup = ['settings', 'public', 'plugins', 'lib'];
        const filesToBackup = ['index.js', 'package.json'];

        foldersToBackup.forEach(folder => {
            const folderPath = path.join(__dirname, folder);
            if (fs.existsSync(folderPath)) {
                archive.directory(folderPath, folder);
            }
        });

        filesToBackup.forEach(file => {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath)) {
                archive.file(filePath, { name: file });
            }
        });

        archive.finalize();
        console.log('Proses backup dimulai...');
    });
};