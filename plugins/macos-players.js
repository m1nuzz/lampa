(function () {
    'use strict';

    console.log('[macOS Players] Script loaded, waiting for DOM and Lampa...');

    var pluginCode = function() {
        if (window.macos_players_plugin) {
            console.log('[macOS Players] Already initialized');
            return;
        }

        if (typeof Lampa === 'undefined' || !Lampa.Platform || !Lampa.Storage || !Lampa.Player) {
            console.log('[macOS Players] Lampa not fully ready yet');
            return;
        }

        window.macos_players_plugin = true;
        console.log('[macOS Players] v1.0.5 starting...');

        // Добавляем переводы
        if (Lampa.Lang && Lampa.Lang.add) {
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
        }

        // Проверка платформы
        if (typeof Lampa.Platform.macOS !== 'function' || !Lampa.Platform.macOS()) {
            console.log('[macOS Players] Not macOS');
            return;
        }

        console.log('[macOS Players] macOS detected');

        // Добавляем настройки
        if (Lampa.SettingsApi && Lampa.SettingsApi.addParam) {
            setTimeout(function() {
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
            }, 1000);
        }

        // Перехватываем запуск плеера
        if (Lampa.Player && typeof Lampa.Player.play === 'function') {
            var originalPlay = Lampa.Player.play;

            Lampa.Player.play = function(data) {
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
            };

            console.log('[macOS Players] Player hooked');
        }

        function handleExternalPlayer(data, playerType) {
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
                    if (Lampa.Noty) Lampa.Noty.show('Configure custom scheme');
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
        }

        console.log('[macOS Players] Initialized');
    };

    // Ждём загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            console.log('[macOS Players] DOM loaded');
            setTimeout(pluginCode, 2000);
        });
    } else {
        console.log('[macOS Players] DOM already loaded');
        setTimeout(pluginCode, 2000);
    }
})();
