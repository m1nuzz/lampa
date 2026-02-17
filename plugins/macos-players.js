(function () {
    'use strict';

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
            ru: 'Примеры: iina://weblink?url= или movist://open?url= или vlc://',
            en: 'Examples: iina://weblink?url= or movist://open?url= or vlc://',
            uk: 'Приклади: iina://weblink?url= або movist://open?url= або vlc://'
        }
    });

    function startPlugin() {
        if (window.macos_players_plugin) return;
        window.macos_players_plugin = true;

        console.log('[macOS Players] v1.1.0 loaded');

        // Проверка платформы
        if (typeof Lampa.Platform === 'undefined' || typeof Lampa.Platform.macOS !== 'function' || !Lampa.Platform.macOS()) {
            console.log('[macOS Players] Not macOS, plugin disabled');
            return;
        }

        console.log('[macOS Players] macOS detected');

        // Создаём отдельную секцию настроек
        Lampa.SettingsApi.addComponent({
            component: 'macos_players',
            name: Lampa.Lang.translate('macos_players_title'),
            icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.87-1.08-7-5.19-7-9V9l7-3.5L19 9v2c0 3.81-3.13 7.92-7 9zm-1-6h2v2h-2zm0-8h2v6h-2z" fill="currentColor"/></svg>'
        });

        // Переключатель включения/выключения
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
                console.log('[macOS Players] Enabled:', value);
            }
        });

        // Поле для URL-схемы
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

        // Перехватываем запуск плеера
        if (Lampa.Player && typeof Lampa.Player.play === 'function') {
            var originalPlay = Lampa.Player.play;

            Lampa.Player.play = function(data) {
                data = data || {};
                
                // Проверяем, включен ли внешний плеер
                var enabled = Lampa.Storage.field('macos_player_enabled');
                
                if (enabled) {
                    console.log('[macOS Players] External player enabled, launching...');
                    launchExternalPlayer(data);
                    return;
                }
                
                // Если выключен - используем стандартный плеер
                return originalPlay.apply(this, arguments);
            };

            console.log('[macOS Players] Player.play hooked');
        }

        function launchExternalPlayer(data) {
            var url = data.url;
            if (!url) {
                console.error('[macOS Players] No URL provided');
                if (Lampa.Noty) Lampa.Noty.show('No video URL');
                return;
            }

            url = url.replace('&preload', '&play');
            
            var scheme = Lampa.Storage.field('macos_player_scheme') || 'iina://weblink?url=';
            if (!scheme) {
                if (Lampa.Noty) Lampa.Noty.show('Configure player URL scheme in settings');
                return;
            }
            
            var encodedUrl = encodeURIComponent(url);
            var externalUrl = '';
            
            // Обработка плейсхолдеров
            if (scheme.indexOf('${url}') > -1) {
                externalUrl = scheme.replace('${url}', encodedUrl);
            } else if (scheme.indexOf('${_url}') > -1) {
                externalUrl = scheme.replace('${_url}', encodeURI(url));
            } else if (scheme.indexOf('${furl}') > -1) {
                externalUrl = scheme.replace('${furl}', url);
            } else {
                // Просто добавляем закодированный URL в конец схемы
                externalUrl = scheme + encodedUrl;
            }

            if (externalUrl) {
                console.log('[macOS Players] Opening:', externalUrl);
                try {
                    window.location.assign(externalUrl);
                    if (Lampa.Noty) Lampa.Noty.show('Opening external player');
                } catch (e) {
                    console.error('[macOS Players] Failed to open:', e);
                    if (Lampa.Noty) Lampa.Noty.show('Failed to launch player');
                }
            }
        }

        console.log('[macOS Players] Initialized successfully');
    }

    // Запуск плагина
    if (window.appready) {
        startPlugin();
    } else if (Lampa.Listener && Lampa.Listener.follow) {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') startPlugin();
        });
    }
})();
