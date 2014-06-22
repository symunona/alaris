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

            