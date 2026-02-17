// DIAGNOSTIC VERSION - Check plugin loading step by step
(function(){
    console.log('\n=== [DIAGNOSTIC] START ===');
    console.log('[DIAGNOSTIC] Step 1: Script executed');
    
    console.log('[DIAGNOSTIC] Step 2: Checking Lampa...');
    console.log('  window.Lampa:', typeof window.Lampa);
    
    if (!window.Lampa) {
        console.error('[DIAGNOSTIC] FAILED: Lampa not found!');
        console.log('=== [DIAGNOSTIC] END (FAILED) ===\n');
        return;
    }
    
    console.log('[DIAGNOSTIC] Step 3: Checking APIs...');
    console.log('  Lampa.SettingsApi:', typeof Lampa.SettingsApi);
    console.log('  Lampa.SettingsApi.addComponent:', typeof Lampa.SettingsApi.addComponent);
    console.log('  Lampa.SettingsApi.addParam:', typeof Lampa.SettingsApi.addParam);
    console.log('  Lampa.Storage:', typeof Lampa.Storage);
    console.log('  Lampa.Player:', typeof Lampa.Player);
    console.log('  Lampa.Listener:', typeof Lampa.Listener);
    console.log('  Lampa.Activity:', typeof Lampa.Activity);
    console.log('  Lampa.Noty:', typeof Lampa.Noty);
    
    console.log('[DIAGNOSTIC] Step 4: Attempting to add component...');
    try {
        Lampa.SettingsApi.addComponent({
            component: 'diagnostic_test',
            name: 'DIAGNOSTIC TEST',
            icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/></svg>'
        });
        console.log('[DIAGNOSTIC] ✅ addComponent SUCCESS');
    } catch(e) {
        console.error('[DIAGNOSTIC] ❌ addComponent FAILED:', e);
        console.log('=== [DIAGNOSTIC] END (FAILED) ===\n');
        return;
    }
    
    console.log('[DIAGNOSTIC] Step 5: Attempting to add param...');
    try {
        Lampa.SettingsApi.addParam({
            component: 'diagnostic_test',
            param: {
                name: 'diagnostic_toggle',
                type: 'trigger',
                default: false
            },
            field: {
                name: '🔧 If you see this - plugin works!',
                description: 'Check Settings for "DIAGNOSTIC TEST" section'
            }
        });
        console.log('[DIAGNOSTIC] ✅ addParam SUCCESS');
    } catch(e) {
        console.error('[DIAGNOSTIC] ❌ addParam FAILED:', e);
        console.log('=== [DIAGNOSTIC] END (FAILED) ===\n');
        return;
    }
    
    console.log('[DIAGNOSTIC] Step 6: Adding another param to existing "player" section...');
    try {
        Lampa.SettingsApi.addParam({
            component: 'player',  // Add to existing section
            param: {
                name: 'diagnostic_in_player',
                type: 'trigger',
                default: false
            },
            field: {
                name: '🔍 DIAGNOSTIC (in Player section)',
                description: 'This should appear in Settings > Player'
            }
        });
        console.log('[DIAGNOSTIC] ✅ addParam to "player" SUCCESS');
    } catch(e) {
        console.error('[DIAGNOSTIC] ❌ addParam to "player" FAILED:', e);
    }
    
    console.log('\n[DIAGNOSTIC] ✅ ALL CHECKS COMPLETE!');
    console.log('[DIAGNOSTIC] Now check:');
    console.log('  1. Settings > DIAGNOSTIC TEST (new section)');
    console.log('  2. Settings > Player > DIAGNOSTIC (at bottom)');
    console.log('=== [DIAGNOSTIC] END (SUCCESS) ===\n');
})();
