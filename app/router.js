module.exports = app => {
    app.get('/join/group', 'home.join');
    app.get('/login', 'admin.index');
    app.post('/login', 'admin.login');
    app.get('/logout', 'admin.logout');

    app.get('/admin', 'admin.admin');
    app.put('/api/push', 'admin.push');
    app.post('/api/update', 'admin.update');
};
