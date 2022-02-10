'use strict';

require('dotenv').config();
const ViberBot = require('viber-bot').Bot;
const BotEvents = require('viber-bot').Events;

const TextMessage = require('viber-bot').Message.Text;
const UrlMessage = require('viber-bot').Message.Url;
const ContactMessage = require('viber-bot').Message.Contact;
const PictureMessage = require('viber-bot').Message.Picture;
const VideoMessage = require('viber-bot').Message.Video;
const LocationMessage = require('viber-bot').Message.Location;
const StickerMessage = require('viber-bot').Message.Sticker;
const FileMessage = require('viber-bot').Message.File;
const RichMediaMessage = require('viber-bot').Message.RichMedia;
const KeyboardMessage = require('viber-bot').Message.Keyboard;

const ngrok = require('./get_public_url');

// ------------------------------- TELEGRAM BOT --------------------------------------------

const TelegramApi = require('node-telegram-bot-api')

const teleAccounts = new Set()

const teletoken = '5112053032:AAGsDxPboNMWE9AKrmh71vsxa2M6OZA1odw'

const telebot = new TelegramApi(teletoken, { polling: true })

const fs = require("fs"), request = require("request")

let telebotGroups = new Set()
let telebotMessages = []

telebot.setMyCommands([
    { command: "/start", description: "Получить команды" }
])

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const download = (uri, filename, callback) => {
    request.head(uri, (err, res, body) => {
        console.log('content-type:', res.headers['content-type']);
        console.log('content-length:', res.headers['content-length']);
        request(uri).pipe(fs.createWriteStream(`./files/${filename}`)).on('close', callback);
    });
};

telebot.on("message", async (msg) => {
    if (msg.text === "14172") {
        teleAccounts.add(msg.from.id)
        telebot.sendMessage(msg.from.id, "Авторизация успешна!")
    }
    const accounts = Array.from(teleAccounts)
    const account = accounts.find(el => el === msg.from.id)
    if (account) {
        if (msg.text === "/start") {
            telebot.sendMessage(msg.chat.id, "Здравствуйте, введите необходимые данные", {
                "reply_markup": {
                    "keyboard": [["/Очистить группы"], ["/Удалить", "/Отправить"]]
                }
            })
        } else if (msg.text === "/Очистить группы") {
            telebotGroups = new Set()
            telebot.sendMessage(msg.chat.id, "Все группы были удалены!")
        } else if (msg.text === "/Удалить") {
            telebotMessages = []
            telebot.sendMessage(msg.chat.id, "Все сообщения были удалены!")
        } else if (msg.text === "/Отправить") {

            const groups = Array.from(telebotGroups)

            for (let i = 0; i < groups.length; i++) {
                const group = groups[i]
                for (let j = 0; j < telebotMessages.length; j++) {
                    const message = telebotMessages[j]
                    if (j % 19 === 0 && j !== 0) {
                        await sleep(60000)
                    }
                    if (message instanceof TextMessage && !message.text.includes(".gif")) {
                        await telebot.sendMessage(group, message.text)
                    } else if (message instanceof PictureMessage) {
                        message.text ? await telebot.sendPhoto(group, message.url, { caption: message.text }) : await telebot.sendPhoto(group, message.url)
                    } else if (message instanceof VideoMessage) {
                        message.text ? await telebot.sendVideo(group, message.url, { caption: message.text }) : await telebot.sendVideo(group, message.url)
                    } else if (message instanceof TextMessage && message.text.includes(".gif")) {
                        await telebot.sendAnimation(group, message.text)
                    } else if (message instanceof FileMessage) {
                        download(message.url, message.filename, async () => {
                            await telebot.sendAnimation(group, `./files/${message.filename}`)
                            try {
                                fs.unlinkSync(`./files/${message.filename}`)
                            } catch (err) {
                                console.log(err)
                            }
                        })
                    }
                }
            }
        }
    }
    
})

telebot.on("channel_post", msg => {
    if (msg.text === "/active") {
        telebotGroups.add(msg.chat.id)
    }
    if (msg.text && msg.text === '/inactive') {
        telebotGroups.delete(msg.chat.id)
    }
})


// ----------------------------- TELEGRAM COUNTER ------------------------------

const countertoken = '5250747372:AAFdfADCZUt754z0I09RgdpWcFBdxJ06394'

const counterbot = new TelegramApi(countertoken, { polling: true })

