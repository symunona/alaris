/*
 * GET home page.
 */
////var monk = require('monk');
//var db = monk('localhost:27017/alaris');
//var blog = db.get('blog');


const moment = require('moment'),
	isThisPostPublic = require('../public/js/is-public')

const config = require('./../config.json'),
	db = require('../lib/db'),
	utils = require('../lib/utils')

exports.index = function (req, res) {
	utils.renderEntries(res, 'index', exports.getEntriesFromReq(req, isThisPostPublic), {
		offsetStart: req.query.offset || 0
	})
};

exports.part = function (req, res) {
	utils.renderEntries(res, 'part', exports.getEntriesFromReq(req, isThisPostPublic))
};

exports.getEntriesFromReq = function (req, _filterFunction) {
	let offset = parseInt(req.query.offset) || 0,
		limit = parseInt(req.query.limit) || config.pageSize,
		id = req.params.id,
		keyword = req.params.keyword || req.query.keyword

	if (keyword){
		keyword = keyword.toLowerCase()
	}
	let length = db.db.blog.length - 1;

	if (keyword){
		if (_filterFunction){
			filterFunc = function(entry){
				return _filterFunction(entry) && entryContainsString(keyword, entry)
			}
		}
		else{
			filterFunction = entryContainsString.bind(this, keyword)
		}
		
	} else{
		filterFunction = _filterFunction
	}
		

	// Get the visible ones.
	if (filterFunction) {
		while (offset > 0 && length > 0) {
			if (filterFunction(db.db.blog[length])) { offset-- }
			length--;
		}
	}
	else {
		length = length - offset;
	}

	let entriesToShow = []
	while (limit > 0 && length > 0) {
		let entry = db.db.blog[length]
		if (!filterFunction || filterFunction(entry)) {
			entriesToShow.push(entry)
			limit--
		}

		length--
	}
	return entriesToShow
}

function entryContainsString(string, entry){
	return entry.tags.join().toLowerCase().includes(string) ||
		entry.body.toLowerCase().includes(string) ||
		entry.title.toLowerCase().includes(string)
}


exports.all = function (req, res) {
	utils.renderEntries(res, 'index', exports.getEntriesFromReq(req), {
		offsetStart: req.query.offset || 0,
		admin: 'true'
	})
};



exports.partAll = function (req, res) {
	utils.renderEntries(res, 'part', exports.getEntriesFromReq(req), {
		admin: true
	})
};

exports.getErasIntf = function (req, res) {
	let time = req.query.time;

	api.getEras(time, function (data) {
		res.send(data);
	});
};

