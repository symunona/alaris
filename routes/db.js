var moment = require('moment');
var config = require('../config.json');
var deferred = require('deferred');

var Db = require('mysql-activerecord');
var db = exports.db = new Db.Adapter({
    server: config.db.server,
    username: config.db.user,
    password: config.db.pass,
    database: config.db.database
});

exports.query = deferred.promisify(db.query);

exports.getById = function(table,id){
	var def = deferred();
	var selector = db.select('*')
		.limit(1)		
		.where('id',id)
	selector.get(table,function(err,rows,fields){
		if (!rows.length)
			def.resolve(null);
		else
			def.resolve(rows[0]);
	});		
	
	return def.promise;
}


// slow for big databases
exports.getRandom = function(table, n){
	var def = deferred();
	var selector = db.select('*')
		.limit(n || 1)
		.order_by('RAND()')
		;
			
	selector.get(table,function(err,rows,fields){
		if (!rows.length)
			def.resolve(null);
		else
			def.resolve(rows.length>1?rows:rows[0]);
	});		
	
	return def.promise;
}


exports.saveOrUpdate = function(table, entry){

	var def = deferred();
	
	if (entry.id)
	{		
		db.where('id',entry.id).update(table,entry,function(err){
			if (err)
			{
				console.error('[database] panda is sad updating' + table,entry, err);
				def.fail(err);
				return;
			}
			def.resolve(entry);
		});
	} else 
	{	
		db.select('id').order_by('id desc').limit(1).get(table,function(err,el){							
			entry.id = parseInt(el[0].id)+1;		
			
			db.insert(table,entry,function(err){
					if (err)
					{
						console.error('[database] panda is sad saving '+table,entry, err);					
						def.fail(err);
						return;
					}
					def.resolve(entry);
				});
			
		});
	}	
	return def.promise;
};

exports.getSP = function(sp) {
	var def = deferred();
	var selector = db.select('*')
		.limit(sp.limit || 0,sp.offset || 0)
		.order_by(sp.orderBy || 'id')
	
	selector.get(sp.table,function(err,rows,fields){		
			db.count(sp.table,function(err,c,fields){
				def.resolve({
					data: rows,
					count: c
				});
			});		
	});
	return def.promise;
};
