var util = {
	extend: function() {
	    var sources = Array.prototype.slice.call(arguments),
	        target = sources.shift();
	    sources.unshift({});
	    sources = $.extend.apply(null, sources.map(ko.toJS));
	    return $.extend(target, ko.wrap.fromJS(sources));
	}
}
function getJson(url, filters){
	return $.ajax({
//        dataType: 'json',
        type: 'GET',
        url : url,
        data: $.param(filters),
//        contentType: (type!='GET')?'application/json':'application/x-www-form-urlencoded; charset=UTF-8'                 
    });
}

function postJson(url, filters){
	return $.ajax({
        dataType: 'json',
        type: 'POST',
        url : url,
        data: JSON.stringify(filters),
        contentType: 'application/json;charset=UTF-8'                
    });
}



function getEras(url, filters){
	return $.ajax({
        dataType: 'json',
        type: 'GET',
        url : url
    });
}


function getEra(url, filters){
	return $.ajax({
        dataType: 'json',
        type: 'GET',
        url : url,
        data: $.param(filters)
    });
}



function getPart(url, filters, type){    
	return $.ajax({        
        type: type || 'GET',
        url : url,
        data: $.param(filters)                      
    });
}


function filterRoot(){
	return {
		offset: 0,
		limit: 10,
		orderBy: '',
		orderDirection: 'asc',
		filters: []
	};
}
