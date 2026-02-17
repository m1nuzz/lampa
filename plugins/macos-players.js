(function () {
    'use strict';

    console.log('[macOS Players] Plugin script loaded');

    // Функция инициализации плагина
    function initPlugin() {
        // Проверяем, что Lampa готова
        if (typeof Lampa === 'undefined') {
            console.log('[macOS Players] Lampa not ready, waiting...');
            return false;
        }

        if (!Lampa.Platform || !Lampa.Storage || !Lampa.Player || !Lampa.Lang) {
            console.log('[macOS Players] Lampa components not ready, waiting...');
            return false;
        }

        if (window.macos_players_plugin) {
            console.log('[macOS Players] Already initialized');
            return true;
        }

        window.macos_players_plugin = true;
        console.log('[macOS Players] v1.0.4 initializing...');

        // Добавляем переводы
        try {
            Lampa.Lang.add({
                settings_player_custom_scheme: {
                    ru: 'URL-схема кастомного плеера',
                    en: 'Custom player URL scheme',
                    uk: 'URL-схема кастомного плеєра'
                },
                settings_player_custom_scheme_descr: {
                    ru: 'Введите URL-схему. Примеры: iina://weblink?url= или vlc://',
                    en: 'Enter URL scheme. Examples: iina://weblink?url= or vlc://',
                    uk: 'Введіть URL-схему. Приклади: iina://weblink?url= або vlc://'
                }
            });
        } catch (e) {
            console.error('[macOS Players] Lang add error:', e);
        }

        // Проверка платформы
        try {
            if (typeof Lampa.Platform.macOS !== 'function' || !Lampa.Platform.macOS()) {
                console.log('[macOS Players] Not macOS, plugin disabled');
                return true;
            }
        } catch (e) {
            console.error('[macOS Players] Platform check error:', e);
            return false;
        }

        console.log('[macOS Players] macOS detected');

        // Добавляем настройки
        if (Lampa.SettingsApi && Lampa.SettingsApi.addParam) {
            try {
                Lampa.SettingsApi.addParam({
                    component: 'player',
                    param: {
                        name: 'custom_player_scheme',
                        type: 'input',
                        placeholder: 'iina://weblink?url=',
                        default: ''
                    },
                    field: {
                        name: Lampa.Lang.translate('settings_player_custom_scheme') || 'Custom player URL scheme',
                        description: Lampa.Lang.translate('settings_player_custom_scheme_descr') || 'Enter URL scheme'
                    }
                });
                console.log('[macOS Players] Settings added');
            } catch (e) {
                console.error('[macOS Players] Settings error:', e);
            }
        }

        // Перехватываем запуск плеера
        if (Lampa.Player && typeof Lampa.Player.play === 'function') {
            var originalPlay = Lampa.Player.play;

            Lampa.Player.play = function(data) {
                try {
                    data = data || {};
                    
                    var playerType = 'player';
                    if (data.torrent_hash) playerType = 'player_torrent';
                    else if (data.iptv) playerType = 'player_iptv';
                    
                    var selectedPlayer = Lampa.Storage.field(playerType) || 'inner';
                    
                    console.log('[macOS Players] Player:', selectedPlayer);
                    
                    if (selectedPlayer === 'movist' || selectedPlayer === 'custom') {
                        handleExternalPlayer(data, selectedPlayer);
                        return;
                    }
                    
                    return originalPlay.apply(this, arguments);
                } catch (e) {
                    console.error('[macOS Players] Play error:', e);
                    return originalPlay.apply(this, arguments);
                }
            };

            console.log('[macOS Players] Player hooked');
        } else {
            console.error('[macOS Players] Player.play not found');
        }

        function handleExternalPlayer(data, playerType) {
            try {
                console.log('[macOS Players] Launching:', playerType);
                
                var url = data.url;
                if (!url) {
                    console.error('[macOS Players] No URL');
                    if (Lampa.Noty) Lampa.Noty.show('No video URL');
                    return;
                }

                url = url.replace('&preload', '&play');
                var encodedUrl = encodeURIComponent(url);
                var externalUrl = '';

                if (playerType === 'movist') {
                    externalUrl = 'movist://open?url=' + encodedUrl;
                } else if (playerType === 'custom') {
                    var scheme = Lampa.Storage.field('custom_player_scheme') || '';
                    
                    if (!scheme) {
                        if (Lampa.Noty) Lampa.Noty.show('Configure custom scheme in settings');
                        return;
                    }
                    
                    if (scheme.indexOf('${url}') > -1) {
                        externalUrl = scheme.replace('${url}', encodedUrl);
                    } else if (scheme.indexOf('${_url}') > -1) {
                        externalUrl = scheme.replace('${_url}', encodeURI(url));
                    } else if (scheme.indexOf('${furl}') > -1) {
                        externalUrl = scheme.replace('${furl}', url);
                    } else {
                        externalUrl = scheme + encodedUrl;
                    }
                }

                if (externalUrl) {
                    console.log('[macOS Players] Opening:', externalUrl);
                    window.location.assign(externalUrl);
                    if (Lampa.Noty) Lampa.Noty.show('Opening ' + playerType);
                }
            } catch (e) {
                console.error('[macOS Players] External player error:', e);
            }
        }

        console.log('[macOS Players] Initialized successfully');
        return true;
    }

    // Пытаемся инициализировать с задержкой
    var attempts = 0;
    var maxAttempts = 50; // 50 попыток * 200мс = 10 секунд
    
    var initTimer = setInterval(function() {
        attempts++;
        
        if (initPlugin()) {
            console.log('[macOS Players] Initialization completed after', attempts, 'attempts');
            clearInterval(initTimer);
        } else if (attempts >= maxAttempts) {
            console.error('[macOS Players] Initialization timeout after', attempts, 'attempts');
            clearInterval(initTimer);
        }
    }, 200);

})();
