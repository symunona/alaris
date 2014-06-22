
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , admin = require('./routes/admin')
  , api = require('./routes/api')
  , http = require('http')
  , path = require('path')
  , config = require('../config.json')
  
  ;



var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
//app.use(require('less-middleware')({ src: __dirname + '/public' }));
app.use(express.static(path.join(__dirname, 'public')));



// auth
//app
//.use(express.cookieParser('mypersonalcookieparserwithahorseandabatterystaple'))
//.use(express.session())
//.use(everyauth.middleware(app));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

function wheretogoroot(req,res)
{
	if (req.params.offset == config.admin.url)
		admin.admin(req,res);
	else if (req.params.offset == 'all')
		routes.all(req,res);
	else
		routes.index(req,res);
}

//Synchronous Function
var auth = express.basicAuth(function(user, pass) {
 return user === config.admin.user && pass === config.admin.pass;
});

app.get('/:offset', wheretogoroot);
app.get('/', routes.index);
app.get('/api/part', routes.part);
app.post('/api/top', admin.toggletop);
app.get('/api/partAll', routes.partAll);
app.get('/api/eras', routes.getErasIntf);
app.get('/users', user.list);
app.get('/x', auth, admin.admin);
app.get('/api/entries', admin.getEntriesIntf);
app.post('/api/saveEntry', api.saveEntry);
app.post('/api/saveTag', api.saveTag);
app.get('/api/searchTags', api.searchTags);
app.get('/api/tags', api.getTags);
app.get('/api/deletedEntries', api.deletedEntries);

var entries;

app.get('/entry', user.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

