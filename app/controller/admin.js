const moment = require('moment');
const fs = require('fs');
const path = require('path');
const awaitWriteStream = require('await-stream-ready').write;
const sendToWormhole = require('stream-wormhole');

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

        // 上传图片
        async upload(ctx) {
            let parts = this.ctx.multipart({
                autoFields: true
            });
            let stream;

            while ((stream = await parts()) != null) {
                const filename = stream.filename.toLowerCase();
                const extname = path.extname(filename);
                const basename = path.basename(filename, extname);
                const rename = moment().format('x') + "-" + filename;
                const target = path.join(app.baseDir, 'app/public/qrcode', rename);

                const name = `${conf.qrcodeTitle}${basename}群`;
                const url = path.join('/public/qrcode', rename);

                const writeStream = fs.createWriteStream(target);
                try {
                    await awaitWriteStream(stream.pipe(writeStream));
                    await ctx.service.qrcode.push({
                        "name": name,
                        "url": url
                    });
                } catch (err) {
                    await sendToWormhole(stream);
                }
            }

            ctx.redirect(INDEX_PATH);
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
