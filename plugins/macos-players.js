(function(){
    'use strict';

    console.log('[macOS Players] v2.2.0 loading...');

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
    //   SETTINGS (SAME AS DIAGNOSTIC)
    // ========================
    console.log(TAG, 'Registering settings...');
    
    try {
        // Create component
        Lampa.SettingsApi.addComponent({
            component: 'external_player',
            name: 'External Player',
            icon: '<svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/></svg>'
        });
        console.log(TAG, 'Component registered');

        // Add player selector
        var values = { none: 'Disabled' };
        for (var k in PLAYERS) values[k] = PLAYERS[k].name;

        Lampa.SettingsApi.addParam({
            component: 'external_player',
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
        console.log(TAG, 'Param registered');

    } catch(e) {
        console.error(TAG, 'Settings error:', e);
        return;
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
        console.log(TAG, 'Opening:', scheme);

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
    console.log(TAG, 'Setting up player listener...');
    
    var intercepted = false;

    Lampa.Listener.follow('player', function(e){
        if (intercepted) return;

        if (e.type === 'start' || e.type === 'play') {
            var sel = Lampa.Storage.field(PARAM);
            if (!sel || sel === 'none') return;

            console.log(TAG, 'Player event:', e.type);

            var video = document.querySelector('video');
            var url = video ? (video.src || video.currentSrc) : '';

            if (!url && e.data) url = extractUrl(e.data);
            if (!url && e.object && e.object.url) url = e.object.url;

            if (url) {
                console.log(TAG, 'Video URL:', url);
                if (openScheme(url)) {
                    intercepted = true;
                    setTimeout(function(){
                        try { Lampa.Player.close(); } catch(e){}
                        try { Lampa.Activity.backward(); } catch(e){}
                        intercepted = false;
                    }, 100);
                }
            } else {
                console.warn(TAG, 'No video URL found');
            }
        }
    });

    console.log(TAG, 'v2.2.0 initialized successfully');
})();
