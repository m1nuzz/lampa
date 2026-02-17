(function() {
    'use strict';

    // Информация о плагине
    var manifest = {
        id: 'macos-players',
        name: 'macOS Players Extension',
        description: 'Adds support for Movist Pro and Custom Player on macOS',
        version: '1.0.0',
        author: '@m1nuzz'
    };

    // Языковые переводы
    var translations = {
        ru: {
            settings_player_custom_scheme: 'URL-схема кастомного плеера',
            settings_player_custom_scheme_descr: 'Укажите URL-схему вашего плеера. Примеры: someplayer://open?url= или mycustomplayer://play?file=',
            settings_player_custom_placeholder: 'Например: someplayer://open?url='
        },
        en: {
            settings_player_custom_scheme: 'Custom player URL scheme',
            settings_player_custom_scheme_descr: 'Specify your player URL scheme. Examples: someplayer://open?url= or mycustomplayer://play?file=',
            settings_player_custom_placeholder: 'For example: someplayer://open?url='
        },
        uk: {
            settings_player_custom_scheme: 'URL-схема кастомного плеєра',
            settings_player_custom_scheme_descr: 'Вкажіть URL-схему вашого плеєра. Приклади: someplayer://open?url= або mycustomplayer://play?file=',
            settings_player_custom_placeholder: 'Наприклад: someplayer://open?url='
        }
    };

    // Инициализация плагина
    function init() {
        console.log('[macOS Players Plugin] Initializing...');
        
        // Добавляем переводы
        addTranslations();
        
        // Модифицируем настройки плеера
        modifyPlayerSettings();
        
        // Перехватываем запуск плеера
        hookPlayerLaunch();
        
        console.log('[macOS Players Plugin] Initialized successfully');
    }

    // Добавление переводов
    function addTranslations() {
        var currentLang = Lampa.Storage.get('language', 'ru');
        
        if (translations[currentLang]) {
            for (var key in translations[currentLang]) {
                if (!Lampa.Lang[key]) {
                    Lampa.Lang[key] = translations[currentLang][key];
                }
            }
        }
    }

    // Модификация настроек плеера
    function modifyPlayerSettings() {
        // Проверяем, что мы на macOS
        if (!Lampa.Platform.macOS()) {
            console.log('[macOS Players Plugin] Not macOS, skipping...');
            return;
        }

        // Добавляем новые опции в список плееров
        var playerTypes = ['player', 'player_iptv', 'player_torrent'];
        
        playerTypes.forEach(function(playerType) {
            // Получаем текущие настройки
            var currentSettings = Lampa.Storage.get(playerType, 'inner');
            
            // Hook для добавления опций в select
            Lampa.SettingsApi.addParam({
                component: 'player',
                param: {
                    name: playerType,
                    type: 'select',
                    values: {
                        'inner': Lampa.Lang.translate('settings_param_player_inner'),
                        'iina': 'IINA',
                        'infuse': 'Infuse',
                        'mpv': 'MPV',
                        'nplayer': 'nPlayer',
                        'movist': 'Movist Pro',
                        'custom': 'Custom Player'
                    },
                    default: 'inner'
                }
            });
        });

        // Добавляем поле для ввода кастомной схемы
        Lampa.SettingsApi.addParam({
            component: 'player',
            param: {
                name: 'custom_player_scheme',
                type: 'input',
                placeholder: Lampa.Lang.translate('settings_player_custom_placeholder') || 'someplayer://open?url=',
                default: ''
            },
            field: {
                name: Lampa.Lang.translate('settings_player_custom_scheme') || 'Custom player URL scheme',
                description: Lampa.Lang.translate('settings_player_custom_scheme_descr') || 'Specify your player URL scheme'
            },
            onRender: function(item) {
                // Показывать только если выбран Custom Player
                var playerType = Lampa.Storage.field('player');
                item.toggle(playerType === 'custom');
            }
        });

        console.log('[macOS Players Plugin] Settings modified');
    }

    // Перехват запуска плеера
    function hookPlayerLaunch() {
        if (!Lampa.Platform.macOS()) return;

        // Сохраняем оригинальную функцию play
        var originalPlay = Lampa.Player.play;
        
        // Переопределяем функцию play
        Lampa.Player.play = function(data) {
            var playerType = 'player';
            
            // Определяем тип плеера
            if (data.torrent_hash) playerType = 'player_torrent';
            else if (data.iptv) playerType = 'player_iptv';
            
            var selectedPlayer = Lampa.Storage.field(playerType);
            
            // Обрабатываем новые плееры
            if (selectedPlayer === 'movist' || selectedPlayer === 'custom') {
                handleExternalPlayer(data, selectedPlayer);
                return;
            }
            
            // Вызываем оригинальную функцию для остальных случаев
            return originalPlay.apply(this, arguments);
        };

        console.log('[macOS Players Plugin] Player launch hooked');
    }

    // Обработка запуска внешнего плеера
    function handleExternalPlayer(data, playerType) {
        console.log('[macOS Players Plugin] Launching', playerType);
        
        var url = data.url.replace('&preload', '&play');
        var encodedUrl = encodeURIComponent(url);
        var externalUrl = '';

        if (playerType === 'movist') {
            // Movist Pro поддерживает несколько схем
            externalUrl = 'movist://open?url=' + encodedUrl;
        } else if (playerType === 'custom') {
            // Используем кастомную схему
            var customScheme = Lampa.Storage.field('custom_player_scheme') || 'custom://';
            
            // Проверяем формат схемы
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
            
            // Показываем рекламу если нужно
            if (data.vast_url && Lampa.Preroll) {
                Lampa.Preroll.show(data, function() {
                    window.location.assign(externalUrl);
                });
            } else {
                window.location.assign(externalUrl);
            }
            
            // Отправляем событие о внешнем плеере
            if (Lampa.Player.listener) {
                Lampa.Player.listener.send('external', data);
            }
        } else {
            console.error('[macOS Players Plugin] Failed to generate external URL');
            Lampa.Noty.show('Failed to launch player');
        }
    }

    // Запуск при загрузке Lampa
    if (window.Lampa) {
        init();
    } else {
        window.addEventListener('app:ready', init);
    }

    // Экспорт манифеста
    if (window.lampa_plugin_manifest) {
        window.lampa_plugin_manifest[manifest.id] = manifest;
    }

})();
