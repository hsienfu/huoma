const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const jsqr = require('jsqr');

// let image = sharp().metadata().then(function (raw) {
//     console.log(raw);
// });

let url = path.resolve('app/public/qrcode/37.png');
let qrcode = sharp(url);

Promise.all([
    qrcode.metadata(),
    qrcode.resize(396, 574).raw().toBuffer()
]).then(data => {
    let [ meta, buffer ] = data;
    return jsqr(buffer, meta.width - 1, meta.height);
}).then(qrtext => {
    console.log(qrtext);
}).catch(err => {
    console.error(err);
});


// fs.readFile(url, function (err, buffer) {
//     console.log(Buffer.isBuffer(buffer));
//     console.log(new Uint8ClampedArray(buffer).length);
// });
// fs.createReadStream(path.resolve('app/public/qrcode/31.png')).pipe(image);
