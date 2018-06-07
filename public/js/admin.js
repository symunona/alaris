$(function(){
	
});

var currentEntry;

function addPost(entry){
	console.warn('adding editor')
	if (!currentEntry){
		currentEntry = {}
		$('#topic').val(0);
		$('#new-post a.new').hide();
		$('#new-entry').append($('#editor'));
		$('#title').focus();		
	}
}

function edit(id){
	
	if (currentEntry){
		if (confirm('you wanna discard changes?')){
			$('#'+currentEntry.id).children('.content').show();
		}
	}
	var entry = currentEntry = $('#'+id).data('entry');
	$('#title').val(entry.title);
	$('#tags').val(entry.tags.join(', '));
	$('#topic').val(entry.topic);
	$('#body').val(entry.body);
	$('#'+id).append($('#editor'));
	$('#editor').show()
	$('#'+id).children('.content').hide();	
}


function saveEntry(){
	
	currentEntry.title = $('#title').val();
	currentEntry.tags = $('#tags').val().split(',').map(function(s){return s.trim()});
	currentEntry.topic = parseInt($('#topic').val());
	currentEntry.body = $('#body').val();
	console.log('saving...', currentEntry)
	
	postJson('api/entry/save', currentEntry).done(function(data){
		var entryElement = $('#'+data.id);

		entryElement.find('.title').html(data.title);
		entryElement.parent().find('.tagscontainer').html(data.tags.map(function(tag){
			return `<div class='tag'>${tag}</div>`;
		}).join());
		
		$('#'+currentEntry.id).children('.content').show();
		$('#editor').hide();	
		currentEntry = false;	
	});
}

function toggleTop(element, id) {
	
	postJson('api/top/' + id).done(function (data) {		
		$(element).children().toggleClass('glyphicon-star').toggleClass('glyphicon-star-empty');
	});
}

function rate(element, id, plusminus) {
	var grade = (parseInt($(element).parent().children('span').html()) || 0) + plusminus;	
	postJson('/api/entry/save', { id: parseInt(id), grade: grade }).done(function (data) {
		$(element).parent().parent().find('.grade').html(data.grade);
	});
}

