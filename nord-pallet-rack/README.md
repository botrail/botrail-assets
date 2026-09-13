# nord-pallet-rack

Nord Modules **Pallet Rack (EU)** の**見た目**を持つアセット(CC0-1.0)。カタログの
`nord_modules/pallet-rack/eu/r1`(`structure.pallet_stand`、生成器 `bt.parts.pallet_stand`)が
`components[].trim` から参照する。パレットリフト付き MiR がパレットを受け渡す床置きのスタンド。

- **メッシュは無い。プリミティブの xacro だけ** — 当たり判定は botrail が置く脚 4 本・レール 2 本・後端ストッパが持つ
- 参照実機: [Nord Pallet Rack 製品シート](https://www.rarukautomation.com/wp-content/uploads/2026/02/Nord-Pallet-Rack-MiR-Product-Sheet.pdf)
  (MiR Go 掲載品、MiR500/600/1000/1350 対応、可搬 1,250 kg、RAL 9005)

| 項目 | 公表値 | モデル |
| --- | --- | --- |
| 長さ(進入方向)| 1,300 mm | 同値 |
| 幅 | 1,178 mm | 同値 |
| 高さ | 389 mm | 後端ストッパの高さに採用 |
| 床→パレット | 348 mm | レール上面 |
| 対象パレット | EU EPAL 800 × 1,200 | 生成器の `rules.pallet_mm` |
| ロボットが潜る内幅 | **非公開** | 1,000 mm(MiR1350 の幅 910 + 両側 45 mm)— 仮定 |
| 脚の断面 | 非公開 | 60 mm 角 — 仮定 |

`visual/stand.urdf.xacro`: 引数 `length` `width` `height` `support` `inner` `leg`(m)。原点は床レベル・スタンド中心、
X = ロボットの進入方向。足板・進入側のフレア・後端の反射マーカを描く。
