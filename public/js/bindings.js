ko.bindingHandlers.richText = {

	init : function(element, valueAccessor, allBindingsAccessor, viewModel) {

		var txtBoxID = $(element).attr("id");

		var options = allBindingsAccessor().richTextOptions || {};

		options.toolbar_Full = [

				[ 'Source', '-', 'Format', 'Font', 'FontSize', 'TextColor',
						'BGColor', '-', 'Bold', 'Italic', 'Underline',
						'SpellChecker' 
						],
				[ 'NumberedList', 'BulletedList', '-', 'Outdent', 'Indent',
						'-', 'Blockquote', 'CreateDiv', '-', 'JustifyLeft',
						'JustifyCenter', 'JustifyRight', 'JustifyBlock', '-',
						'BidiLtr', 'BidiRtl' 
						],
				[ 'Link', 'Unlink', 'Image', 'Table' ] ];

		// handle disposal (if KO removes by the template binding)

		ko.utils.domNodeDisposal.addDisposeCallback(element, function() {

			if (CKEDITOR.instances[txtBoxID]) {
				CKEDITOR.remove(CKEDITOR.instances[txtBoxID]);
			}
		});

		CKEDITOR.replace(element, options);

		CKEDITOR.instances[txtBoxID].focusManager.blur = function() {

			var observable = valueAccessor();
			
			if (typeof(observable)=='function')
			{
				observable(CKEDITOR.instances[txtBoxID].getData());
			}
			else
			{
				debugger;
				observable = CKEDITOR.instances[txtBoxID].getData();
			}
		};

	},

	update : function(element, valueAccessor, allBindingsAccessor, viewModel) {

		var val = ko.utils.unwrapObservable(valueAccessor());

		$(element).val(val);

	}

};

	 



ko.bindingHandlers.debug = {
	init : function(element, valueAccessor) {
		$($('<pre>', {
			'id' : 'debugpre'
		}).html(ko.toJSON(valueAccessor(), null, 4))).appendTo(element);
	},
	update : function(element, valueAccessor) {
		$(element).html(ko.toJSON(valueAccessor(), null, 4));
	}
};





ko.bindingHandlers.tagger = {
	init : function(element, valueAccessor, allBindingsAccessor, context) {
		var input = $(element), value = valueAccessor();

		input.tokenInput(value.url, {
			prePopulate : value.value,
			hint : input.attr('placeholder'),
			onAdd : function(val) {
				console.log('adding', val);
				value.value.push(val);
			},
			onDelete : function(val) {
				console.log('removing', val);
				value.value.pop(val);
			}
		});

	},

	update : function(element, valueAccessor, allBindingsAccessor, context) {
//		var value = ko.utils.unwrapObservable(valueAccessor());
		//            if (allBindingsAccessor.ckeditor) allBindingsAccessor.ckeditor.setData(value)
	}
};

ko.bindingHandlers.datepicker = {
	    init: function(element, valueAccessor, allBindingsAccessor) {
	        //initialize datepicker with some optional options
	        var options = allBindingsAccessor().datepickerOptions || {};
//	        console.log('dp binging',ko.utils.unwrapObservable(valueAccessor()));
	        options.dateFormat = 'yy.mm.dd.';
	        $(element).datepicker(options);
	          
	        //handle the field changing
	        ko.utils.registerEventHandler(element, "change", function () {
	            var observable = valueAccessor();
	            observable($(element).datepicker("getDate"));
	        });
	        
	        //handle disposal (if KO removes by the template binding)
	        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
	            $(element).datepicker("destroy");
	        });
	    
	    },
	    //update the control when the view model changes
	    update: function(element, valueAccessor) {
	        var value = ko.utils.unwrapObservable(valueAccessor()),
	            current = $(element).datepicker("getDate");
	        
//	        console.log('setting: ',moment(value).format('YYYY.MM.DD.'), current)
	        if (value - current !== 0) {
	            $(element).datepicker("setDate", moment(value).format('YYYY.MM.DD.'));   
	        }
	    }
	};


