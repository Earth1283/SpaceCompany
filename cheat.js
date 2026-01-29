
var CheatMenu = (function () {
    var instance = {};

    // Config
    instance.speedMultiplier = 1.0;
    instance.resourceOverrides = {}; // { id: { capacity: number, productionMult: number } }

    // Initialize
    instance.init = function () {
        console.log("Cheat Menu Initialized");
        this.bindEvents();
        this.monkeyPatchGameLoop();
        this.populateResourceDropdown();
    };

    // DOM Events
    instance.bindEvents = function () {
        // Toggle button
        document.getElementById('cheat-toggle-btn').addEventListener('click', function () {
            var panel = document.getElementById('cheat-panel');
            panel.classList.toggle('visible');
        });

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
            console.log("Unlock Achievements clicked");
            instance.unlockAllAchievements();
            Game.notifySuccess('Cheated!', 'All achievements unlocked.');
        });

        // Unlock Wonders
        document.getElementById('btn-unlock-wonders').addEventListener('click', function () {
            console.log("Unlock Wonders clicked");
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
        });

        document.getElementById('btn-set-quantity').addEventListener('click', function () {
            var resId = resourceSelect.value;
            if (!resId) return;
            var val = parseFloat(quantityInput.value);
            if (isNaN(val)) return;

            var current = Game.resources.getResource(resId);
            var diff = val - current;
            if (diff > 0) {
                Game.resources.addResource(resId, diff);
            } else if (diff < 0) {
                Game.resources.takeResource(resId, -diff);
            }
            Game.notifySuccess('Resource Updated', 'Quantity set to ' + val);
        });

        document.getElementById('btn-set-capacity').addEventListener('click', function () {
            var resId = resourceSelect.value;
            if (!resId) return;
            var val = parseFloat(capacityInput.value);

            if (!instance.resourceOverrides[resId]) instance.resourceOverrides[resId] = {};

            if (isNaN(val) || val <= 0) {
                // Reset to default
                delete instance.resourceOverrides[resId].capacity;
                Game.notifySuccess('Resource Updated', 'Capacity reset to default');
            } else {
                instance.resourceOverrides[resId].capacity = val;
                Game.notifySuccess('Resource Updated', 'Capacity override set to ' + val);
            }
        });

        document.getElementById('btn-set-prod-mult').addEventListener('click', function () {
            var resId = resourceSelect.value;
            if (!resId) return;
            var val = parseFloat(prodMultInput.value);

            if (!instance.resourceOverrides[resId]) instance.resourceOverrides[resId] = {};

            if (isNaN(val)) {
                instance.resourceOverrides[resId].productionMult = 1;
                Game.notifySuccess('Resource Updated', 'Production multiplier reset');
            } else {
                instance.resourceOverrides[resId].productionMult = val;
                Game.notifySuccess('Resource Updated', 'Production multiplier set to ' + val + 'x');
            }
        });
    };

    instance.populateResourceDropdown = function () {
        var select = document.getElementById('resource-select');
        // Sort resources alphabetically for easier finding
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
    };

    // Logic Functions
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
        Game.techUI.refreshResearches(); // Refresh UI
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
        // We will mock resource checks to bypass costs
        var originalGetResource = window.getResource;
        var originalTakeResource = Game.resources.takeResource;

        // Mock to return infinite resources
        window.getResource = function () { return 1e100; };
        // Mock to do nothing when taking resources
        Game.resources.takeResource = function () { };

        // Ensure interstellar data exists to prevent crashes
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
            // Restore
            window.getResource = originalGetResource;
            Game.resources.takeResource = originalTakeResource;
        }
        Game.techUI.refreshResearches(); // Refresh UI
    };

    instance.timewarp = function (seconds) {
        // Warp time by simulating gains
        refreshPerSec(1);
        gainResources(seconds);
        fixStorageRounding();
        // Also update timeplayed
        Game.statistics.add('timePlayed', seconds);
    };

    // Monkey Patching for Speed Hack & Resource Overrides
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

        // Resource Overrides
        var originalGetStorage = Game.resources.getStorage;
        Game.resources.getStorage = function (id) {
            if (instance.resourceOverrides[id] && instance.resourceOverrides[id].capacity !== undefined) {
                return instance.resourceOverrides[id].capacity;
            }
            return originalGetStorage.apply(this, arguments);
        };

        // Note: global getStorage wrapper calls Game.resources.getStorage, so this patch covers both.

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
