const fetch = require('node-fetch');
const axios = require('axios');

// Variabel global untuk menyimpan status Auto-Simi dan timeout
const autoSimiStatus = new Map();
const chatTimeouts = new Map();

module.exports = (bot, config, database, saveDatabase) => {
  // Handler untuk perintah /autosimi
  bot.onText(/^\/autosimi\s+(on|off)$/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const status = match[1]; // 'on' atau 'off'

    // Periksa apakah pengguna memiliki limit yang cukup
    if (!database[userId]) {
      database[userId] = { limit: 0, premium: false, premiumExpiry: null };
    }

    if (!database[userId].premium && database[userId].limit >= config.globallimit) {
      return bot.sendMessage(chatId, `Anda telah mencapai batas penggunaan gratis sebanyak ${config.globallimit} kali. Silakan upgrade ke premium untuk terus menggunakan fitur ini.`);
    }

    // Set status Auto-Simi
    autoSimiStatus.set(chatId, status === 'on');

    // Reset timeout jika ada
    if (chatTimeouts.has(chatId)) {
      clearTimeout(chatTimeouts.get(chatId));
      chatTimeouts.delete(chatId);
    }

    // Jika Auto-Simi diaktifkan, set timeout untuk mematikannya setelah 5 menit
    if (status === 'on') {
      const timeout = setTimeout(() => {
        autoSimiStatus.set(chatId, false);
        bot.sendMessage(chatId, 'Auto-Simi dinonaktifkan secara otomatis setelah 5 menit tidak ada aktivitas.');
      }, 5 * 60 * 1000); // 5 menit

      chatTimeouts.set(chatId, timeout);
    }

    bot.sendMessage(
      chatId,
      `Auto-Simi telah di${status === 'on' ? 'aktifkan' : 'nonaktifkan'}.`,
      { reply_to_message_id: msg.message_id }
    );

    // Tambah limit jika bukan premium
    if (!database[userId].premium) {
      database[userId].limit += 1;
      saveDatabase();
    }
  });

  // Handler untuk merespons pesan pengguna jika Auto-Simi aktif
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const text = msg.text;

    // Periksa apakah Auto-Simi aktif di chat ini
    if (autoSimiStatus.get(chatId) && text && !text.startsWith('/')) {
      // Periksa apakah pengguna memiliki limit yang cukup
      if (!database[userId]) {
        database[userId] = { limit: 0, premium: false, premiumExpiry: null };
      }

      if (!database[userId].premium && database[userId].limit >= config.globallimit) {
        return bot.sendMessage(chatId, `Anda telah mencapai batas penggunaan gratis sebanyak ${config.globallimit} kali. Silakan upgrade ke premium untuk terus menggunakan fitur ini.`);
      }

      try {
        // Reset timeout setiap kali ada pesan baru
        if (chatTimeouts.has(chatId)) {
          clearTimeout(chatTimeouts.get(chatId));
        }
        const timeout = setTimeout(() => {
          autoSimiStatus.set(chatId, false);
          bot.sendMessage(chatId, 'Auto-Simi dinonaktifkan secara otomatis setelah 5 menit tidak ada aktivitas.');
        }, 5 * 60 * 1000); // 5 menit
        chatTimeouts.set(chatId, timeout);

        // Panggil API SimSimi baru
        const url = `https://api.agatz.xyz/api/simsimi?message=${encodeURIComponent(text)}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Gagal mengambil data dari API SimSimi.');
        }

        const data = await response.json();

        // Periksa status respons
        if (data.status !== 200) {
          throw new Error('Respons API tidak valid.');
        }

        // Kirim balasan ke pengguna
        bot.sendMessage(chatId, data.data, { reply_to_message_id: msg.message_id });

        // Tambah limit jika bukan premium
        if (!database[userId].premium) {
          database[userId].limit += 1;
          saveDatabase();
        }
      } catch (error) {
        console.error('Error:', error);
        bot.sendMessage(chatId, 'Gagal merespons. Coba lagi nanti.', { reply_to_message_id: msg.message_id });
      }
    }
  });
};