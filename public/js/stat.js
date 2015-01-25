
$(function(){
	
	var datamonthly2 = [] 
	datamonthly.map(function(e){
		var mdata = $.grep(datamonthly2,function(dy){
			return dy.YM == e.YM
		});
		if (mdata.length){
			mdata[0].cnt+=e.cnt;
		}
		else{
			datamonthly2.push({
				YM: e.YM,
				cnt: e.cnt
			})
		}
	});
	
	var publicMonthly = datamonthly.filter(function(e){return e.top})
	var privateMonthly = datamonthly.filter(function(e){return !e.top})

	var statsmonthly = {
	    labels: publicMonthly.map(function(e){return e.YM}),
	    datasets: [       
	        {
	            label: "Public",
	            fillColor: "rgba(151,187,205,0.5)",
	            strokeColor: "rgba(151,187,205,0.8)",
	            highlightFill: "rgba(151,187,205,0.75)",
	            highlightStroke: "rgba(151,187,205,1)",
	            data: publicMonthly.map(function(e){return e.cnt})
	        },
	         {
	            label: "Private",
	            fillColor: "rgba(151,87,95,0.5)",
	            strokeColor: "rgba(151,87,95,0.8)",
	            highlightFill: "rgba(151,87,95,0.75)",
	            highlightStroke: "rgba(151,87,95,1)",
	            data: privateMonthly.map(function(e){return e.cnt})
	        },	        
	         {
	            label: "All",
	            fillColor: "rgba(151,187,95,0.5)",
	            strokeColor: "rgba(151,187,95,0.8)",
	            highlightFill: "rgba(151,187,95,0.75)",
	            highlightStroke: "rgba(151,187,95,1)",
	            data: datamonthly2.map(function(e){return e.cnt})
	        }
	        
	    ]
	};
	var datayearly = []
	datamonthly.map(function(e){
		var yeardata = $.grep(datayearly,function(dy){
			return dy.y == e.Y
		});
		if (yeardata.length){
			yeardata[0].cnt+=e.cnt;
		}
		else{
			datayearly.push({
				y: e.Y,
				cnt: e.cnt
			})
		}
	})
	var statsyearly = {
	    labels: datayearly.map(function(e){return e.y}),
	    datasets: [       
	        {
	            label: "Years",
	            fillColor: "rgba(151,187,205,0.5)",
	            strokeColor: "rgba(151,187,205,0.8)",
	            highlightFill: "rgba(151,187,205,0.75)",
	            highlightStroke: "rgba(151,187,205,1)",
	            data: datayearly.map(function(e){return e.cnt})
	        }
	    ]
	};

	var ctx = document.getElementById("graph").getContext("2d");
	var myNewChart = new Chart(ctx).Bar(statsmonthly);

	var ctx = document.getElementById("graph2").getContext("2d");
	var myNewChart2 = new Chart(ctx).Bar(statsyearly);
})
