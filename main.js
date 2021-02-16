function openTab(evt, pageName){
	var i, tabcontent, tablinks
	tabcontent = document.getElementsByClassName("tabcontent")
	for(i = 0; i < tabcontent.length; i++) {
		tabcontent[i].style.display = "none";
	}

	tablinks = document.getElementsByClassName("tablinks");
	for(i = 0; i < tablinks.length; i++) {
		tablinks[i].className = tablinks[i].className.replace(" active", "");
	}

	document.getElementById(pageName).style.display = "block";
	evt.currentTarget.className += " active";
}
/*
----Beginign of MainPage section of the javascript----
*/
//Initialize all global variables that are relevent to the game
var totalCPS = 0;
var coins = 0;
var coinstext = document.getElementById("coins");
var clickStr = 1;
var clickCost = 10;
var refreshRateVar = 100;
var privatePrice = 10;
var privateTotal = 0;
var privateCPS = 1;
var commandoPrice = 25:
var commandoTotal = 0;
var commandoCPS = 5;
var cadetPrice = 100;
var cadetTotal = 0;
var cadetCPS = 10;
var privateUpgrade = false

function loadSave() { //loads the saved values from local storage
	if(localStorage.bluecoins) { //checks for a local save
		savedCoins = localStorage.bluecoins;
		coins = parseInt(savedCoins); clickStr = parseInt(localStorage.clickStr); clickCost = parseInt(localStorage.clickCost);
		loadPrivates();
		loadCommandos();
		loadCadets();
	}
	else {

	}
}

function loadPrivates() { //loads privates when loading the game
	savedPrivates = localStorage.privates;
	privateTotal = parseInt(savedPrivates);
	privatePrice = Math.ceil(10 * 1.1**privateTotal);
	privateUpgrade = (localStorage.privateUpgrade == 'true');
	console.log(privateUpgrade)
	if(privateUpgrade){
		privateCPS = privateCPS * 2;
	}
	document.getElementById("private").innerHTML = 'Clone Private for ' + privatePrice + ' Blue Coins';
	document.getElementById("privateAmount").innerHTML = 'You cloned ' + privateTotal + ' Privates';
	document.getElementById("privateProduce").innerHTML = 'Earning ' + (privateCPS * privateTotal).toFixed(1) + ' Blue Coins per second';
}

function loadCommandos() { //loads commandos when loading the game
	savedCommandos = localStorage.commandos;
	commandoTotal = parseInt(savedCommandos);
	commandoPrice = Math.ceil(25 * 1.3**commandoTotal);
	document.getElementById("commando").innerHTML = 'Clone Commando for ' + commandoPrice + ' Blue Coins';
	document.getElementById("commandoAmount").innerHTML = 'You cloned ' + commandoTotal + ' Commandos';
	document.getElementById("commandoProduce").innerHTML = 'Earning ' + (commandoCPS * commandoTotal).toFixed(1) + ' Blue Coins per second';
}

function loadCadets() { //loads cadets when loading the game
	savedCadets = localStorage.cadets;
	cadetTotal = parseInt(savedCadets);
	cadetPrice = Math.ceil(100 * 1.25**cadetTotal);
	document.getElementById("cadet").innerHTML = 'Clone Cadet for ' + cadetPrice + ' Blue Coins';
	document.getElementById("cadetAmount").innerHTML = 'You cloned ' + cadetTotal + ' Cadets';
	document.getElementById("cadetProduce").innerHTML = 'Earning ' + (cadetCPS * cadetTotal).toFixed(1) + ' Blue Coins per second';
}

function addCoins() { //function for clicking
	coins = coins + clickStr;
	//console.log(getCookie("coins"))l;
	document.getElementById("coins").innerHTML = coins.toFixed(1) + ' Blue Coins';
}

function buyPrivate() { //function for cloning more privates
	if(coins >=privatePrice) {
		coins = coins - commandoPrice;
		privateTotal = privateTotal + 1;
		privatePrice = Math.ceil(10 * 1.1**privateTotal);
		document.getElementById("private").innerHTML = 'Clone Private for ' + privatePrice + ' Blue Coins';
		document.getElementById("privateAmount").innerHTML = 'You cloned ' + privateTotal + ' Privates';
    document.getElementById("privateProduce").innerHTML = 'Earning ' + (privateCPS * privateTotal).toFixed(1) + ' Blue Coins per second';
	}
}

