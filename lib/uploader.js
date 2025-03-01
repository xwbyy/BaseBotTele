const fetch = require('node-fetch');
const FormData = require('form-data');
const { fromBuffer } = require('file-type'); // Untuk mendeteksi tipe file dari buffer

module.exports = async (buffer, fileName = 'file') => {
    try {
        // Deteksi tipe file dari buffer
        const { ext } = await fromBuffer(buffer);

        // Buat FormData dan tambahkan file
        const bodyForm = new FormData();
        bodyForm.append("file", buffer, `${fileName}.${ext}`);

        // Kirim request ke API upload
        const response = await fetch("https://8030.us.kg/api/upload.php", {
            method: "POST",
            body: bodyForm,
        });

        // Parse response JSON
        const data = await response.json();

        // Cek status response
        if (data.status && data.result && data.result.url) {
            return data.result.url; // Kembalikan URL file yang diunggah
        } else {
            throw new Error(data.message || 'Gagal mengunggah file.');
        }
    } catch (error) {
        console.error('Error uploading file:', error.message);
        throw new Error('Terjadi kesalahan saat mengunggah file.');
    }
};