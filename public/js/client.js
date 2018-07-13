var loadingnextx = false;
var offset = 0;
var pageSize = 10;
var offsets = [];
var actual = 0;
var offsetStart;
var currentbg;
var keyword;

function isScrolledIntoView(elem) {
	var docViewTop = $(window).scrollTop();
	var docViewBottom = docViewTop + $(window).height();

	var elemTop = $(elem).offset().top;
	var elemBottom = elemTop + $(elem).height();

	return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
}

var parturl;

var QueryString = function () {

	var query_string = {};
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split("=");
		if (typeof query_string[pair[0]] === "undefined") {
			query_string[pair[0]] = pair[1];
		} else if (typeof query_string[pair[0]] === "string") {
			var arr = [query_string[pair[0]], pair[1]];
			query_string[pair[0]] = arr;
		} else {
			query_string[pair[0]].push(pair[1]);
		}
	}
	return query_string;
}();

keyword = QueryString.keyword;

function search() {

	$('#entries').html('');
	offset = -pageSize;
	offsets = [];
	loadnextl();
}

var toYear = function (element, _offset) {

	console.warn('to year', element.innerText, _offset)

	keyword = '';
	offset = _offset - pageSize;

	$('#entries').html('');
	loadnextl();
}


var autoChange = true;

$(window).on('hashchange', function () {
	if (!autoChange) {
		var hash = window.location.hash;
		console.warn('hash changed manually', hash)
		if (hash && hash.substr(1)) {
			loadingnextx = true;
			$('#entries').html('');
			getPart(parturl, { id: parseInt(hash.substr(1)) }).then(partCallback);
		}
	}
});

