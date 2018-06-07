var util = {
	extend: function() {
	    var sources = Array.prototype.slice.call(arguments),
	        target = sources.shift();
	    sources.unshift({});
	    sources = $.extend.apply(null, sources.map(ko.toJS));
	    return $.extend(target, ko.wrap.fromJS(sources));
	}
}
var Entry = Class.extend({
	init : function(properties) {
		util.extend(this, {
			id : '',
			title : '',
			body : '',
			date : moment().format(),
			tag : '',
			topic: 0,
			top: 0,
			grade: 0
		}, properties);
	}
});

var Tag = Class.extend({
	init : function(properties) {
		util.extend(this, {
			id: '',
			name : '',
			style : '',
			customjs: '',
			startdate: null,
			enddate: null,
			background: ''
		}, properties);
	}
});
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
		pageStart: 0,
		pageSize: 10,
		orderBy: '',
		orderDirection: 'asc',
		filters: []
	};
}