function buyCommando() { //function for cloning more commandos
	if(coins >=commandoPrice) {
		coins = coins - commandoPrice;
		commandoTotal = commandoTotal + 1;
		commandoPrice = Math.ceil(25 * 1.3**commandoTotal);
		document.getElementById("commando").innerHTML = 'Clone Commando for ' + commandoPrice + ' Blue Coins';
		document.getElementById("commandoAmount").innerHTML = 'You cloned ' + commandoTotal + ' Commandos';
		document.getElementById("commandoProduce").innerHTML = 'Earning ' + (commandoCPS * commandoTotal).toFixed(1) + ' Blue Coins per second';
	}
}

function buyCadet() { //function for cloning more cadets
	if(coins >=cadetPrice) {
		coins = coins - cadetPrice;
		cadetTotal = cadetTotal + 1;
		cadetPrice = Math.ceil(100 * 1.25**cadetTotal);
		document.getElementById("cadet").innerHTML = 'Clone Cadet for ' + cadetPrice + ' Blue Coins';
		document.getElementById("cadetAmount").innerHTML = 'You cloned ' + cadetTotal + ' Cadets';
		document.getElementById("cadetProduce").innerHTML = 'Earning ' + (cadetCPS * cadetTotal).toFixed(1) + ' Blue Coins per second';
	}
}

window.setInterval(function() { //Adds together all the Lines of Code and then updates the elements in the HTML
	  coins = (coins + (privateTotal * privateCPS) + (commandoTotal * commandoCPS) + (cadetTotal * cadetCPS));
		totalCPS = ((privateTotal * privateCPS) + (commandoTotal * commandoCPS) + (cadetTotal * cadetCPS));
		document.getElementById("coinspersec").innerHTML = totalCPS.toFixed(1) + ' Blue Coins per second':
		document.getElementById("coins").innerHTML = coins.toFixed(1) + ' Blue Coins';
		document.cookie = "coins=" + coins.toFixed(1);
}, 1000); // dont change this to anything other than 1000 lol

window.setInterval(function() {
	document.getElementById("coins").innerHTML = coins.toFixed(1) + ' Blue Coins';
}, refreshRateVar);

window.setInterval(function() { //Saves game data every 15 seconds
	localStorage.setItem("bluecoins", coins);
	localStorage.setItem("privates", privateTotal);
	localStorage.setItem("commandos", commandoTotal);
	localStorage.setItem("cadets", cadetTotal);
	console.log("Game Saved");
}, 15000);


/*
----This section represents the Upgrades page of the javascript----
*/
function checkUpgrades() {
	console.log(privateUpgrade);
	if(privateTotal >= 1 && privateUpgrade != true) {
		var privateUpgradeElements = document.getElementsByClassName("privateUpgrade");
		for (i = 0; i < privateUpgradeElements.length; i++){
			privateUpgradeElements[i].style.display = "inline";
		}
	}
}

function upgradePrivate() {
	var privateUpgradeCost = 1000
	if(coins >= privateUpgradeCost) {
		coins = coins - privateUpgradeCost;
		privateUpgrade = true;
		localStorage.setItem("privateUpgrade", true);
		privateCPS = privateCPS * 2;
		var privateUpgradeElements = document.getElementsByClassName("privateUpgrade");
		for (i = 0; i < privateUpgradeElements.length; i++){
			privateUpgradeElements[i].style.display = "none";
		}
	}
}

function clickHarder() { // Upgrade click ability

	if (coins >= clickCost) {
    coins = coins - clickCost;
		clickStr = clickStr * 2;
		clickCost = clickCost* 3;
		localStorage.setItem("clickStr", clickStr); localStorage.setItem("clickCost", clickCost);
		document.getElementById("clickCostDisplay").innerHTML = "Current level: " + clickStr.toFixed(1) + " Cost for next level: " + clickCost.toFixed(1);
	}
}

/*
	This section represents the functions for the options tab
*/

function resetGame() {
	if(confirm("Do you want to reset the game?")){
		localStorage.clear();
		resetVariables();
		location.reload();
	}
	else {

	}
}

function resetVariables(){
	var totalCPS = 0;
	var coins = 0;
	var coinstext = document.getElementById("coins");
	var clickStr = 1;
	var clickCost = 10;
	var refreshRateVar = 100;
	var privatePrice = 10;
	var privateTotal = 0;
	var privateCPS = 1;
	var commandoPrice = 25:
	var commandoTotal = 0;
	var commandoCPS = 5;
	var cadetPrice = 100;
	var cadetTotal = 0;
	var cadetCPS = 10;
	var privateUpgrade = false
}

function refreshRate() {
	// hey should you use the same name for functions and variables? maybe
	refreshRateVar = parseInt(document.getElementById("refreshRate").value);
	document.getElementById("refreshRate").value;
}
