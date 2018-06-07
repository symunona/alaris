const config = require('../config.json'),
	_ = require('underscore'),
	// uuid = require('uuid/v1'),
	fs = require('fs')
	

console.log('Loading database...')
let startTime = new Date()
// Load the DB.
exports.db = db = require('./../' + config.db.src)
console.log('Db loaded in ', (new Date()-startTime)/1000, 'sec')

let maxBlogId = _.reduce(db.blog, function(prev, curr){
	if (prev < curr.id) return curr.id
	return prev
}, 0)

exports.persist = function(){
	fs.writeFileSync('./../' + config.db.src, JSON.stringify(exports.db, null, config.db.prettyfy?2:undefined))
}

exports.getById = function (table, id) {
	return _.find(exports.db[table], { id })
}


exports.getRandom = function (table, n) {
	return exports.db[table][Math.floor(Math.random() * exports.db[table].length)];
}


exports.saveOrUpdate = function (table, entry) {

	let existing = exports.getById(table, parseInt(entry.id))	

	if (!entry.id){
		entry.id = ++maxBlogId
	}

	if (existing) {
		let index = exports.db[table].indexOf(existing)
		entry = _.extend(existing, entry)
	} else {
		exports.db[table].push(entry)		
	}	

	console.log('[persist]', entry)

	exports.persist()

	return entry
}
