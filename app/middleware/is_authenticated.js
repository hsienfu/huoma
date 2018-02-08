module.exports = (options, app) => {
    return async function(ctx, next) {
        if (ctx.session.admin) {
            return await next();
        }

        // Ajax Request
        if (ctx.get("x-requested-with") === "XMLHttpRequest") {
            ctx.body = {
                code: 0,
                url: '/login'
            };
            return;
        };

        ctx.redirect("/login");
    };
};
