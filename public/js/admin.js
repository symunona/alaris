$(function(){
	
});

function addPost(entry){
	console.warn('adding editor')
	if (!entry){
		$('#new-entry').append($('#editor'))
	}
}