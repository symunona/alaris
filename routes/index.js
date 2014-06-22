/*
 * GET home page.
 */
//var monk = require('monk');
//var db = monk('localhost:27017/alaris');
var blog = db.get('blog');
var displaySize = 10;
var when = require('when');
var api = require('./api');
var moment = require('moment');
var config = require('../config.json');


function processentries(ctrl) {
	
	var docs = ctrl.entries || [];	
	
	var style = '';
	
	
	docs = docs.map(function(e){
		e.monthday = moment(e.date).format('MMM D.');
		e.monthdaym = 'm'+moment(e.date).format('M');
		e.dayofweek = moment(e.date).format('dddd');
		e.dayofweeks = 'd'+moment(e.date).format('d');
		e.time = moment(e.date).format('h:mm');
		e.timee = 'hh'+Math.floor(moment(e.date).format('h')/3);
		e.tags = e.tag.split(',').map(function(t){return t.trim()});
		e.year = moment(e.date).format('YYYY');
		e.timestamp = moment(e.date).format();
		return e;
	});
	return {
		title : config.title,
		tagline : config.tagline,
		footer : config.footer,
		footerTitle : config.footerTitle,
		style: style,
		mainentry : docs[0],
		entries : docs,
		offset: ctrl.offset,
		max: ctrl.max,
		count: ctrl.count
//		prev: req.params.offset - displaySize > 0 ? req.params.offset - displaySize : '',
//		next: req.params.offset + displaySize > max ? req.params.offset + displaySize : req.params.offset,
//		hasPrev: (req.params.offset - displaySize) < 0,
//		hasNext: (req.params.offset + displaySize) < max
		
	};
};

exports.index = function(req, res) {

	var ctrl = {
		offset: parseInt(req.params.offset) || 0,
		limit: parseInt(req.params.limit) || 10,
		
		callback: function(renderobj){			
			res.render('index', processentries(renderobj));			
		}
	}
//	console.log('index:',req.query, req.params);
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
//	console.log('index:',req.query, req.params);
	api.getAllEntries(ctrl);
};


exports.part = function(req, res) {
	
	var ctrl = {
			offset: parseInt(req.query.offset) || 0,
			limit: parseInt(req.query.limit) || 10,			
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
