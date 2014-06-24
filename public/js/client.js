var entries = ko.observableArray();
var loadingnextx = false;
var offset = 0;
var pageSize = 10;
var offsets = [];
var actual = 0;
var offsetstart;
var currentbg;

function isScrolledIntoView(elem)
{
    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();

    var elemTop = $(elem).offset().top;
    var elemBottom = elemTop + $(elem).height();

    return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
}



$(function(){	
	
	offsetstart = offset = parseInt($('meta[name="offsetstart"]').attr('content'));
	
	offsets = $('.entry').map(function(i,e){return $(e).position().top})
	
	var getcurrententry = function(){
		var top = $(document).scrollTop()
		var i;
		for(i=0; offsets[i]<top; i++);
		
		var ents = $('.entry'); 

		$('#actualyear').html($(ents[i]).attr('data-year'));
		$('#actualmonth').html(moment($(ents[i]).attr('data-timestamp')).format('MMM'));
		$('#actualday').html(moment($(ents[i]).attr('data-timestamp')).format('DD'));
		

		getEra('api/eras', {time: $(ents[i]).attr('data-timestamp')}).done(function(data){

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
					var bg = 'url("'+data[0].background+'")';
					if (bg!=currentbg)
					{
						currentbg = bg;					
						console.log('loading: ',bg)
						
						$('<img>',{src:data[0].background}).load(function(){
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

	
	
	var resizer = function(){		
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

    var loadnextl = function(){
    	loadingnextx = true;
    	
    	var filter = filterRoot();
    	filter.orderBy = 'creationDate';
    	filter.orderDirection = 'desc';
    	offset+=pageSize;
    	filter.offset = offset; 
    	
		getPart('api/part', filter).done(function(data){	
			loadingnextx = false;		
			
			$('#entries').append(data);
			offsets = $('.entry').map(function(i,e){return $(e).position().top});
			getcurrententry();
			resizer();
		});            
		
	}

 // trigger when almost reached the bottom
	$(document).on('scroll', $.debounce(function(){			
		getcurrententry();
		if($(document).scrollTop()+$(window).height() >= document.body.offsetHeight - 500 )       
		{
			if (!loadingnextx)
				loadnextl();
		}
    },200));

            
	
	resizer();
	getcurrententry();
	
	$(window).on('resize',$.debounce(resizer,100));
		
});
