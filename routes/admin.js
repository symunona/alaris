/**
 * New node file
 */

var api = require('./api');
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

exports.admin = function(req, res){
	
 var path = module.parent.filename.replace(/\\/g,'/');
 path = path.slice(0,path.lastIndexOf("/")) +"/public/content";
	
  var dirlist = fs.readdirSync(path)
  
  res.render('admin', { 
	  title: 'admin screen', 
      
  });
};

exports.mobile = function(req, res){  
  res.render('mobile', { 
	  title: 'mobile screen'      
  });
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

exports.getEntriesIntf = function(req, res) {

	var ctrl = {
		offset: parseInt(req.query.offset) || 0,
		limit: parseInt(req.query.limit) || 10,
		id: req.query.id,
		callback: function(renderobj){
//			console.log('query result',renderobj)
			res.send(renderobj);			
		}
	}
//	console.log('admin:',req.query, req.params);
	api.getAllEntries(ctrl);
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