let counterbotMessages = []

counterbot.setMyCommands([
    { command: "/start", description: "Получить команды" }
])

let isCurr = true
let currency = []

const rounder = (num) => {
    num = Math.round(num)
    const str = num + ""
    if (str.length > 1) {
        const arr = str.split("")
        const last = arr[arr.length - 1]
        if (last === "1" || last === "2") arr[arr.length - 1] = "0"
        if (last === "3" || last === "4" || last === "6" || last === "7") arr[arr.length - 1] = "5"
        if (last === "8" || last === "9") {
            arr[arr.length - 2] = `${+arr[arr.length - 2] + 1}`
            arr[arr.length - 1] = "0"
        }
        return arr.join("")
    } else {
        if (str === "1" || str === "2") return "0"
        if (str === "3" || str === "4" || str === "6" || str === "7") return "5"
        if (str === "8" || str === "9") return "10"
    }
}

const textCounterByCurrency = (text) => {
    text = text.replaceAll(" PLN", "PLN")
    text = text.replaceAll(" TL", "TL")
    text = text.replaceAll(" CZK", "CZK")
    const arr = text.split(" ")
    let result = []

    for (let i = 0; i < arr.length; i++) {
        const word = arr[i]

        if (word.includes("$") && currency.find(el => el.includes("usd"))) {
            const value = +(currency.find(el => el.includes("usd")).replace("usd", ""))
            if (word.includes("-")) {
                const num1 = rounder(+word.replace("$", "").split("-")[0] * value)
                const num2 = rounder(+word.replace("$", "").split("-")[1] * value)
                result = [...result, `${num1}-${num2}грн`]
            } else {
                const newNum = rounder(+word.replace("$", "") * value)
                result = [...result, `${newNum}грн`]
            }
            const plus = currency.find(el => el === "+")
            if (plus) {
                result = [...result, "+ вес"]
            }
        } else if (word.includes("€") && currency.find(el => el.includes("eur"))) {
            const value = +(currency.find(el => el.includes("eur")).replace("eur", ""))
            if (word.includes("-")) {
                const num1 = rounder(+word.replace("€", "").split("-")[0] * value)
                const num2 = rounder(+word.replace("€", "").split("-")[1] * value)
                result = [...result, `${num1}-${num2}грн`]
            } else {
                const newNum = rounder(+word.replace("€", "") * value)
                result = [...result, `${newNum}грн`]

            }
            const plus = currency.find(el => el === "+")
            if (plus) {
                result = [...result, "+ вес"]
            }
        } else if (word.includes("£") && currency.find(el => el.includes("gbp"))) {
            const value = +(currency.find(el => el.includes("gbp")).replace("gbp", ""))
            if (word.includes("-")) {
                const num1 = rounder(+word.replace("£", "").split("-")[0] * value)
                const num2 = rounder(+word.replace("£", "").split("-")[1] * value)
                result = [...result, `${num1}-${num2}грн`]
            } else {
                const newNum = rounder(+word.replace("£", "") * value)
                result = [...result, `${newNum}грн`]
            }
            const plus = currency.find(el => el === "+")
            if (plus) {
                result = [...result, "+ вес"]
            }
        } else if (word.includes("PLN") && currency.find(el => el.includes("pln"))) {
            const value = +(currency.find(el => el.includes("pln")).replace("pln", ""))
            if (word.includes("-")) {
                const num1 = rounder(+word.replace("PLN", "").split("-")[0] * value)
                const num2 = rounder(+word.replace("PLN", "").split("-")[1] * value)
                result = [...result, `${num1}-${num2}грн`]
            } else {
                const newNum = rounder(+word.replace("PLN", "") * value)
                result = [...result, `${newNum}грн`]
            }
            const plus = currency.find(el => el === "+")
            if (plus) {
                result = [...result, "+ вес"]
            }
        } else if (word.includes("TL") && currency.find(el => el.includes("tl"))) {
            const value = +(currency.find(el => el.includes("tl")).replace("tl", ""))
            if (word.includes("-")) {
                const num1 = rounder(+word.replace("TL", "").split("-")[0] * value)
                const num2 = rounder(+word.replace("TL", "").split("-")[1] * value)
                result = [...result, `${num1}-${num2}грн`]
            } else {
                const newNum = rounder(+word.replace("TL", "") * value)
                result = [...result, `${newNum}грн`]
            }
            const plus = currency.find(el => el === "+")
            if (plus) {
                result = [...result, "+ вес"]
            }
        } else if (word.includes("CZK") && currency.find(el => el.includes("czk"))) {
            const value = +(currency.find(el => el.includes("czk")).replace("czk", ""))
            if (word.includes("-")) {
                const num1 = rounder(+word.replace("CZK", "").split("-")[0] * value)
                const num2 = rounder(+word.replace("CZK", "").split("-")[1] * value)
                result = [...result, `${num1}-${num2}грн`]
            } else {
                const newNum = rounder(+word.replace("CZK", "") * value)
                result = [...result, `${newNum}грн`]
            }
            const plus = currency.find(el => el === "+")
            if (plus) {
                result = [...result, "+ вес"]
            }
        } else {
            result = [...result, word]
        }
    }

    return result.join(" ")
}

