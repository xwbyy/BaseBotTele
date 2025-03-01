const axios = require('axios');
const moment = require('moment-timezone');
const PhoneNum = require('awesome-phonenumber');

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

module.exports = (bot, config, database, saveDatabase) => { 
  bot.onText(/^\/stalkwa(?:\s(.+))?$/, async (msg, match) => { 
    const chatId = msg.chat.id; 
    const userId = msg.from.id.toString(); 
    let num = match[1];

    if (!num) {
      return bot.sendMessage(chatId, "⚠️ Masukkan nomor WhatsApp.\n\nContoh: `/stalkwa 6281234567890`", {
        parse_mode: "Markdown",
        reply_to_message_id: msg.message_id
      });
    }

    num = num.replace(/\D/g, '') + '@s.whatsapp.net';

    if (!database[userId]) {
      database[userId] = { limit: 0, premium: false, premiumExpiry: null };
    }

    if (!database[userId].premium && database[userId].limit >= config.globallimit) {
      return bot.sendMessage(
        chatId,
        `🚫 Anda telah mencapai batas penggunaan gratis sebanyak ${config.globallimit} kali. Silakan upgrade ke premium untuk terus menggunakan fitur ini.`,
        { reply_to_message_id: msg.message_id }
      );
    }

    bot.sendMessage(chatId, `🔍 Mencari informasi WhatsApp *${num.split('@')[0]}*...`, {
      parse_mode: "Markdown",
      reply_to_message_id: msg.message_id
    });

    try {
      const conn = global.conn;
      let isRegistered = (await conn.onWhatsApp(num))[0]?.exists;
      
      if (!isRegistered) {
        return bot.sendMessage(chatId, "❌ Nomor ini tidak terdaftar di WhatsApp.", {
          reply_to_message_id: msg.message_id
        });
      }

      let img = await conn.profilePictureUrl(num, 'image').catch(() => './src/avatar_contact.png');
      let bio = await conn.fetchStatus(num).catch(() => null);
      let name = await conn.getName(num);
      let business = await conn.getBusinessProfile(num);
      let format = new PhoneNum(`+${num.split('@')[0]}`);
      let country = regionNames.of(format.getRegionCode('international'));

      let output = `📲 *Stalking WhatsApp*\n\n` +
                   `🌍 *Negara:* ${country?.toUpperCase() || '-'}\n` +
                   `👤 *Nama:* ${name || '-'}\n` +
                   `📞 *Nomor:* ${format.getNumber('international')}\n` +
                   `🔗 *Link:* [Klik Disini](https://wa.me/${num.split('@')[0]})\n` +
                   `📌 *Status:* ${bio?.status || '-'}\n` +
                   `📆 *Tanggal Status:* ${bio?.setAt ? moment(bio.setAt).locale('id').format('LL') : '-'}\n`;

      if (business) {
        output += `\n🏢 *Info Bisnis*\n` +
                  `🆔 *Business ID:* ${business.wid}\n` +
                  `🌐 *Website:* ${business.website || '-'}\n` +
                  `📧 *Email:* ${business.email || '-'}\n` +
                  `🏷️ *Kategori:* ${business.category || '-'}\n` +
                  `📍 *Alamat:* ${business.address || '-'}\n` +
                  `🕒 *Zona Waktu:* ${business.business_hours?.timezone || '-'}\n` +
                  `📝 *Deskripsi:* ${business.description || '-'}\n`;
      } else {
        output += "\n⚡ *Akun WhatsApp Standar*";
      }

      if (img) {
        bot.sendPhoto(chatId, img, {
          caption: output.trim(),
          parse_mode: "Markdown",
          disable_web_page_preview: true,
          reply_to_message_id: msg.message_id
        });
      } else {
        bot.sendMessage(chatId, output.trim(), {
          parse_mode: "Markdown",
          reply_to_message_id: msg.message_id
        });
      }

      if (!database[userId].premium) {
        database[userId].limit += 1;
        saveDatabase();
      }

    } catch (error) {
      console.error("Error fetching WhatsApp data:", error);
      bot.sendMessage(chatId, "FITUR INI MAINTENANCE DALAM PERBAIKAN.", {
        reply_to_message_id: msg.message_id
      });
    }
  });
};