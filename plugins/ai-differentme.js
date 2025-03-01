const axios = require('axios');
const FormData = require('form-data');
const { Buffer } = require('buffer');

// Daftar style yang tersedia
const AVAILABLE_STYLES = [
    "animal_fest", "old", "doll", "metal", "8bit", "city", "blazing_torch",
    "clay", "realism", "simulife", "sketch", "zombie", "oil_stick", "balloon",
    "pipe_craft", "crystal", "felt", "jade", "pink_girl", "vivid", "eastern",
    "mythical", "ps2", "pixel_game", "league", "lineage", "fantasy", "gta",
    "persona", "happiness", "manga", "sweet", "pixel_art", "catwoman", "loose",
    "sakura", "pocket", "grains", "graduation", "oil_pastel", "flora_tour", 
    "loong_year", "figure", "prospera", "guardians", "expedition", "leisure", 
    "giftify", "amiable", "3d_cartoon", "sketch_ii", "collage", "mini_doll",
    "sketchresize", "cartoon", "fluffy", "insta", "local_graffiti", "peking_opera",
    "opera", "torch", "sport", "dunk", "idol", "anime25d", "anime", "comic",
    "manhwa", "manhwa_female", "manhwa_male", "samyang"
];

// Konfigurasi API
const API_CONFIG = {
    TMPFILES_UPLOAD_URL: 'https://tmpfiles.org/api/v1/upload',
    DIFFERENTME_API_URL: 'https://api.itsrose.rest/differentMe',
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
    STATUS_CHECK_INTERVAL: 3000,
    STATUS_CHECK_TIMEOUT: 60000 // 1 minute timeout
};

// Fungsi untuk delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fungsi untuk retry operation
const retryOperation = async (operation, maxRetries = API_CONFIG.MAX_RETRIES) => {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            if (i < maxRetries - 1) {
                await sleep(API_CONFIG.RETRY_DELAY);
            }
        }
    }
    throw lastError;
};

// Service untuk upload gambar ke tmpfiles.org
const ImageUploadService = {
    async uploadToTmpFiles(buffer) {
        const formData = new FormData();
        formData.append('file', Buffer.from(buffer), {
            filename: 'image.jpg',
            contentType: 'image/jpeg'
        });

        return retryOperation(async () => {
            const response = await axios({
                method: 'POST',
                url: API_CONFIG.TMPFILES_UPLOAD_URL,
                headers: {
                    ...formData.getHeaders()
                },
                data: formData,
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });

            if (!response.data?.data?.url) {
                throw new Error('Invalid response from upload server');
            }

            const fileUrl = response.data.data.url;
            const directUrl = fileUrl.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
            return directUrl;
        });
    }
};

