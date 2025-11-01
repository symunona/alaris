/**
 * Alaris engine v.4
 */

const path = require('path')
const express = require('express')
    , routes = require('./routes')
    , admin = require('./routes/admin')
    , grader = require('./routes/grader')
    , http = require('http')
    , config = require('./config.json')
    , basicAuth = require('express-basic-auth')
    , multer = require('multer')


var app = express()

console.log('starting server... ', process.env.PORT)

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.set('port', process.env.PORT || 3000)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

if (config.debug) {
    console.warn('[DEBUG] Less compile on.')
}
app.use(express.static(path.join(__dirname, 'public')));

var auth = basicAuth({
    users: config.admin.users,
    challenge: true
});

app.get('/', routes.index);

app.get('/api/part', routes.part);
app.post('/api/top/:id', auth, admin.toggleTop);
app.get('/api/partAll', auth, routes.partAll);
app.get('/api/id/:id', auth, routes.getById);
app.get('/api/rnd', auth, routes.getRandom);
app.get('/api/db', auth, admin.dump);
app.get('/api/list', auth, admin.tags);
app.get('/api/tags', auth, admin.tags)
app.get('/api/tag/posts/:id', auth, admin.tagPosts)

//app.get('/users', user.list);
app.get('/stat', auth, admin.stat);
app.get('/all', auth, routes.all);
app.get('/weeks', admin.weeks);
app.get('/grader', auth, grader.grader);
app.get('/:offset', routes.index);
app.get('/id/:id', routes.index);

app.post('/api/entry/save', auth, admin.saveEntry);

app.delete('/api/tag/delete/:id', auth, admin.deleteTag);
app.post('/api/tag/save', auth, admin.saveTag);
app.get('/api/content', auth, admin.content);

// Events API
app.get('/api/events', auth, admin.events);
app.post('/api/event/save', auth, admin.saveEvent);
app.delete('/api/event/delete/:id', auth, admin.deleteEvent);

let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'public', 'content'))
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

app.post('/api/upload', auth, multer({ dest: path.join(__dirname, 'public', 'content', 'tmp'), storage: storage }).single('file'), function(req, res){
    res.send('ok');
});

// 404 handler
app.use(function (req, res) {
    res.status(404).send('Not Found');
});

// Error handler
app.use(function (err, req, res, next) {
    console.error('[ERROR]', err);
    var status = err.status || 500;
    res.status(status).json({ error: err.message || 'Internal Server Error' });
});

http.createServer(app).listen(app.get('port'), function () {
    console.log('Alaris server listening on port ' + app.get('port'));
});
