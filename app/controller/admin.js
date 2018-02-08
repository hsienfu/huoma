const moment = require('moment');

module.exports = app => {
    const conf = app.config;
    const redis = app.redis;

    const INDEX_PATH = '/admin';
    const ENTRY_PATH = '/login';

    class Admin extends app.Controller {
        async index(ctx) {
            if (ctx.session.admin) {
                ctx.redirect(INDEX_PATH);
                return;
            }

            return await ctx.render('login');
        }

        async login(ctx) {
            if (ctx.session.admin) {
                ctx.body = {
                    code: 100,
                    url: INDEX_PATH
                };
                return;
            }

            try {
                ctx.validate({
                    username: { type: 'string', max: 10 },
                    password: { type: 'string', max: 20 }
                });
            } catch (err) {
                ctx.body = {
                    code: 101,
                    message: 'input error'
                };
                return;
            }

            // username: uname
            // ADMINISTRATOR:uname "hello world"
            let { username, password } = ctx.request.body;
            let admin = await redis.get(`ADMINISTRATOR:${username}`).then(pwd => {
                return pwd && pwd === password && username;
            });

            if (!admin) {
                ctx.body = {
                    code: 101,
                    message: 'input error'
                };
                return;
            }

            // session
            ctx.session.admin = admin;

            return ctx.body = {
                code: 100,
                url: INDEX_PATH
            };
        }

        async logout(ctx) {
            if (ctx.session.admin) {
                ctx.session.admin = null;
            }

            ctx.redirect(ENTRY_PATH);
        }

        // 生成二维码
        async push(ctx) {
            if (!await redis.exists('QRCODE:LIST')) {
                for (let i = 31; i < 81; i++) {
                    await ctx.service.qrcode.push({
                        "name": `${conf.qrcodeTitle}${i}群`,
                        "url": `/public/qrcode/${i}.png`
                    });
                }
            }

            ctx.body = {
                code: 100
            };
        }

        async admin(ctx) {
            return await ctx.render("admin", await ctx.service.qrcode.getList());
        }

        async update(ctx) {
            try {
                ctx.validate({
                    index: 'int',
                    join: 'int',
                    flex: 'int'
                });
            } catch(err) {
                ctx.body = {
                    code: 101,
                    message: "输入数据类型错误"
                };
                return;
            }

            let { index, join, flex } = ctx.request.body;
            join = parseInt(join);
            flex = parseInt(flex);


            let k1 = join ? redis.set(`${conf.prefix}:JOIN:${index}`, join) : Promise.resolve();
            let k2 = flex ? redis.set(`${conf.prefix}:FLEX:${index}`, flex) : Promise.resolve();

            try {
                await k1;
                await k2;

                ctx.body = {
                    code: 100
                };
            } catch(err) {
                ctx.body = {
                    code: 102,
                    message: "服务器出错，稍候重试"
                };
            }
        }
    }

    return Admin;
};
