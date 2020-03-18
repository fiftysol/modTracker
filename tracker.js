let oldData;
let currentChart, trackedData, rawNames, rawTrackedData;
let staffList, communities = { };

const forumRegex = [ new RegExp(/<img src="\/img\/pays\//).source, new RegExp(/\.png".+? (\w+)<span class="nav-header-hashtag">/).source ];

const commuList = [ "xx", "gb", "fr", "br", "es", "tr", "pl", "hu", "ro", "sa", "vk", "nl", "id", "de", "ru", "cn", "ph", "lt", "jp", "fi", "il", "it", "cz", "hr", "bg", "lv", "ee" ];
const commuStr = "<td><button onclick=\"setCommunity('{0}')\"><img src=\"https://atelier801.com/img/pays/{0}.png\" alt=\"{0}\"></button></td>"

let canvas, chart_control, info, communities_table;

if (!String.format) {
	String.format = function(format)
	{
		var args = Array.prototype.slice.call(arguments, 1);
		return format.replace(/{(\d+)}/g, function(match, number)
		{
			return typeof args[number] != "undefined" ? args[number] : match;
		});
	};
}

function hexToRGBA(hex, alpha) {
    let r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16);

    return "rgba(" + r + ", " + g + ", " + b + ", 0.5)";
}

function sortObjByScoreDesc(a, b) {
	return b[1] - a[1];
}

function sortObjByScoreAsc(a, b) {
	return sortObjByScoreDesc(b, a);
}

function sortObjByNameAsc(a, b) {
	if (a > b) return 1;
	if (a < b) return -1;
	return 0;
}

function sortObjByNameDesc(a, b) {
	return sortObjByNameAsc(b, a);
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
			"maintainAspectRatio": false,
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
	chart_control.style.height = (Math.max(data.length, 7) * (4/3)) + "em";
	let chart = getChartData();
	for (let nameData of data)
	{
		chart.data.labels.push(nameData[0]);
		chart.data.datasets[0].data.push(nameData[1]);
	}

	let ctx = canvas.getContext("2d");
	return new Chart(ctx, chart);
}

async function trackData()
{
	let data = await fetch("https://discbotdb.000webhostapp.com/get?k=&e=json&f=" + (oldData ? ("modTracker_until_09-" + oldData + "-2020") : "modTracker"));
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
	if (!staffList)
	{
		staffList = await fetch("https://cors-anywhere.herokuapp.com/https://atelier801.com/staff-ajax?role=1");
		staffList = await staffList.text();
	}

	let names = await [ ...staffList.matchAll(forumRegex[0] + commu + forumRegex[1]) ];

	communities[commu] = { };
	await names.map(data => communities[commu][data[1]] = true)
}

async function setCommunity(commu)
{
	trackedData = rawTrackedData;
	if (commu != '')
	{
		await installCommunityMembers(commu);

		// Removes who is not from the specific community
		trackedData = trackedData.filter((name) => !!communities[commu][name[0]]);
		// Adds who has 0 score
		for (let name in communities[commu])
			if (!rawNames[name])
				trackedData.push([ name, 0 ]);
	}
	rebuildChart(trackedData);
}

function sortData(f)
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
	rawNames = names;

	info.innerText = totalRegisters + " registers, " + totalDays + " days";

	return rawTrackedData = trackedData = Object.keys(names).map((name) => [name, names[name]]);
}

function populateCommunityDropdown()
{
	let index = 0;
	communities_table.innerHTML = "<tr>" + commuList.map((commu) => String.format(commuStr, commu) + (++index % 4 == 0 ? "</tr><tr>" : '')).join('') + "</tr>";
}

function getElements()
{
	canvas = document.getElementById("chart");
	chart_control = document.getElementById("chart-control");
	info = document.getElementById("info");
	communities_table = document.getElementById("communities");
}

window.onload = async function()
{
	try
	{
		oldData = document.location.search.match(/[?&]old(\d+)/)[1];
	}
	catch(_)
	{
		oldData = false;
	}

	await getElements();
	let data = await trackData();
	data = await filterData(data);
	currentChart = createChart(data);
	populateCommunityDropdown();
}