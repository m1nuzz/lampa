(function () {
    'use strict';

    // Проверяем, что Lampa готова
    if (typeof Lampa === 'undefined') {
        console.error('[macOS Players] Lampa not found');
        return;
    }

    // Добавляем переводы безопасно
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

    function startPlugin() {
        if (window.macos_players_plugin) return;
        window.macos_players_plugin = true;

        console.log('[macOS Players] v1.0.3 starting...');

        // Проверяем необходимые объекты
        if (!Lampa.Platform || !Lampa.Storage || !Lampa.Player) {
            console.error('[macOS Players] Required Lampa objects not found');
            return;
        }

        // Проверка платформы
        if (typeof Lampa.Platform.macOS !== 'function' || !Lampa.Platform.macOS()) {
            console.log('[macOS Players] Not macOS, skipping');
            return;
        }

        console.log('[macOS Players] macOS detected');

        // Добавляем настройки с проверкой
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

        // Перехватываем запуск плеера с проверкой
        if (!Lampa.Player.play || typeof Lampa.Player.play !== 'function') {
            console.error('[macOS Players] Player.play not found');
            return;
        }

        var originalPlay = Lampa.Player.play;

        Lampa.Player.play = function(data) {
            try {
                data = data || {};
                
                // Определяем тип плеера
                var playerType = 'player';
                if (data.torrent_hash) playerType = 'player_torrent';
                else if (data.iptv) playerType = 'player_iptv';
                
                var selectedPlayer = '';
                try {
                    selectedPlayer = Lampa.Storage.field(playerType) || 'inner';
                } catch (e) {
                    console.error('[macOS Players] Storage error:', e);
                    selectedPlayer = 'inner';
                }
                
                console.log('[macOS Players] Player:', selectedPlayer);
                
                // Проверяем новые плееры
                if (selectedPlayer === 'movist' || selectedPlayer === 'custom') {
                    handleExternalPlayer(data, selectedPlayer);
                    return;
                }
                
                // Для остальных - стандартное поведение
                return originalPlay.apply(this, arguments);
            } catch (e) {
                console.error('[macOS Players] Play error:', e);
                return originalPlay.apply(this, arguments);
            }
        };

        console.log('[macOS Players] Player hooked');

        function handleExternalPlayer(data, playerType) {
            try {
                console.log('[macOS Players] Launching:', playerType);
                
                var url = data.url;
                if (!url) {
                    console.error('[macOS Players] No URL');
                    if (Lampa.Noty && Lampa.Noty.show) {
                        Lampa.Noty.show('No video URL');
                    }
                    return;
                }

                url = url.replace('&preload', '&play');
                var encodedUrl = encodeURIComponent(url);
                var externalUrl = '';

                if (playerType === 'movist') {
                    externalUrl = 'movist://open?url=' + encodedUrl;
                } else if (playerType === 'custom') {
                    var scheme = '';
                    try {
                        scheme = Lampa.Storage.field('custom_player_scheme') || '';
                    } catch (e) {
                        console.error('[macOS Players] Storage error:', e);
                    }
                    
                    if (!scheme) {
                        if (Lampa.Noty && Lampa.Noty.show) {
                            Lampa.Noty.show('Configure custom scheme in settings');
                        }
                        return;
                    }
                    
                    // Обработка плейсхолдеров
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
                    try {
                        window.location.assign(externalUrl);
                        if (Lampa.Noty && Lampa.Noty.show) {
                            Lampa.Noty.show('Opening ' + playerType);
                        }
                    } catch (e) {
                        console.error('[macOS Players] Launch error:', e);
                        if (Lampa.Noty && Lampa.Noty.show) {
                            Lampa.Noty.show('Failed to launch');
                        }
                    }
                }
            } catch (e) {
                console.error('[macOS Players] External player error:', e);
            }
        }

        console.log('[macOS Players] Initialized');
    }

    // Запуск плагина
    if (window.appready) {
        startPlugin();
    } else if (Lampa.Listener && Lampa.Listener.follow) {
        Lampa.Listener.follow('app', function (e) {
            if (e && e.type === 'ready') startPlugin();
        });
    } else {
        console.error('[macOS Players] Cannot initialize - Lampa.Listener not found');
    }
})();
