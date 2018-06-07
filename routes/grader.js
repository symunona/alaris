var db = require('../lib/db');
var api = require('./api');

exports.grader = function(req, res){
	db.getRandom('blog').done(function(data){		
		res.render('indexall', api.processentries({entries: [data]}));
	})
}

exports.rate = function(req, res){	
	db.saveOrUpdate('blog', req.body).done(function(){
		res.send({success: true})
	});
}