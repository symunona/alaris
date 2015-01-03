var db = require('./db');
var api = require('./api');

exports.grader = function(req, res){
	db.getRandom('blog').done(function(data){
		console.log(data);
		res.render('indexall', api.processentries({entries: [data]}));
	})
}

exports.rate = function(req, res){	
	db.saveOrUpdate('blog', req.body).done(function(){
		res.send({success: true})
	});
}