// Service untuk transformasi gambar menggunakan DifferentMe API
const DifferentMeService = {
    async transform(url, prompt = "", style, disableImageDetect = false, numImages = 1) {
        return retryOperation(async () => {
            const response = await axios.post(
                `${API_CONFIG.DIFFERENTME_API_URL}/create`,
                {
                    init_image: url,
                    prompt: prompt || undefined,
                    style_id: style,
                    disable_image_detect: disableImageDetect,
                    num_image: numImages
                },
                {
                    headers: {
                        'Authorization': `Bearer ${global.api.rose}`, // Gunakan API key dari global.api.rose
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.data?.status || !response.data?.result?.task_id) {
                throw new Error('Invalid response from DifferentMe API');
            }

            return response.data.result;
        });
    },

    async waitForCompletion(taskId) {
        const startTime = Date.now();

        while (Date.now() - startTime < API_CONFIG.STATUS_CHECK_TIMEOUT) {
            const response = await axios.get(
                `${API_CONFIG.DIFFERENTME_API_URL}/status`,
                {
                    params: { task_id: taskId },
                    headers: {
                        'Authorization': `Bearer ${global.api.rose}` // Gunakan API key dari global.api.rose
                    }
                }
            );

            if (response.data?.result?.status === 'completed') {
                return response.data.result;
            } else if (response.data?.result?.status === 'failed') {
                throw new Error('Task processing failed');
            }

            await sleep(API_CONFIG.STATUS_CHECK_INTERVAL);
        }

        throw new Error('Task processing timeout');
    }
};

// Export modul
module.exports = (bot, config, database, saveDatabase) => {
    // Simpan konteks foto pengguna sementara
    const userPhotoContext = new Map();

    // Handler untuk command /diffme
    bot.onText(/\/diffme/, async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id.toString();
        const messageId = msg.message_id;

        // Batasi penggunaan hanya di private chat
        if (msg.chat.type !== 'private') {
            return bot.sendMessage(
                chatId,
                '🚫 Fitur ini hanya dapat digunakan di private chat. Silakan hubungi bot secara langsung.'
            );
        }

        // Periksa apakah pengguna ada di database
        if (!database[userId]) {
            database[userId] = { limit: 0, premium: false, premiumExpiry: null };
        }

        // Periksa apakah pengguna telah mencapai batas limit
        if (!database[userId].premium && database[userId].limit >= config.globallimit) {
            return bot.sendMessage(
                chatId,
                `🚫 Anda telah mencapai batas penggunaan gratis sebanyak ${config.globallimit} kali. Silakan upgrade ke premium untuk terus menggunakan fitur ini.`
            );
        }

        try {
            // Dua skenario:
            // 1. Pengguna membalas foto dengan command /diffme
            if (msg.reply_to_message && msg.reply_to_message.photo) {
                const photoId = msg.reply_to_message.photo[msg.reply_to_message.photo.length - 1].file_id;
                userPhotoContext.set(chatId.toString(), photoId);

                // Buat tombol pilihan style (dalam kelompok 4 untuk menghindari batasan UI Telegram)
                const styleChunks = [];
                for (let i = 0; i < AVAILABLE_STYLES.length; i += 4) {
                    styleChunks.push(AVAILABLE_STYLES.slice(i, i + 4).map(style => ({
                        text: style,
                        callback_data: `diff_${style}`
                    })));
                }

                await bot.sendMessage(chatId, 'Pilih style yang diinginkan:', {
                    reply_markup: {
                        inline_keyboard: styleChunks
                    }
                });
            }
            // 2. Pengguna mengirim /diffme dan akan mengirim foto setelahnya
            else {
                await bot.sendMessage(chatId, 'Silahkan kirim foto yang ingin difilter');
                // Set penanda kosong untuk menunggu foto
                userPhotoContext.set(chatId.toString(), 'waiting');
            }
        } catch (error) {
            console.error('Error in /diffme command:', error);
            await bot.sendMessage(chatId, 'Terjadi kesalahan. Silakan coba lagi.');
        }
    });

    // Handler untuk foto (ketika pengguna mengirim foto setelah command /diffme)
    bot.on('photo', async (msg) => {
        const chatId = msg.chat.id;

        // Batasi penggunaan hanya di private chat
        if (msg.chat.type !== 'private') return;

        // Periksa apakah kita sedang menunggu foto dari pengguna ini
        if (userPhotoContext.get(chatId.toString()) === 'waiting') {
            try {
                const photoId = msg.photo[msg.photo.length - 1].file_id;
                userPhotoContext.set(chatId.toString(), photoId);

                // Buat tombol pilihan style (dalam kelompok 4 untuk menghindari batasan UI Telegram)
                const styleChunks = [];
                for (let i = 0; i < AVAILABLE_STYLES.length; i += 4) {
                    styleChunks.push(AVAILABLE_STYLES.slice(i, i + 4).map(style => ({
                        text: style,
                        callback_data: `diff_${style}`
                    })));
                }

                await bot.sendMessage(chatId, 'Pilih style yang diinginkan:', {
                    reply_markup: {
                        inline_keyboard: styleChunks
                    }
                });
            } catch (error) {
                console.error('Error processing photo:', error);
                await bot.sendMessage(chatId, 'Terjadi kesalahan saat memproses foto. Silakan coba lagi.');
                userPhotoContext.delete(chatId.toString());
            }
        }
    });

    // Handler untuk callback queries (pemilihan style)
    bot.on('callback_query', async (callbackQuery) => {
        const chatId = callbackQuery.message.chat.id;
        const data = callbackQuery.data;
        const userId = callbackQuery.from.id.toString();

        if (data.startsWith('diff_')) {
            try {
                const style = data.replace('diff_', '');
                const photoId = userPhotoContext.get(chatId.toString());

                if (!photoId) {
                    await bot.answerCallbackQuery(callbackQuery.id, {
                        text: 'Sesi telah berakhir. Silakan mulai lagi dengan /diffme',
                        show_alert: true
                    });
                    return;
                }

                // Beri tahu pengguna bahwa proses telah dimulai dan hapus keyboard pilihan style
                await bot.editMessageText('Sedang memproses gambar...', {
                    chat_id: chatId,
                    message_id: callbackQuery.message.message_id,
                    reply_markup: { inline_keyboard: [] }
                });

                // Dapatkan URL file dari Telegram
                const fileUrl = await bot.getFileLink(photoId);
                const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
                const buffer = Buffer.from(response.data, 'binary');

                // Upload ke layanan tmp
                const uploadedUrl = await ImageUploadService.uploadToTmpFiles(buffer);

                // Transformasi gambar
                const transformResult = await DifferentMeService.transform(uploadedUrl, '', style);
                const result = await DifferentMeService.waitForCompletion(transformResult.task_id);

                // Kirim kembali gambar yang telah diubah
                if (result.images && result.images.length > 0) {
                    for (const imageUrl of result.images) {
                        await bot.sendPhoto(chatId, imageUrl, {
                            caption: `Berhasil mengubah gambar dengan style: ${style}`
                        });
                    }

                    // Hapus pesan pemrosesan
                    await bot.deleteMessage(chatId, callbackQuery.message.message_id);
                } else {
                    throw new Error('No images returned from API');
                }

                // Tambah limit jika bukan pengguna premium
                if (!database[userId].premium) {
                    database[userId].limit += 1;
                    saveDatabase();
                }

                // Bersihkan konteks
                userPhotoContext.delete(chatId.toString());

            } catch (error) {
                console.error('Error in callback processing:', error);
                await bot.sendMessage(chatId, 'Terjadi kesalahan. Silakan coba lagi.');
                // Bersihkan konteks jika terjadi error
                userPhotoContext.delete(chatId.toString());

                // Coba bersihkan UI
                try {
                    await bot.editMessageText('Terjadi kesalahan saat memproses gambar.', {
                        chat_id: chatId,
                        message_id: callbackQuery.message.message_id,
                        reply_markup: { inline_keyboard: [] }
                    });
                } catch (uiError) {
                    // Abaikan error pembersihan UI
                }
            }
        }

        // Selalu jawab callback query untuk mencegah status "loading" di Telegram
        try {
            await bot.answerCallbackQuery(callbackQuery.id);
        } catch (error) {
            // Abaikan error dalam menjawab callback query
        }
    });
};