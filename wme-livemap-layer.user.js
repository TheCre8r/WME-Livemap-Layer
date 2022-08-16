// ==UserScript==
// @name        WME Livemap Layer
// @namespace
// @description
// @match       /^https:\/\/(www|beta)\.waze\.com\/(?!user\/)(.{2,6}\/)?editor.*$/
// @icon
// @version     2022.08.16.01
// @grant       none
// ==/UserScript==

/* global W, I18n, OL, google, WazeWrap, $ */

(function() {
    function init() {
        log("Init Ran")
        // Add the map layer, hidden by default
        I18n.translations[I18n.currentLocale()].layers.name.livemap = 'LiveMap';

        let tileServer = {
                    production: {
                        row: {
                            url: "https://worldtiles1.waze.com/tiles/${z}/${x}/${y}.png"
                        },
                        na: {
                            url: "https://livemap-tiles1.waze.com/tiles/${z}/${x}/${y}.png"
                        },
                        il: {
                            url: "https://il-livemap-tiles1.waze.com/tiles/${z}/${x}/${y}.png"
                        }
                    }
                };
        let ActiveTS
        switch(W.Config.search.server) {
            case "/SearchServer/mozi":
                ActiveTS = tileServer.production.na.url
                break;
            case "/row-SearchServer/mozi":
                ActiveTS = tileServer.production.row.url
                break;
            case "/il-SearchServer/mozi":
                ActiveTS = tileServer.production.il.url
                break;
            default:
                // code block
        }
        var LivemapLayer = new OL.Layer.XYZ('Livemap Layer', ActiveTS, {
            isBaseLayer: false,
            uniqueName: 'livemap',
            tileSize: new OL.Size(256, 256),
            transitionEffect: 'resize',
            //zoomOffset: 12,
            displayInLayerSwitcher: true,
            opacity: localStorage.WME_livemap ? JSON.parse(localStorage.WME_livemap).opacity : 1,
            visibility: true
        });
        W.map.addLayer(LivemapLayer);

        // Add layer entry in the new layer drawer
        var displayGroupToggle = document.getElementById('layer-switcher-group_display');
        if (displayGroupToggle != null) {
            var displayGroup = displayGroupToggle.parentNode;
            while (displayGroup != null && displayGroup.className != 'group') {
                displayGroup = displayGroup.parentNode;
            }
            var togglesList = displayGroup.querySelector('.collapsible-GROUP_DISPLAY');
            var toggler = document.createElement('li');
            var checkbox = document.createElement('wz-checkbox');
            checkbox.id = 'layer-switcher-item_street_view';
            checkbox.type = 'checkbox';
            checkbox.className = 'hydrated';
            checkbox.textContent = 'Livemap Layer';
            checkbox.addEventListener('click', function(e) {
                LivemapLayer.setVisibility(e.target.checked);
            });
            toggler.appendChild(checkbox);
            togglesList.appendChild(toggler);
            displayGroupToggle.addEventListener('click', function() {
                checkbox.disabled = !displayGroupToggle.checked;
                LivemapLayer.setVisibility(checkbox.checked);
            });
        }

        // Create keyboard shortcut to toggle the imagery layer (Shift+H)
        I18n.translations[I18n.currentLocale()].keyboard_shortcuts.groups.layers.members.toggleLivemapLayer= 'Toggle Livemap Layer';
        W.accelerators.addAction('toggleLivemapLayer', { group: 'layers' });
        W.accelerators.events.register('toggleLivemapLayer', this, function() {
            LivemapLayer.setVisibility(!LivemapLayer.getVisibility());
            checkbox.checked = LivemapLayer.getVisibility();
        });
        W.accelerators._registerShortcuts({ 'S+H': 'toggleLivemapLayer' });


        // Deal with changes to the layer visibility
        LivemapLayer.setZIndex(200);
        const checkLayerZIndex = () => { if (LivemapLayer.getZIndex() !== 200) LivemapLayer.setZIndex(200); };
        setInterval(() => { checkLayerZIndex(); }, 100);
    }

    function bootstrap(e,tries = 1) {
        //log("bootstrap attempt "+ tries);
        if (W && W.map && W.model && W.loginManager.user && $ && WazeWrap.Ready) {
            if (e && e.user === null) {
                log("Error 1");
                return;
            }
            if (typeof I18n === 'undefined') {
                setTimeout(bootstrap, 300);
                log("Error 2");
                return;
            }
            if (document.getElementById('layer-switcher') === null && document.getElementById('layer-switcher-group_display') === null) {
                setTimeout(bootstrap, 200);
                log("Error 3");
                return;
            }
            if (typeof W === 'undefined' ||
                typeof W.loginManager === 'undefined') {
                setTimeout(bootstrap, 100);
                log("Error 4");
                return;
            }
            if (!W.loginManager.user) {
                W.loginManager.events.register("login", null, init);
                log("Error 5");
            }
            init();
        }
        else if (tries < 1000) {
            setTimeout(() => bootstrap(tries++), 200);
        }
    }

    bootstrap();

    function log(message) {
        console.log("WME Livemap Layer: " + message);
    }
})();
