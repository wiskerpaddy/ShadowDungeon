/**
 * 1. 定数・設定 (Config)
 * ゲームバランスやマップサイズを一括管理します。
 */
const CONFIG = {
    MAP_W: 30,      // マップの横幅
    MAP_H: 15,      // マップの縦幅
    MAX_DEPTH: 5,   // ボスが登場する階層
    WARP_COST: 5,   // ワープスキル使用時のHP消費量
    HEAL_VAL: 12,    // 回復アイテム(L)の回復量

// タイルやエンティティの記号定義
    TILES: {
        PLAYER: '@',
        MONSTER_GENERIC: 'E',
        BOSS: 'Ω',
        WALL: '#',
        FLOOR: '.', // '·' から '.' に変更してみる
        STAIRS: '>',
        POTION: 'L'
    },

    APPEARANCE: {
        PLAYER: { color: '#fff' },
        WALL: { color: '#444' },
        FLOOR: { color: '#222' },
        POTION: { color: '#5f5' },
        STAIRS: { color: '#ff5' },
        MONSTER: { color: '#aaa' },
        BOSS: { color: '#f0f' },
        EXPLORED_SHADOW: { color: '#111' }, // 探索済みの場所（暗め）
        UNEXPLORED: { color: '#000' }       // まだ見ていない場所（真っ黒）
    }
};


/**
 * 2. 多言語定義 (i18n)
 * 表示するテキストを言語ごとに管理します。
 */
const i18n = {
    ja: {
        gTitle: "迷宮ガイド", 
        gBody: "【目的】5Fの指揮者を倒せ<br>【HP】命の息吹。0で終了<br>【移動】矢印で移動・攻撃<br>【待機】その場で1ターン経過<br>【ワープ】HPを5消費してランダム転送",
        start: "演奏を開始します。", 
        bossNear: "不穏な旋律が近づいている...",
        wall: "壁にはね返された。", 
        potion: "リード交換！HP回復。",
        stairs: "次のフロアへ... ({d}F)", 
        lvup: "Level Up! (Lv{l})",
        attack: "{n}へ攻撃！ {dmg}点", 
        defeat: "{n}を消し去った。",
        damaged: "{n}の反撃！ {dmg}点", 
        warp: "音の渦で転送された！",
        hp: "HP", 
        atk: "ATK", 
        floor: "FL", 
        wait: "待機", 
        warpBtn: "ワープ",
        mNames: ["ノイズ・ラット", "不協和音の鎧", "沈黙の眼"], 
        bName: "古の指揮者",
        win: "伝説の奏者となった！", 
        lose: "音が途絶えた..."
    },
    /* 英語定義 */
    en: {
        gTitle: "GUIDE", 
        gBody: "Goal: Defeat boss on 5F<br>HP: Life breath. 0 = End<br>Move: Arrows to move/attack<br>Wait: Stay 1 turn<br>Warp: Spend 5 HP to teleport",
        start: "Performance start.", 
        bossNear: "An ominous melody approaches...",
        wall: "It's a wall.", 
        potion: "Reed changed! HP up.",
        stairs: "Deeper... ({d}F)", 
        lvup: "Level Up! (Lv{l})",
        attack: "Attack {n}! {dmg} dmg", 
        defeat: "Purified {n}.",
        damaged: "{n} counter! {dmg} dmg", 
        warp: "Teleported!",
        hp: "HP", 
        atk: "ATK", 
        floor: "FL", 
        wait: "WAIT", 
        warpBtn: "WARP",
        mNames: ["Noise Rat", "Discord Armor", "Silent Eye"], 
        bName: "Ancient Conductor",
        win: "Legend Soloist!", 
        lose: "Music stopped..."
    },
        /* スペイン語定義 */
    es: {
        gTitle: "GUÍA", 
        gBody: "Meta: Vencer jefe en 5F<br>HP: Vida. 0 = Fin<br>Mover: Flechas para atacar<br>Espera: 1 turno quieto<br>Warp: Gasta 5 HP para teleport",
        start: "Empieza la función.", 
        bossNear: "Melodía inquietante cerca...",
        wall: "Es un muro.", 
        potion: "¡HP recuperado!",
        stairs: "Piso siguiente... ({d}F)", 
        lvup: "¡Nivel sube! (Lv{l})",
        attack: "¡Ataca a {n}! {dmg}", 
        defeat: "Venciste a {n}.",
        damaged: "¡{n} ataca! {dmg}", 
        warp: "¡Teletransportado!",
        hp: "HP", 
        atk: "ATQ", 
        floor: "PISO", 
        wait: "ESPERA", 
        warpBtn: "WARP",
        mNames: ["Rata Ruido", "Armadura Discord", "Ojo Silencio"], 
        bName: "Director Antiguo",
        win: "¡Solista de leyenda!", 
        lose: "Música detenida..."
    }
};

/**
 * config.js
 * サウンド設定を追加
 */

