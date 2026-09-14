# schneider-xalk178f — Harmony XALK178F 非常停止ステーションの見た目

カタログの `schneider-electric/harmony/xalk178f/r2` (`hmi.panel`、生成器 `operator_panel`)
が `components[].trim` から参照する表示用 xacro (CC0-1.0)。

- **参照実機**: Schneider Electric Harmony XALK178F — 黄/灰の筐体に φ40 のひねり復帰
  非常停止操作部、NC 接点 2 ([製品ページ](https://www.se.com/ph/en/product/XALK178F/))
- **描くもの**: 灰の筐体と、その前面の黄色い蓋 (2 mm 出る)、蓋の留めねじ 2 本。
  **操作部 (きのこ頭と黄色い襟) は botrail の生成器が描く** — 押下の Zone センサと
  一体だから。ここは筐体だけ
- **干渉には入らない**。当たり判定は生成器の板 (`<name>/plate`) が持つ

| 項目 | 公表値 | モデル |
|---|---|---|
| 見付 | 68 × 68 mm | パックの `size_mm_by_positions` |
| 筐体奥行 | 53 mm (操作部込み 92.5) | 53 (パックの `thickness`)、操作部は `proud` 15.8 × 2.5 |
| 蓋・ねじ | 写真参照 | 黄色 2 mm、φ4.8 のねじ頭 2 本 (位置は推定) |

原点は板の中心、面は -Y。引数 (メートル): `width` `height` `thickness` — 生成器が
パックの寸法から渡す。2 つの NC 接点は 1 本の入力として扱われる (安全回路の検証ではない)。
