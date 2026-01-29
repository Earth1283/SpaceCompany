
var CheatMenu = (function () {
    var instance = {};

    // Config
    instance.speedMultiplier = 1.0;

    // Initialize
    instance.init = function () {
        console.log("Cheat Menu Initialized");
        this.bindEvents();
        this.monkeyPatchGameLoop();
    };

    // DOM Events
    instance.bindEvents = function () {
        // Toggle button
        document.getElementById('cheat-toggle-btn').addEventListener('click', function () {
            var panel = document.getElementById('cheat-panel');
            panel.classList.toggle('visible');
            var icon = this.querySelector('div');
            // Simple text toggle or icon toggle could go here
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
            // Logarithmic scale for better control? Or just simple linear for now as per plan
            // Plan said 0.1x to 100x. Slider can go from 0.1 to 100.
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
    };

    // Logic Functions
    instance.maximizeResources = function () {
        for (var id in RESOURCE) {
            var resId = RESOURCE[id];
            var storage = getStorage(resId);
            if (storage > 0) {
                // Set to storage cap
                // We need to bypass regular addResource to avoid checks if possible, 
                // but addResource is fine if we just want to fill it.
                // Actually, accessing the resource variable directly might be safer to ensure it sets exactly
                // But Game.resources.activeNotifications might trigger.
                // Let's use the game's method to be "nice"
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
            // Optional: Should we maximize level too? Maybe just unlock for now.
            // If we want to buy them, we'd need resources.
            // Let's just ensure they are unlocked so they appear.
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
        } finally {
            // Restore
            window.getResource = originalGetResource;
            Game.resources.takeResource = originalTakeResource;
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
        } finally {
            // Restore
            window.getResource = originalGetResource;
            Game.resources.takeResource = originalTakeResource;
        }
    };

    instance.timewarp = function (seconds) {
        // Warp time by simulating gains
        // We can use offline progress logic: refreshPerSec(1) then gainResources(seconds)
        // refreshPerSec updates production rates.
        refreshPerSec(1);
        gainResources(seconds);
        fixStorageRounding();
        // Also update timeplayed
        Game.statistics.add('timePlayed', seconds);
    };

    // Monkey Patching for Speed Hack
    instance.monkeyPatchGameLoop = function () {
        // We know Game.update receives delta in seconds.
        // We can wrap Game.update or Game.update_frame (which calls requestAnimationFrame).
        // Game.update_frame calls Game.update(time - Game.lastUpdateTime)

        var originalUpdate = Game.update;
        Game.update = function (delta) {
            // Apply multiplier
            var modifiedDelta = delta * instance.speedMultiplier;

            // Call original with modified delta
            // Note: delta is in milliseconds in update_frame when passed to update?
            // Wait, look at game.js: 
            // instance.update_frame = function(time) { Game.update(time - Game.lastUpdateTime); ... }
            // So delta is difference in ms.
            // Then inside Game.update: 
            // data.c(this, data.e / 1000);  <- converts to seconds for callbacks?
            // instance.fixedUpdate calls refreshPerSec(delta) where delta is (currentTime - lastFixedUpdate) / 1000 (seconds).

            // The game loop seems to have multiple update methods.
            // Game.update handles intervals (Fast Update, Slow Update).
            // Game.fixedUpdate handles resource gain separate from the render loop?
            // window.setInterval(function(){ Game.fixedUpdate(); },100); -> This is the resource loop!

            // So to speed up resources, we need to patch fixedUpdate or the delta it calculates.
            // fixedUpdate calculates delta using Date.now().

            // Let's patch fixedUpdate for resources
            return originalUpdate.apply(this, arguments);
        };

        var originalFixedUpdate = Game.fixedUpdate;
        Game.fixedUpdate = function () {
            // We can't easily change the delta calculated inside fixedUpdate because it uses new Date().getTime() local vars.
            // However, fixedUpdate calls refreshPerSec(delta) and gainResources(delta).
            // We can override those or override fixedUpdate completely.
            // Overriding fixedUpdate roughly:

            var currentTime = new Date().getTime();
            // We need to maintain our own lastTime if we want to fake time, but fixedUpdate uses this.lastFixedUpdate
            // which is member of Game.

            var realDelta = (currentTime - Game.lastFixedUpdate) / 1000;
            Game.lastFixedUpdate = currentTime; // Update the real time tracker so it doesn't drift

            var effectiveDelta = realDelta * instance.speedMultiplier;

            refreshPerSec(effectiveDelta);
            gainResources(effectiveDelta);
            fixStorageRounding();
        };

        // We also want UI animations and intervals to speed up?
        // standard Game.update handles intervals.
        // It uses data.e += delta (ms).
        // So we should patch Game.update too.

        Game.update = function (delta) {
            // delta is in ms
            originalUpdate.call(Game, delta * instance.speedMultiplier);
        };

    };

    return instance;
})();

// Auto-init when loaded? Or wait for DOM?
// Since we inject at end of body, DOM is ready.
// But we might want provided HTML to be there first.
// The HTML is injected via index.html modification, so it should be there.
window.addEventListener('load', function () {
    setTimeout(function () {
        CheatMenu.init();
    }, 1000); // Wait a bit for Game to fully init
});
