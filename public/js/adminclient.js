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
		editingTag: editingTag
	});

});