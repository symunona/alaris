

// var server = new Server('localhost', 27017, { auto_reconnect: true }),
// alaris = new Db('alaris', server);
//
// alaris.open(function (err, db) {
// if (!err) {
// console.log("Database connection established");
// if (err) {
// console.log("DB error blipp");
// }
// });

var moment = require('moment');
var config = require('../config.json');

var Db = require('mysql-activerecord');
var db = new Db.Adapter({
    server: config.db.server,
    username: config.db.user,
    password: config.db.pass,
    database: config.db.database
});

exports.getEntries = function(ctrl) {
	var selector = db.select('*')
		.limit(ctrl.limit,ctrl.offset)
		.order_by('date desc')
		.where('topic = 0 ')
	if (ctrl.offset>0)
		selector = selector.where('top = 1');
	
	selector.get('blog',function(err,rows,fields){		
			db.count('blog',function(err,c,fields){
				ctrl.entries = rows;
				ctrl.max = c;
				ctrl.count = rows?rows.length:0;
				ctrl.callback(ctrl);	
			});		
	});
};



exports.getAllEntries = function(ctrl) {
	var selector = db.select('*')
		.limit(ctrl.limit,ctrl.offset)
		.order_by('date desc');
	
	selector.get('blog',function(err,rows,fields){		
			db.count('blog',function(err,c,fields){
				ctrl.entries = rows;
				ctrl.max = c;
				ctrl.count = rows?rows.length:0;
				ctrl.callback(ctrl);	
			});		
	});
};


exports.getEras = function(time, cb){
	time = moment(time).format('YYYY-MM-DD');
	var query = "SELECT *, enddate-startdate as dif FROM tags WHERE startdate > ?"
	var dbq = db.select('*, enddate-startdate as dif')
			.where('startdate < "'+ time +'"')
			.where('enddate > "'+ time +'"')
			.order_by('dif asc')
				.get('tags',function(err,out,fields){
					if (err)
						console.error('Error: ',err);
					cb(out);
				});
}




exports.searchTags = function(req, res) {
	
// if (req.query.q.length < 1)
// return;
// var rgxp = '.*'+req.query.q+'.*';
//	
// console.log(rgxp);
// tags.find({
// name : {$regex: rgxp}
//			
// },
// {limit: 10}
//		
// , function(e,docs){
// console.log(docs);
		res.send({msg:'in progress...'});
// })

};



exports.getTags = function(req, res) {
	
	db.select('*').get('tags',
	function(err, docs,fields) {		
		res.send(docs);
	})

};

exports.saveTag = function(req, res) {
	if (!req.body.id)
		req.body.date = moment().format();
	exports.saveOrUpdate(req.body, 'tags', function(scs){
		res.send(req.body);
	});
};

exports.saveEntry = function(req, res) {
	if (!req.body.id)
		req.body.date = moment().format();
	exports.saveOrUpdate(req.body, 'blog', function(scs){
		res.send(req.body);
	});
};

exports.toggletop = function(id, oldval, cb){
	console.log('top called with: ',id,oldval);
	exports.saveOrUpdate({
		id: id,
		top: !oldval
	},'blog',cb);
}

exports.saveOrUpdate = function(entry, table, cb){

	if (entry.id)
	{		
		db.where('id',entry.id).update(table,entry,function(err){
			if (err)
			{
				console.error('[database] panda is sad updating'+table,entry, err);
				if (cb) cb({error: err});
				return;
			}
			if (cb) cb({success: true});
		});
	} else 
	{	
		db.select('id').order_by('id desc').limit(1).get('blog',function(err,el){							
			entry.id = parseInt(el[0].id)+1;		
			db.insert(table,entry,function(err){
					if (err)
					{
						console.error('[database] panda is sad saving '+table,entry, err);					
						if (cb) cb({error: err});
						return;
					}
					if (cb) cb({success: true});
				});
			
		});
	}	
	
};

exports.deletedEntries = function(ctrl) {
	var selector = db.select('*')
	.limit(ctrl.limit,ctrl.offset)
	.order_by('date desc')
	.where('topic = 0 ')
		selector = selector.where('top != 1');

	selector.get('blog',function(err,rows,fields){		
		db.count('blog',function(err,c,fields){
			ctrl.entries = rows;
			ctrl.max = c;
			ctrl.count = rows?rows.length:0;
			ctrl.callback(ctrl);	
		});		
	});
};