function changeHashWithoutScrolling(hash) {
	var id = hash.replace(/^.*#/, ''),
		elem = document.getElementById(id);
	elem.id = id + '-tmp';
	autoChange = true;
	window.location.hash = hash;
	setTimeout(function () {
		autoChange = false;
	}, 0);
	elem.id = id;
}

var actualEntryIndex;

function next() {
	if (actualEntryIndex || actualEntryIndex == 0)
		setActual($($('.entry')[actualEntryIndex + 1]), true)

}

function prev() {
	if (actualEntryIndex > 0)
		setActual($($('.entry')[actualEntryIndex - 1]), true);
}

var tags = JSON.parse($('meta[name="eras"]').attr('content'))
for (var i = 0; i < tags.length; i++) {
	tags[i].length = moment(tags[i].enddate).diff(moment(tags[i].startdate), 'days')
}

function getTagsForTime(time) {
	if (!time) return [];
	var ret = [];
	for (var i = 0; i < tags.length; i++) {
		var tag = tags[i];
		if (tag.startdate < time && tag.enddate > time) {
			ret.push(tag)
		}
	}
	ret.sort(function (a, b) {
		if (a.length > b.length) return 1;
		if (a.length < b.length) return -1;
		return 0;
	})

	return ret;
}

function setActual(jqentry, scrollthere) {

	if (jqentry.length < 1) return;

	$('.actual').removeClass('actual');
	$('#actualyear').html(moment(jqentry.attr('data-date')).format('YYYY'));
	$('#actualmonth').html(moment(jqentry.attr('data-date')).format('MMM'));
	$('#actualday').html(moment(jqentry.attr('data-date')).format('DD'));


	actualEntryIndex = $('.entry').index(jqentry[0]);
	//	console.log(actualEntryIndex);
	jqentry.addClass('actual');

	if (jqentry.attr('data-id')) {

		changeHashWithoutScrolling(jqentry.attr('data-id'));
		if (scrollthere) {
			// window.location.hash = jqentry.attr('data-id');	
			console.warn('scrolling to...', jqentry.attr('data-id'))		
			var offset = jqentry.position().top;
			$("html, body").animate({ scrollTop: offset + 'px' }, 150);
		}
	}

	var data = getTagsForTime(jqentry.attr('data-date'))

	if (data && data.length > 0) {
		for (var i = 0; i < data.length; i++) {
			if ($('#eratags').children('[data-name="' + data[i].name + '"]').length == 0)
				$('#eratags').append($('<div>', {
					class: 'tag',
					'data-name': data[i].name,
					title: data[i].startdate + ' - ' + data[i].enddate
				}).data('tag', data[i]).html($('<span>').html(data[i].name)));

		}
		$('#eratags').children().each(function (i, e) {
			if ($.grep(data, function (k) { return k.name == $(e).attr('data-name') }).length == 0) {
				if (!$(e).hasClass('new'))
					$(e).hide('slow').remove();
			}
			else
				if (!$(e).is(":visible"))
					$(e).show('slow');
		});


		if (data[0].background) {
			var bg = 'url("/' + data[0].background + '")';
			if (bg != currentbg) {
				currentbg = bg;
				// console.log('loading: ',bg)

				$('<img>', { src: '/' + data[0].background }).load(function () {
					$('.bgfader')
						.css('opacity', 0)
						.css('background-image', bg)
					$(this).show();
					$('.bgfader').animate({ opacity: 1 }, 'slow', function () {
						$('body').css('background-image', bg);
						$('.bgfader').animate({ opacity: 0 }, 'slow', $('.bgfader').hide)

					})
				});
			}
		}
	}
}

function getCurrentEntry() {
	var top = $(document).scrollTop()
	var i;
	for (i = 0; offsets[i] < top; i++);

	var ents = $('.entry.real-entry');
	actualEntryIndex = i;

	setActual($(ents[i]));

}



function loadnextl() {
	loadingnextx = true;

	var filter = filterRoot();
	filter.orderBy = 'creationDate';
	filter.orderDirection = 'desc';
	filter.keyword = keyword;
	offset += pageSize;
	filter.offset = offset;

	// console.log('loading items from-to: ', filter.offset, ' - ', offset + pageSize);

	getPart(parturl, filter).then(partCallback);

}

function partCallback(data) {
	loadingnextx = false;
	if (!data) {
		if (!$('.theend').length)
			$('#entries').append($('<div>', { class: 'theend entry center col-md-2 col-md-offset-5' }).html('for new beginnings'))
	}

	$('#entries').append(data);

	offsets = $('.entry').map(function (i, e) {
		//			console.log('Offset - ', $(e).attr('data-id'), $(e).position().top)
		return $(e).position().top

	});

	if (keyword) {
		//			console.log('highlighting...',keyword);
		$('#entries').highlight(keyword);
	}


	// getCurrentEntry();
	resizer();

	if (typeof (placeFirstPostMarker) !== 'undefined') {
		placeFirstPostMarker()
	}
	return data;
}

function resizer() {
	if ($(window).outerWidth() > 976)
		$('.tags').each(function (i, e) {
			var w = $(e).outerWidth();
			var entryheight = $(e).parent().children('.entry').height();

			$(e).children('.tagscontainer')
				.height(w)
				.css('top', -w + 'px')
				.css('left', -entryheight + w + 'px')
				.width(entryheight);


		}).show();
	else
		$('.tags').hide()
}


$(function () {

	offsetStart = offset = parseInt($('meta[name="offsetStart"]').attr('content'));

	parturl = $('meta[name="admin"]').attr('content') ? "/api/partAll" : "/api/part";

	offsets = $('.entry').map(function (i, e) { return $(e).position().top })

	// trigger when almost reached the bottom
	$(document).on('scroll', $.debounce(function () {
		getCurrentEntry();
		if ($(document).scrollTop() + $(window).height() >= document.body.offsetHeight - 500) {
			if (!loadingnextx)
				loadnextl();
		}
	}, 200));

	$(document).on('keypress', function (event) {
		if (event.target == document.body) {
			if (event.which == 107) prev();
			if (event.which == 106) next();
		}

	});

	$('.lookfor').on('keypress', function (event) {
		if (event.which == 13) {
			keyword = $('.lookfor').val();
			search();
		}
	});

	resizer();
	getCurrentEntry();

	$(window).on('resize', $.debounce(resizer, 100));

});
