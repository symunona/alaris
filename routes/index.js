/*
 * GET home page.
 */
////var monk = require('monk');
//var db = monk('localhost:27017/alaris');
//var blog = db.get('blog');
var displaySize = 10;
var when = require('when');
var api = require('./api');
var moment = require('moment');
var config = require('./../config.json');
var db = require('./db');

var processentries = api.processentries;

exports.index = function(req, res) {
//	console.log(req.paramsm, parseInt(req.params.offset)  );
// console.log(req,req.params, req)
	var ctrl = {
		offset: parseInt(req.params.offset) || 0,
		limit: parseInt(req.params.limit) || 10,
		id: req.params.id,
		keyword: req.params.keyword || req.query.keyword,
		callback: function(renderobj){			
			res.render('index', processentries(renderobj));			
		}
	}

	api.getEntries(ctrl);	

};

exports.all = function(req, res) {

	var ctrl = {
		offset: parseInt(req.params.offset) || 0,
		limit: parseInt(req.params.limit) || 10,
		
		callback: function(renderobj){			
			res.render('indexall', processentries(renderobj));			
		}
	}
	api.getAllEntries(ctrl);
};


exports.part = function(req, res) {
	
	var ctrl = {
			offset: parseInt(req.query.offset) || 0,
			limit: parseInt(req.query.limit) || 10,
			keyword: req.query.keyword,
			callback: function(renderobj){
				res.render('part', processentries(renderobj));			
			}
		};
//	console.log('part:',req.query, req.params);
	api.getEntries(ctrl);
};

exports.partAll = function(req, res) {
	
	var ctrl = {
			offset: parseInt(req.query.offset) || 0,
			limit: parseInt(req.query.limit) || 10,
			keyword: req.query.keyword,
			callback: function(renderobj){
				res.render('partall', processentries(renderobj));			
			}
		};	
	api.getAllEntries(ctrl);
};

exports.getErasIntf = function(req, res) {
	var time = req.query.time; 
	
	api.getEras(time,function(data){
		res.send(data);
	});
};
