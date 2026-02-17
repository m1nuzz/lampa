(function(){
    'use strict';

    console.log('[macOS Players] v2.3.0 loading...');

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
    //   SETTINGS
    // ========================
    console.log(TAG, 'Registering settings...');
    
    try {
        Lampa.SettingsApi.addComponent({
            component: 'external_player',
            name: 'External Player',
            icon: '<svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/></svg>'
        });

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
            },
            onChange: function(value) {
                console.log(TAG, 'Setting changed to:', value);
            }
        });
        console.log(TAG, 'Settings registered');
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
        console.log(TAG, 'openScheme called, current setting:', sel);
        
        if (!sel || sel === 'none') {
            console.log(TAG, 'Player disabled, not intercepting');
            return false;
        }
        
        if (!PLAYERS[sel]) {
            console.error(TAG, 'Unknown player:', sel);
            return false;
        }

        var scheme = PLAYERS[sel].scheme(videoUrl);
        console.log(TAG, '🚀 Opening scheme:', scheme);

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
        console.log(TAG, '📺 Player event received:', e.type);
        
        if (intercepted) {
            console.log(TAG, 'Already intercepted, ignoring');
            return;
        }

        if (e.type === 'start' || e.type === 'play') {
            var sel = Lampa.Storage.field(PARAM);
            console.log(TAG, 'Current setting:', sel);
            
            if (!sel || sel === 'none') {
                console.log(TAG, 'External player disabled');
                return;
            }

            console.log(TAG, 'Attempting to extract video URL...');

            // Try multiple sources
            var url = '';
            
            // Source 1: video element
            var video = document.querySelector('video');
            if (video) {
                url = video.src || video.currentSrc || '';
                console.log(TAG, 'From <video> element:', url ? url.substring(0, 100) + '...' : 'empty');
            } else {
                console.log(TAG, 'No <video> element found');
            }

            // Source 2: event data
            if (!url && e.data) {
                url = extractUrl(e.data);
                console.log(TAG, 'From event.data:', url ? url.substring(0, 100) + '...' : 'empty');
            }

            // Source 3: event object
            if (!url && e.object && e.object.url) {
                url = e.object.url;
                console.log(TAG, 'From event.object.url:', url ? url.substring(0, 100) + '...' : 'empty');
            }

            if (url) {
                console.log(TAG, '✅ Got video URL, redirecting...');
                if (openScheme(url)) {
                    intercepted = true;
                    console.log(TAG, 'Closing built-in player...');
                    setTimeout(function(){
                        try { 
                            Lampa.Player.close(); 
                            console.log(TAG, 'Player closed');
                        } catch(e){ 
                            console.error(TAG, 'Failed to close player:', e);
                        }
                        try { 
                            Lampa.Activity.backward(); 
                            console.log(TAG, 'Navigated back');
                        } catch(e){
                            console.error(TAG, 'Failed to navigate back:', e);
                        }
                        intercepted = false;
                    }, 100);
                }
            } else {
                console.warn(TAG, '❌ No video URL found in any source');
                console.log(TAG, 'Event object:', e);
            }
        }
    });

    console.log(TAG, 'v2.3.0 initialized successfully');
    console.log(TAG, 'Current setting on init:', Lampa.Storage.field(PARAM));
})();
