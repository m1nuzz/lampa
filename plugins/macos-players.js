(function () {
    'use strict';

    if (window.macos_players_plugin) return;
    window.macos_players_plugin = true;

    console.log('[macOS Players] v1.2.0 loaded');

    // Добавляем переводы
    Lampa.Lang.add({
        macos_players_title: {
            ru: 'Внешние плееры macOS',
            en: 'External macOS Players',
            uk: 'Зовнішні плеєри macOS'
        },
        macos_players_enable: {
            ru: 'Использовать внешний плеер',
            en: 'Use external player',
            uk: 'Використовувати зовнішній плеєр'
        },
        macos_players_scheme: {
            ru: 'URL-схема плеера',
            en: 'Player URL scheme',
            uk: 'URL-схема плеєра'
        },
        macos_players_scheme_descr: {
            ru: 'Примеры: iina://weblink?url= или movist://open?url=',
            en: 'Examples: iina://weblink?url= or movist://open?url=',
            uk: 'Приклади: iina://weblink?url= або movist://open?url='
        }
    });

    // Проверка платформы
    if (typeof Lampa.Platform === 'undefined' || !Lampa.Platform.macOS || !Lampa.Platform.macOS()) {
        console.log('[macOS Players] Not macOS, disabled');
        return;
    }

    console.log('[macOS Players] macOS detected');

    // Настройки
    if (!window.lampa_settings) window.lampa_settings = {};
    
    if (!window.lampa_settings.macos_players) {
        Lampa.SettingsApi.addComponent({
            component: 'macos_players',
            name: Lampa.Lang.translate('macos_players_title'),
            icon: '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect x="5.5" y="5.5" width="37" height="33.1724" rx="1.252" fill="none" stroke="currentColor" stroke-width="3"/><line x1="27.8276" y1="5.5" x2="27.8276" y2="38.6724" stroke="currentColor" stroke-width="3"/><line x1="33.5898" y1="12.2251" x2="36.7378" y2="12.2251" stroke="currentColor" stroke-width="3"/><line x1="33.5898" y1="17.3047" x2="36.7378" y2="17.3047" stroke="currentColor" stroke-width="3"/><rect x="8.1292" y="38.6724" width="5.1034" height="3.8276" fill="none" stroke="currentColor" stroke-width="3"/><rect x="34.8687" y="38.6724" width="5.1034" height="3.8276" fill="none" stroke="currentColor" stroke-width="3"/></svg>'
        });
        window.lampa_settings.macos_players = true;
        console.log('[macOS Players] Settings component registered');
    }

    Lampa.SettingsApi.addParam({
        component: 'macos_players',
        param: {
            name: 'macos_player_enabled',
            type: 'trigger',
            default: false
        },
        field: {
            name: Lampa.Lang.translate('macos_players_enable')
        },
        onChange: function(value) {
            console.log('[macOS Players] Toggle:', value);
            if (value) {
                hookPlayer();
            }
        }
    });

    Lampa.SettingsApi.addParam({
        component: 'macos_players',
        param: {
            name: 'macos_player_scheme',
            type: 'input',
            placeholder: 'iina://weblink?url=',
            default: 'iina://weblink?url='
        },
        field: {
            name: Lampa.Lang.translate('macos_players_scheme'),
            description: Lampa.Lang.translate('macos_players_scheme_descr')
        }
    });

    console.log('[macOS Players] Settings params added');

    // Функция перехвата плеера
    var player_hooked = false;
    var originalPlay = null;

    function hookPlayer() {
        if (player_hooked) return;
        if (!Lampa.Player || typeof Lampa.Player.play !== 'function') {
            console.warn('[macOS Players] Player.play not found');
            return;
        }

        originalPlay = Lampa.Player.play;
        player_hooked = true;

        Lampa.Player.play = function(data) {
            data = data || {};
            
            var enabled = Lampa.Storage.field('macos_player_enabled');
            
            if (enabled) {
                console.log('[macOS Players] Launching external player...');
                launchExternalPlayer(data);
                return;
            }
            
            return originalPlay.apply(this, arguments);
        };

        console.log('[macOS Players] Player hooked');
    }

    function launchExternalPlayer(data) {
        var url = data.url;
        if (!url) {
            console.error('[macOS Players] No URL');
            if (Lampa.Noty) Lampa.Noty.show('No video URL');
            return;
        }

        url = url.replace('&preload', '&play');
        var scheme = Lampa.Storage.field('macos_player_scheme') || 'iina://weblink?url=';
        var encodedUrl = encodeURIComponent(url);
        var externalUrl = '';
        
        if (scheme.indexOf('${url}') > -1) {
            externalUrl = scheme.replace('${url}', encodedUrl);
        } else if (scheme.indexOf('${_url}') > -1) {
            externalUrl = scheme.replace('${_url}', encodeURI(url));
        } else if (scheme.indexOf('${furl}') > -1) {
            externalUrl = scheme.replace('${furl}', url);
        } else {
            externalUrl = scheme + encodedUrl;
        }

        if (externalUrl) {
            console.log('[macOS Players] Opening:', externalUrl);
            window.location.assign(externalUrl);
            if (Lampa.Noty) Lampa.Noty.show('Opening external player');
        }
    }

    // Если уже включено - хукаем сразу
    if (Lampa.Storage.field('macos_player_enabled')) {
        hookPlayer();
    }

    console.log('[macOS Players] Initialized');
})();
