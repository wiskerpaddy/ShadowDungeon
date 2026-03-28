// --- 冒頭の変数宣言に追加 ---
let bgmIndex = 0;
let bgmNextTime = 0;
let isMuted = false; // 消音フラグ
let bgmTimer = null; // ループ用タイマー
let audioCtx = null; // 音声コンテキストを保持する変数

// BGMを再生する関数
function playBGM() {
    if (isMuted || !audioCtx) return;

    // 次の音が鳴るべきタイミングを計算
    const now = audioCtx.currentTime;
    if (bgmNextTime < now) bgmNextTime = now;

    const note = SOUND_DATA.BGM_TRACK[bgmIndex];
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle'; // 柔らかい音
    osc.frequency.setValueAtTime(note.freq, bgmNextTime);
    
    gain.gain.setValueAtTime(0.03, bgmNextTime); // BGMなので音量はかなり控えめに
    gain.gain.exponentialRampToValueAtTime(0.001, bgmNextTime + note.dur);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(bgmNextTime);
    osc.stop(bgmNextTime + note.dur);

    // 次の音へ
    bgmNextTime += note.dur;
    bgmIndex = (bgmIndex + 1) % SOUND_DATA.BGM_TRACK.length;

    // 0.4秒後に次の音を予約（再帰的に呼び出す）
    bgmTimer = setTimeout(playBGM, note.dur * 1000);
}

// ミュート切り替え関数
function toggleMute() {
    isMuted = !isMuted;
    const btn = document.getElementById('mute-btn');
    btn.textContent = isMuted ? "🔇" : "🔊";

    if (isMuted) {
        clearTimeout(bgmTimer);
    } else {
        bgmNextTime = audioCtx.currentTime;
        playBGM();
    }
}

// --- 2. ゲームの状態管理 (Game State) ---
let curLang = 'en'; // デフォルトを英語にしておく
let gameState = { 
    depth: 1,       // 現在の階層
    player: {},      // プレイヤー情報
    map: [],        // 二次元配列のマップデータ
    explored: [],   // 探索済みフラグ
    monsters: [],   // 出現中のモンスターリスト
    log: [],        // ログ履歴
    gameOver: false, 
    initialized: false 
};

/**
 * 4. システム関数: 言語切り替え・初期化
 */

