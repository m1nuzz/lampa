(function(){
    'use strict';

    if (!window.Lampa) {
        console.error('[macOS Players] Lampa not found');
        return;
    }

    var TAG = '[macOS Players]';
    var PARAM = 'macos_ext_player';

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
    //   SETTINGS REGISTRATION
    // ========================
    function registerSettings(){
        var values = { none: 'Disabled' };
        for (var k in PLAYERS) values[k] = PLAYERS[k].name;

        Lampa.SettingsApi.addParam({
            component: 'player',  // Add to existing 'player' section - safer
            param: {
                name: PARAM,
                type: 'select',
                values: values,
                default: 'none'
            },
            field: {
                name: 'External Player (macOS)',
                description: 'Redirect playback to external player'
            }
        });

        console.log(TAG, 'settings registered');
    }

    // Register settings immediately
    try {
        registerSettings();
    } catch(e) {
        console.error(TAG, 'settings error:', e);
        // Fallback - on ready event
        if (Lampa.Listener) {
            Lampa.Listener.follow('app', function(ev){
                if (ev.type === 'ready') {
                    try { registerSettings(); } catch(e2) {
                        console.error(TAG, 'settings retry error:', e2);
                    }
                }
            });
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
    //   STRATEGY: PLAYER EVENT LISTENER (SAFEST)
    // ========================
    function listenPlayerEvents(){
        var intercepted = false;

        Lampa.Listener.follow('player', function(e){
            if (intercepted) return;

            // Catch the moment when URL is known
            if (e.type === 'start' || e.type === 'play') {
                var sel = Lampa.Storage.field(PARAM);
                if (!sel || sel === 'none') return;

                // Try to get URL from <video> element
                var video = document.querySelector('video');
                var url = video ? (video.src || video.currentSrc) : '';

                // Or from event data (depends on Lampa version)
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
    //   STRATEGY: SAFE PLAYER.PLAY HOOK (OPTIONAL)
    // ========================
    function hookPlayerPlay(){
        if (!Lampa.Player || typeof Lampa.Player.play !== 'function') {
            console.warn(TAG, 'Player.play not found');
            return;
        }

        var _orig = Lampa.Player.play;

        Lampa.Player.play = function(data){
            var sel = Lampa.Storage.field(PARAM);

            if (sel && sel !== 'none') {
                var videoUrl = extractUrl(data);

                if (videoUrl && openScheme(videoUrl)) {
                    // IMPORTANT: use backward() to prevent player UI initialization
                    setTimeout(function(){
                        try { Lampa.Activity.backward(); } catch(e){}
                    }, 50);
                    return;
                }
            }

            // Context MUST be Lampa.Player, otherwise internal this === window
            return _orig.apply(Lampa.Player, arguments);
        };

        console.log(TAG, 'Player.play hooked');
    }

    // ========================
    //   INITIALIZATION
    // ========================
    function initPlugin(){
        // Use event listener strategy (safest - doesn't break player chain)
        listenPlayerEvents();

        // Optionally add play() hook for instant redirect (comment out if causes issues)
        // hookPlayerPlay();

        console.log(TAG, 'v2.0.0 initialized');
    }

    // Wait for app ready
    if (Lampa.Listener) {
        Lampa.Listener.follow('app', function(e){
            if (e.type === 'ready') initPlugin();
        });
    }

    // Fallback - if 'ready' already fired
    setTimeout(function(){
        try { initPlugin(); } catch(e){ console.error(TAG, e); }
    }, 5000);

    console.log(TAG, 'script loaded');
})();
