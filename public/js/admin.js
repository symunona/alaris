$(function () {

});

var currentEntry;

function addPost(entry) {	
	if (currentEntry) {
		if (confirm('you wanna discard changes?')) {
			$('#' + currentEntry.id).children('.content').show();
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
	$('#title').focus();

}

function edit(element) {
	var id = getId(element);
	if (currentEntry) {
		if (confirm('you wanna discard changes?')) {
			$('#' + currentEntry.id).children('.content').show();
		}
	}
	var entry = currentEntry = $('#' + id).data('entry');
	$('#title').val(entry.title);
	$('#tags').val(entry.tags.join(', '));
	$('#topic').val(entry.topic);
	$('#body').val(entry.body);
	$('#' + id).append($('#editor'));
	$('#editor').show()
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


function saveEntry() {	
	currentEntry.title = $('#title').val();
	currentEntry.tags = $('#tags').val().split(',').map(function (s) { return s.trim() });
	currentEntry.topic = parseInt($('#topic').val());
	currentEntry.body = $('#body').val();
	console.log('saving...', currentEntry)

	postJson('api/entry/save', currentEntry).done(function (data) {

		if (!currentEntry.id) {
			// insert new one...
			newEntryElement(data);
			$('#new-post a.new').show();
		}

		var entryElement = $('#' + data.id);

		entryElement.find('.title').html(data.title);
		entryElement.find('.body').html(data.body);
		entryElement.parent().find('.tagscontainer').html(data.tags.map(function (tag) {
			return `<div class='tag'>${tag}</div>`;
		}).join());

		$('#' + currentEntry.id).children('.content').show();
		$('#editor').hide();
		currentEntry = false;
	});
}

function toggleTop(element) {
	var id = getId(element);
	postJson('api/top/' + id).done(function (data) {
		$(element).children().toggleClass('glyphicon-star').toggleClass('glyphicon-star-empty');
	});
}

function rate(element, plusminus) {
	var id = getId(element);
	var grade = (parseInt($(element).parent().children('span').html()) || 0) + plusminus;
	postJson('/api/entry/save', { id: parseInt(id), grade: grade }).done(function (data) {
		$(element).parent().parent().find('.grade').html(data.grade);
	});
}

function getId(element) {
	return $(element).closest('.entry').data('id');
}
