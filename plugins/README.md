# Lampa Plugins

## macOS Players Plugin

**Purpose:** Redirect video playback to external macOS players (IINA, Movist Pro, VLC) using URL schemes.

### Installation

#### Step 1: Diagnostic (Required First)

Before installing the main plugin, **test if plugins load at all**:

```
https://raw.githubusercontent.com/m1nuzz/lampa/main/plugins/macos-players-diagnostic.js
```

**Expected console output:**
```
=== [macOS Players DIAGNOSTIC] script loaded ===
Lampa exists: true
SettingsApi: object
Player: object
...
[DIAGNOSTIC] ✅ Settings registration SUCCESS
```

**Check Settings:**
- Go to **Settings → Player**
- Look for **"🔧 DIAGNOSTIC TEST"** at the bottom
- If you see it → plugin loading works! Proceed to Step 2
- If NOT → see Troubleshooting below

---

#### Step 2: Main Plugin

Remove diagnostic plugin, add:

```
https://raw.githubusercontent.com/m1nuzz/lampa/main/plugins/macos-players.js
```

**Or via CDN (cached):**
```
https://cdn.jsdelivr.net/gh/m1nuzz/lampa@latest/plugins/macos-players.js
```

**Or specific commit (bypass cache):**
```
https://cdn.jsdelivr.net/gh/m1nuzz/lampa@d3dcbafb764bb9c790bd4e58d7609f44b8d4da4d/plugins/macos-players.js
```

---

### Configuration

1. **Open Settings → Player**
2. **Scroll to bottom** → find **"External Player (macOS)"**
3. **Select player:**
   - `Disabled` (default)
   - `IINA`
   - `Movist Pro`
   - `VLC`
4. **Play any video** → it will open in selected player

---

### How It Works

#### Strategy: Event Listener (Safe)

The plugin uses `Lampa.Listener.follow('player', ...)` to intercept video URLs **after** the built-in player starts loading. This approach:

✅ **Does NOT break** the default player  
✅ **Does NOT modify** `Lampa.Player.play()`  
✅ **Works with all** video sources (online, torrent, etc.)  
⚠️ Built-in player may **flash briefly** (< 1 second)

**Flow:**
1. User clicks Play
2. Lampa starts loading video
3. Plugin catches `player/start` event
4. Extracts video URL from `<video>` element
5. Opens URL scheme (e.g., `iina://weblink?url=...`)
6. Closes built-in player
7. Returns to previous screen

#### Optional: Play Hook (Instant Redirect)

To enable **instant redirect** (no player flash), uncomment line 136 in `macos-players.js`:

```javascript
// hookPlayerPlay(); // ← Remove comment
```

⚠️ **Warning:** This hooks `Lampa.Player.play()` and may cause issues if other plugins also modify it.

---

### Troubleshooting

#### Problem: Diagnostic plugin doesn't appear in console

**Check:**

1. **Network tab** (DevTools) → filter by `macos-players`
   - Status `200` = loaded successfully
   - Status `404` = file not found (check URL)
   - Status `CORS error` = use raw.githubusercontent.com URL

2. **Open plugin URL** in browser:
   - Should show JavaScript code
   - If shows HTML/404 page → wrong URL or GitHub Pages not enabled

3. **Clear cache:**
   - `Ctrl+Shift+Delete` (Chrome/Edge)
   - `Cmd+Shift+Delete` (Safari)
   - Select "Cached images and files"
   - Restart browser

4. **Check MIME type:**
   - Open URL in new tab
   - Right-click → Inspect → Network tab
   - Content-Type should be `application/javascript` or `text/javascript`
   - If `text/html` → GitHub Pages issue

---

#### Problem: Setting appears, but player crashes on Play

**Check console for errors:**

```javascript
// In DevTools console, run:
Lampa.Storage.field('macos_ext_player')
// Should return: 'iina', 'movist', 'vlc', or 'none'

Lampa.Player.play.toString()
// Should contain original code (no hook if using event strategy)
```

**If error persists:**
- Set **External Player** back to **"Disabled"**
- Try playing video → works?
  - YES = issue with plugin hook
  - NO = unrelated Lampa/codec issue

---

#### Problem: External player doesn't open

**Check:**

1. **Player installed?**
   ```bash
   # macOS Terminal:
   open iina://weblink?url=https://test.com/video.mp4
   # Should prompt to open IINA
   ```

2. **Console logs:**
   ```
   [macOS Players] opening scheme: iina://weblink?url=...
   ```
   If missing → plugin not intercepting video

3. **Video element exists?**
   ```javascript
   document.querySelector('video').src
   // Should show video URL when player is open
   ```

---

### URL Schemes

| Player | Scheme | Notes |
|--------|--------|-------|
| **IINA** | `iina://weblink?url=<encoded>` | Most reliable |
| **Movist Pro** | `movist://weblink?url=<encoded>` | May need "Open URL" permission |
| **VLC** | `vlc://<encoded>` | Simple but less stable |

**Custom player?** Edit `PLAYERS` object in `macos-players.js`:

```javascript
var PLAYERS = {
    myplayer: {
        name: 'My Player',
        scheme: function(url){ 
            return 'myplayer://play?url=' + encodeURIComponent(url); 
        }
    }
};
```

---

### Technical Details

**Why event listener instead of hook?**

| Approach | Pros | Cons |
|----------|------|------|
| **Event Listener** | ✅ No conflicts<br>✅ Safe fallback<br>✅ Works with all sources | ⚠️ Player flashes briefly |
| **Player.play() Hook** | ✅ Instant redirect<br>✅ No player flash | ⚠️ Can break with updates<br>⚠️ Conflicts with other plugins |
| **Button on Card** | ✅ User control<br>✅ No auto-redirect | ⚠️ Extra click required |

This plugin uses **Event Listener** by default (safest). Optionally enable **Hook** for instant redirect.

---

### Version History

- **v2.0.0** (Feb 2026)
  - Complete rewrite based on professional analysis
  - Event listener strategy (safe)
  - Settings in existing 'player' component
  - Proper context handling
  - Activity.backward() for clean cancel

- **v1.x** (deprecated)
  - Attempted custom settings component
  - Direct Player.play() hook
  - Caused crashes

---

### Credits

- **Analysis:** Claude Opus 4
- **Implementation:** Based on [online_mod.js](https://nb557.github.io/plugins/online_mod.js) patterns
- **Lampa:** [yumata/lampa](https://github.com/yumata/lampa)

---

### License

MIT
