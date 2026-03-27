/**
 * 1. 定数・設定 (Config)
 * ゲームバランスやマップサイズを一括管理します。
 */
const CONFIG = {
    MAP_W: 30,      // マップの横幅
    MAP_H: 15,      // マップの縦幅
    MAX_DEPTH: 5,   // ボスが登場する階層
    WARP_COST: 5,   // ワープスキル使用時のHP消費量
    HEAL_VAL: 12    // 回復アイテム(L)の回復量
};

/**
 * 2. 多言語定義 (i18n)
 * 表示するテキストを言語ごとに管理します。
 */
const i18n = {
    ja: {
        gTitle: "迷宮ガイド", 
        gBody: "【目的】5Fの指揮者を倒せ<br>【HP】命の息吹。0で終了<br>【移動】矢印で移動・攻撃<br>【待機】その場で1ターン経過<br>【ワープ】HPを5消費してランダム転送",
        start: "演奏を開始します。", bossNear: "不穏な旋律が近づいている...",
        wall: "壁にはね返された。", potion: "リード交換！HP回復。",
        stairs: "次のフロアへ... ({d}F)", lvup: "Level Up! (Lv{l})",
        attack: "{n}へ攻撃！ {dmg}点", defeat: "{n}を消し去った。",
        damaged: "{n}の反撃！ {dmg}点", warp: "音の渦で転送された！",
        hp: "HP", atk: "ATK", floor: "FL", wait: "待機", warpBtn: "ワープ",
        mNames: ["ノイズ・ラット", "不協和音の鎧", "沈黙の眼"], bName: "古の指揮者",
        win: "伝説の奏者となった！", lose: "音が途絶えた..."
    },
    /* 英語定義 */
    en: {
        gTitle: "GUIDE", gBody: "Goal: Defeat boss on 5F<br>HP: Life breath. 0 = End<br>Move: Arrows to move/attack<br>Wait: Stay 1 turn<br>Warp: Spend 5 HP to teleport",
        start: "Performance start.", bossNear: "An ominous melody approaches...",
        wall: "It's a wall.", potion: "Reed changed! HP up.",
        stairs: "Deeper... ({d}F)", lvup: "Level Up! (Lv{l})",
        attack: "Attack {n}! {dmg} dmg", defeat: "Purified {n}.",
        damaged: "{n} counter! {dmg} dmg", warp: "Teleported!",
        hp: "HP", atk: "ATK", floor: "FL", wait: "WAIT", warpBtn: "WARP",
        mNames: ["Noise Rat", "Discord Armor", "Silent Eye"], bName: "Ancient Conductor",
        win: "Legend Soloist!", lose: "Music stopped..."
    },
        /* スペイン語定義 */
    es: {
        gTitle: "GUÍA", gBody: "Meta: Vencer jefe en 5F<br>HP: Vida. 0 = Fin<br>Mover: Flechas para atacar<br>Espera: 1 turno quieto<br>Warp: Gasta 5 HP para teleport",
        start: "Empieza la función.", bossNear: "Melodía inquietante cerca...",
        wall: "Es un muro.", potion: "¡HP recuperado!",
        stairs: "Piso siguiente... ({d}F)", lvup: "¡Nivel sube! (Lv{l})",
        attack: "¡Ataca a {n}! {dmg}", defeat: "Venciste a {n}.",
        damaged: "¡{n} ataca! {dmg}", warp: "¡Teletransportado!",
        hp: "HP", atk: "ATQ", floor: "PISO", wait: "ESPERA", warpBtn: "WARP",
        mNames: ["Rata Ruido", "Armadura Discord", "Ojo Silencio"], bName: "Director Antiguo",
        win: "¡Solista de leyenda!", lose: "Música detenida..."
    }
};