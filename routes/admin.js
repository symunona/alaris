/**
 * New node file
 */

var api = require('./api');
var fs = require('fs');
var path = require('path');


exports.admin = function(req, res){
	
 var path = module.parent.filename.replace(/\\/g,'/');
 path = path.slice(0,path.lastIndexOf("/")) +"/public/content";
	
  var dirlist = fs.readdirSync(path)
  
  res.render('admin', { 
	  title: 'admin screen', 
      
  });
};

exports.content = function(req, res){
	
 var dir = module.parent.filename.replace(/\\/g,'/');
 dir = dir.slice(0,dir.lastIndexOf("/")) +"/public/content";
	
	fs.readdir(dir, function (err, files) {

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

exports.saveEntry = function(req,res){
	res.send("respond with a resource 2");
}

exports.getEntriesIntf = function(req, res) {

	var ctrl = {
		offset: parseInt(req.query.offset) || 0,
		limit: parseInt(req.query.limit) || 10,
		
		callback: function(renderobj){
//			console.log('query result',renderobj)
			res.send(renderobj);			
		}
	}
//	console.log('admin:',req.query, req.params);
	api.getAllEntries(ctrl);
};

exports.toggletop = function(req, res) {

	api.toggletop(req.body.id, req.body.top,function(data){
		res.send(data);
	})
};