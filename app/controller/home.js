const moment = require('moment');

module.exports = app => {
    const conf = app.config;
    const redis = app.redis;

    class Home extends app.Controller {
        // 扫码
        async join(ctx) {
            let isNewUser = !(ctx.session && ctx.session.qrcode !== undefined);
            let qr = ctx.service.qrcode;
            let index;

            if (conf.env === 'prod' && isNewUser) {
                let max = 5;
                let sec = moment().minute();
                let key = `ATTACK:${ctx.ip}:${sec}`;

                let signal = false;
                let [ a, b ] = await redis.pipeline().get(key).incr(key).expire(key, 60).exec();

                if (a[1] > max || b[1] > max) {
                    return await ctx.render("home", {
                        error: "请求频率过快"
                    });
                }
            }

            if (isNewUser) {
                index = await qr.getIndex();
            }
            else {
                index = ctx.session.qrcode;
            }

            let qrcode = await qr.getValue(index, isNewUser);
            if (isNewUser && qrcode.index >= 0) {
                ctx.session.qrcode = qrcode.index;
            }

            return await ctx.render('home', qrcode);
        }
    }

    return Home;
};
