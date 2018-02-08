module.exports = (options, app) => {
  return async function(ctx, next) {
    await next();
    // 如果`Session`是空的，则不保存
    if (!ctx.session.admin) {
        return;
    }

    // 延长用户`Session`有效期
    ctx.session.save();
  };
};
