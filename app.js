/**
 * Alaris engine v.4
 */

var express = require('express')
	, routes = require('./routes')
	, admin = require('./routes/admin')
	, grader = require('./routes/grader')
	, http = require('http')
	, config = require('./config.json')
	, bodyParser = require('body-parser')
	, basicAuth = require('express-basic-auth')
	, multer = require('multer')


var app = express()

console.log('starting server... ', process.env.PORT)

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.set('port', process.env.PORT || 3000)
app.set('views', __dirname + '/views')
app.set('view engine', 'jade')

if (config.debug) {
	console.warn('[DEBUG] Less compile on.')
}
app.use(express.static('public'));
app.use(express.static('node_modules'));

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

//app.get('/users', user.list);
app.get('/stat', auth, admin.stat);
app.get('/all', auth, routes.all);
app.get('/grader', auth, grader.grader);
app.get('/:offset', routes.index);
app.get('/id/:id', routes.index);

app.post('/api/entry/save', auth, admin.saveEntry);

app.delete('/api/tag/delete', auth, admin.deleteTag);

app.post('/api/tag/save', auth, admin.saveTag);

app.get('/api/content', auth, admin.content);

let storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, './public/content')
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname)
	}
})

app.post('/api/upload', auth, multer({ dest: './public/content/tmp', storage: storage }).single('file'), function(req, res){
	res.send('ok');
});

http.createServer(app).listen(app.get('port'), function () {
	console.log('Alaris server listening on port ' + app.get('port'));
});

