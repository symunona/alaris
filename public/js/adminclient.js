var entries = ko.observableArray(),
	deletedEntries = ko.observableArray(),
	editingEntry = ko.observable(false),
	editingTag = ko.observable(false),
	tags = ko.observableArray(),
	tagsearch = ko.observableArray();



function logout(){}


function addTag(){
	console.log('addTag');
	if (editingTag() && !confirm('You want to ignore changes?'))
		return;
	editingTag(new Tag());
}

function addEntry(){
	console.log('addEntry');
	if (editingEntry() && !confirm('You want to ignore changes?'))
		return;
	editingEntry(new Entry());
}

function editTag(tag) {
	console.log('editing: ', tag);
	tags.remove(tag)
	editingTag(new Tag(ko.utils.unwrapObservable(tag)));
}


function editEntry(entry) {
	console.log('editing: ', entry);
	entries.remove(entry)
	editingEntry(new Entry(ko.utils.unwrapObservable(entry)));
}

function discardEntry(){
	if (confirm('Sure about discard?'))
		editingEntry(false);
}
function discardTag(){
	if (confirm('Sure about discard?'))
		editingTag(false);
}
function replaceAll(find, replace, str) {
	return str.replace(new RegExp(find, 'g'), replace);
}

function deleteEntry(entry){
	if (!confirm('Sure you want to delete entry?')) return;
	
	debugger;
	entries.remove(entry);
	editingEntry(entry);
	entry.deleted(1);
	saveEntry();
}

function saveEntry(){
	
	var entry = ko.toJS(editingEntry);	
	
//	entry.bodyshort = entry.body.slice(0,30);
//	if (!entry.id) entry.date = moment.format();
//	entry.bodyshort = replaceAll("<[^>]*>", "", entry.bodyshort) + '...';
	console.log('saveentry',entry);
	editingEntry(false);
	
	postJson('api/saveEntry', entry).done(function(data){
		console.log('data:',data);		
//		if (!entry.id)
		entries.unshift(new Entry(data));

	});
}
function saveTag(){
	
	var tag = ko.toJS(editingTag);	

	postJson('api/saveTag', tag ).done(function(data){
		console.log('data:',data);
		editingTag(false);
		tags.unshift(new Tag(data));

	});
}

var pager = {
	offset: ko.observable(0),
	pagesize: ko.observable(10),
	allentries: ko.observable(0),
	actualpage: ko.observable(0),
	next: function(){pager.offset(pager.offset()+pager.pagesize())},
	prev: function(){pager.offset(pager.offset()-pager.pagesize())},
	first: function(){pager.offset(0)},
	last: function(){
		var notround = Math.floor(pager.allentries()/(pager.pagesize()));		
		pager.offset(pager.pagesize()*notround)}

};
pager.load = ko.computed(function(){
	var filter = filterRoot();
	filter.orderBy = 'creationDate';
	filter.orderDirection = 'desc';
	filter.offset = pager.offset();
	filter.limit = pager.pagesize();
	
	getJson('api/entries', filter).done(function(data){		
		console.log("dddd",data)
		if (data.entries)
			entries(data.entries.map(function(e){return new Entry(e);}));	
		pager.allentries(data.max);
		
	});
	
});
pager.hasNext = ko.computed(function(){return pager.offset()+pager.pagesize()<pager.allentries();});
pager.hasPrev = ko.computed(function(){return pager.offset()>0;});

$(function(){
	
	var filter = filterRoot();
	filter.orderBy = 'creationDate';
	filter.orderDirection = 'desc';
	
	getJson('api/entries', filter).done(function(data){			
		if (data.entries)
			entries(data.entries.map(function(e){return new Entry(e);}));		
	});
	
	getJson('api/tags', filter).done(function(data){			
		if (data)
			tags(data.map(function(e){return new Tag(e);}));		
	});
	
//	getJson('api/deletedEntries', filter).done(function(data){			
//		if (data.result)
//			deletedEntries(data.result.map(function(e){return new Entry(e);}));		
//	});
//	

	ko.applyBindings({
		entries : entries,
		tags: tags,
		deletedEntries : deletedEntries,
		editEntry : editEntry,
		editTag   : editTag,
		addEntry : addEntry,
		saveEntry : saveEntry,
		editingTag: editingTag,
		pager: pager
	});

});