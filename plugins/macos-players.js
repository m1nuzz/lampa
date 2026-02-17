(function () {
    'use strict';

    var manifest = {
        id: 'macos-players',
        name: 'macOS Players Extension',
        description: 'Adds Movist Pro and Custom Player support for macOS',
        version: '1.0.1'
    };

    // Добавляем переводы
    function addTranslations() {
        Lampa.Lang.add({
            settings_player_custom_scheme: {
                ru: 'URL-схема кастомного плеера',
                en: 'Custom player URL scheme',
                uk: 'URL-схема кастомного плеєра'
            },
            settings_player_custom_scheme_descr: {
                ru: 'Укажите URL-схему вашего плеера. Примеры: someplayer://open?url= или myplayer://play?file=',
                en: 'Specify your player URL scheme. Examples: someplayer://open?url= or myplayer://play?file=',
                uk: 'Вкажіть URL-схему вашого плеєра. Приклади: someplayer://open?url= або myplayer://play?file='
            }
        });
    }

    function startPlugin() {
        if (window.macos_players_plugin) return;
        window.macos_players_plugin = true;

        console.log('[macOS Players Plugin] Starting...');
        
        addTranslations();

        // Проверяем, что мы на macOS
        if (!Lampa.Platform.macOS()) {
            console.log('[macOS Players Plugin] Not macOS, plugin disabled');
            return;
        }

        console.log('[macOS Players Plugin] macOS detected, initializing...');

        // Получаем текущие значения селектора плееров
        var playerSelectors = {
            'inner': Lampa.Lang.translate('settings_param_player_inner'),
            'iina': 'IINA',
            'infuse': 'Infuse',
            'mpv': 'MPV',
            'nplayer': 'nPlayer',
            'movist': 'Movist Pro',
            'custom': 'Custom Player'
        };

        // Добавляем параметр для основного плеера
        try {
            Lampa.SettingsApi.addParam({
                component: 'player',
                param: {
                    name: 'player',
                    type: 'select',
                    values: playerSelectors,
                    default: 'inner'
                },
                field: {
                    name: Lampa.Lang.translate('settings_player_type')
                },
                onChange: function(value) {
                    console.log('[macOS Players Plugin] Player changed to:', value);
                }
            });
        } catch (e) {
            console.warn('[macOS Players Plugin] Failed to add player selector:', e);
        }

        // Добавляем параметр для IPTV плеера
        try {
            Lampa.SettingsApi.addParam({
                component: 'player',
                param: {
                    name: 'player_iptv',
                    type: 'select',
                    values: playerSelectors,
                    default: 'inner'
                },
                field: {
                    name: Lampa.Lang.translate('settings_player_iptv_type')
                }
            });
        } catch (e) {
            console.warn('[macOS Players Plugin] Failed to add IPTV player selector:', e);
        }

        // Добавляем параметр для торрент плеера
        try {
            Lampa.SettingsApi.addParam({
                component: 'player',
                param: {
                    name: 'player_torrent',
                    type: 'select',
                    values: playerSelectors,
                    default: 'inner'
                },
                field: {
                    name: Lampa.Lang.translate('settings_player_torrent_type')
                }
            });
        } catch (e) {
            console.warn('[macOS Players Plugin] Failed to add torrent player selector:', e);
        }

        // Добавляем поле для кастомной схемы
        Lampa.SettingsApi.addParam({
            component: 'player',
            param: {
                name: 'custom_player_scheme',
                type: 'input',
                placeholder: 'someplayer://open?url=',
                default: ''
            },
            field: {
                name: Lampa.Lang.translate('settings_player_custom_scheme'),
                description: Lampa.Lang.translate('settings_player_custom_scheme_descr')
            },
            onRender: function(item) {
                // Показываем только если выбран Custom Player
                var update = function() {
                    var player = Lampa.Storage.field('player');
                    var player_iptv = Lampa.Storage.field('player_iptv');
                    var player_torrent = Lampa.Storage.field('player_torrent');
                    var show = player === 'custom' || player_iptv === 'custom' || player_torrent === 'custom';
                    item.toggle(show);
                };
                update();
                Lampa.Storage.listener.follow('change', update);
            }
        });

        // Перехватываем запуск плеера
        var originalPlay = Lampa.Player.play;
        if (originalPlay) {
            Lampa.Player.play = function(data) {
                data = data || {};
                
                // Определяем тип плеера
                var playerType = 'player';
                if (data.torrent_hash) playerType = 'player_torrent';
                else if (data.iptv) playerType = 'player_iptv';
                
                var selectedPlayer = Lampa.Storage.field(playerType);
                
                console.log('[macOS Players Plugin] Play requested:', selectedPlayer, data);
                
                // Обрабатываем новые плееры
                if (selectedPlayer === 'movist' || selectedPlayer === 'custom') {
                    handleExternalPlayer(data, selectedPlayer);
                    return;
                }
                
                // Вызываем оригинальную функцию для остальных случаев
                return originalPlay.apply(this, arguments);
            };
            console.log('[macOS Players Plugin] Player.play hooked successfully');
        } else {
            console.warn('[macOS Players Plugin] Lampa.Player.play not found');
        }

        function handleExternalPlayer(data, playerType) {
            console.log('[macOS Players Plugin] Launching external player:', playerType);
            
            var url = data.url;
            if (!url) {
                console.error('[macOS Players Plugin] No URL provided');
                Lampa.Noty.show('No video URL available');
                return;
            }

            // Убираем параметр preload
            url = url.replace('&preload', '&play');
            
            var encodedUrl = encodeURIComponent(url);
            var externalUrl = '';

            if (playerType === 'movist') {
                // Movist Pro схема
                externalUrl = 'movist://open?url=' + encodedUrl;
            } else if (playerType === 'custom') {
                // Кастомная схема
                var customScheme = Lampa.Storage.field('custom_player_scheme') || '';
                
                if (!customScheme) {
                    console.error('[macOS Players Plugin] Custom scheme not configured');
                    Lampa.Noty.show('Please configure custom player URL scheme in settings');
                    return;
                }
                
                // Обрабатываем плейсхолдеры
                if (customScheme.indexOf('${url}') !== -1) {
                    externalUrl = customScheme.replace('${url}', encodedUrl);
                } else if (customScheme.indexOf('${_url}') !== -1) {
                    externalUrl = customScheme.replace('${_url}', encodeURI(url));
                } else if (customScheme.indexOf('${furl}') !== -1) {
                    externalUrl = customScheme.replace('${furl}', url);
                } else {
                    // Просто добавляем URL в конец
                    externalUrl = customScheme + encodedUrl;
                }
            }

            if (externalUrl) {
                console.log('[macOS Players Plugin] Opening URL:', externalUrl);
                
                try {
                    window.location.assign(externalUrl);
                    Lampa.Noty.show('Opening in ' + playerType);
                } catch (e) {
                    console.error('[macOS Players Plugin] Failed to open external player:', e);
                    Lampa.Noty.show('Failed to open player');
                }
            } else {
                console.error('[macOS Players Plugin] Failed to generate external URL');
                Lampa.Noty.show('Failed to launch player');
            }
        }

        console.log('[macOS Players Plugin] Initialized successfully');
    }

    // Запускаем плагин когда Lampa готова
    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (event) {
            if (event.type === 'ready') {
                startPlugin();
            }
        });
    }
})();
