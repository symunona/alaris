
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')  
  , admin = require('./routes/admin')
  , api = require('./routes/api')
  , grader = require('./routes/grader')
  , http = require('http')
  , path = require('path')
  , config = require('./config.json')
  , bodyParser = require('body-parser')
  , basicAuth = require('express-basic-auth')
  



var app = express()

console.log('starting server... ', process.env.PORT)

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.set('port', process.env.PORT || 3000)
app.set('views', __dirname + '/views')
app.set('view engine', 'jade')

if (config.debug) {
	console.warn('[DEBUG] Less compile on.')
	// app.use(require('less-middleware')('public'));
}
app.use(express.static('public'));
app.use(express.static('node_modules'));




// auth
// app
// .use(express.cookieParser('mypersonalcookieparserwithahorseandabatterystaple'))
// .use(express.session())
// .use(everyauth.middleware(app));

// development only
// if ('development' == app.get('env')) {
//   app.use(express.errorHandler());
// }

function wheretogoroot(req,res)
{
	console.log(req)
	if (req.params.offset == config.admin.url)
		admin.admin(req,res);
	else if (req.params.offset == 'all')
		routes.all(req,res);
	else if (req.params.offset == 'grader')
		routes.grader(req,res);
	else
		routes.index(req,res);
}

//Synchronous Function

var auth = basicAuth({
	users: config.admin.users,
	challenge: true
});

app.get('/', routes.index);

app.get('/api/part', routes.part);
app.post('/api/top/:id', auth, admin.toggleTop);
app.get('/api/partAll', auth, routes.partAll);

//app.get('/users', user.list);
app.get('/x', auth, admin.admin);
app.get('/m', auth, admin.mobile);
app.get('/stat', auth, admin.stat);
app.get('/all', auth, routes.all);
app.get('/grader', auth, grader.grader);
app.get('/:offset', routes.index);
app.get('/id/:id', routes.index);

app.post('/api/entry/save', auth, admin.saveEntry);

app.post('/api/tag/save', auth, admin.saveTag);

app.get('/api/content', admin.content);
app.post('/api/uploadfile',function(req,res){
	api.upload(req,res,app);
});

var entries;


// app.use(express.logger('dev'));

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

