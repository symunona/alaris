
function toggleTop(element,id, currentvalue){
	console.log('switching top: '+id, element);
	postJson('api/top', {id: id, top: currentvalue} ).done(function(data){
		console.log('data:',data);		
		$(element).toggleClass('glyphicon-star').toggleClass('glyphicon-star-empty');
	});
}

function rate(element,id,plusminus){
	var grade = (parseInt($(element).parent().children('span').html()) || 0) + plusminus;
	console.log('switching grade: '+id, element, grade);
	postJson('api/rate', {id: id, grade: grade} ).done(function(data){
		$(element).parent().children('span').html(grade);
	});
}

$(function(){
	parturl = serverRoot + "/api/partAll";
	});