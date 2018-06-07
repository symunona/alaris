


var entries = ko.observableArray(),
	deletedEntries = ko.observableArray(),
	editingEntry = ko.observable(false),
	editingTag = ko.observable(false),
	tags = ko.observableArray(),
	tagsearch = ko.observableArray();

window.onbeforeunload = saveEntry;

var timeline_config = {
    width:              '100%',
    height:             '300',
    embed_id:           'timeline',               //OPTIONAL USE A DIFFERENT DIV ID FOR EMBED
    start_at_end:       true,                          //OPTIONAL START AT LATEST DATE
//    start_at_slide:     '4',                            //OPTIONAL START AT SPECIFIC SLIDE
    start_zoom_adjust:  '1',                            //OPTIONAL TWEAK THE DEFAULT ZOOM LEVEL
    hash_bookmark:      true,                           //OPTIONAL LOCATION BAR HASHES
    lang:               'en',                           //OPTIONAL LANGUAGE
    css:                'js/lib/vendor/timelinejs/timeline.css',     //OPTIONAL PATH TO CSS
    js:                 'js/lib/vendor/timelinejs/timeline.js'    //OPTIONAL PATH TO JS
}

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
		
	entries.remove(entry);
	editingEntry(entry);
	entry.deleted(1);
	saveEntry();
}



function saveEntry(){
	
	var entry = ko.toJS(editingEntry);	
	editingEntry(false);
	
	postJson('api/saveEntry', entry).done(function(data){
		entries.unshift(new Entry(data));
	});
}
function saveTag(){
	
	var tag = ko.toJS(editingTag);	

	tag.startdate = moment(tag.startdate).isValid()?tag.startdate : null;
	tag.enddate = moment(tag.startdate).isValid()?tag.enddate : null;

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

		if (data.entries)
			entries(data.entries.map(function(e){return new Entry(e);}));	
		pager.allentries(data.max);
		
	});
	
});
pager.hasNext = ko.computed(function(){return pager.offset()+pager.pagesize()<pager.allentries();});
pager.hasPrev = ko.computed(function(){return pager.offset()>0;});




var contentdir = ko.observableArray(), selectedimg = ko.observable();

var getContent = function(){
	return getJson('api/content',{}).done(function(data){		
		contentdir(data)				
	});
}

var addImg = function(img){
	var entry = editingEntry();
	editingEntry(false);
	entry.body(entry.body() + "<p class='blogimg'><img src='"+img()+"'></p>");
	editingEntry(entry);
}

var uploadconfig={
		target: 'api/uploadfile', 
		dropAreaId: 'dropspace',
		progressBarId: 'uploadprogress',
		onDone: function(data){
			console.log('uploaddone');
			getContent().done(function(){
				console.log('contentdir:','content/'+contentdir()[0].filename)			
				selectedimg('content/'+contentdir()[0].filename);
			})
		},
		formdata: []
	};

var loadTimeline = function(){
	var eras = tags().map(function(e){return {
				startDate: moment(e.startdate()).format("YYYY,MM,DD"),
				endDate: moment(e.enddate()).format("YYYY,MM,DD"),
				headline: e.name()
				
			}});
	var tmlnconfig = {
					timeline: {
						headline: "My eras",
						type: "default",
						text: "",
						date: eras,						
						era: []							
					}			
			}
			timeline_config.source = tmlnconfig;		
			$('#'+timeline_config.embed_id).html('');
			if (window.createStoryJS) createStoryJS(timeline_config);
}


$(function(){
	
	var filter = filterRoot();
	filter.orderBy = 'creationDate';
	filter.orderDirection = 'desc';
	tags.subscribe(loadTimeline);
	
	getJson('api/entries', filter).done(function(data){

		if (data.entries)
			entries(data.entries.map(function(e){return new Entry(e);}));		
	});
	
	getJson('api/tags', filter).done(function(data){			
		if (data){
			tags(data.map(function(e){return new Tag(e);}).sort(function(a,b){

				if (a.startdate() > b.startdate()) return 1;
				if (a.startdate() < b.startdate()) return -1;
				return 0;
			}));						
		}
				
	});
	
//	getJson('api/deletedEntries', filter).done(function(data){			
//		if (data.result)
//			deletedEntries(data.result.map(function(e){return new Entry(e);}));		
//	});
//	
	getContent();

	if (window.location.hash){
		var filter = filterRoot();
		filter.orderBy = 'creationDate';
		filter.orderDirection = 'desc';
		filter.id = window.location.hash.substring(1);

		getJson('api/entries', filter).done(function(data){
			console.log(filter, data)
			if (data.entries)
				editEntry(new Entry(data.entries[0]));
		});
	}

	ko.applyBindings({
		entries : entries,
		tags: tags,
		deletedEntries : deletedEntries,
		editEntry : editEntry,
		editTag   : editTag,
		addEntry : addEntry,
		saveEntry : saveEntry,
		editingTag: editingTag,
		pager: pager,
		uploadconfig: uploadconfig,
		content: contentdir,
		selectedimg: selectedimg,
		
	});

});
