let currentChart, trackedData;

function hexToRGBA(hex, alpha) {
    let r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16);

    return "rgba(" + r + ", " + g + ", " + b + ", 0.5)";
}

function sortObjByScore(a, b) {
	return b[1] - a[1];
}

function sortObjByName(a, b) {
	if (a > b) return 1;
	if (a < b) return -1;
	return 0;
}

function getChartData()
{
	return {
		"type": "horizontalBar",

		"data": {
			"labels": [ ],
			"datasets": [
				{
					"label": "Activity score",
					"data": [ ],
					backgroundColor: hexToRGBA("#7289DA")
				}
			]
		},

		"options": {
			"responsive": true,
			"maintainAspectRatio": false,
			"elements": {
				"line": {
					"fill": true,
					"borderWidth": 1,
				}
			},
			"legend": {
				"labels": {
					"fontColor": "#AAAAAA"
				}
			},
			"scales": {
				"xAxes": [{
					"ticks": {
						"fontColor": "#7289DA"
					}
				}],
				"yAxes": [{
					"ticks": {
						"fontColor": "#BABD2F",
						"fontSize": 18,
						"lineHeight": 300
					}
				}]
			}
		}
	}
}

function createChart(data)
{
	let chart = getChartData();
	for (let nameData of data)
	{
		chart.data.labels.push(nameData[0]);
		chart.data.datasets[0].data.push(nameData[1]);
	}

	let ctx = document.getElementById("chart").getContext("2d");
	return new Chart(ctx, chart);
}

async function trackData()
{
	let data = await fetch("https://discbotdb.000webhostapp.com/get?k=&e=json&f=modTracker");
	data = await data.json();
	return data;
}

function sortData(f)
{
	currentChart.destroy();
	currentChart = createChart(trackedData.sort(f));
}

async function filterData(data)
{
	let totalRegisters = 0, totalDays = 0;
	let names = { };

	for (let date in data)
	{
		totalDays++;
		totalRegisters += data[date].length;
		for (let registers of data[date])
		{
			registers = registers.split('#');
			registers.pop();

			for (let name of registers)
				if (!names[name])
					names[name] = 1;
				else
					names[name]++;
		}
	}

	document.getElementById("info").innerText = totalRegisters + " registers, " + totalDays + " days"

	return trackedData = Object.keys(names).map(function(name) {
		return [name, names[name]];
	});
}

window.onload = async function()
{
	let data = await trackData();
	data = await filterData(data);
	currentChart = createChart(data);
}