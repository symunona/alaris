/**
 * New node file
 */

var api = require('./api');

exports.admin = function(req, res){
  res.render('admin', { 
	  title: 'admin screen' 
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
			console.log('query result',renderobj)
			res.send(renderobj);			
		}
	}
	console.log('admin:',req.query, req.params);
	api.getAllEntries(ctrl);
};

exports.toggletop = function(req, res) {

	api.toggletop(req.body.id, req.body.top,function(data){
		res.send(data);
	})
};