// function: 言語の切り替えとUI表示の更新
function setLang(lang) {
    curLang = lang;
    const T = i18n[curLang];
    
    // ボタンの活性化状態を更新
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-${lang}`);
    // 指定された言語ボタンが存在する場合のみクラスを付与
    if(activeBtn)
    {
        activeBtn.classList.add('active');
    }
    // 操作パネルのテキスト更新
    const waitBtn = document.getElementById('wait');
    waitBtn.textContent = T.wait;

    // if: 文字数が多い場合はフォントサイズを自動調整
    if (T.wait.length > 5) {
        waitBtn.style.fontSize = "10px";
    } else {
        waitBtn.style.fontSize = "14px";
    }
    document.getElementById('skill').innerHTML = `${T.warpBtn}<br>(HP-5)`;
    document.getElementById('g-title').textContent = T.gTitle;
    document.getElementById('g-body').innerHTML = T.gBody;
    
    if (gameState.initialized) draw();
}

/**
 * Web Audio APIを使ってシンセ音を鳴らす
 * @param {number} freq 周波数 (Hz)
 * @param {string} type 波形 ('sine', 'square', 'sawtooth', 'triangle')
 * @param {number} duration 鳴らす時間 (秒)
 */
function playTone(freq, type, duration) {
    if (!audioCtx) return; // まだ初期化されていなければ無視
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playEffect(data) {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const sounds = Array.isArray(data) ? data : [data];

    sounds.forEach(s => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = s.type;
        osc.frequency.setValueAtTime(s.freq, audioCtx.currentTime);
        
        // 攻撃の「重み」を出すために、周波数を少しだけ急降下させる演出
        osc.frequency.exponentialRampToValueAtTime(s.freq * 0.8, audioCtx.currentTime + s.dur);

        gain.gain.setValueAtTime(s.gain || 0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + s.dur);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + s.dur);
    });
}

// --- 冒頭の変数宣言、BGM、言語、playEffect等の関数は変更なしのため省略 ---

// function: ゲームの初期セットアップ
function init() {
    gameState.player = { 
        x: 0, 
        y: 0, 
        hp: 30, 
        maxHp: 30, 
        atk: 6, 
        exp: 0, 
        lv: 1, 
        nextExp: 15, 
        vision: 4 
    };
    gameState.depth = 1; 
    gameState.log = []; 
    gameState.gameOver = false;
    
    addLog('start', 'log-system');
    setupLevel(); 
    gameState.initialized = true;
}

/**
 * 5. マップ生成・座標ロジック
 */

// function: 何もない床の座標をランダムに取得する
function findEmptyFloor() {
    let x, y;
    do {
        x = Math.floor(Math.random() * CONFIG.MAP_W);
        y = Math.floor(Math.random() * CONFIG.MAP_H);
    } while (gameState.map[y][x] !== CONFIG.TILES.FLOOR); // CONFIGを参照
    return { x, y };
}

// function: フロアの地形とオブジェクトの配置
function setupLevel() {
    const TILE = CONFIG.TILES;
    
    // マップを壁で埋めてから、ランダムに床を掘る
    gameState.map = Array.from(
        {length: CONFIG.MAP_H }, () => Array(CONFIG.MAP_W).fill(TILE.WALL)
    );
    for (let y = 1; y < CONFIG.MAP_H - 1; y++) {
        for (let x = 1; x < CONFIG.MAP_W - 1; x++) {
            if (Math.random() > 0.18){
                gameState.map[y][x] = TILE.FLOOR; // CONFIGを参照
            }
        }
    }
    gameState.explored = Array.from(
        { length: CONFIG.MAP_H }, () => Array(CONFIG.MAP_W).fill(false)
    );
    gameState.monsters = [];

    // プレイヤーを配置
    const pPos = findEmptyFloor();
    gameState.player.x = pPos.x; gameState.player.y = pPos.y;

    // 階段 または ボスの配置
    const exitPos = findEmptyFloor();
    if (gameState.depth < CONFIG.MAX_DEPTH) {
        gameState.map[exitPos.y][exitPos.x] = TILE.STAIRS; // CONFIGを参照
    } else {
        gameState.monsters.push(
            { 
                isBoss: true, 
                tile: TILE.BOSS, 
                hp: 80, 
                atk: 15, 
                color: CONFIG.APPEARANCE.BOSS.color, 
                x: exitPos.x, 
                y: exitPos.y 
            }
        );
        gameState.map[exitPos.y][exitPos.x] = TILE.BOSS;
        addLog('bossNear', 'log-boss');
    }

    // モンスターの配置
    for (let i = 0; i < 3 + gameState.depth; i++) {
        const mPos = findEmptyFloor();
        const typeIdx = Math.min(gameState.depth - 1, 2);
        gameState.monsters.push(
            { 
                typeIndex: typeIdx, 
                tile: ['r','A','e'][typeIdx], // 見た目としての記号
                hp: 10 * gameState.depth, 
                atk: 3 * gameState.depth, 
                color: CONFIG.APPEARANCE.MONSTER.color, 
                x: mPos.x, y: mPos.y 
            }
        );
        gameState.map[mPos.y][mPos.x] = TILE.MONSTER_GENERIC;
    }

    // 回復アイテムを配置
    const itemPos = findEmptyFloor();
    gameState.map[itemPos.y][itemPos.x] = TILE.POTION; // CONFIGを参照

    updateVision();
    draw();
}

/**
 * 6. レンダリング (描画系)
 */
function getTileDisplay(x, y, isVisible) {
    const p = gameState.player;
    const APP = CONFIG.APPEARANCE;
    const TILE = CONFIG.TILES;
    
    // 1. プレイヤー自身
    if (x === p.x && y === p.y){
        return { c: TILE.PLAYER, color: APP.PLAYER.color };
    }
    
    // 2. 視界外の処理
    if (!isVisible) {
        if (gameState.explored[y][x]) {
            const t = gameState.map[y][x];
            // 敵やアイテムは隠して床として表示
            const isEntity = (t === TILE.MONSTER_GENERIC || t === TILE.BOSS || t === TILE.POTION);
            return { c: isEntity ? TILE.FLOOR : t, color: APP.EXPLORED_SHADOW.color };
        }
        return { c: ' ', color: APP.UNEXPLORED.color };
    }

    // 3. 視界内の処理
    const tile = gameState.map[y][x];

    // モンスター・ボスの表示
    if (tile === TILE.MONSTER_GENERIC || tile === TILE.BOSS) {
        const m = gameState.monsters.find(m => m.x === x && m.y === y);
        return { c: m ? m.tile : tile, color: m ? m.color : (tile === TILE.BOSS ? APP.BOSS.color : APP.MONSTER.color) };
    }
    
    // その他のタイルの色
    const tileColors = { 
        [TILE.WALL]: APP.WALL.color, 
        [TILE.POTION]: APP.POTION.color, 
        [TILE.STAIRS]: APP.STAIRS.color, 
        [TILE.FLOOR]: APP.FLOOR.color 
    };
    
    return { c: tile, color: tileColors[tile] || APP.FLOOR.color };
}

/**
 * モンスターの移動ロジック
 */
function moveMonsterRandomly(m) {
    const TILE = CONFIG.TILES;
    const dx = gameState.player.x - m.x;
    const dy = gameState.player.y - m.y;

    let moveX = 0; let moveY = 0;
    if (Math.abs(dx) > Math.abs(dy)) {
        moveX = dx > 0 ? 1 : -1;
    } else {
        moveY = dy > 0 ? 1 : -1;
    }

    const tx = m.x + moveX; const ty = m.y + moveY;
    const isPlayerPos = (tx === gameState.player.x && ty === gameState.player.y);
    
    // 移動先が床（TILE.FLOOR）であることを確認
    if (gameState.map[ty][tx] === TILE.FLOOR && !isPlayerPos) {
        gameState.map[m.y][m.x] = TILE.FLOOR;
        m.x = tx; m.y = ty;
        gameState.map[m.y][m.x] = m.isBoss ? TILE.BOSS : TILE.MONSTER_GENERIC;
    } else {
        let altX = moveX === 0 ? (dx > 0 ? 1 : -1) : 0;
        let altY = moveY === 0 ? (dy > 0 ? 1 : -1) : 0;
        const ax = m.x + altX; const ay = m.y + altY;
        
        if (gameState.map[ay][ax] === TILE.FLOOR && !(ax === gameState.player.x && ay === gameState.player.y)) {
            gameState.map[m.y][m.x] = TILE.FLOOR;
            m.x = ax; m.y = ay;
            gameState.map[m.y][m.x] = m.isBoss ? TILE.BOSS : TILE.MONSTER_GENERIC;
        }
    }
}

// プレイヤーの移動処理内の記号も修正
function movePlayer(nx, ny, tile) {
    const TILE = CONFIG.TILES;
    gameState.player.x = nx; gameState.player.y = ny;
    
    if (tile === TILE.POTION) {
        playEffect(SOUND_DATA.HEAL);
        gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + CONFIG.HEAL_VAL);
        addLog('potion', 'log-player');
        gameState.map[ny][nx] = TILE.FLOOR;
    } else if (tile === TILE.STAIRS) {
        playEffect(SOUND_DATA.STAIRS);
        gameState.depth++;
        addLog('stairs', 'log-system', { d: gameState.depth });
        setupLevel();
    } else {
        playEffect(SOUND_DATA.MOVE);
    }
}

// 攻撃成功時の床戻しも修正
function combat(nx, ny) {
    playEffect(SOUND_DATA.PLAYER_ATTACK);
    const m = gameState.monsters.find(m => m.x === nx && m.y === ny);
    const dmg = gameState.player.atk + Math.floor(Math.random()*5);
    m.hp -= dmg;
    addLog('attack', 'log-player', { nIsMonster: true, monsterObj: m, dmg: dmg });

    if (m.hp <= 0) {
        playEffect(SOUND_DATA.DEFEATED);
        addLog('defeat', 'log-system', { nIsMonster: true, monsterObj: m });
        gameState.map[ny][nx] = CONFIG.TILES.FLOOR; // ここを修正
        gameState.monsters = gameState.monsters.filter(mon => mon !== m);
        if (m.isBoss) return endGame(true);
        checkLvUp();
    }
}

// function: プレイヤーの移動と特殊タイル(アイテム・階段)の処理
function movePlayer(nx, ny, tile) {
    // 以下の行は1行じゃないと挙動がおかしくなるので触らない。
    gameState.player.x = nx; gameState.player.y = ny;
    if (tile === 'L') {
        // ★回復音
        playEffect(SOUND_DATA.HEAL);
        gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + CONFIG.HEAL_VAL);
        addLog('potion', 'log-player');
        gameState.map[ny][nx] = '·';
    } else if (tile === '>') {
        // ★階段音
        playEffect(SOUND_DATA.STAIRS);
        gameState.depth++;
        addLog('stairs', 'log-system', { d: gameState.depth });
        setupLevel(); // 次の階層へ
    }else{
        // ★何もない場所を移動する音
        playEffect(SOUND_DATA.MOVE);
    }
}

// function: 全モンスターの行動
function monstersTurn() {
    //playTone(100, 'square', 0.3); // 「ボフッ」という鈍い音
    gameState.monsters.forEach(m => {
        const dx = Math.abs(gameState.player.x - m.x), dy = Math.abs(gameState.player.y - m.y);
        // 1. 隣接していれば攻撃
        if (dx + dy === 1) {
            const dmg = Math.max(1, m.atk - Math.floor(Math.random()*3));
            gameState.player.hp -= dmg;
            
            // ボスかどうかで音を出し分ける！
            if (m.isBoss) {
                playEffect(SOUND_DATA.BOSS_ATTACK); // 怖いうなり音
            } else {
                playEffect(SOUND_DATA.ENEMY_ATTACK); // 通常の攻撃音
            }

            addLog('damaged', 'log-enemy', { nIsMonster: true, monsterObj: m, dmg: dmg });
            if (gameState.player.hp <= 0) endGame(false);
        }
        // 2. 隣接していなければランダム移動（ここを追加！）
        else {
            moveMonsterRandomly(m);
        }
    });
}

// function: モンスターのランダム移動
// function: モンスターがプレイヤーに近づくように移動する
function moveMonsterRandomly(m) {
    // 1. プレイヤーとの距離（差）を計算
    const dx = gameState.player.x - m.x;
    const dy = gameState.player.y - m.y;

    // 2. X軸とY軸、どちらに動くべきか決める（距離が遠い方を優先）
    let moveX = 0;
    let moveY = 0;

    if (Math.abs(dx) > Math.abs(dy)) {
        moveX = dx > 0 ? 1 : -1;
    } else {
        moveY = dy > 0 ? 1 : -1;
    }

    const tx = m.x + moveX;
    const ty = m.y + moveY;

    // 3. 移動先が床(·)であり、他のモンスターやプレイヤーがいないかチェック
    // プレイヤーの位置(px, py)に重ならないようにする
    const isPlayerPos = (tx === gameState.player.x && ty === gameState.player.y);
    
    if (gameState.map[ty][tx] === '·' && !isPlayerPos) {
        // 元いた場所を床に戻し、新しい場所にモンスターを配置
        gameState.map[m.y][m.x] = '·';
        m.x = tx; 
        m.y = ty;
        gameState.map[m.y][m.x] = m.isBoss ? 'Ω' : 'E';
    } else {
        // もし行きたい方向に壁や敵があったら、もう一方の軸を試す
        // （これを入れると角に詰まりにくくなります）
        let altX = moveX === 0 ? (dx > 0 ? 1 : -1) : 0;
        let altY = moveY === 0 ? (dy > 0 ? 1 : -1) : 0;
        const ax = m.x + altX;
        const ay = m.y + altY;
        
        if (gameState.map[ay][ax] === '·' && !(ax === gameState.player.x && ay === gameState.player.y)) {
            gameState.map[m.y][m.x] = '·';
            m.x = ax; m.y = ay;
            gameState.map[m.y][m.x] = m.isBoss ? 'Ω' : 'E';
        }
    }
}

// function: 特殊スキル(ワープ)
function useSkill() {
    if (gameState.player.hp > CONFIG.WARP_COST && !gameState.gameOver) {
        gameState.player.hp -= CONFIG.WARP_COST;
        const pos = findEmptyFloor();
        gameState.player.x = pos.x; gameState.player.y = pos.y;
        // ★ワープ音を鳴らす
        playEffect(SOUND_DATA.WARP);
        addLog('warp', 'log-system');
        monstersTurn();
        updateVision();
        draw();
    }
}

// function: レベルアップ判定
function checkLvUp() {
    const p = gameState.player; 
    p.exp += 10;
    if (p.exp >= p.nextExp) {
        // ★レベルアップ音
        playEffect(SOUND_DATA.LEVEL_UP);
        setTimeout(() => playTone(659.25, 'sine', 0.1), 100);
        p.lv++; p.maxHp += 10; p.hp = p.maxHp; p.atk += 4; p.exp = 0;
        addLog('lvup', 'log-lvup', { l: p.lv });
    }
}

// function: 探索範囲の更新
function updateVision() {
    for (let y = 0; y < CONFIG.MAP_H; y++) 
        for (let x = 0; x < CONFIG.MAP_W; x++)
            if (Math.sqrt((x-gameState.player.x)**2 + (y-gameState.player.y)**2) <= gameState.player.vision)
                gameState.explored[y][x] = true;
}

/**
 * 8. ユーティリティ・UI制御
 */
function addLog(key, type, params = {}) {
     gameState.log.push({ key, type, params }); 
}

function isGuideOpen() { 
    return document.getElementById('guide-overlay').style.display === 'flex'; 
}

function openGuide() { 
    document.getElementById('guide-overlay').style.display = 'flex';
    // BGMを一時停止
    if (bgmTimer) {
        clearTimeout(bgmTimer);
        bgmTimer = null;
    }
}

function closeGuide() { 
    const overlay = document.getElementById('guide-overlay');
    overlay.style.display = 'none';
    
    // AudioContext の初期化と強制再開
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Edge/Chrome対策: resume() を呼び出し、完了を待たずに音を鳴らす準備をする
    audioCtx.resume().then(() => {
        console.log("AudioContext resumed successfully");
        
        // 開始音（ピコーン！）を鳴らす
        playEffect(SOUND_DATA.START_GAME[0]);
        setTimeout(() => {
            playEffect(SOUND_DATA.START_GAME[1]);
        }, 80);

        // BGMを開始
        if (!bgmTimer && !isMuted) {
            playBGM();
        }
    });

    if(!gameState.initialized){
        init();
    }
}

// function: ゲーム終了(勝利・敗北)の通知
function endGame(win) { 
    gameState.gameOver = true; 
    alert(win ? i18n[curLang].win : i18n[curLang].lose); 
    location.reload(); 
}

// キーボード入力イベント
window.addEventListener('keydown', (e) => {
    const keys = { 
        'ArrowUp': [0,-1], 'w': [0,-1], '8': [0,-1], 
        'ArrowDown': [0,1], 's': [0,1], '2': [0,1], 
        'ArrowLeft': [-1,0], 'a': [-1,0], '4': [-1,0], 
        'ArrowRight': [1,0], 'd': [1,0], '6': [1,0], 
        ' ': [0,0], '5': [0,0] 
    };
    if (keys[e.key]) handleInput(...keys[e.key]);
});

// ページロード時の初期言語設定
window.onload = () => {
    const browserLang = (navigator.language || navigator.userLanguage).split('-')[0];
    setLang(['ja', 'en', 'es'].includes(browserLang) ? browserLang : 'en');
    openGuide();
};
