

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
var fs = require('fs');
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
	req.body.startdate = req.body.startdate?moment(req.body.startdate).format("YYYY-MM-DD HH:mm:ss"):null;
	req.body.enddate = req.body.enddate?moment(req.body.enddate).format("YYYY-MM-DD HH:mm:ss"):null;
	exports.saveOrUpdate(req.body, 'tags', function(scs){
		res.send(req.body);
	});
};

exports.saveEntry = function(req, res) {
	if (!req.body.id)
		req.body.date = moment().format("YYYY-MM-DD HH:mm:ss");
	exports.saveOrUpdate(req.body, 'blog', function(scs){
		res.send(req.body);
	});
};

exports.toggletop = function(id, oldval, cb){
//	console.log('top called with: ',id,oldval);
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
		db.select('id').order_by('id desc').limit(1).get(table,function(err,el){							
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

exports.upload = function(req, res, app) {
    // get the temporary location of the file
//	console.log(req.files);
    var tmp_path = req.files.file.path;
    
    // set where the file should actually exists - in this case it is in the "images" directory
    
	 var path = module.parent.filename.replace(/\\/g,'/');
	 path = path.slice(0,path.lastIndexOf("/")) +"/../public/content/";
    
    var target_path = path + req.files.file.name;
    if (module.parent.filename.indexOf('\\')>-1)
    	target_path = target_path.replace(/\//g,'\\');
    console.log('tmppath',tmp_path,target_path);
    debugger;
    try{
    // move the file from the temporary location to the intended location
    fs.rename(tmp_path, target_path, function(err) {
        if (err) throw err;
        // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
        fs.unlink(tmp_path, function() {
            if (err) throw err;
            res.send('File uploaded to: ' + target_path + ' - ' + req.files.file.size + ' bytes');
        });
    });
    }
    catch(e)
    {
    	res.send({'upload error':e.message});
    }
}

