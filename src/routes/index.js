const homeRouter=require('./home');
const phimleRouter=require('./phimle');
const phimboRouter=require('./phimbo');
const phimmoiRouter=require('./phimmoi');
function route(app) {
    // Home route
    app.use('/',homeRouter);
    app.use('/phim-le',phimleRouter);
    app.use('/phim-bo',phimboRouter);
    app.use('/phim-moi',phimmoiRouter);  
}

module.exports = route;
