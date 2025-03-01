module.exports = (bot) => {
  const ownerId = '1618920755'; // ID Owner

  // Fitur perintah /start
  bot.onText(/\/start/, (msg) => {
    const name = msg.from.first_name; // Ambil nama depan pengguna
    const text = `<b style="color: blue;">👋 Halo ${name}!!</b> Saya Vynaa AI, Bot Telegram multi-fungsi siap membantu kamu!  

🔹 Butuh hiburan atau fitur keren?  
Ketik /menu untuk melihat semua fitur yang tersedia.  

💬 Gabut? Mau cari teman atau pasangan?  
Cobain Anonymous Chat dengan perintah /search  
Ngobrol bebas tanpa identitas—siapa tahu ketemu sahabat baru atau jodoh impian!  

Yuk, mulai chat sekarang! 🚀`;

    const photoUrl = './lib/thumbnail.jpg'; // Gambar dari folder lokal
    const audioUrl = './lib/pinaa.mp3'; // Audio dari folder lokal

    // Kirim pesan selamat datang dengan foto
    bot.sendPhoto(msg.chat.id, photoUrl, {
      caption: text,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔗 Join Channel', url: 'https://t.me/VynaaMD' }],
          [{ text: '➕ Tambah ke Grup', url: 'https://t.me/pinottbot?startgroup=true' }]
        ]
      }
    }).then(() => {
      // Kirim audio setelah foto dikirim
      bot.sendAudio(msg.chat.id, audioUrl);
    });
  });

  // Fitur perintah /menu
  bot.onText(/\/menu/, (msg) => {
    const chatId = msg.chat.id;

    const menuText = `<b style="color: blue;">✨ Berikut adalah fitur-fitur yang tersedia:</b>  
    
🔹 <b>USER</b>
• /ping
• /owner
• /profile
• /confess

🚫 <b>GROUP</b>
• /welcome on-off
• /bye on-off
• /enable

🤖 <b>A I</b>
• /deepseek
• /vynaa
• /aiporn
• /bingimg
• /gpt
• /copilot
• /jadianime
• /diffme
• /txt2img 
• /autosimi on-off

📥 <b>DOWNLOADER</b>
• /play
• /ytmp3
• /ytmp4 
• /tiktok
• /instagram
• /capcut
• /facebook
• /github
• /mediafire
• /spotifydl
• /threads
• /drive
• /pindl
• /apkdl
• /xnxxdl
• /terabox

🔍 <b>SEARCH</b>
• /ytsearch
• /searchtt
• /xnxxsearch
• /spotifysearch
• /ppcouple
• /gcwa

🛠 <b>TOOLS</b>
• /getiduser
• /toimg
• /tourl
• /nulis
• /cekmental
• /ssweb
• /hd
• /remini
• /txtsound
• /kodepos

😜 <b>STALKER</b>
• /stalkwa 
• /stalkyt
• /stalkig
• /stalkff
• /stalkml

🎭 <b>STICKER</b>
• /s
• /qc
• /brat
• /bratvid
• /emojimix

🎮 <b>FUN</b>
• /apakah
• /tololcek
• /longtext
• /fiersa
• /katadilan
• /katazaynn
• /quotebatak 

ℹ <b>INFO</b>
• /cekcuaca
• /infogempa`;

    // Inline keyboard dengan tombol Owner Menu (hanya tampil untuk Owner)
    const keyboard = [[{ text: '👑 Owner Menu', callback_data: 'owner_menu' }]];

    bot.sendMessage(chatId, menuText, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: keyboard }
    });
  });

  // Tangani klik tombol "Owner Menu"
  bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id.toString();

    if (callbackQuery.data === 'owner_menu') {
      if (userId === ownerId) {
        // Jika owner, kirim menu owner
        const ownerMenuText = `<b style="color: blue;">👑 OWNER MENU</b>\n\n` +
          `🔹 /addprem - Tambah pengguna premium\n` +
          `🔹 /delprem - Hapus pengguna premium\n` +
          `🔹 /autodb - Kirim backup database otomatis\n` +
          `🔹 /autoresetlimit - Reset limit otomatis\n` +
          `🔹 /cekdb - Cek status database\n` +
          `🔹 /resetlimit - Reset limit manual\n` +
          `🔹 /backupsc - Backup source code\n` +
          `🔹 /listprem - Lihat daftar pengguna premium\n` +
          `🔹 /bc - Broadcast pesan ke semua pengguna`;

        bot.sendMessage(chatId, ownerMenuText, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 Kembali ke Menu', callback_data: 'back_to_menu' }]
            ]
          }
        });
      } else {
        // Jika bukan owner, kasih respon bercanda 😋😜
        bot.answerCallbackQuery(callbackQuery.id, {
          text: '😋😜 Eits, ini khusus owner! Mau ngapain? 🤭',
          show_alert: true
        });
      }
    } else if (callbackQuery.data === 'back_to_menu') {
      // Kembali ke menu utama
      bot.sendMessage(chatId, '📋 Kembali ke menu utama...', {
        reply_markup: {
          inline_keyboard: [[{ text: '📋 Lihat Menu', callback_data: 'show_menu' }]]
        }
      });
    }
  });
};