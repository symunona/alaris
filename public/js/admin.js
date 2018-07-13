var currentEntry;
var editorDropZoneElement;

// Init.
$(function () {
	placeFirstPostMarker();
	$('.bgfader').on('click', function () {
		if (currentEntry) {
			stopEditing(currentEntry.id)
		}
	})

	bindTags();
});

function discardEntry() {
	stopEditing(currentEntry.id)
}


function initTrumbowygOnElement(element, html) {

	if (editorDropZoneElement && editorDropZoneElement[0].dropzone) {
		editorDropZoneElement[0].dropzone.destroy();
	}

	$(element).trumbowyg();
	if (html !== undefined) {
		$(element).trumbowyg('html', html)
	}


	editorDropZoneElement = element.closest('.entry')

	if (!editorDropZoneElement.data().dropzone) {
		editorDropZoneElement.dropzone({
			url: '/api/upload',
			success: function (file) {
				var html = $(element).trumbowyg('html')
				html += '<img src="content/' + file.name + '">';
				$('#body').trumbowyg('html', html);
			}
		})
	}
	$('#add-file').on('click', function () {
		listOfFiles(function (fileName) {
			var html = $(element).trumbowyg('html')
			html += '<img src="' + fileName + '">';
			$('#body').trumbowyg('html', html);
			$('#file-list').modal('hide')
		})
	})


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
	initTrumbowygOnElement($('#body'), '');
	$('#title').focus();
}

var DATE_FORMAT_MOMENT = 'YYYY-MM-DD';
var DATE_FORMAT_JQUERY = 'yy-mm-dd';
var editingTag;

function bindTags() {
	$('#eratags').on('click', function (event) {
		var tag = $(event.target).closest('.tag')
		if (tag.data('tag')) {
			editTag(tag.data('tag'));
		}
	})
}

function editTag(tag) {
	editingTag = tag;
	$('#tag-name').val(editingTag.name);
	$('#tag-background').val(editingTag.background);
	$('#tag-start').val(moment(editingTag.startdate).format(DATE_FORMAT_MOMENT));
	$('#tag-end').val(moment(editingTag.enddate).format(DATE_FORMAT_MOMENT));
	$('#tag-editor').show();
	$('#tag-start').datepicker({ dateFormat: DATE_FORMAT_JQUERY });
	$('#tag-end').datepicker({ dateFormat: DATE_FORMAT_JQUERY })
	if (editingTag.id) {
		$('.delete-tag').show();
	}
	else {
		$('.delete-tag').hide();
	}
	initTagImageUpload();
}

function newTag() {
	editTag({
		name: '',
		background: '',
		startdate: moment().format(),
		enddate: moment().format()
	});
}

function listTags() {
	$('#eratags > :not(.new)').hide();
	for (var i = 0; i < tags.length; i++) {
		$('#eratags').append($('<div>', {
			class: 'tag',
			'data-name': tags[i].name,
			title: tags[i].startdate + ' - ' + tags[i].enddate
		}).data('tag', tags[i]).html($('<span>').html(tags[i].name)))
	}
}

var fileListCallback;

function listOfFiles(_fileListCallback) {
	fileListCallback = _fileListCallback;
	$('#file-list').modal()
	getJson('api/content', {}).then(function (data) {
		var list = '';
		for (var i = 0; i < data.length; i++) {
			list += '<a onclick="preview(this)">' + data[i].filename + '</a>'
		}
		$('#file-list .list').append(list);
	})

}

var selectedFile;

function preview(element) {
	selectedFile = element.innerText;

	if (
		selectedFile.toLowerCase().endsWith('.png') ||
		selectedFile.toLowerCase().endsWith('.gif') ||
		selectedFile.toLowerCase().endsWith('.jpg')
	) {
		$('#file-list .preview').html($('<img>', { src: 'content/' + selectedFile }));
	} else {
		$('#file-list .preview').html('no preview');
	}
}

function pickerCallback() {
	if (selectedFile) {
		fileListCallback('content/' + selectedFile);
	}
}

function filterFileList(event) {
	setTimeout(function () {
		var search = $('#file-filter').val();
		if (search) {
			search = search.toLowerCase()
			$('#file-list .list a').each(function (i, e) {
				var fileName = e.innerText.toLowerCase();
				if (fileName.includes(search)) {
					$(e).removeClass('hidden')
				} else {
					$(e).addClass('hidden')
				}
			})
		}
		else {
			$('#file-list .list a').removeClass('hidden')
		}

	}, 1)

}