ko.bindingHandlers.dragupload = {
		
		init: function (element, valueAccessor, allBindingsAccessor){
			var dropAreaId = 'dropArea';
			if (valueAccessor().dropAreaId) dropAreaId = valueAccessor().dropAreaId;
				
			var dropArea = $('<div>',{'class':'dropArea', id: dropAreaId});
			var result = $('<div>',{'class':'result'});
			
			var list = [];
			var totalSize = 0;
			var totalProgress = 0;
			
			var progressBar = null;
			
			if (valueAccessor().progressBarId)
				progressBar = document.getElementById(valueAccessor().progressBarId);
			
			$(element).append(dropArea);
			$(element).append(result);
			
			// this prevents accidentaly misdrops to navigate the page somewhere else.
            $('body').bind('dragover drop',function(e){
            	console.log('drop prevented')
            	e.preventDefault();
            	return false;
            });
			
			dropArea = document.getElementById(dropAreaId);
			
			function drawProgress(perc)
			{
				if (!progressBar) return;
				
				progressBar.value = perc;
				progressBar.className = 'visible';
			}
			
		    // drag over
		    function handleDragOver(event) {    		    	
		        event.stopPropagation();
		        event.preventDefault();

		        $(dropArea).addClass('hover');

		    }

		    // drag drop
		    function handleDrop(event) {
		        event.stopPropagation();
		        event.preventDefault();
		        processFiles(event.dataTransfer.files);
		    }
		    
		    // on complete - start next file
		    function handleComplete(size) {
		        totalProgress += size;
		        drawProgress(totalProgress / totalSize);
		        uploadNext();
		        $(progressBar).removeClass('visible');
		        $(progressBar).addClass('hidden');
		    }

		    // update progress
		    function handleProgress(event) {
		        var progress = totalProgress + event.loaded;
		        drawProgress(progress / totalSize);
		    }
		    function processFiles(filelist) {
		        if (!filelist || !filelist.length || list.length) return;
		        totalSize = 0;
		        totalProgress = 0;
		        result.textContent = '';

		        for (var i = 0; i < filelist.length && i < 5; i++) {
		            list.push(filelist[i]);
		            totalSize += filelist[i].size;
		        }
		        uploadNext();
		    }
		    // upload file
		    function uploadFile(file, status) {

		        // prepare XMLHttpRequest
		        var xhr = new XMLHttpRequest();
		        xhr.open('POST', valueAccessor().target);
		        xhr.onload = function() {
		            result.innerHTML += this.responseText;
		            handleComplete(file.size);
		        };
		        xhr.onerror = function() {
		            result.textContent = this.responseText;
		            handleComplete(file.size);
		        };
		        xhr.upload.onprogress = function(event) {
		            handleProgress(event);
		        }
		        xhr.upload.onloadstart = function(event) {
		        }

		        // prepare FormData
		        var formData = new FormData();
		        formData.append('file', file);   
//		        formData.append('origFileName', file.name);   
		        if (valueAccessor().formdata)
		        {
		        	for ( var int = 0; int < valueAccessor().formdata.length; int++) {
						var dt = valueAccessor().formdata[int];
						formData.append(dt.name, dt.value);
					}
		        }    		        
		        xhr.send(formData);
		    }
		 // upload next file
		    function uploadNext() {
		        if (list.length>0) {
//		            count.textContent = list.length - 1;
		            $(dropArea).addClass('uploading');

		            var nextFile = list.shift();
//		            if (nextFile.size >= 262144) { // 256kb
//		                result.innerHTML += '<div class="f">Too big file (max filesize exceeded)</div>';
//		                handleComplete(nextFile.size);
//		            } else {
//		                uploadFile(nextFile, status);
//		            }
		            uploadFile(nextFile, status);
		        } else {
		            $(dropArea).removeClass('hover');
		            $(dropArea).removeClass('uploading');
		            if (valueAccessor().onDone)
		            	valueAccessor().onDone();
		        }
		        
		    }
			
			dropArea.addEventListener('drop', handleDrop, false);
			dropArea.addEventListener('dragover', handleDragOver, false);
		}
		
		
}            

