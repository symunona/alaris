/**
 * New node file
 */

var fs = require('fs');
var path = require('path');
var db = require('../lib/db');

exports.stat = function(req, res){
	
  var query = "select year(date) as Y, month(date) as M, concat(year(date) ,'-', month(date)) as YM, count(id) as cnt, top from blog group by year(date),month(date), top;"
  var ret = api.processentries({});
  
  db.query(query).done(function(data){
  	ret.statdata = data[0];
  	res.render('stat',  ret);
  })
  
  
}; 


exports.content = function(req, res){
	
 var dir = module.parent.filename.replace(/\\/g,'/');
 dir = dir.slice(0,dir.lastIndexOf("/")) +"/public/content";
	
	fs.readdir(dir, function (err, files) {
		if (!files) {
			res.send(err);
			return 0;
		}		
	    res.send(files.map(function (file) {
	        return {file: file, path: path.join(dir, file)};
	    }).filter(function (file) {
	        return fs.statSync(file.path).isFile();
	    }).map(function (file) {
	    	var data = fs.statSync(file.path);
	    	data.filename = file.file;
	    	data.path=file.path
	    	return data;

	    }).sort(function(a,b){
	    	if (a.ctime > b.ctime) return -1;
	    	if (a.ctime < b.ctime) return 1;
	    	return 0;
	    }));
	    
	});
	
};

exports.toggleTop = function(req, res) {
	let entry = db.getById('blog', parseInt(req.params.id))
	entry.top = !entry.top
	db.persist()	
	res.send(entry)
};

exports.saveEntry = function (req, res) {	
	res.send(db.saveOrUpdate('blog', req.body))
}

exports.deleteTag = function (req, res) {	
	res.send(db.deleteItem('tags', req.params.id))
}

exports.saveTag = function (req, res) {	
	res.send(db.saveOrUpdate('tags', req.body))
}
