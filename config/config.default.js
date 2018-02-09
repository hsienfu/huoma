const path = require('path');

module.exports = appInfo => {
    return {
        keys: "asV!QSPcD#M6,QQHPct#@qBa3",
        session: {
            key: "sessid",
            maxAge: 24 * 3600 * 1000
        },
        logger: {
            dir: path.join(appInfo.baseDir, "logs", appInfo.name)
        },
        security: {
            csrf: {
                enable: false
            }
        },
        middleware: [ "errorHandler", "saveSession", "isAuthenticated" ],
        isAuthenticated: {
            ignore: /^\/$|logout|login|join/
        },
        multipart: {
            fileSize: "100kb",
            whitelist: [
                ".png",
                ".jpg"
            ]
        },
        redis: {
            client: {
                host: "127.0.0.1",
                port: 6379,
                password: null,
                db: 8
            }
        },
        view: {
            defaultViewEngine: "nunjucks",
            defaultExtension: ".nj"
        },
        prefix: "GROUP:QRCODE",
        upperLimit: 100,
        qrcodeTitle: "测试"
    };
};
