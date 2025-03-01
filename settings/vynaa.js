const config = {
    token: '6513717790:AAEWMeEHDooLzO-3nmQZcUwT77nbPG_QlX4', // Token bot Telegram
    ownerID: 1618920755, // ID pemilik bot
    ownerLink: 'http://t.me/VLShop2', // Link ke profil owner
    globallimit: 10, // Batas global untuk pengguna
    tokopay: { // Konfigurasi TokoPay
        merchantID: 'M240701FIBRZ175',
        secretKey: '79f11be7847b1f018336776cef9c78d988530d5758527a032acd1f08ea429f28',
        link: 'https://api.tokopay.id'
    }
};

// Konfigurasi API global
global.api = {
    btch: 'Vynaaaanjaymabar',
    rose: 'Prod-Sk-8e499dd622744eac3a99ca18adc1d4e5',
};

global.APIs = {
    btch: 'https://api.botcahx.eu.org',
    rose: 'https://api.itsrose.rest',
};

global.APIKeys = {
    'https://api.botcahx.eu.org': 'AksaAlamdra20042011',
    'https://api.itsrose.rest': 'Prod-Sk-8e499dd622744eac3a99ca18adc1d4e5',
};

module.exports = config;