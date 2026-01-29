
var CheatMenu = (function () {
    var instance = {};

    // Config
    instance.speedMultiplier = 1.0;
    instance.resourceOverrides = {}; // { id: { capacity: number, productionMult: number } }

    instance.init = function () {
        console.log("Cheat Menu Initialized (Native Tab)");
        this.bindEvents();
        this.monkeyPatchGameLoop();
        this.populateResourceDropdown();
    };

    instance.bindEvents = function () {
        // Max Resources
        document.getElementById('btn-max-resources').addEventListener('click', function () {
            instance.maximizeResources();
            Game.notifySuccess('Cheated!', 'All resources maximized.');
        });

        // Unlock Tech
        document.getElementById('btn-unlock-tech').addEventListener('click', function () {
            instance.unlockAllTech();
            Game.notifySuccess('Cheated!', 'All technologies unlocked.');
        });

        // Unlock Achievements
        document.getElementById('btn-unlock-achievements').addEventListener('click', function () {
            instance.unlockAllAchievements();
            Game.notifySuccess('Cheated!', 'All achievements unlocked.');
        });

        // Unlock Wonders
        document.getElementById('btn-unlock-wonders').addEventListener('click', function () {
            instance.unlockAllWonders();
            Game.notifySuccess('Cheated!', 'All wonders activated.');
        });

        // Timewarp - Speed Slider
        var speedSlider = document.getElementById('speed-slider');
        var speedValue = document.getElementById('speed-value');

        speedSlider.addEventListener('input', function () {
            var val = parseFloat(this.value);
            instance.speedMultiplier = val;
            speedValue.textContent = val + 'x';
        });

        // Warp Buttons
        document.getElementById('btn-warp-1h').addEventListener('click', function () {
            instance.timewarp(3600);
            Game.notifySuccess('Time Warp', 'Jumped forward 1 hour.');
        });

        document.getElementById('btn-warp-1d').addEventListener('click', function () {
            instance.timewarp(86400);
            Game.notifySuccess('Time Warp', 'Jumped forward 1 day.');
        });

        document.getElementById('btn-warp-1m').addEventListener('click', function () {
            instance.timewarp(2592000); // 30 days
            Game.notifySuccess('Time Warp', 'Jumped forward 1 month.');
        });

        document.getElementById('btn-warp-1y').addEventListener('click', function () {
            instance.timewarp(31536000); // 365 days
            Game.notifySuccess('Time Warp', 'Jumped forward 1 year.');
        });

        // Resource Manager Handlers
        var resourceSelect = document.getElementById('resource-select');
        var quantityInput = document.getElementById('resource-quantity');
        var capacityInput = document.getElementById('resource-capacity');
        var prodMultInput = document.getElementById('resource-prod-mult');

        resourceSelect.addEventListener('change', function () {
            var resId = this.value;
            if (!resId) return;

            // Populate inputs
            if (resId === 'antimatter') {
                quantityInput.value = Math.floor(window.antimatter || 0);
                capacityInput.value = window.antimatterStorage || 0;
                prodMultInput.value = 1; // Production mult not easily supported for globals

            } else if (resId === 'rocketFuel') {
                quantityInput.value = Math.floor(window.rocketFuel || 0);
                capacityInput.value = "∞"; // No storage cap var found
                prodMultInput.value = 1;

            } else {
                // Standard Resource
                quantityInput.value = Math.floor(Game.resources.getResource(resId));

                // Check for overrides
                if (instance.resourceOverrides[resId] && instance.resourceOverrides[resId].capacity) {
                    capacityInput.value = instance.resourceOverrides[resId].capacity;
                } else {
                    capacityInput.value = Game.resources.getStorage(resId);
                }

                if (instance.resourceOverrides[resId] && instance.resourceOverrides[resId].productionMult) {
                    prodMultInput.value = instance.resourceOverrides[resId].productionMult;
                } else {
                    prodMultInput.value = 1;
                }
            }
        });

        document.getElementById('btn-set-quantity').addEventListener('click', function () {
            var resId = resourceSelect.value;
            if (!resId) return;
            var val = parseFloat(quantityInput.value);
            if (isNaN(val)) return;

            if (resId === 'antimatter') {
                window.antimatter = val;
                Game.notifySuccess('Resource Updated', 'Antimatter set to ' + val);
            } else if (resId === 'rocketFuel') {
                window.rocketFuel = val;
                Game.notifySuccess('Resource Updated', 'Rocket Fuel set to ' + val);
            } else {
                var current = Game.resources.getResource(resId);
                var diff = val - current;
                if (diff > 0) {
                    Game.resources.addResource(resId, diff);
                    Game.resources.takeResource(resId, -diff);
                }
                Game.notifySuccess('Resource Updated', 'Quantity set to ' + val);
            }
        });

        document.getElementById('btn-multiply-quantity').addEventListener('click', function (e) {
            var resId = resourceSelect.value;
            if (!resId) return;

            var multiplier = e.shiftKey ? 512 : 2;
            var currentVal = 0;

            if (resId === 'antimatter') {
                currentVal = window.antimatter || 0;
                window.antimatter = currentVal * multiplier;
                quantityInput.value = window.antimatter;
                Game.notifySuccess('Resource Multiplied', 'Antimatter x' + multiplier);
            } else if (resId === 'rocketFuel') {
                currentVal = window.rocketFuel || 0;
                window.rocketFuel = currentVal * multiplier;
                quantityInput.value = window.rocketFuel;
                Game.notifySuccess('Resource Multiplied', 'Rocket Fuel x' + multiplier);
            } else {
                currentVal = Game.resources.getResource(resId);
                var newVal = currentVal * multiplier;
                var diff = newVal - currentVal;

                Game.resources.addResource(resId, diff);
                quantityInput.value = Math.floor(newVal);
                Game.notifySuccess('Resource Multiplied', 'Quantity x' + multiplier);
            }
        });

        document.getElementById('btn-set-capacity').addEventListener('click', function () {
            var resId = resourceSelect.value;
            if (!resId) return;
            var val = parseFloat(capacityInput.value);

            if (resId === 'antimatter') {
                if (!isNaN(val)) {
                    window.antimatterStorage = val;
                    Game.notifySuccess('Resource Updated', 'Antimatter Capacity set to ' + val);
                }
            } else if (resId === 'rocketFuel') {
                // No storage var to update
                Game.notifyInfo('Info', 'Rocket Fuel capacity cannot be changed directly.');
            } else {
                if (!instance.resourceOverrides[resId]) instance.resourceOverrides[resId] = {};

                if (isNaN(val) || val <= 0) {
                    delete instance.resourceOverrides[resId].capacity;
                    Game.notifySuccess('Resource Updated', 'Capacity reset to default');
                } else {
                    instance.resourceOverrides[resId].capacity = val;
                    Game.notifySuccess('Resource Updated', 'Capacity override set to ' + val);
                }
            }
        });

        document.getElementById('btn-set-prod-mult').addEventListener('click', function () {
            var resId = resourceSelect.value;
            if (!resId) return;
            var val = parseFloat(prodMultInput.value);

            if (resId === 'antimatter' || resId === 'rocketFuel') {
                Game.notifyInfo('Info', 'Production multipliers for this resource are not supported yet.');
                return;
            }

            if (!instance.resourceOverrides[resId]) instance.resourceOverrides[resId] = {};

            if (isNaN(val)) {
                instance.resourceOverrides[resId].productionMult = 1;
                Game.notifySuccess('Resource Updated', 'Production multiplier reset');
            } else {
                instance.resourceOverrides[resId].productionMult = val;
                Game.notifySuccess('Resource Updated', 'Production multiplier set to ' + val + 'x');
            }
        });

        // Advanced Hacks
        document.getElementById('btn-instant-explore').addEventListener('click', function () {
            instance.instantExplore();
        });

        document.getElementById('btn-complete-dyson').addEventListener('click', function () {
            instance.completeDysonSphere();
        });

        document.getElementById('btn-build-10').addEventListener('click', function () {
            instance.infrastructureBoost(10);
        });

        document.getElementById('btn-build-100').addEventListener('click', function () {
            instance.infrastructureBoost(100);
        });
    };

    instance.populateResourceDropdown = function () {
        var select = document.getElementById('resource-select');
        // Standard Resources
        var sortedResources = [];
        for (var id in Game.resources.entries) {
            sortedResources.push({ id: id, name: Game.resources.entries[id].name });
        }
        sortedResources.sort(function (a, b) {
            return a.name.localeCompare(b.name);
        });

        sortedResources.forEach(function (res) {
            var option = document.createElement('option');
            option.value = res.id;
            option.textContent = res.name;
            select.appendChild(option);
        });

        // Special Resources
        var group = document.createElement('optgroup');
        group.label = "Special";

        var antimatterOpt = document.createElement('option');
        antimatterOpt.value = 'antimatter';
        antimatterOpt.textContent = 'Antimatter';
        group.appendChild(antimatterOpt);

        var fuelOpt = document.createElement('option');
        fuelOpt.value = 'rocketFuel';
        fuelOpt.textContent = 'Rocket Fuel';
        group.appendChild(fuelOpt);

        select.appendChild(group);
    };

    instance.maximizeResources = function () {
        for (var id in RESOURCE) {
            var resId = RESOURCE[id];
            var storage = getStorage(resId);
            if (storage > 0) {
                var current = getResource(resId);
                var needed = storage - current;
                if (needed > 0) {
                    Game.resources.addResource(resId, needed);
                }
            }
        }
    };

    instance.unlockAllTech = function () {
        for (var id in Game.tech.entries) {
            var tech = Game.tech.entries[id];
            if (!tech.unlocked) {
                tech.unlocked = true;
            }
        }
        Game.techUI.refreshResearches();
    };

    instance.unlockAllAchievements = function () {
        for (var id in Game.achievements.entries) {
            var data = Game.achievements.entries[id];
            if (data.brackets) {
                Game.achievements.unlock(id, data.brackets.length - 1);
            }
        }
    };

    instance.unlockAllWonders = function () {
        var originalGetResource = window.getResource;
        var originalTakeResource = Game.resources.takeResource;

        window.getResource = function () { return 1e100; };
        Game.resources.takeResource = function () { };

        if (Game.interstellar && Game.interstellar.entries) {
            var keys = ['comms', 'rocket', 'antimatter', 'stargate'];
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                if (!Game.interstellar.entries[key]) {
                    Game.interstellar.entries[key] = { unlocked: false, displayNeedsUpdate: false };
                }
            }
        }

        try {
            // Level 1
            if (typeof achievePreciousWonder === 'function') achievePreciousWonder();
            if (typeof activatePreciousWonder === 'function') activatePreciousWonder();

            if (typeof achieveEnergeticWonder === 'function') achieveEnergeticWonder();
            if (typeof activateEnergeticWonder === 'function') activateEnergeticWonder();

            if (typeof achieveTechWonder === 'function') achieveTechWonder();
            if (typeof activateTechWonder === 'function') activateTechWonder();

            if (typeof achieveMeteoriteWonder === 'function') achieveMeteoriteWonder();
            if (typeof activateMeteoriteWonder === 'function') activateMeteoriteWonder();

            // Level 2 (Rebuilds)
            if (typeof rebuildCommsWonder === 'function') rebuildCommsWonder();
            if (typeof rebuildRocketWonder === 'function') rebuildRocketWonder();
            if (typeof rebuildAntimatterWonder === 'function') rebuildAntimatterWonder();

            // Level 3
            if (typeof activatePortal === 'function') activatePortal();
            if (typeof rebuildStargate === 'function') rebuildStargate();

        } catch (e) {
            console.error("Error unlocking wonders:", e);
            alert("Error unlocking wonders: " + e.message);
        } finally {
            window.getResource = originalGetResource;
            Game.resources.takeResource = originalTakeResource;
        }
        Game.techUI.refreshResearches();
    };

    instance.timewarp = function (seconds) {
        refreshPerSec(1);
        gainResources(seconds);
        fixStorageRounding();
        Game.statistics.add('timePlayed', seconds);
    };

    instance.monkeyPatchGameLoop = function () {
        var originalUpdate = Game.update;
        Game.update = function (delta) {
            var modifiedDelta = delta * instance.speedMultiplier;
            return originalUpdate.apply(this, [modifiedDelta]);
        };

        var originalFixedUpdate = Game.fixedUpdate;
        Game.fixedUpdate = function () {
            var currentTime = new Date().getTime();
            var realDelta = (currentTime - Game.lastFixedUpdate) / 1000;
            Game.lastFixedUpdate = currentTime; // Update the real time tracker

            var effectiveDelta = realDelta * instance.speedMultiplier;

            refreshPerSec(effectiveDelta);
            gainResources(effectiveDelta);
            fixStorageRounding();
        };

        var originalGetStorage = Game.resources.getStorage;
        Game.resources.getStorage = function (id) {
            if (instance.resourceOverrides[id] && instance.resourceOverrides[id].capacity !== undefined) {
                return instance.resourceOverrides[id].capacity;
            }
            return originalGetStorage.apply(this, arguments);
        };

        var originalGetProduction = Game.resources.getProduction;
        Game.resources.getProduction = function (id) {
            var val = originalGetProduction.apply(this, arguments);
            if (instance.resourceOverrides[id] && instance.resourceOverrides[id].productionMult !== undefined) {
                return val * instance.resourceOverrides[id].productionMult;
            }
            return val;
        };
    };

    return instance;
})();

window.addEventListener('load', function () {
    setTimeout(function () {
        CheatMenu.init();
    }, 1000);
});