let telebotGroups2 = new Set()
const counterAccounts = new Set()

counterbot.on("message", async (msg) => {

    if (msg.text === "14172") {
        counterAccounts.add(msg.from.id)
        counterbot.sendMessage(msg.from.id, "Авторизация успешна!")
    }
    const accounts = Array.from(counterAccounts)
    const account = accounts.find(el => el === msg.from.id)

    if (account) {
        if (msg.text && isCurr && msg.text.includes("curr ")) {
            currency = msg.text.replace("curr ", "").split(" ")
        }
        if (msg.text === "/start") {
            counterbot.sendMessage(msg.chat.id, "Здравствуйте, введите необходимые данные", {
                "reply_markup": {
                    "keyboard": [["/Очистить группы"], ["/Валюта"], ["/Сообщения"], ["/Удалить", "/Отправить"]]
                }
            })
        } else if (msg.text === "/Очистить группы") {
            telebotGroups2 = new Set()
            counterbot.sendMessage(msg.chat.id, "Все группы были удалены!")
        } else if (msg.text === "/Удалить") {
            counterbotMessages = []
            counterbot.sendMessage(msg.chat.id, "Все сообщения были удалены!")
        } else if (msg.text === "/Валюта") {
            isCurr = true
        } else if (msg.text === "/Сообщения") {
            isCurr = false
        } else if (msg.text === "/Отправить") {
            if (!isCurr) {
                const groups = Array.from(telebotGroups2)

                for (let i = 0; i < groups.length; i++) {
                    const group = groups[i]
                    for (let j = 0; j < counterbotMessages.length; j++) {
                        const message = counterbotMessages[j]
                        if (j % 19 === 0 && j !== 0) {
                            await sleep(60000)
                        }
                        if (message instanceof TextMessage && !message.text.includes(".gif")) {
                            await counterbot.sendMessage(group, textCounterByCurrency(message.text))
                        } else if (message instanceof PictureMessage) {
                            message.text ? await counterbot.sendPhoto(group, message.url, { caption: textCounterByCurrency(message.text) }) : await counterbot.sendPhoto(group, message.url)
                        } else if (message instanceof VideoMessage) {
                            message.text ? await counterbot.sendVideo(group, message.url, { caption: textCounterByCurrency(message.text) }) : await counterbot.sendVideo(group, message.url)
                        } else if (message instanceof TextMessage && message.text.includes(".gif")) {
                            await counterbot.sendAnimation(group, message.text)
                        } else if (message instanceof FileMessage) {
                            download(message.url, message.filename, async () => {
                                await counterbot.sendAnimation(group, `./files/${message.filename}`)
                                try {
                                    fs.unlinkSync(`./files/${message.filename}`)
                                } catch (err) {
                                    console.log(err)
                                }
                            })
                        }
                    }
                }
            }
        }
    }

    
})

counterbot.on("channel_post", msg => {
        if (msg.text === "/active") {
            telebotGroups2.add(msg.chat.id)
        }
        if (msg.text && msg.text === '/inactive') {
            telebotGroups2.delete(msg.chat.id)
        }
    })

// ----------------------------- VIBER BOT -------------------------------------

function say(response, message) {
    response.send(new TextMessage(message));
}

