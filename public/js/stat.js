
$(function () {

	var datamonthly = [];

	var db = window.db = JSON.parse($('meta[name="db"]').attr('content'))

	db.blog.map(function (entry) {
		var date = entry.date;
		var Y = date.substr(0, 4)
		var YM = Y + date.substr(5, 2)
		datamonthly[YM] = datamonthly[YM] || { YM: YM, cnt: 0, len: 0, top: 0, Y: Y }
		datamonthly[YM].cnt += 1
		datamonthly[YM].len += entry.body.length
		if (entry.top) {
			datamonthly[YM].top++
		}
	})

	var datamonthly2 = []
	Object.keys(datamonthly).map(function (key) {
		datamonthly2.push({
			YM: datamonthly[key].YM,
			cnt: datamonthly[key].cnt,
			len: datamonthly[key].len
		})
	});

	var publicMonthly = datamonthly.filter(function (e) { return e.top })
	var privateMonthly = datamonthly.filter(function (e) { return !e.top })

	var statsmonthly = {
		labels: publicMonthly.map(function (e) { return e.YM }),
		datasets: [
			{
				label: "Public",
				fillColor: "rgba(151,187,205,0.5)",
				strokeColor: "rgba(151,187,205,0.8)",
				highlightFill: "rgba(151,187,205,0.75)",
				highlightStroke: "rgba(151,187,205,1)",
				data: publicMonthly.map(function (e) { return e.cnt })
			},
			{
				label: "Private",
				fillColor: "rgba(151,87,95,0.5)",
				strokeColor: "rgba(151,87,95,0.8)",
				highlightFill: "rgba(151,87,95,0.75)",
				highlightStroke: "rgba(151,87,95,1)",
				data: privateMonthly.map(function (e) { return e.cnt })
			},
			{
				label: "All",
				fillColor: "rgba(151,187,95,0.5)",
				strokeColor: "rgba(151,187,95,0.8)",
				highlightFill: "rgba(151,187,95,0.75)",
				highlightStroke: "rgba(151,187,95,1)",
				data: datamonthly2.map(function (e) { return e.cnt })
			}

		]
	};
	var datayearly = []
	Object.keys(datamonthly).map(function (key) {
		var yeardata = datayearly.find((yearData) => yearData.y === key.substr(0, 4))
		if (yeardata) {
			yeardata.cnt += datamonthly[key].cnt;
		}
		else {
			datayearly.push({
				y: datamonthly[key].Y,
				cnt: datamonthly[key].cnt
			})
		}
	})
	var statsyearly = {
		labels: datayearly.map(function (e) { return e.y }),
		datasets: [
			{
				label: "Years",
				fillColor: "rgba(151,187,205,0.5)",
				strokeColor: "rgba(151,187,205,0.8)",
				highlightFill: "rgba(151,187,205,0.75)",
				highlightStroke: "rgba(151,187,205,1)",
				data: datayearly.map(function (e) { return e.cnt })
			}
		]
	};

	var ctx = document.getElementById("graph").getContext("2d");
	var myNewChart = new Chart(ctx).Bar(statsmonthly);

	var ctx = document.getElementById("graph2").getContext("2d");
	var myNewChart2 = new Chart(ctx).Bar(statsyearly);
})
