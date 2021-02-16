class Building {
    constructor(name, cost, effect, upgrades, locked = true) {
        this.name = name;
        this.amount = 0;
        this.originalCost = cost;
        this.cost = cost;
        this.multiplier = 1;
        this.baseEffect = effect;
        this.specialCPS = 0;
        this.effect = 0;
        this.upgrades = upgrades;
        this.locked = locked;
    }

    buy(amount) {
        let player = game.player;
        if (player.spendCoins(this.getCost(amount)) == true) {
            this.amount += amount;
            this.cost = Math.round(this.cost * Math.pow(1.15, amount));
            game.settings.recalculateCPS = true;
            let curIndex = game.utilities.getBuildingIndexByName(this.name);
            if (curIndex + 1 <= game.buildings.length - 1) {
                let nextBuilding = game.buildings[curIndex + 1];
                if (nextBuilding.locked == true) {
                    nextBuilding.locked = false;
                    game.constructShop();
                }
            }
        }
    }

    setCost() {
        this.cost = this.originalCost;
        for (let i = 0; i < this.amount; i++) {
            this.cost = Math.round(this.cost * 1.15);
        }
    }

    buyUpgrade(name) {
        let player = game.player;
        this.upgrades.forEach(upgrade => {
            if (upgrade.name == name) {
                if (player.spendCoins(upgrade.cost) == true) {
                    upgrade.owned = true;
                    game.settings.recalculateCPS = true;
                    return;
                }
            }
        });
    }

    calculateEffectOfUpgrades() {
        let player = game.player;
        let multiplier = 1;
        let buildingCount = game.utilities.getBuildingCount();
        this.specialCPS = 0;
        if (this.name == 'Private') { game.player.aMPC = 1; }
        this.upgrades.forEach(upgrade => {
            if (upgrade.owned == true) {
                if (upgrade.special == false) {
                    multiplier *= 2;
                    if (this.name == 'Private') {
                        player.aMPC *= 2;
                    }
                } else {
                    // Special casing for all special types of upgrades
                    // There may at some point be more than just cursors here, as theres special stuff for grandmas as well.
                    switch (this.name) {
                        case 'Private':
                            let nonCursorBuildingCount = buildingCount - this.amount;
                            this.specialCPS += (upgrade.special * nonCursorBuildingCount) * this.amount;
                            player.aMPC += (upgrade.special * nonCursorBuildingCount);
                    }
                }
            }
        });
        return multiplier;
    }

    getCPS() {
        this.multiplier = this.calculateEffectOfUpgrades();
        this.effect = ((this.baseEffect * this.amount) * this.multiplier) + this.specialCPS;
        return this.effect;
    }

    getCost(amount) {
        let bulkCost = this.cost;
        let tempPrice = this.cost;
        for (let i = 0; i < amount - 1; i++) {
            bulkCost += Math.round(tempPrice *= 1.15);
        }
        return bulkCost;
    }

    generateMenuButton() {
        return `<button onclick="game.updateShop('${this.name}');">${this.name}</button>`;
    }   

    generateBuyButtons() {
        let format = game.utilities.formatNumber;
        let html = '<div class="btnBuyGroup">';
        html += `<button onclick="game.buyBuilding('${this.name}', 1);">Buy x1</br><b>${format(this.cost)}</b></button>`;
        html += `<button onclick="game.buyBuilding('${this.name}', 5);">Buy x5</br><b>${format(this.getCost(5))}</b></button>`;
        html += `<button onclick="game.buyBuilding('${this.name}', 10);">Buy x10</br><b>${format(this.getCost(10))}</b></button>`;
        html += `<button onclick="game.buyBuilding('${this.name}', 25);">Buy x25</br><b>${format(this.getCost(25))}</b></button>`:
        html += `<button onclick="game.buyBuilding('${this.name}', 100);">Buy x100</br><b>${format(this.getCost(100))}</b></button>`;
        html += '</div>';
        return html;
    }

    generateUpgradeButtons() {
        let html = '';
        let notMet = false;
        this.upgrades.forEach(upgrade => {
            let format = game.utilities.formatNumber;
            if (upgrade.owned == false) {
                if (upgrade.requirementMet(this.amount)) {
                    html += `<button class="upgBtn" onclick="game.buyUpgrade('${this.name}', '${upgrade.name}')"><b>${upgrade.name}</b></br>${upgrade.desc}</br><b>${format(upgrade.cost)}</b></button>`
                } else {
                    if (notMet == false) {
                        notMet = true;
                        html += `</br><button class="upgNext">Next upgrade in <b>${upgrade.limit - this.amount}</b> more ${this.name.toLowerCase()}(s)</button>`;
                    }
                }
            }
        });
        return html;
    }

    generateShopHTML() {
        let format = game.utilities.formatNumber;
        let singleEffect = (this.baseEffect * this.multiplier)
        if (this.specialCPS > 0) {
            singleEffect += (this.specialCPS / this.amount);
        }
        let html = `<b>${this.name}</b></br>You have <b>${this.amount}</b> ${this.name.toLowerCase()}(s).</br>Each ${this.name.toLowerCase()} produces <b>${format(singleEffect)}</b> blue coin(s).</br>All of your ${this.name.toLowerCase()}(s) combined produces <b>${format(this.effect)}</b> blue coin(s).</br>${this.generateBuyButtons()}</br>${this.generateUpgradeButtons()}`;
        return html;
    }
}

