const { createProxyMiddleware } = require('http-proxy-middleware');
module.exports = function(app) {
    app.use(
        // we will use this /api to 代理 this website to gain data
        '/api',
        createProxyMiddleware({
            // redirect to this website
            target: 'https://api.n2yo.com',
            changeOrigin: true,
        })
    );
};
