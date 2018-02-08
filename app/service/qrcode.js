module.exports = app => {
    const conf = app.config;
    const redis = app.redis;

    const upper = conf.upperLimit;
    const prefix = conf.prefix;
    const headKey = "QRCODE:LIST:HEAD";
    const listKey = "QRCODE:LIST";

    const EMPTY = -1;
    const FULLY = -2;

    function toInt(v) {
        try {
            v = parseInt(v) || 0;
        } catch(err) {
            v = 0;
        }
        return v;
    }

    function toCount(index, item) {
        return Promise.all([
            redis.get(`${prefix}:OPEN:${index}`).then(toInt),
            redis.get(`${prefix}:JOIN:${index}`).then(toInt),
            redis.get(`${prefix}:FLEX:${index}`).then(toInt).then(v => Math.max(v, upper))
        ]).then(count => {
            let [ open, joined, flex ] = count;
            return Object.assign(item, {
                open: open,
                joined: joined,
                flex: flex
            });
        });
    }

    class Qrcode extends app.Service {
        async getIndex() {
            let head = await redis.get(headKey).then(toInt);
            let { index } = await this.verify(head, true);

            return index;
        }

        async getValue(idx, isNewUser) {
            let { index, float } = await this.verify(idx, isNewUser);
            if (index < 0) {
                return {
                    index: index
                };
            }

            if (isNewUser) {
                index = await this.count(index, float);
            }

            return redis.lindex(listKey, index).then(ret => {
                return Object.assign({
                    index: index
                }, JSON.parse(ret));
            });
        }

        async verify(idx, isNewUser) {
            let [ open, joined, float, len, index ] = await Promise.all([
                redis.get(`${prefix}:OPEN:${idx}`).then(toInt),
                redis.get(`${prefix}:JOIN:${idx}`).then(toInt),
                redis.get(`${prefix}:FLEX:${idx}`).then(toInt).then(v => Math.max(v, upper)),
                redis.llen(listKey).then(v => v || 0),
                idx
            ]);

            if (len === 0) {
                index = EMPTY;
            }
            else if (index >= len) {
                index = FULLY;
            }
            else if (isNewUser && (open >= float || joined >= upper)) {
                index += 1;
                await redis.set(headKey, index);
            }

            return {
                index: index,
                float: float
            };
        }

        async count(index, limit) {
            let open = await redis.incr(`${prefix}:OPEN:${index}`);
            if (open > limit) {
                await redis.set(headKey, index + 1);
            }
            return index;
        }

        async getList(start = 0, stop = -1) {
            return {
                llen: await redis.llen(listKey),
                head: await redis.get(headKey).then(toInt).then(v => {
                    return redis.lindex(listKey, v);
                }).then(item => {
                    return JSON.parse(item);
                }),
                data: await redis.lrange(listKey, start, stop).then(list => {
                    return Promise.all(list.map((item, idx) => {
                        return toCount(idx, JSON.parse(item));
                    }));
                })
            };
        }

        async push(qrcode) {
            return redis.rpush(listKey, JSON.stringify(qrcode));
        }
    }

    return Qrcode;
};
