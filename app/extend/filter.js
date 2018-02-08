exports.leftpad = (int, max, pad = "0") => {
    max = max.toString();
    pad = max.replace(/\d/g, pad);

    return (pad + int).substr(pad.length * -1);
};
