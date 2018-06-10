$(function () {
	placeFirstPostMarker()
});

var currentEntry;

function discardEntry(){
	stopEditing(currentEntry.id)
}

function addPost(entry) {
	if (currentEntry) {
		if (confirm('you wanna discard changes?')) {
			stopEditing(currentEntry.id);
		}
	}

	currentEntry = {}
	$('#topic').val(0);
	$('#new-post a.new').hide();
	$('#new-entry').append($('#editor'));
	$('#editor').show();
	$('#title').val('');
	$('#tags').val('');
	$('#body').val('');
	$('#body').trumbowyg();
	$('#title').focus();
}

// $.fn.datepicker.setDefaults({
// 	format: moment.ISO_8601
// })
var DATE_FORMAT_MOMENT = 'YYYY-MM-DD';
var DATE_FORMAT_JQUERY = 'yy-mm-dd';
var editingTag;
function bindTags(){
	$('#eratags').children().on('click', function(){
		if ($(this).data('tag')){
			editingTag = $(this).data('tag');
			console.warn('edit tag', editingTag);
			$('#tag-name').val(editingTag.name);
			$('#tag-background').val(editingTag.background);
			$('#tag-start').val(moment(editingTag.startdate).format(DATE_FORMAT_MOMENT));
			$('#tag-end').val(moment(editingTag.enddate).format(DATE_FORMAT_MOMENT));
			$('#tag-editor').show();
			$('#tag-start').datepicker({dateFormat: DATE_FORMAT_JQUERY});
			$('#tag-end').datepicker({dateFormat: DATE_FORMAT_JQUERY})
		}
	})
}


function saveTag(){
	var update = {
		id: editingTag.id,
		name: $('#tag-name').val(),
		startdate: moment($('#tag-start').val(), DATE_FORMAT_MOMENT),
		enddate: moment($('#tag-end').val(), DATE_FORMAT_MOMENT),
		background: $('#tag-image').val()
	}
	postJson('api/tag/save', update).then(function(tag){
		var existingTag = tags.find(function(t){return t.id===tag.id})
		if (existingTag){
			$.extend(existingTag, tag)
		}
		else{
			tags.push(tag)
		}
		editingTag = false;
		$('#tag-editor').hide();
	})
}

function discardTag(){
	$('#tag-editor').hide();
}

function edit(element) {
	var id = getId(element);
	if (currentEntry) {
		if (currentEntry.id === id) return;
		if (confirm('you wanna discard changes?')) {
			stopEditing(currentEntry.id);
		}
	}
	var entry = currentEntry = $('#' + id).data('entry');
	$('#' + id).parent().addClass('editing')
	$('#title').val(entry.title);
	$('#tags').val(entry.tags.join(', '));
	$('#topic').val(entry.topic);
	$('#body').val(entry.body);
	$('#' + id).append($('#editor'));
	$('#editor').show()
	$('#body').trumbowyg();
	$('#body').trumbowyg('html', entry.body);
	$('#' + id).children('.content').hide();
}

function newEntryElement(entry) {
	var stub = $('.entry-stub')[0].outerHTML;
	$('#entries').prepend(stub);
	var newEntry = $('#entries .entry-stub');
	newEntry.removeClass('.entry-stub hidden');
	newEntry.find('.entry').attr('id', entry.id).data({
		entry: entry,
		id: entry.id,
		date: entry.date
	});
}

function stopEditing(id) {
	$('#' + id).children('.content').show();
	$('#' + id).parent().removeClass('editing')
}


function saveEntry() {
	var update = {
		id: currentEntry.id,
		title: $('#title').val(),
		tags: $('#tags').val().split(',').map(function (s) { return s.trim() }),
		topic: parseInt($('#topic').val()),
		body: $('#body').val(),
	}	
	console.log('saving...', update)

	postJson('api/entry/save', update).done(function (data) {

		if (!currentEntry.id) {
			// insert new one...
			newEntryElement(data);
			$('#new-post a.new').show();
		}

		stopEditing(currentEntry.id);

		updatePostData(data);
		$('#editor').hide();
		currentEntry = false;
	});
}


function toggleTop(element) {
	var id = getId(element);
	postJson('api/top/' + id).done(function (data) {
		updatePostData(data);		
		placeFirstPostMarker();
	});
}


function rate(element, plusminus) {
	var id = getId(element);
	var grade = (parseInt($(element).parent().children('span').html()) || 0) + plusminus;
	postJson('/api/entry/save', { id: parseInt(id), grade: grade })
		.done(updatePostData);
}


function updatePostData(entry) {
	var element = $('#' + entry.id);

	element.data('entry', entry);
	
	if (entry.top){		
		element.find('.top').addClass('glyphicon-star').removeClass('glyphicon-star-empty');
	}
	else{
		element.find('.top').removeClass('glyphicon-star').addClass('glyphicon-star-empty');
	}
	
	element.find('.grade').html(entry.grade);
	element.find('.title').html(entry.title);
	element.find('.body').html(entry.body);
	element.find('.topic').html(entry.topic);
	
	if (!entry.topic){
		element.find('.topicq').addClass('hidden')
	}
	else{
		element.find('.topicq').removeClass('hidden')
	}
	element.parent().find('.tagscontainer').html(entry.tags.map(function (tag) {
		return `<div class='tag'>${tag}</div>`;
	}).join());

	// check if it's public
	if (isThisPostPublic(entry)){
		element.addClass('public')
	}
	else{
		element.removeClass('public')
	}
}

function getId(element) {
	return $(element).closest('.entry').data('id');
}


function placeFirstPostMarker() {
	$('#first-marker').remove();
	$('.entry.public').first().before('<hr id="first-marker">');
}