function checkUrlAvailability(botResponse, text_received) {
    let sender_name = botResponse.userProfile.name;
    let sender_id = botResponse.userProfile.id;


    if (text_received === '') {
        say(botResponse, 'I need a Text to check');
        return;
    }

    // say(botResponse, 'One second...Let me check!');
    // setTimeout(function() {
    //     say(botResponse, 'Here comes the answer :P!');
    // }, 1000);

    let message;
    if (text_received === 'text') {
        // ================================
        // TextMessage object
        // ================================
        message = new TextMessage('hello world');
    }
    else if (text_received === 'url') {
        // ================================
        // Url Message object
        // ================================
        let url = "https://google.com"
        message = new UrlMessage(url);
    }
    else if (text_received === 'contact') {
        // ================================
        // Contact Message object
        // ================================
        let contactName = "Ko Ko";
        let contactPhoneNumber = "09420084765";
        message = new ContactMessage(contactName, contactPhoneNumber);
    }
    else if (text_received === 'picture') {
        // ================================
        // Picture Message object
        // ================================
        let url = "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png";
        message = new PictureMessage(url);
    }
    else if (text_received === 'video') {
        // ================================
        // Video Message object
        // ================================
        let url = "https://file-examples-com.github.io/uploads/2017/04/file_example_MP4_480_1_5MG.mp4";
        let size = 1;
        message = new VideoMessage(url, size);
    }
    else if (text_received === 'location') {
        // ================================
        // Location Message object
        // ================================
        let latitude = '16.7985897';
        let longitude = '96.1473162';
        message = new LocationMessage(latitude, longitude);
    }
    else if (text_received === 'sticker') {
        // ================================
        // Sticker Message object
        // https://developers.viber.com/docs/tools/sticker-ids/
        // ================================
        let stickerId = '40133';
        message = new StickerMessage(stickerId);
    }
    else if (text_received === 'file') {
        // ================================
        // File Message object
        // ================================
        let url = 'https://file-examples-com.github.io/uploads/2017/10/file-sample_150kB.pdf';
        let sizeInBytes = '102400';
        let filename = 'FileMessageTest.pdf';
        message = new FileMessage(url, sizeInBytes, filename);
    }
    else if (text_received === 'rich_media') {
        // ================================
        // RichMedia Message object
        // ================================
        const SAMPLE_RICH_MEDIA = {
            "ButtonsGroupColumns": 6,
            "ButtonsGroupRows": 5,
            "BgColor": "#FFFFFF",
            "Buttons": [{
                "ActionBody": "https://www.google.com",
                "ActionType": "open-url",
                "BgMediaType": "picture",
                "Image": "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png",
                "BgColor": "#000000",
                "TextOpacity": 60,
                "Rows": 4,
                "Columns": 6
            }, {
                "ActionBody": "https://www.facebook.com",
                "ActionType": "open-url",
                "BgColor": "#85bb65",
                "Text": "Buy",
                "TextOpacity": 60,
                "Rows": 1,
                "Columns": 6
            }]
        };
        message = new RichMediaMessage(SAMPLE_RICH_MEDIA);
    }
    else if (text_received === 'keyboard') {
        // ================================
        // Keyboard Message object
        // ================================
        const SAMPLE_KEYBOARD = {
            "Type": "keyboard",
            "Revision": 1,
            "Buttons": [
                {
                    "Columns": 3,
                    "Rows": 2,
                    "BgColor": "#e6f5ff",
                    "BgMedia": "http://www.jqueryscript.net/images/Simplest-Responsive-jQuery-Image-Lightbox-Plugin-simple-lightbox.jpg",
                    "BgMediaType": "picture",
                    "BgLoop": true,
                    "ActionType": "reply",
                    "ActionBody": "Yes"
                }
            ]
        };
        message = new KeyboardMessage(SAMPLE_KEYBOARD);
    }
    else {
        message = new TextMessage("Hi!" + sender_name + " (" + sender_id + ")");
    }

    console.log(message);
    botResponse.send(message);
}

const bot = new ViberBot({
    authToken: process.env.ACCESS_TOKEN,
    name: "Viber Resender JS",
    avatar: "https://dl-media.viber.com/1/share/2/long/vibes/icon/image/0x0/7f1b/b3974aafe25ae5ad2e2e68496e30eec4fe978ecb3eadc19d168f2ae46d077f1b.jpg" // It is recommended to be 720x720, and no more than 100kb.
});

// The user will get those messages on first registration
bot.onSubscribe(response => {
    say(response, `Hi there ${response.userProfile.name}. I am ${bot.name}! Feel free to ask me if a web site is down for everyone or just you. Just send me a name of a website and I'll do the rest!`);
});


