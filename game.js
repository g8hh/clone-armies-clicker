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
        if (player.spendCookies(this.getCost(amount)) == true) {
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
                if (player.spendCookies(upgrade.cost) == true) {
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
        if (this.name == 'Cursor') { game.player.aMPC = 1; }
        this.upgrades.forEach(upgrade => {
            if (upgrade.owned == true) {
                if (upgrade.special == false) {
                    multiplier *= 2;
                    if (this.name == 'Cursor') {
                        player.aMPC *= 2;
                    }
                    if (this.name == 'Power Clicker') {
                        player.aMPC *= 4;
                    }
                } else {
                    // Special casing for all special types of upgrades
                    // There may at some point be more than just cursors here, as theres special stuff for grandmas as well.
                    switch (this.name) {
                        case 'Cursor':
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
        html += `<button onclick="game.buyBuilding('${this.name}', 1);">Buy x1</br><b>${format(this.cost)}</b></button>`
        html += `<button onclick="game.buyBuilding('${this.name}', 5);">Buy x5</br><b>${format(this.getCost(5))}</b></button>`;
        html += `<button onclick="game.buyBuilding('${this.name}', 10);">Buy x10</br><b>${format(this.getCost(10))}</b></button>`;
        html += `<button onclick="game.buyBuilding('${this.name}', 25);">Buy x25</br><b>${format(this.getCost(25))}</b></button>`;
        html += `<button onclick="game.buyBuilding('${this.name}', 50);">Buy x50</br><b>${format(this.getCost(50))}</b></button>`;
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
        let html = `<b>${this.name}</b></br>You have <b>${this.amount}</b> ${this.name.toLowerCase()}(s).</br>Each ${this.name.toLowerCase()} generates <b>${format(singleEffect)}</b> bluecoins.</br>All of your ${this.name.toLowerCase()}(s) combined generates <b>${format(this.effect)}</b> bluecoins.</br>${this.generateBuyButtons()}</br>${this.generateUpgradeButtons()}`;
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
        this.cookies = 0;
        this.cookieStats = {
            Earned: 0,
            Spent: 0,
            Clicked: 0
        }
        this.aMPF = 0;
        this.aMPC = 1;
    }

    earnCookie(amount) {
        this.cookies += amount;
        this.cookieStats.Earned += amount;
    }

    spendCookies(amount) {
        if (this.cookies >= amount) {
            this.cookies -= amount;
            this.cookieStats.Spent += amount;
            return true;
        }
    } 

    clickCookie() {
        this.earnCookie(this.aMPC);
        this.cookieStats.Clicked += this.aMPC;
    }
}

let game = {
    settings: {
        frameRate: 30,
        recalculateCPS: true,
        key: 'cookieclicker'
    },
    buildings: [
        // Generate all buildings here
        new Building('Cursor', 10, 0.1, [
            new Upgrade('Clicker I', 100, 'Autoclickers and clicking are twice as efficient', 1),
            new Upgrade('Clicker II', 500, 'Autoclickers and clicking are twice as efficient', 10),
            new Upgrade('Clicker III', 1000, 'Autoclickers and clicking are twice as efficient', 20),
            new Upgrade('Clicker IV', 5000, 'Autoclickers and clicking are twice as efficient', 35),
            new Upgrade('Clicker V', 15000, 'Autoclickers and clicking are twice as efficient', 50),
            new Upgrade('Clicker VI', 50000, 'Mouse and clickers gain +1 blue coin for every non-clicker clone owned', 75, 1),
            new Upgrade('Clicker VII', 250000, 'Mouse and clickers gain +5 blue coins for every non-clicker clone owned', 100, 5),
            new Upgrade('Clicker VIII', 1000000, 'Mouse and clickers gain +10 blue coins for every non-clicker clone owned', 125, 10),
            new Upgrade('Clicker IX', 7500000, 'Mouse and clickers gain +25 blue coins for every non-clicker clone owned', 150, 25),
            new Upgrade('Clicker X', 50000000, 'Mouse and clickers gain +100 blue coins for every non-clicker clone owned', 175, 100),
            new Upgrade('Clicker XI', 625000000, 'Mouse and clickers gain +500 blue coins for every non-clicker clone owned', 200, 500),
            new Upgrade('Clicker XII', 7500000000, 'Mouse and clickers gain +1,000 blue coins for every non-clicker clone owned', 225, 1000),
            new Upgrade('Clicker XIII', 67500000000, 'Mouse and clickers gain +10,000 blue coins for every non-clicker clone owned', 250, 10000),
            new Upgrade('Clicker XIV', 1250000000000, 'Mouse and clickers gain +100,000 blue coins for every non-clicker clone owned', 275, 100000),
            new Upgrade('Clicker XV', 20000000000000, 'Mouse and clickers gain +1 million blue coins for every non-clicker clone owned', 300, 1000000)
        ], true),
        new Building('Power Clicker', 1e306, 0, [
            new Upgrade('Power Clicks I', 50000, 'Clicking efficiency is quadrupled', 0),
            new Upgrade('Power Clicks II', 250000, 'Clicking efficiency is quadrupled', 0),
            new Upgrade('Power Clicks III', 1500000, 'Clicking efficiency is quadrupled', 0),
            new Upgrade('Power Clicks IV', 5000000, 'Clicking efficiency is quadrupled', 0),
            new Upgrade('Power Clicks V', 35000000, 'Clicking efficiency is quadrupled', 0),
            new Upgrade('Power Clicks VI', 450000000, 'Clicking efficiency is quadrupled', 0),
            new Upgrade('Power Clicks VII', 6500000000, 'Clicking efficiency is quadrupled', 0),
            new Upgrade('Power Clicks VIII', 85000000000, 'Clicking efficiency is quadrupled', 0),
            new Upgrade('Power Clicks IX', 2750000000000, 'Clicking efficiency is quadrupled', 0),
            new Upgrade('Power Clicks X', 50000000000000, 'Clicking efficiency is quadrupled', 0),
            new Upgrade('Power Clicks XI', 1500000000000000, 'Clicking efficiency is quadrupled', 0),
            new Upgrade('Power Clicks XII', 40000000000000000, 'Clicking efficiency is quadrupled', 0),
            new Upgrade('Power Clicks XIII', 600000000000000000, 'Clicking efficiency is quadrupled', 0),
            new Upgrade('Power Clicks XIV', 9000000000000000000, 'Clicking efficiency is quadrupled', 0),
            new Upgrade('Power Clicks XV', 150000000000000000000, 'Clicking efficiency is quadrupled', 0)
        ]),
        new Building('Private', 100, 1, [
            new Upgrade('Private I', 1000, 'Privates are twice as efficent', 10),
            new Upgrade('Private II', 5000, 'Privates are twice as efficent', 20),
            new Upgrade('Private III', 15000, 'Privates are twice as efficent', 30),
            new Upgrade('Private IV', 50000, 'Privates are twice as efficent', 40),
            new Upgrade('Private V', 200000, 'Privates are twice as efficent', 50),
            new Upgrade('Private VI', 500000, 'Privates are twice as efficent', 75),
            new Upgrade('Private VII', 2500000, 'Privates are twice as efficent', 100),
            new Upgrade('Private VIII', 10000000, 'Privates are twice as efficent', 125),
            new Upgrade('Private IX', 35000000, 'Privates are twice as efficent', 150),
            new Upgrade('Private X', 92500000, 'Privates are twice as efficent', 175),
            new Upgrade('Private XI', 275000000, 'Privates are twice as efficent', 200)
        ]),
        new Building('Commando', 250, 5, [
            new Upgrade('Commando I', 3500, 'Commandos are twice as efficent', 10),
            new Upgrade('Commando II', 17500, 'Commandos are twice as efficent', 20),
            new Upgrade('Commando III', 60000, 'Commandos are twice as efficent', 30),
            new Upgrade('Commando IV', 300000, 'Commandos are twice as efficent', 40),
            new Upgrade('Commando V', 1000000, 'Commandos are twice as efficent', 50),
            new Upgrade('Commando VI', 4000000, 'Commandos are twice as efficent', 75),
            new Upgrade('Commando VII', 12500000, 'Commandos are twice as efficent', 100),
            new Upgrade('Commando VIII', 50000000, 'Commandos are twice as efficent', 125),
            new Upgrade('Commando IX', 250000000, 'Commandos are twice as efficent', 150),
            new Upgrade('Commando X', 750000000, 'Commandos are twice as efficent', 175),
            new Upgrade('Commando XI', 3000000000, 'Commandos are twice as efficent', 200)
        ]),
        new Building('Cadet', 1000, 15, [
            new Upgrade('Cadet I', 12500, 'Cadets are twice as efficient', 10),
            new Upgrade('Cadet II', 50000, 'Cadets are twice as efficient', 20),
            new Upgrade('Cadet III', 225000, 'Cadets are twice as efficient', 30),
            new Upgrade('Cadet IV', 800000, 'Cadets are twice as efficient', 40),
            new Upgrade('Cadet V', 4000000, 'Cadets are twice as efficient', 50),
            new Upgrade('Cadet VI', 13000000, 'Cadets are twice as efficient', 75),
            new Upgrade('Cadet VII', 42000000, 'Cadets are twice as efficient', 100),
            new Upgrade('Cadet VIII', 175000000, 'Cadets are twice as efficient', 125),
            new Upgrade('Cadet IX', 725000000, 'Cadets are twice as efficient', 150),
            new Upgrade('Cadet X', 2250000000, 'Cadets are twice as efficient', 175),
            new Upgrade('Cadet XI', 10000000000, 'Cadets are twice as efficient', 200)
        ]),
        new Building('Infantry', 5000, 50, [
            new Upgrade('Infantry I', 60000, 'Infantrymen are twice as efficient', 10),
            new Upgrade('Infantry II', 225000, 'Infantrymen are twice as efficient', 20),
            new Upgrade('Infantry III', 750000, 'Infantrymen are twice as efficient', 30),
            new Upgrade('Infantry IV', 3000000, 'Infantrymen are twice as efficient', 40),
            new Upgrade('Infantry V', 12750000, 'Infantrymen are twice as efficient', 50),
            new Upgrade('Infantry VI', 47500000, 'Infantrymen are twice as efficient', 75),
            new Upgrade('Infantry VII', 135000000, 'Infantrymen are twice as efficient', 100),
            new Upgrade('Infantry VIII', 550000000, 'Infantrymen are twice as efficient', 125),
            new Upgrade('Infantry IX', 1750000000, 'Infantrymen are twice as efficient', 150),
            new Upgrade('Infantry X', 6500000000, 'Infantrymen are twice as efficient', 175),
            new Upgrade('Infantry XI', 35000000000, 'Infantrymen are twice as efficient', 200)
        ]),
        new Building('Marksman', 30000, 200, [
            new Upgrade('Marksman I', 400000, 'Marksmen are twice as efficient', 10),
            new Upgrade('Marksman II', 1375000, 'Marksmen are twice as efficient', 20),
            new Upgrade('Marksman III', 5250000, 'Marksmen are twice as efficient', 30),
            new Upgrade('Marksman IV', 20000000, 'Marksmen are twice as efficient', 40),
            new Upgrade('Marksman V', 90000000, 'Marksmen are twice as efficient', 50),
            new Upgrade('Marksman VI', 250000000, 'Marksmen are twice as efficient', 75),
            new Upgrade('Marksman VII', 825000000, 'Marksmen are twice as efficient', 100),
            new Upgrade('Marksman VIII', 3250000000, 'Marksmen are twice as efficient', 125),
            new Upgrade('Marksman IX', 8750000000, 'Marksmen are twice as efficient', 150),
            new Upgrade('Marksman X', 30000000000, 'Marksmen are twice as efficient', 175),
            new Upgrade('Marksman XI', 125000000000, 'Marksmen are twice as efficient', 200)
        ]),
        new Building('Rookie', 125000, 650, [
            new Upgrade('Rookie I', 1500000, 'Rookies are twice as efficient', 10),
            new Upgrade('Rookie II', 6250000, 'Rookies are twice as efficient', 20),
            new Upgrade('Rookie III', 20000000, 'Rookies are twice as efficient', 30),
            new Upgrade('Rookie IV', 100000000, 'Rookies are twice as efficient', 40),
            new Upgrade('Rookie V', 400000000, 'Rookies are twice as efficient', 50),
            new Upgrade('Rookie VI', 1300000000, 'Rookies are twice as efficient', 75),
            new Upgrade('Rookie VII', 6000000000, 'Rookies are twice as efficient', 100),
            new Upgrade('Rookie VIII', 16000000000, 'Rookies are twice as efficient', 125),
            new Upgrade('Rookie IX', 50000000000, 'Rookies are twice as efficient', 150),
            new Upgrade('Rookie X', 175000000000, 'Rookies are twice as efficient', 175),
            new Upgrade('Rookie XI', 725000000000, 'Rookies are twice as efficient', 200)
        ]),
        new Building('Defender', 750000, 2750, [
            new Upgrade('Defender I', 8250000, 'Defenders are twice as efficient', 10),
            new Upgrade('Defender II', 27500000, 'Defenders are twice as efficient', 20),
            new Upgrade('Defender III', 100000000, 'Defenders are twice as efficient', 30),
            new Upgrade('Defender IV', 350000000, 'Defenders are twice as efficient', 40),
            new Upgrade('Defender V', 1150000000, 'Defenders are twice as efficient', 50),
            new Upgrade('Defender VI', 4750000000, 'Defenders are twice as efficient', 75),
            new Upgrade('Defender VII', 22500000000, 'Defenders are twice as efficient', 100),
            new Upgrade('Defender VIII', 65000000000, 'Defenders are twice as efficient', 125),
            new Upgrade('Defender IX', 250000000000, 'Defenders are twice as efficient', 150),
            new Upgrade('Defender X', 900000000000, 'Defenders are twice as efficient', 175),
            new Upgrade('Defender XI', 3250000000000, 'Defenders are twice as efficient', 200)
        ]),
        new Building('Pyro', 2000000, 5250, [
            new Upgrade('Pyro I', 23500000, 'Pyros are twice as efficient', 10),
            new Upgrade('Pyro II', 67500000, 'Pyros are twice as efficient', 20),
            new Upgrade('Pyro III', 250000000, 'Pyros are twice as efficient', 30),
            new Upgrade('Pyro IV', 875000000, 'Pyros are twice as efficient', 40),
            new Upgrade('Pyro V', 2600000000, 'Pyros are twice as efficient', 50),
            new Upgrade('Pyro VI', 10000000000, 'Pyros are twice as efficient', 75),
            new Upgrade('Pyro VII', 32500000000, 'Pyros are twice as efficient', 100),
            new Upgrade('Pyro VIII', 122500000000, 'Pyros are twice as efficient', 125),
            new Upgrade('Pyro IX', 500000000000, 'Pyros are twice as efficient', 150),
            new Upgrade('Pyro X', 2000000000000, 'Pyros are twice as efficient', 175),
            new Upgrade('Pyro XI', 7000000000000, 'Pyros are twice as efficient', 200)
        ]),
        new Building('Butcher', 15000000, 22500, [
            new Upgrade('Butcher I', 325000000, 'Butchers are twice as efficient', 10),
            new Upgrade('Butcher II', 1450000000, 'Butchers are twice as efficient', 20),
            new Upgrade('Butcher III', 16500000000, 'Butchers are twice as efficient', 30),
            new Upgrade('Butcher IV', 59250000000, 'Butchers are twice as efficient', 40),
            new Upgrade('Butcher V', 313000000000, 'Butchers are twice as efficient', 50),
            new Upgrade('Butcher VI', 1040000000000, 'Butchers are twice as efficient', 75),
            new Upgrade('Butcher VII', 4200000000000, 'Butchers are twice as efficient', 100),
            new Upgrade('Butcher VIII', 15100000000000, 'Butchers are twice as efficient', 125),
            new Upgrade('Butcher IX', 58700000000000, 'Butchers are twice as efficient', 150),
            new Upgrade('Butcher X', 125000000000000, 'Butchers are twice as efficient', 175),
            new Upgrade('Butcher XI', 312900000000000, 'Butchers are twice as efficient', 200)
        ]),
        new Building('Sapper', 75000000, 87500, [
            new Upgrade('Sapper I', 1543750000, 'Sappers are twice as efficient', 10),
            new Upgrade('Sapper II', 6887500000, 'Sappers are twice as efficient', 20),
            new Upgrade('Sapper III', 74250000000, 'Sappers are twice as efficient', 30),
            new Upgrade('Sapper IV', 311062500000, 'Sappers are twice as efficient', 40),
            new Upgrade('Sapper V', 1565000000000, 'Sappers are twice as efficient', 50),
            new Upgrade('Sapper VI', 4357000000000, 'Sappers are twice as efficient', 75),
            new Upgrade('Sapper VII', 14700000000000, 'Sappers are twice as efficient', 100),
            new Upgrade('Sapper VIII', 56625000000000, 'Sappers are twice as efficient', 125),
            new Upgrade('Sapper IX', 190775000000000, 'Sappers are twice as efficient', 150),
            new Upgrade('Sapper X', 406250000000000, 'Sappers are twice as efficient', 175),
            new Upgrade('Sapper XI', 1230635700000000, 'Sappers are twice as efficient', 200)
        ]),
        new Building('Bazooka', 350000000, 325000, [
            new Upgrade('Bazooka I', 6500000000, 'Bazookas are twice as efficient', 10),
            new Upgrade('Bazooka II', 30000000000, 'Bazookas are twice as efficient', 20),
            new Upgrade('Bazooka III', 200000000000, 'Bazookas are twice as efficient', 30),
            new Upgrade('Bazooka IV', 850000000000, 'Bazookas are twice as efficient', 40),
            new Upgrade('Bazooka V', 3625000000000, 'Bazookas are twice as efficient', 50),
            new Upgrade('Bazooka VI', 13925000000000, 'Bazookas are twice as efficient', 75),
            new Upgrade('Bazooka VII', 66600000000000, 'Bazookas are twice as efficient', 100),
            new Upgrade('Bazooka VIII', 250000000000000, 'Bazookas are twice as efficient', 125),
            new Upgrade('Bazooka IX', 830000000000000, 'Bazookas are twice as efficient', 150),
            new Upgrade('Bazooka X', 2400000000000000, 'Bazookas are twice as efficient', 175),
            new Upgrade('Bazooka XI', 7410580000000000, 'Bazookas are twice as efficient', 200)
        ]),
        new Building('Gunner', 1350000000, 1050000, [
            new Upgrade('Gunner I', 29250000000, 'Gunners are twice as efficient', 10),
            new Upgrade('Gunner II', 185000000000, 'Gunners are twice as efficient', 20),
            new Upgrade('Gunner III', 1150000000000, 'Gunners are twice as efficient', 30),
            new Upgrade('Gunner IV', 5250000000000, 'Gunners are twice as efficient', 40),
            new Upgrade('Gunner V', 22500000000000, 'Gunners are twice as efficient', 50),
            new Upgrade('Gunner VI', 77500000000000, 'Gunners are twice as efficient', 75),
            new Upgrade('Gunner VII', 333000000000000, 'Gunners are twice as efficient', 100),
            new Upgrade('Gunner VIII', 1250000000000000, 'Gunners are twice as efficient', 125),
            new Upgrade('Gunner IX', 6500000000000000, 'Gunners are twice as efficient', 150),
            new Upgrade('Gunner X', 23750000000000000, 'Gunners are twice as efficient', 175),
            new Upgrade('Gunner XI', 60000000000000000, 'Gunners are twice as efficient', 200)
        ]),
        new Building('UPCOMING', 1e303, 1000000000, [
            new Upgrade('Medic I', 1e15, 'Medics are twice as efficient', 10),
            new Upgrade('Medic II', 5e15, 'Medics are twice as efficient', 20),
            new Upgrade('Medic III', 3e16, 'Medics are twice as efficient', 30),
            new Upgrade('Medic IV', 2e17, 'Medics are twice as efficient', 40),
            new Upgrade('Medic V', 1.5e18, 'Medics are twice as efficient', 50)
        ])
    ],
    utilities: {
        ShortNumbers: ['K', 'M', 'B', 'T', 'Q', 'QQ', 'S', 'SS', 'O', 'N', 'D', 'U', 'DD', 'TD', 'QD', 'QQD', 'SD', 'SSD', 'OD', 'ND', 'Vig', 'UVi', 'DVi', 'TVi', 'QVi', 'QQVi', 'SVi', 'SSVi', 'OVi', 'NVi', 'Trigin'],
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
            saveString += `${game.player.cookies}|${game.player.cookieStats.Earned}|${game.player.cookieStats.Spent}|${game.player.cookieStats.Clicked}-`;
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
                game.player.cookies = parseFloat(playerData[0]);
                game.player.cookieStats.Earned = parseFloat(playerData[1]);
                game.player.cookieStats.Spent = parseFloat(playerData[2]);
                game.player.cookieStats.Clicked = parseFloat(playerData[3]);
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
                game.player.cookies = 0;
                game.player.cookieStats.Earned = 0;
                game.player.cookieStats.Spent = 0;
                game.player.cookieStats.Clicked = 0;
                game.buildings.forEach(building => {
                    if (building.name != 'Cursor') {
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
                game.updateShop('Cursor');
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
            game.player.earnCookie(game.player.aMPF);
            game.saving.export();
            setTimeout(game.logic, 1000 / game.settings.frameRate);
        } else {
            game.player.earnCookie(game.player.aMPF * game.settings.frameRate);
            game.saving.export();
            setTimeout(game.logic, 1000);
        }
    },
    updateDisplays () {
        // Create temporary shorthand aliases for ease of use.
        let updateText = game.utilities.updateText;
        let format = game.utilities.formatNumber;
        let player = game.player;
        let stats = player.cookieStats;
        document.title = 'Clone Armies Clicker | ' + format(player.cookies);
        updateText('cookieDisplay', format(player.cookies));
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
    currentShop: 'Cursor',
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
        document.getElementsByClassName('cookieButton')[0].onclick = () => {
            game.player.clickCookie() 
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
