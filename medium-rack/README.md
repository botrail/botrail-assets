# medium-rack

汎用中量ラックの**見た目**を持つアセット (CC0-1.0)。カタログの
`botrail/rack/medium-shelf/r1` (`structure.rack`) が `components[].trim` から参照する。

- **メッシュは無い。プリミティブの xacro だけ** — 棚は間口・奥行・高さ・段数を指定して
  買う製品。段のビームは**段数から再帰マクロで生える**ので、4 段でも 6 段でも同じ 1 枚が描く
- **参照実機は特定していない** — 市場で一般的な中量棚 (300 kg/段クラス) を模した独自著作
- **干渉には入らない**。当たり判定は botrail が置く支柱 4 本と棚板が持つ

## ファイル

| | 引数 (levels 以外メートル) | 描くもの |
|---|---|---|
| `visual/bay.urdf.xacro` | `width` `depth` `height` `upright` `beam` `shelf_thickness` `levels` | 支柱 4 本 + 足、側面の斜めブレース、各段の前後ビーム |
| `visual/shelf.urdf.xacro` | `width` `depth` `thickness` `upright` | 棚板 1 枚 + 前後の折り返し |

原点は `bay` が **床レベル・棚の中心**、`shelf` は **その段の天面中心**
(生成器が出す `<name>/level{i}` フレームと同じ位置)。

ブレースの傾きは `${atan2(h, run)}` でファイル側が出す (**xurdf 0.6.4 以降**。
それ以前は評価器に三角関数が無く、生成器が `tilt` 引数で渡していた —
catalog-builder の `docs/xurdf-issues.md` Issue 6)。
