var entries = ko.observableArray();
var loadingnextx = false;
var offset = 0;
var pageSize = 10;
var offsets = [];
var actual = 0;
var offsetstart;
var currentbg;
var keyword;
var serverroot;

function isScrolledIntoView(elem)
{
    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();

    var elemTop = $(elem).offset().top;
    var elemBottom = elemTop + $(elem).height();

    return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
}

var parturl;

function search(){

	$('#entries').html('');
	offset = -pageSize;
	offsets = [];
	loadnextl();
}

var toYear = function(element){
	var yearData = $('.yearpicker').data('years');
	var selectedYear = $(element).data('year').year;
	keyword = '';
	offset = yearData.reduce(function(prev,cur){
		return cur.year > selectedYear?prev + cur.cnt:prev;
	},0) - pageSize;

	$('#entries').html('');
	loadnextl();
}



function changeHashWithoutScrolling(hash) {
  var id = hash.replace(/^.*#/, ''),
      elem = document.getElementById(id)
  elem.id = id+'-tmp'
  window.location.hash = hash
  elem.id = id
}

var actualEntryIndex;

function next(){
	if (actualEntryIndex || actualEntryIndex == 0)
		setActual($($('.entry')[actualEntryIndex + 1]),true)

}

function prev(){
	if (actualEntryIndex>0)
		setActual($($('.entry')[actualEntryIndex - 1]),true);
}

function setActual(jqentry, scrollthere){

	if (jqentry.length<1) return;

	$('.actual').removeClass('actual');
	$('#actualyear').html(jqentry.attr('data-year'));
	$('#actualmonth').html(moment(jqentry.attr('data-timestamp')).format('MMM'));
	$('#actualday').html(moment(jqentry.attr('data-timestamp')).format('DD'));


	actualEntryIndex = $('.entry').index(jqentry[0]);
	console.log(actualEntryIndex);
	jqentry.addClass('actual');

	if (jqentry.attr('data-id')){
		if (scrollthere)
			window.location.hash = jqentry.attr('data-id');
		else
			changeHashWithoutScrolling(jqentry.attr('data-id'));
	}


	getEra(serverroot+'/api/eras', {time: jqentry.attr('data-timestamp')}).done(function(data){


		if (data && data.length > 0)
		{
			for(var i = 0; i<data.length; i++)
			{
				if ($('#eratags').children('[data-name="'+data[i].name+'"]').length==0)
					$('#eratags').append($('<div>',{'data-name':data[i].name}).html($('<span>').html(data[i].name)));

			}
			$('#eratags').children().each(function(i,e){
				if ($.grep(data,function(k){return k.name==$(e).attr('data-name')}).length == 0)
					$(e).hide('slow');
				else
				if (!$(e).is(":visible"))
					$(e).show('slow');
			});

			if (data[0].background){
				var bg = 'url("'+serverroot+'/'+data[0].background+'")';
				if (bg!=currentbg)
				{
					currentbg = bg;
					// console.log('loading: ',bg)

					$('<img>',{src: serverroot+'/'+data[0].background}).load(function(){
						$('.bgfader')
							.css('opacity',0)
							.css('background-image',bg)
						$(this).show();
						$('.bgfader').animate({opacity: 1},'slow',function(){
							$('body').css('background-image',bg);
							$('.bgfader').animate({opacity: 0},'slow',$('.bgfader').hide)

						})
					});
				}
			}
		}
	})

}

function getcurrententry(){
	var top = $(document).scrollTop()
	var i;
	for(i=0; offsets[i]<top; i++);

	console.log('currententry',i)

	var ents = $('.entry');
	actualEntryIndex = i;

	setActual($(ents[i]));

}

function loadnextl(){
	loadingnextx = true;
	
	var filter = filterRoot();
	filter.orderBy = 'creationDate';
	filter.orderDirection = 'desc';
	filter.keyword = keyword;
	offset+=pageSize;
	filter.offset = offset; 
	
	// console.log('loading items from-to: ', filter.offset, ' - ', offset+pageSize);
	
	getPart(parturl, filter).done(function(data){	
		loadingnextx = false;		

		if (!data){
			if (!$('.theend').length)
				$('#entries').append($('<div>',{class: 'theend entry center col-md-2 col-md-offset-5'}).html('for new beginnings'))
		}

		$('#entries').append(data);

		offsets = $('.entry').map(function(i,e){
			console.log('Offset - ', $(e).attr('data-id'), $(e).position().top)
			return $(e).position().top

		});

		if (keyword)
		{
			console.log('highlighting...',keyword);
			$('#entries').highlight(keyword);
		}
		getcurrententry();
		resizer();
	});            
	
}

function resizer(){		
	if ($(window).outerWidth()>976)
		$('.tags').each(function(i,e)
			{			
				var w = $(e).outerWidth();
				var entryheight = $(e).parent().children('.entry').height();

				$(e).children('.tagscontainer')
						.height(w)
						.css('top',-w+'px')
						.css('left',-entryheight+w+'px')
						.width(entryheight);
				
			
			}).show();
	else
		$('.tags').hide()			
}


$(function(){	
	
	offsetstart = offset = parseInt($('meta[name="offsetstart"]').attr('content'));

	serverroot = $('meta[name=serverroot]').attr('content');
	parturl = serverroot+"/api/part";

	offsets = $('.entry').map(function(i,e){return $(e).position().top})
	
 // trigger when almost reached the bottom
	$(document).on('scroll', $.debounce(function(){			
		getcurrententry();
		if($(document).scrollTop()+$(window).height() >= document.body.offsetHeight - 500 )       
		{
			if (!loadingnextx)
				loadnextl();
		}
    },200));

	$(document).on('keypress', function(event){
		if (event.target == document.body){
			if (event.which == 107) prev();
			if (event.which == 106) next();
		}

	});

	$('.lookfor').on('keypress', function(event){
		if (event.which == 13) {
			keyword = $('.lookfor').val();
			search();
		}
	});

	resizer();
	getcurrententry();
	
	$(window).on('resize',$.debounce(resizer,100));
		
});
