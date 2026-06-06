var db = require('../lib/db');
var utils = require('../lib/utils');

exports.grader = function(req, res){
	const data = db.getRandom('blog');
	utils.renderEntries(res, 'index', [data], { admin: true });
}

exports.rate = function(req, res){
	res.send(db.saveOrUpdate('blog', req.body));
}