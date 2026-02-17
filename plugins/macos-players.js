(function(){
    'use strict';

    if (!window.Lampa) {
        console.error('[macOS Players] Lampa not found');
        return;
    }

    var TAG = '[macOS Players]';
    var PARAM = 'macos_ext_player';

    console.log(TAG, 'v2.1.0 loading...');

    // ========================
    //   PLAYER CONFIGURATIONS
    // ========================
    var PLAYERS = {
        iina: {
            name: 'IINA',
            scheme: function(url){ return 'iina://weblink?url=' + encodeURIComponent(url); }
        },
        movist: {
            name: 'Movist Pro',
            scheme: function(url){ return 'movist://weblink?url=' + encodeURIComponent(url); }
        },
        vlc: {
            name: 'VLC',
            scheme: function(url){ return 'vlc://' + encodeURIComponent(url); }
        }
    };

    // ========================
    //   SETTINGS - SEPARATE COMPONENT
    // ========================
    function registerSettings(){
        var values = { none: 'Disabled' };
        for (var k in PLAYERS) values[k] = PLAYERS[k].name;

        // Create SEPARATE component (not adding to 'player')
        Lampa.SettingsApi.addComponent({
            component: 'external_player',
            name: 'External Player',
            icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/></svg>'
        });

        Lampa.SettingsApi.addParam({
            component: 'external_player',  // Our own component
            param: {
                name: PARAM,
                type: 'select',
                values: values,
                default: 'none'
            },
            field: {
                name: 'Player Selection',
                description: 'Choose external player for macOS'
            }
        });

        console.log(TAG, 'settings registered');
    }

    // Wait for Settings to be ready
    function initSettings(){
        if (!Lampa.SettingsApi || !Lampa.SettingsApi.addComponent) {
            console.warn(TAG, 'SettingsApi not ready, retrying...');
            setTimeout(initSettings, 1000);
            return;
        }

        try {
            registerSettings();
        } catch(e) {
            console.error(TAG, 'settings error:', e);
        }
    }

    // ========================
    //   URL EXTRACTION
    // ========================
    function extractUrl(data){
        if (!data) return '';
        if (typeof data === 'string') return data;
        return data.url || data.stream || data.file || data.link || '';
    }

    // ========================
    //   OPEN URL SCHEME
    // ========================
    function openScheme(videoUrl){
        var sel = Lampa.Storage.field(PARAM);
        if (!sel || sel === 'none' || !PLAYERS[sel]) return false;

        var scheme = PLAYERS[sel].scheme(videoUrl);
        console.log(TAG, 'opening scheme:', scheme);

        // Most reliable method on macOS - hidden link
        var a = document.createElement('a');
        a.href = scheme;
        a.style.cssText = 'position:fixed;top:-9999px';
        document.body.appendChild(a);
        a.click();
        setTimeout(function(){ 
            try { a.remove(); } catch(e){}
        }, 500);

        try { 
            Lampa.Noty.show('Opening in ' + PLAYERS[sel].name); 
        } catch(e){}

        return true;
    }

    // ========================
    //   PLAYER EVENT LISTENER
    // ========================
    function listenPlayerEvents(){
        var intercepted = false;

        Lampa.Listener.follow('player', function(e){
            if (intercepted) return;

            if (e.type === 'start' || e.type === 'play') {
                var sel = Lampa.Storage.field(PARAM);
                if (!sel || sel === 'none') return;

                var video = document.querySelector('video');
                var url = video ? (video.src || video.currentSrc) : '';

                if (!url && e.data) url = extractUrl(e.data);
                if (!url && e.object && e.object.url) url = e.object.url;

                if (url && openScheme(url)) {
                    intercepted = true;
                    setTimeout(function(){
                        try { Lampa.Player.close(); } catch(e){}
                        try { Lampa.Activity.backward(); } catch(e){}
                        intercepted = false;
                    }, 100);
                }
            }
        });

        console.log(TAG, 'player event listener added');
    }

    // ========================
    //   INITIALIZATION
    // ========================
    function initPlugin(){
        initSettings();
        listenPlayerEvents();
        console.log(TAG, 'v2.1.0 initialized');
    }

    // Wait for app ready
    if (Lampa.Listener) {
        Lampa.Listener.follow('app', function(e){
            if (e.type === 'ready') initPlugin();
        });
    }

    // Fallback
    setTimeout(function(){
        try { initPlugin(); } catch(e){ console.error(TAG, e); }
    }, 3000);

    console.log(TAG, 'script loaded');
})();
