# mesh-guard

汎用メッシュパネル安全柵の**見た目**を持つアセット (CC0-1.0)。カタログの
`botrail/fence/mesh-guard/r1` (`structure.fence`) が `components[].trim` から参照する。

- **メッシュ (三角形) は無い。プリミティブの xacro だけ** — 柵は「押し出し + 繰り返し」で
  できているので、形状ファイルより**寸法から組み立てる規則**の方が正確に表せる。
  1 枚の xacro が、売られている全サイズ (幅 200〜1500 / 高さ 1200〜2400) を描く
- **参照実機は特定していない** — 市場で一般的なメッシュガードを模した独自著作で、
  特定メーカーの寸法表の転記ではない。メーカー版のパックは自分の xacro を持てばよい
- **干渉には入らない**。当たり判定は botrail が置くパネル 1 枚のスラブと支柱が持ち、
  ここのファイルが描くのは枠・金網・ベースプレート (`set_obstacle_enabled(False)`)

## ファイル

| | 引数 (すべてメートル) | 描くもの |
|---|---|---|
| `visual/panel.urdf.xacro` | `width` `height` `thickness` `frame` `wire` `aperture` `handle` | 角パイプの枠 4 本 + 金網のグリッド。`handle=1` で扉のハンドル |
| `visual/post.urdf.xacro` | `height` `section_w` `section_d` `plate` `square` | 支柱 + ベースプレート。`square=1` は角の支柱 (2 方向を受けるので正方断面) |

原点の規約はどちらも **床レベル・部材中心**。X = 柵の走る方向、Y = 板厚方向、Z = 上。
`bt.parts.fence` がこの原点を部材の設置位置に置き、辺の yaw で回す。

金網は**線を 1 本ずつは描かない**。開口 49 mm をそのまま描くと 1 枚 60 本になるので、
1 辺あたり最大 5 本の粗いグリッドに丸める (`nv` / `nh` の式)。セル全景の距離では
これで金網として読め、かつ**向こう側が透ける** — botrail に透明度が無いので、
透かすには実際に隙間を空けるしかない。

## 手で確かめる

```python
import botrail as bt
scene = bt.Scene(bt.Robot.from_urdf("examples/simple_arm.urdf"))
scene.load_urdf("mesh-guard/visual/panel.urdf.xacro", prefix="panel",
                args={"width": "1.2", "height": "2.0", "aperture": "0.049"})
```