class Upgrade {
    constructor(name, cost, desc, limit, special = false) {
        this.name = name;
        this.cost = cost;
        this.desc = desc;
        this.limit = limit; 
        this.owned = false;
        this.special = special;
    }

    requirementMet(amount) {
        if (amount >= this.limit) {
            return true;
        }
    }
}

class Player {
    constructor() {
        this.coins = 0;
        this.coinStats = {
            Earned: 0,
            Spent: 0,
            Clicked: 0
        }
        this.aMPF = 0;
        this.aMPC = 1;
    }

    earnCoin(amount) {
        this.coins += amount;
        this.coinStats.Earned += amount;
    }

    spendCoins(amount) {
        if (this.coins >= amount) {
            this.coins -= amount;
            this.coinStats.Spent += amount;
            return true;
        }
    } 

    clickCoin() {
        this.earnCoin(this.aMPC);
        this.coinStats.Clicked += this.aMPC;
    }
}

let game = {
    settings: {
        frameRate: 30,
        recalculateCPS: true,
        key: 'cloneclicker'
    },
    buildings: [
        // Generate all buildings here
        new Building('Private', 10, 1, [
            new Upgrade('Private II', 1000, 'Privates are twice as strong', 1),
            new Upgrade('Private III', 10000, 'Privates are twice as strong', 1),
            new Upgrade('Private IV', 75000, 'Privates are twice as strong', 1),
            new Upgrade('Private V', 500000, 'Privates are twice as strong', 1),
            new Upgrade('Super Private', 8000000, 'Privates are twice as strong', 1)
        ]),
        new Building('Commando', 25, 5, [
            new Upgrade('Commando II', 10000, 'Commandos are twice as strong', 1),
            new Upgrade('Commando III', 150000, 'Commandos are twice as strong', 1),
            new Upgrade('Commando IV', 1250000, 'Commandos are twice as strong', 1),
            new Upgrade('Commando V', 7250000, 'Commandos are twice as strong', 1),
            new Upgrade('Super Commando', 75000000, 'Commandos are twice as strong', 1)
        ]),
        new Building('Cadet', 100, 10, [
            new Upgrade('Cadet II', 30000, 'Cadets are twice as strong', 1),
            new Upgrade('Cadet III', 250000, 'Cadets are twice as strong', 1),
            new Upgrade('Cadet IV', 1750000, 'Cadets are twice as strong', 1),
            new Upgrade('Cadet V', 10000000, 'Cadets are twice as strong', 1),
            new Upgrade('Super Cadet', 100000000, 'Cadets are twice as strong', 1)
        ]),
        new Building('Infantry', 500, 40, [
            new Upgrade('Infantry II', 125000, 'Infantrymen are twice as strong', 1),
            new Upgrade('Infantry III', 750000, 'Infantrymen are twice as strong', 1),
            new Upgrade('Infantry IV', 5000000, 'Infantrymen are twice as strong', 1),
            new Upgrade('Infantry V', 50000000, 'Infantrymen are twice as strong', 1),
            new Upgrade('Super Infantry', 300000000, 'Infantrymen are twice as strong', 1)
        ]),
        new Building('Marksman', 2000, 100, [
            new Upgrade('Marksman II', 500000, 'Marksmen are twice as strong', 1),
            new Upgrade('Marksman III', 2000000, 'Marksmen are twice as strong', 1),
            new Upgrade('Marksman IV', 25000000, 'Marksmen are twice as strong', 1),
            new Upgrade('Marksman V', 150000000, 'Marksmen are twice as strong', 1),
            new Upgrade('Super Marksman', 1000000000, 'Marksmen are twice as strong', 1)
        ]),
        new Building('Rookie', 8000, 300, [
            new Upgrade('Rookie II', 2500000, 'Rookies are twice as strong', 1),
            new Upgrade('Rookie III', 7500000, 'Rookies are twice as strong', 1),
            new Upgrade('Rookie IV', 75000000, 'Rookies are twice as strong', 1),
            new Upgrade('Rookie V', 500000000, 'Rookies are twice as strong', 1),
            new Upgrade('Super Rookie', 3500000000, 'Rookies are twice as strong', 1)
        ]),
        new Building('Defender', 60000, 1300, [
            new Upgrade('Defender II', 15000000, 'Defenders are twice as strong', 1),
            new Upgrade('Defender III', 65000000, 'Defenders are twice as strong', 1),
            new Upgrade('Defender IV', 275000000, 'Defenders are twice as strong', 1),
            new Upgrade('Defender V', 2000000000, 'Defenders are twice as strong', 1),
            new Upgrade('Super Defender', 12500000000, 'Defenders are twice as strong', 1)
        ]),
        new Building('Pyro', 400000, 7700, [
            new Upgrade('Pyro II', 60000000, 'Pyros are twice as strong', 1),
            new Upgrade('Pyro III', 280000000, 'Pyros are twice as strong', 1),
            new Upgrade('Pyro IV', 1400000000, 'Pyros are twice as strong', 1),
            new Upgrade('Pyro V', 9000000000, 'Pyros are twice as strong', 1),
            new Upgrade('Super Pyro', 50000000000, 'Pyros are twice as strong', 1)
        ])
    ],
    utilities: {
        ShortNumbers: ['', 'M', 'B', 'T', 'Q', 'QQ', 'S', 'SS', 'O', 'N', 'D', 'U', 'DD', 'TD', 'QD', 'QQD', 'SD', 'SSD', 'OD', 'ND', 'Vigin'],
        updateText (className, text) {
            let elements = document.getElementsByClassName(className);
            for(var i in elements) {
                elements[i].innerHTML = text;
            }
        },
        formatNumber (number) {
            let formatted = '';
            if (number >= 1000) {
                for (let i = 0; i < game.utilities.ShortNumbers.length; i++) {
                    let divider = Math.pow(10, (i + 1) * 3)
                    if (number >= divider) {
                        formatted = (Math.trunc((number / divider) * 1000) / 1000).toFixed(3) + ' ' + game.utilities.ShortNumbers[i];
                    }
                }
                return formatted;
            }
            return (Math.trunc(number * 10) / 10).toFixed(1);
        },
        getBuildingByName (name) {
            let correctBuilding = null;
            game.buildings.forEach(building => {
                if (building.name == name) {
                    correctBuilding = building;
                    return;
                }
            });
            return correctBuilding;
        },
        getBuildingIndexByName (name) {
            for (let i = 0; i < game.buildings.length - 1; i++) {
                let curBuilding = game.buildings[i];
                if (curBuilding.name == name) {
                    return i;
                }
            }
        },
        getBuildingCount () {
            let amount = 0;
            game.buildings.forEach(building => {
                amount += building.amount;
            });
            return amount;
        },
        stringToBool (string) {
            switch (string) {
                case 'true':
                    return true;
                case 'false':
                    return false;
            }
        }
    },
    saving: {
        export () {
            let saveString = '';
            saveString += `${game.player.coins}|${game.player.coinStats.Earned}|${game.player.coinStats.Spent}|${game.player.coinStats.Clicked}-`;
            let first = true;
            game.buildings.forEach(building => {
                if (first) {
                    first = false;
                    saveString += `${building.amount}|${building.locked}|`;
                } else {
                    saveString += `#${building.amount}|${building.locked}|`;
                }
                building.upgrades.forEach(upgrade => {
                    saveString += `${upgrade.owned}:`;
                });
                saveString = saveString.slice(0, -1);
            });
            game.saving.saveToCache(premagic(saveString));
            return premagic(saveString);
        },
        import (saveString) {
            saveString = magic(saveString);
            if (saveString != false) {
                saveString = saveString.split('-');
                game.saving.loadPlayer(saveString[0]);
                game.saving.loadBuildings(saveString[1]);
                game.settings.recalculateCPS = true;
                game.updateShop(game.currentShop);
            } else {
                alert('Something wasn\'t quite right there, unfortunately your save could not be loaded.');
            }
        },
        saveToCache (saveString) {
            try {  return window.localStorage.setItem(game.settings.key, saveString); } catch { console.log('Problem saving to cache'); }
        },
        getSaveFromCache () {
            try {  return window.localStorage.getItem(game.settings.key); } catch { console.log('Problem loading data from cache, probably doesn\'t exist'); }
        },
        loadPlayer (playerData) {
            playerData = playerData.split('|');
            try {
                game.player.coins = parseFloat(playerData[0]);
                game.player.coinStats.Earned = parseFloat(playerData[1]);
                game.player.coinStats.Spent = parseFloat(playerData[2]);
                game.player.coinStats.Clicked = parseFloat(playerData[3]);
            } catch { console.log('Something went wrong whilst loading player data, likely from an older version and not to worry.') }
        },
        loadBuildings (buildingData) {
            buildingData = buildingData.split('#');
            try {
                for (let i = 0; i < game.buildings.length; i++) {
                    let savedBuilding = buildingData[i];
                    let nonUpgrade = savedBuilding.split('|');
                    let building = game.buildings[i];
                    building.amount = parseFloat(nonUpgrade[0]);
                    building.setCost();
                    building.locked = game.utilities.stringToBool(nonUpgrade[1]);
                    let j = 0;
                    let upgrades = nonUpgrade[2].split(':');
                    building.upgrades.forEach(upgrade => {
                        upgrade.owned = game.utilities.stringToBool(upgrades[j]);
                        j++;
                    });
                }
            } catch { console.log('Something went wrong whilst loading building data, likely from an older version and not to worry.') }
        },
        wipeSave() {
            if (confirm('Are you sure you want to wipe your save? This cannot be reversed!')) {
                game.player.coins = 0;
                game.player.coinStats.Earned = 0;
                game.player.coinStats.Spent = 0;
                game.player.coinStats.Clicked = 0;
                game.buildings.forEach(building => {
                    if (building.name != 'Private') {
                        building.locked = true;
                    }
                    building.amount = 0;
                    building.effect = 0;
                    building.specialCPS = 0;
                    building.setCost();
                    for(var i in building.upgrades) {
                        building.upgrades[i].owned = false;
                    }
                });
                game.constructShop();
                game.updateShop('Private');
                game.settings.recalculateCPS = true;
            }
        },
        importing: false,
        openBox(type) {
            let container = document.getElementsByClassName('importExportBox')[0];
            let box = document.getElementById('saveBox');
            switch(type) {
                case 'import':
                    this.importing = true;
                    container.style.visibility = 'visible';
                    box.removeAttribute('readonly');
                    box.value = '';
                    return;
                case 'export':
                    let saveString = this.export();
                    container.style.visibility = 'visible';
                    box.value = saveString;
                    box.setAttribute('readonly', true);
                    return;
            }
        },
        closeBox () {
            document.getElementsByClassName('importExportBox')[0].style.visibility = 'hidden';
            if (this.importing) {
                let box = document.getElementById('saveBox');
                this.import(box.value);
                box.value = '';
            }
        }
    },
    player: new Player(),
    logic () {
        game.updateDisplays();
        // Only recalculate it when needed, saves on some processing power because this can turn out to be quite a lot of maths.
        if (game.settings.recalculateCPS == true) {
            let CPS = 0;
            game.buildings.forEach(building => {
                CPS += building.getCPS();
            });
            game.settings.recalculateCPS = false;
            game.player.aMPF = CPS / game.settings.frameRate;
            game.updateShop(game.currentShop);
        }
        if (document.hasFocus()) {
            game.player.earnCoin(game.player.aMPF);
            game.saving.export();
            setTimeout(game.logic, 1000 / game.settings.frameRate);
        } else {
            game.player.earnCoin(game.player.aMPF * game.settings.frameRate);
            game.saving.export();
            setTimeout(game.logic, 1000);
        }
    },
    updateDisplays () {
        // Create temporary shorthand aliases for ease of use.
        let updateText = game.utilities.updateText;
        let format = game.utilities.formatNumber;
        let player = game.player;
        let stats = player.coinStats;
        document.title = 'Clone Armies Clicker | ' + format(player.coins);
        updateText('cookieDisplay', format(player.coins));
        updateText('cpcDisplay', format(player.aMPC));
        updateText('cpsDisplay', format(player.aMPF * game.settings.frameRate));
        updateText('earnedDisplay', format(stats.Earned));
        updateText('spentDisplay', format(stats.Spent));
        updateText('clickedDisplay', format(stats.Clicked));
    },
    constructShop () {
        let buildings = game.buildings;
        let finalHtml = '';
        buildings.forEach(building => {
            if (building.locked == false) {
                finalHtml += building.generateMenuButton();
            }
        });
        game.utilities.updateText('shopList', finalHtml);
    },
    currentShop: 'Private',
    updateShop (name) {
        game.currentShop = name;
        let finalHtml = '';
        let building = game.utilities.getBuildingByName(name);
        finalHtml += building.generateShopHTML();
        game.utilities.updateText('shop', finalHtml);
    },
    buyBuilding (name, amount) {
        let building = game.utilities.getBuildingByName(name);
        building.buy(amount);
    },
    buyUpgrade (buildingName, upgrade) {
        let building = game.utilities.getBuildingByName(buildingName);
        building.buyUpgrade(upgrade);
    },
    start () {
        // This prevents the user from holding down enter to click the cookie very quickly.
        window.addEventListener('keydown', () => {
            if (event.keyCode == 13 || event.keyCode == 32) {
                event.preventDefault();
                return false;
            }
        });

        // This enables the cookie clicking process.
        document.getElementsByClassName('coinButton')[0].onclick = () => {
            game.player.clickCoin() 
        };

        let localSave = game.saving.getSaveFromCache();
        if (localSave) {
            game.saving.import(localSave);
        } else {
            console.log('No cache save found');
        }

        game.constructShop();
        game.logic();
    }
}

game.start();
