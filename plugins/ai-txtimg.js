const axios = require('axios');
const FormData = require('form-data');
const { Buffer } = require('buffer');

// Konfigurasi API
const API_CONFIG = {
    TMPFILES_UPLOAD_URL: 'https://tmpfiles.org/api/v1/upload',
    DIFFERENTME_API_URL: 'https://api.itsrose.rest/differentMe',
    TXT2IMG_API_URL: 'https://api.itsrose.rest/sdapi/txt2img', // URL untuk txt2img
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

// Service untuk menghasilkan gambar dari teks menggunakan txt2img API
const TextToImageService = {
    async generateImage(prompt, modelId = "dreamshaper", width = 512, height = 512, samples = 1, numInferenceSteps = 21, scheduler = "DDPMScheduler", clipSkip = 2) {
        return retryOperation(async () => {
            const response = await axios.post(
                API_CONFIG.TXT2IMG_API_URL,
                {
                    server_id: "rose",
                    model_id: modelId,
                    prompt: prompt,
                    width: width,
                    height: height,
                    samples: samples,
                    num_inference_steps: numInferenceSteps,
                    scheduler: scheduler,
                    clip_skip: clipSkip
                },
                {
                    headers: {
                        'Authorization': `Bearer ${global.api.rose}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.data?.status || !response.data?.result?.images) {
                throw new Error('Invalid response from TextToImage API');
            }

            return response.data.result;
        });
    }
};

// Objek untuk melacak status pengguna
const userStatus = {};

// Export modul
module.exports = (bot, config, database, saveDatabase) => {
    // Handler untuk command /txt2img
    bot.onText(/\/txt2img/, async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id.toString();

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

        // Aktifkan mode txt2img untuk pengguna
        userStatus[userId] = { isWaitingForPrompt: true };

        try {
            await bot.sendMessage(chatId, 'Silakan kirim teks yang ingin diubah menjadi gambar.');
        } catch (error) {
            console.error('Error in /txt2img command:', error);
            await bot.sendMessage(chatId, 'Terjadi kesalahan. Silakan coba lagi.');
        }
    });

    // Handler untuk pesan teks (ketika pengguna mengirim teks setelah command /txt2img)
    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id.toString();

        // Periksa apakah pengguna sedang dalam mode txt2img
        if (userStatus[userId]?.isWaitingForPrompt && msg.text && !msg.text.startsWith('/')) {
            try {
                const prompt = msg.text;
                const result = await TextToImageService.generateImage(prompt);

                if (result.images && result.images.length > 0) {
                    for (const imageUrl of result.images) {
                        await bot.sendPhoto(chatId, imageUrl, {
                            caption: `Berhasil menghasilkan gambar dari teks: ${prompt}`
                        });
                    }

                    // Tambah limit jika bukan pengguna premium
                    if (!database[userId].premium) {
                        database[userId].limit += 1;
                        saveDatabase();
                    }

                    // Nonaktifkan mode txt2img setelah selesai
                    userStatus[userId].isWaitingForPrompt = false;
                } else {
                    throw new Error('No images returned from API');
                }
            } catch (error) {
                console.error('Error generating image:', error);
                await bot.sendMessage(chatId, 'Terjadi kesalahan saat menghasilkan gambar. Silakan coba lagi.');
            }
        }
    });
};