function tagImageFromList() {
	listOfFiles(function (fileName) {
		$('#tag-background').val(fileName);
		$('#file-list').modal('hide')
	})
}

function hiddenSwitch() {
	if ($('#hidden-switch-style').length) {
		$('#hidden-switch-style').remove();
		$('.hidden-switch').text('Show Hidden')

	} else {
		var style = $('<style>', { id: 'hidden-switch-style' }).text('.entry:not(.public):not(#new-entry){display: none;}')
		$('body').append(style);
		$('.hidden-switch').text('Hide Hidden')
	}
}

var tagDropZone;

function initTagImageUpload() {
	var e = $('#tag-image-upload')
	var lastFile
	$('#tag-editor').dropzone({
		url: '/api/upload',
		success: function (file) {
			if (lastFile) {
				tagDropZone.removeFile(lastFile)
			}
			$('#tag-background').val('content/' + file.name);
			lastFile = file;
		},
		init: function () {
			tagDropZone = this;
		}
	})

}

function deleteTag() {
	return $.ajax({
		url: 'api/tag/delete/' + editingTag.id,
		method: 'delete'
	}).then(function () {
		discardTag();
	});
}

function saveTag() {
	var update = {
		id: editingTag.id,
		name: $('#tag-name').val(),
		startdate: moment($('#tag-start').val(), DATE_FORMAT_MOMENT),
		enddate: moment($('#tag-end').val(), DATE_FORMAT_MOMENT),
		background: $('#tag-background').val()
	}
	postJson('api/tag/save', update).then(function (tag) {
		var existingTag = tags.find(function (t) { return t.id === tag.id })
		if (existingTag) {
			$.extend(existingTag, tag)
		}
		else {
			tags.push(tag)
		}
		editingTag = false;
		setTimeout(getCurrentEntry, 100);

		$('#tag-editor').hide();
		tagDropZone.destroy();
	})
}

function discardTag() {
	$('#tag-editor').hide();
	tagDropZone.destroy();

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
	$('#editor').on('keydown', function (event) {
		if (event.ctrlKey && event.keyCode === 13) {
			saveEntry();
		}
	})
	initTrumbowygOnElement($('#body'));
	$('#body').trumbowyg('html', entry.body);
	$('#' + id).children('.content').hide();
	setTimeout(function () {
		$('#title').focus();
	}, 0);
}

function newEntryElement(entry) {
	var stub = $('.entry-stub')[0].outerHTML;
	$('#entries').prepend(stub);
	var newEntry = $('#entries .entry-stub');
	newEntry.removeClass('entry-stub hidden');
	newEntry.find('.entry').attr('id', entry.id).data({
		entry: entry,
		id: entry.id,
		date: entry.date
	});
}

function stopEditing(id) {
	if (id) {
		$('#' + id).children('.content').show();
		$('#' + id).parent().removeClass('editing');
	} else {
		$('#new-post a.new').show();
	}
	$('#editor').hide();
	$('.editor-wrapper').append($('#editor'));
	currentEntry = false;
}

function getRnd(){
	loadingnextx = true;
	$('#entries').html('');
	getPart('/api/rnd').then(partCallback).then(function(){		
		setActual($('#entries .entry'));
	});
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

		// Place the tags.
		setTimeout(resizer, 10)
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

	if (entry.top) {
		element.find('.top').addClass('glyphicon-star').removeClass('glyphicon-star-empty');
	}
	else {
		element.find('.top').removeClass('glyphicon-star').addClass('glyphicon-star-empty');
	}

	element.find('.grade').html(entry.grade);
	element.find('.title').html(entry.title);
	element.find('.body').html(entry.body);
	element.find('.topic').html(entry.topic);

	if (!entry.topic) {
		element.find('.topicq').addClass('hidden')
	}
	else {
		element.find('.topicq').removeClass('hidden')
	}
	element.parent().find('.tagscontainer').html(entry.tags.map(function (tag) {
		return `<div class='tag'>${tag}</div>`;
	}).join(''));

	// check if it's public
	if (isThisPostPublic(entry)) {
		element.addClass('public')
	}
	else {
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
