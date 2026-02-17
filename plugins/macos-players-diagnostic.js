// DIAGNOSTIC VERSION - Use this first to check if plugin loads
(function(){
    console.log('=== [macOS Players DIAGNOSTIC] script loaded ===');
    console.log('Lampa exists:', typeof window.Lampa !== 'undefined');
    
    if (window.Lampa) {
        console.log('SettingsApi:', typeof Lampa.SettingsApi);
        console.log('Player:', typeof Lampa.Player);
        console.log('Storage:', typeof Lampa.Storage);
        console.log('Listener:', typeof Lampa.Listener);
        console.log('Activity:', typeof Lampa.Activity);
        console.log('Noty:', typeof Lampa.Noty);
        
        // Try to register simple setting
        try {
            Lampa.SettingsApi.addParam({
                component: 'player',
                param: {
                    name: 'diagnostic_test',
                    type: 'trigger',
                    default: false
                },
                field: {
                    name: '🔧 DIAGNOSTIC TEST',
                    description: 'If you see this, plugin loading works!'
                }
            });
            console.log('[DIAGNOSTIC] ✅ Settings registration SUCCESS');
        } catch(e) {
            console.error('[DIAGNOSTIC] ❌ Settings registration FAILED:', e);
        }
    } else {
        console.error('[DIAGNOSTIC] ❌ Lampa not found - plugin loaded too early or wrong environment');
    }
    
    console.log('=== [macOS Players DIAGNOSTIC] complete ===');
})();