let vibermessages = []

let choice = 1

const path = require("path")

// Perfect! Now here's the key part:
bot.on(BotEvents.MESSAGE_RECEIVED, async (message, response) => {
    // response.send(new VideoMessage(message.url, message.size))
    // download(message.url, 'file.mp4', () => {console.log("done")})
    // console.log(message)
    // response.send(new UrlMessage(message.url, 98615))
    // response.send(new VideoMessage("https://web.telegram.org/b81076b1-3f3a-4c44-8958-389106481715", 11707))
    console.log(message)
        
    if (message instanceof TextMessage && message.text === "V1") {
        choice = 1
        say(response, "Вайбер - Пересылка")
    } else if (message instanceof TextMessage && message.text.includes("/curr")) {
        currency = message.text.replace("/curr ", "").split(" ")
        say(response, "Вы указали валюту в вайбере")
    } else if (message instanceof TextMessage && message.text === "V2") {
        choice = 2
        say(response, "Вайбер - Валюта")
    } else if (message instanceof TextMessage && message.text === "V3") {
        choice = 3
        say(response, "Вайбер - Вайбер")
    } else if (message instanceof TextMessage && message.text === "V4") {
        choice = 4
        say(response, "Вайбер - Вайбер / Вайбер - Валюта")
    } else if (message instanceof TextMessage && message.text === "VC") {
        vibermessages = []
        say(response, "Бот удалил все вайбер сообщения")
    } else if (message instanceof TextMessage && message.text === "Команды") {
        vibermessages = []
        say(response, "V1 - отправить сообщения в тг бот пересылку\nV2 - отправить сообщения в тг бот валюту\nV3 - обработать сообщения в вайбере\nVC - удалить сообщения в вайбере\nVS - начать обработку сообщения в вайбере\n/curr - прописать валюту в вайбере (пример: /curr usd100.00 eur10.00 tl14.00 czk23.00 +)")
    } else if (message instanceof TextMessage && message.text === "VS") {
        console.log("TEST")
        for (let i = 0; i < vibermessages.length; i++) {
            const m = vibermessages[i]
            if (!(m instanceof VideoMessage)) {
                if (m.text && m.text.length > 777 && m instanceof PictureMessage) {
                    await response.send(new PictureMessage(m.url))
                    await response.send(new TextMessage(textCounterByCurrency(m.text)))
                } else if (m.text && m instanceof PictureMessage) {
                    await response.send(new PictureMessage(m.url, textCounterByCurrency(m.text)))
                } else if (m.text && m instanceof TextMessage) {
                    console.log(textCounterByCurrency(m.text))
                    await response.send(new TextMessage(textCounterByCurrency(m.text)))
                } else if (m instanceof FileMessage) {
                    download(m.url, m.filename, async () => {
                        const fullPath = path.resolve(`./files/${m.filename}`)
                        await response.send(new UrlMessage(fullPath))
                    })
                } else {
                    await response.send(m)
                }
            } else {
                if (m.text) {
                    await response.send(new VideoMessage(m.url, m.size, textCounterByCurrency(m.text)))
                } else {
                    await response.send(new VideoMessage(m.url, m.size))
                }
            }
        }
    } else {
        if (choice === 1) {
            telebotMessages = [...telebotMessages, message]
        } else if (choice === 2) {
            counterbotMessages = [...counterbotMessages, message]
        } else if (choice === 3) {
            vibermessages = [...vibermessages, message]
        } else if (choice === 4) {
            counterbotMessages = [...counterbotMessages, message]
            vibermessages = [...vibermessages, message]
        }
    }
});


bot.getBotProfile().then(response => console.log(`Bot Named: ${response.name}`));
// Server
if (process.env.NOW_URL || process.env.HEROKU_URL) {
    const http = require('http');
    const port = process.env.PORT || 5000;

    http.createServer(bot.middleware()).listen(port, () => bot.setWebhook(process.env.NOW_URL || process.env.HEROKU_URL));
} else {
    return ngrok.getPublicUrl().then(publicUrl => {
        const http = require('http');
        const port = process.env.PORT || 5000;

        console.log('publicUrl => ', publicUrl);

        http.createServer(bot.middleware()).listen(port, () => bot.setWebhook(publicUrl));

    }).catch(error => {
        console.log('Can not connect to ngrok server. Is it running?');
        console.error(error);
        process.exit(1);
    });
}

