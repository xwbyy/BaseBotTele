import { watchFile, unwatchFile } from 'fs';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

// LINK 
global.link = {
    ig: 'https://instagram.com/vynaa_valerie',
    gh: 'https://github.com/VynaaValerie',
    gc: 'https://whatsapp.com/channel/0029VaHPYh6LNSa81M9Xcq1K',
    web: 'https://whatsapp.com/channel/0029VaHPYh6LNSa81M9Xcq1K',
    yt: 'https://youtube.com/@VynaaChan',
    fb: 'https://m.facebook.com',
    tree: 'https://www.vynaachan-api.shop',
    nh: 'https://nhentai.net/g/365296/'
};

// PAYMENT 
global.pay = {
    dana: '082389924037',
    ovo: '082389924037',
    gopay: '082389924037',
    pulsa: '082389924037',
    qris: 'https://telegra.ph/file/a3653879d96186bdd0467.jpg'
};

// INFO
global.info = {
    nomorbot: '6283896757956',
    nomorown: '6282389924037',
    namebot: '© 2024 Vynaa AI',
    nameown: 'Vynaa Valerie'
};

// STAF
global.owner = [
    ['6282389924037', 'VynaaValerie', 'true'],
    ['6283896757956', 'VynaaValerie', 'true']
];
global.mods = [];
global.prems = [];

// STICKER WATERMARK
global.stickpack = 'YT VynaaValerie';
global.stickauth = '© Vynaa AI';
global.multiplier = 38; 

// WATERMARK 
global.versibot = '10.18';
global.wm = '© 2024 Vynaa AI';
global.author = 'VynaValerie';
global.wait = '> prosess...';

// DOCUMENT SETTINGS
global.fsizedoc = '99999999999999';
global.fpagedoc = '999';
global.maxwarn = 5;

// IMAGES
global.elainajpg = [
    'https://telegra.ph/file/3e43fcfaea6dc1ba95617.jpg',
    'https://telegra.ph/file/c738a9fc0722a59825cbb.mp4',
    'https://telegra.ph/file/4018167852aef19651f46.jpg'
];
global.vynaajpg = 'https://widipe.com/file/FOvzIiPhl88m.png';
global.thumbnail = 'https://widipe.com/file/FOvzIiPhl88m.png';

// WELCOME & GOODBYE
global.wel = 'https://telegra.ph/file/ddc2589307fe851dfa1db.mp4';
global.good = 'https://telegra.ph/file/b262558cf65343c584e64.mp4';

global.tokopay = {
    merchantID: 'M240701FIBRZ175',
    secretKey: '79f11be7847b1f018336776cef9c78d988530d5758527a032acd1f08ea429f28',
    link: 'https://api.tokopay.id'
};

// GlobalAPI 
global.zein = 'zenzkey_848b800b1f';
global.skizo = 'sweattheartkyl';
global.rose = 'Rk-Ashbornt';
global.lol = 'fafbc90143ed7cfe7a2907f9';
global.neoxr = 'Sanzxdid';
global.can = 'ItsukaChan';
global.btc = 'Rizalzllk';

// API SETTINGS
global.APIs = {
    xteam: 'https://api.xteam.xyz',
    lol: 'https://api.lolhuman.xyz',
    males: 'https://malesin.xyz',
    zein: 'https://api.zahwazein.xyz',
    rose: 'https://api.itsrose.life',
    skizo: 'https://skizo.tech',
    saipul: 'https://saipulanuar.cf'
};

// DOCUMENT TYPES
global.doc = {
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pdf: 'application/pdf',
    rtf: 'text/rtf'
};

// DECORATIONS
global.decor = {
    menut: '❏═┅═━–〈',
    menub: '┊•',
    menub2: '┊',
    menuf: '┗––––––––––✦',
    hiasan: '꒦ ͝ ꒷ ͝ ꒦ ͝ ꒷ ͝ ꒦ ͝ ꒷ ͝ ꒦ ͝ ꒷',
    menuh: '』––––––',
    menua: '',
    menus: '☃︎',
    htki: '––––––『',
    htka: '』––––––',
    haki: '┅━━━═┅═❏',
    haka: '❏═┅═━━━┅',
    lopr: 'Ⓟ',
    lolm: 'Ⓛ',
    htjava: '❃'
};

// FLAMING TEXT
global.flaaa = [
    'https://www6.flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=sketch-name&doScale=true&scaleWidth=800&scaleHeight=500&fontsize=100&fillTextType=1&fillTextPattern=Warning!&text=',
    'https://www6.flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=sketch-name&doScale=true&scaleWidth=800&scaleHeight=500&fontsize=100&fillTextType=1&fillTextPattern=Warning!&fillColor1Color=%23f2aa4c&fillColor2Color=%23f2aa4c&fillColor3Color=%23f2aa4c&fillColor4Color=%23f2aa4c&fillColor5Color=%23f2aa4c&fillColor6Color=%23f2aa4c&fillColor7Color=%23f2aa4c&fillColor8Color=%23f2aa4c&fillColor9Color=%23f2aa4c&fillColor10Color=%23f2aa4c&fillOutlineColor=%23f2aa4c&fillOutline2Color=%23f2aa4c&backgroundColor=%23101820&text='
];

// WAIFU IMAGES
global.hwaifu = [
    'https://i.pinimg.com/originals/ed/34/f8/ed34f88af161e6278993e1598c29a621.jpg',
    'https://i.pinimg.com/originals/85/4d/bb/854dbbd30304cd69f305352f0183fad0.jpg'
];

// RPG EMOTICONS
global.rpg = {
    emoticon(string) {
        string = string.toLowerCase();
        const emot = {
            level: '📊',
            limit: '🎫',
            health: '❤️',
            exp: '✨',
            atm: '💳',
            money: '💰',
            bank: '🏦',
            potion: '🥤',
            diamond: '💎',
            common: '📦',
            uncommon: '🛍️',
            mythic: '🎁',
            legendary: '🗃️',
            superior: '💼',
            pet: '🔖',
            trash: '🗑',
            armor: '🥼',
            sword: '⚔️',
            pickaxe: '⛏️',
            fishingrod: '🎣',
            wood: '🪵',
            rock: '🪨',
            string: '🕸️',
            horse: '🐴',
            cat: '🐱',
            dog: '🐶',
            fox: '🦊',
            robo: '🤖',
            petfood: '🍖',
            iron: '⛓️',
            gold: '🪙',
            emerald: '❇️',
            upgrader: '🧰',
            bibitanggur: '🌱',
            bibitjeruk: '🌿',
            bibitapel: '☘️',
            bibitmangga: '🍃',
            gardenboxs: '🌳',
            bibitpisang: '🍂',
            pisang: '🍌',
            jeruk: '🍊',
            anggur: '🍇',
            apel: '🍏',
            mangga: '🥭',
            ayam: '🐓',
            babi: '🐖',
            sapi: '🐄',
            monyet: '🐒',
            domba: '🐑',
            ikan: '🐟',
            kuda: '🐎',
            singa: '🦁',
            harimau: '🐯',
            burung: '🐦'
        };
        return emot[string] || '';
    }
};

// OTHER GLOBAL VARIABLES
global.isrpg = false; // Set RPG as false by default
global.author = 'Vynaa Valerie'; // Bot author
global.chatbot = 'vynaaAI'; // Name bot

const file = fileURLToPath(import.meta.url);
watchFile(file, () => {
    unwatchFile(file);
    console.log(chalk.redBright(`'${file}' Updated!`));
    import(file);
});