const SOUND_DATA = {
    // プレイヤーの移動
    MOVE: { freq: 220, type: 'sine', dur: 0.03, gain: 0.02 }, // 低めで短く、音量も極小
    
    // プレイヤーの攻撃
    PLAYER_ATTACK: { freq: 440, type: 'sawtooth', dur: 0.1, gain: 0.05 },
    
    // 敵の攻撃
    ENEMY_ATTACK:  {freq: 150, type: 'triangle', dur: 0.2, gain: 0.1 },
    
    // 壁にぶつかる
    DUDGE_WALL: { freq: 440, type: 'sine', dur: 0.05, gain: 0.02 }, // 低めで短く、音量も極小

    // ボスの攻撃：低音のうなり
    BOSS_ATTACK: [
        { freq: 60, type: 'sawtooth', dur: 0.5, gain: 0.2 }, // 地響きのような低音
        { freq: 66, type: 'sawtooth', dur: 0.5, gain: 0.2 }  // わずかにずらした音で「うねり」を作る
    ],

    // ゲーム開始：ピコーン
    START_GAME: [
        { freq: 660, type: 'triangle', dur: 0.1, gain: 0.04 }, // 「ピ」
        { freq: 880, type: 'triangle', dur: 0.3, gain: 0.03 }, // 「コーン！」
        { freq: 784, type: 'triangle', dur: 0.1, gain: 0.02 }, // 「ピ」(少し変化をつけて軽やかに)
        { freq: 1046, type: 'triangle', dur: 0.4, gain: 0.015 } // 「カーン…」(高音で綺麗に消える)
    ],
    
    // ワープ：空間がねじれるような、滑らかな上昇音
    WARP: [
        { freq: 440, type: 'triangle', dur: 0.1, gain: 0.03 }, // ラ
        { freq: 660, type: 'triangle', dur: 0.1, gain: 0.03 }, // ミ
        { freq: 880, type: 'triangle', dur: 0.1, gain: 0.02 }, // 高いラ
        { freq: 1320, type: 'sine',     dur: 0.4, gain: 0.01 }  // 非常に高いミ（サイン波で柔らかく締める）
    ],

    // 回復：柔らかい高音
    HEAL: { freq: 1200, type: 'square', dur: 0.2, gain: 0.08 },
    
    // レベルアップ：明るい和音のファンファーレ
    LEVEL_UP: [
        { freq: 523, type: 'triangle', dur: 0.1, gain: 0.04 }, // ド
        { freq: 659, type: 'triangle', dur: 0.1, gain: 0.04 }, // ミ
        { freq: 784, type: 'triangle', dur: 0.2, gain: 0.03 }, // ソ
        { freq: 523, type: 'triangle', dur: 0.1, gain: 0.02 }, // ド (高音への余韻)
        { freq: 659, type: 'triangle', dur: 0.1, gain: 0.015 }, // ミ
        { freq: 1046, type: 'triangle', dur: 0.4, gain: 0.01 }  // 高いド (最後は消え入るように)
    ],
    
    // 階段：一段ずつ上がるような音
    STAIRS: [
        { freq: 300, type: 'triangle', dur: 0.2, gain: 0.1 },
        { freq: 400, type: 'triangle', dur: 0.2, gain: 0.1 },
        { freq: 300, type: 'triangle', dur: 0.2, gain: 0.1 },
        { freq: 400, type: 'triangle', dur: 0.2, gain: 0.1 },
        { freq: 300, type: 'triangle', dur: 0.2, gain: 0.1 },
        { freq: 400, type: 'triangle', dur: 0.2, gain: 0.1 }
    ],
    
    // 敵撃破：気持ちいい音
    DEFEATED: [
        { freq: 146, type: 'sawtooth', dur: 0.1, gain: 0.03 }, // 少しザラついた音で手応えを出す
        { freq: 110, type: 'triangle', dur: 0.15, gain: 0.02 }, // 後半は柔らかい音へ
        { freq: 73,  type: 'triangle', dur: 0.2, gain: 0.01 }  // スッと消える
    ],
    BGM_TRACK: [
        { freq: 293.66, dur: 0.8 }, // レ (D)
        { freq: 220.00, dur: 0.8 }, // ラ (A)
        { freq: 246.94, dur: 0.8 }, // シ (Bm)
        { freq: 185.00, dur: 0.8 }, // ファ# (F#m)
        { freq: 196.00, dur: 0.8 }, // ソ (G)
        { freq: 146.83, dur: 0.8 }, // レ (D)
        { freq: 196.00, dur: 0.8 }, // ソ (G)
        { freq: 220.00, dur: 0.8 }  // ラ (A)
    ],
    BGM_BOSS: [
        { freq: 138.59, dur: 0.4 }, // C# (重苦しい)
        { freq: 146.83, dur: 0.4 }, // D  (不協和音)
        { freq: 138.59, dur: 0.4 },
        { freq: 164.81, dur: 0.4 }, // E
        { freq: 130.81, dur: 0.4 }, // C  (悪魔の音程)
        { freq: 110.00, dur: 0.8 }, // 低い A
        { freq: 116.54, dur: 0.8 }, // 低い Bb
        { freq: 103.83, dur: 0.8 }  // 低い G#
    ],
};