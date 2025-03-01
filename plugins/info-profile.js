module.exports = (bot, config, database, saveDatabase) => {
    bot.onText(/\/profile/, (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id.toString();

        // Cek apakah pengguna ada di database
        if (!database[userId]) {
            database[userId] = { limit: 0, premium: false, premiumExpiry: null };
            saveDatabase();
        }

        const user = database[userId];

        // Ambil informasi pengguna
        const username = msg.from.username ? `@${msg.from.username}` : 'Tidak ada username';
        const firstName = msg.from.first_name || 'Tidak ada nama depan';
        const lastName = msg.from.last_name || 'Tidak ada nama belakang';
        const fullName = `${firstName} ${lastName}`.trim();

        // Status premium
        const isPremium = user.premium ? '✅ Aktif' : '❌ Tidak Aktif';
        let premiumExpiry = 'Tidak ada';
        let timeRemaining = 'Tidak ada';

        if (user.premium && user.premiumExpiry) {
            const expiryDate = new Date(user.premiumExpiry);
            const now = new Date();

            // Format tanggal kedaluwarsa
            premiumExpiry = expiryDate.toLocaleString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });

            // Hitung waktu tersisa
            const timeDiff = expiryDate - now;
            if (timeDiff > 0) {
                const daysRemaining = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                const hoursRemaining = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutesRemaining = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60)); // ✅ FIXED

                timeRemaining = `${daysRemaining} hari, ${hoursRemaining} jam, ${minutesRemaining} menit`;
            } else {
                timeRemaining = 'Kedaluwarsa';
                user.premium = false; // Nonaktifkan premium jika sudah kedaluwarsa
                saveDatabase();
            }
        }

        // Buat pesan profil
        const message = `
👤 *Profil Pengguna*

🆔 ID: ${userId}
👤 Nama: ${fullName}
📧 Username: ${username}
🎟️ Status Premium: ${isPremium}
📅 Kedaluwarsa Premium: ${premiumExpiry}
⏳ Waktu Tersisa: ${timeRemaining}
📊 Sisa Limit: ${user.limit}
        `;

        // Kirim pesan ke pengguna
        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    });
};