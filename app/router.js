module.exports = app => {
    app.get('/join/group', 'home.join');
    app.get('/login', 'admin.index');
    app.post('/login', 'admin.login');
    app.get('/logout', 'admin.logout');

    app.get('/admin', 'admin.admin');
    app.post('/api/update', 'admin.update');
    app.post('/api/upload', 'admin.upload');
};
