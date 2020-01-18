let currentChart, trackedData, rawTrackedData;
let communities = { };

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
					"backgroundColor": hexToRGBA("#7289DA")
				}
			]
		},

		"options": {
			"responsive": true,
			"maintainAspectRatio": true,
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
						"fontFamily": "Roboto"
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

function rebuildChart(data)
{
	currentChart.destroy();
	currentChart = createChart(data);
}

async function installCommunityMembers(commu)
{
	if (communities[commu]) return;
	let body = await fetch("https://cors-anywhere.herokuapp.com/https://atelier801.com/staff-ajax?role=1")
	body = await body.text()
	body = await [ ...body.matchAll(new RegExp(/data-search="/).source + commu + new RegExp(/".+?alt="">  (\w+?)<span class="font-s couleur-hashtag-pseudo">/).source) ];
	communities[commu] = { }
	await body.map(data => communities[commu][data[1]] = true)
}

async function setCommunity(commu)
{
	trackedData = rawTrackedData;
	if (commu != '') {
		await installCommunityMembers(commu);
		trackedData = trackedData.filter((name) => !!communities[commu][name[0]]);
	}
	rebuildChart(trackedData);
}

function sortData(f, param = null)
{
	rebuildChart(trackedData.sort(f));
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

	return rawTrackedData = trackedData = Object.keys(names).map(function(name) {
		return [name, names[name]];
	});
}

window.onload = async function()
{
	let data = await trackData();
	data = await filterData(data);
	currentChart = createChart(data);
}