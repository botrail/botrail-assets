# OnRobot RG6 — 写真参照による独立した形状

参照実機: **OnRobot RG6、ツール側 Quick Changer、標準 EPDM フィンガーチップ**。
CC0-1.0 の手続き形状。メーカー CAD・メッシュ・写真・ロゴ・テクスチャは同梱しない。
旧カタログ ID `onrobot/rg/rg6/r2` は互換情報。公開時には新 rev が必要。

## 出典と採った値

- [公式データシート v2.0](https://onrobot.com/storage/datasheets/rg6/datasheet_rg6_v2.0_en.pdf)
- [公式製品ページ](https://onrobot.com/en/products/rg6-finger-gripper) の同型番の写真（2026-10-10 確認）
- [旧モデルで数値を参照した公開 ROS ソース 1](https://github.com/inria-paris-robotics-lab/onrobot_ros/blob/9c6ce32d84bd903d59120c2a95d4a115d6e33cde/onrobot_description/config/rg6_v2.yaml)
- 旧モデルの公開 ROS 由来の関節値は互換維持のため据え置いた。今回の写真からの寸法同定ではない

| 項目 | 公表値 | 今回の扱い |
| --- | --- | --- |
| 全ストローク | 160 mm | 約 160.00056 mm、接触面 X 座標は旧モデルを維持 |
| 本体の首幅 / 最大幅 / 厚さ | 60 / 84 / 42 mm | 同値の外装包絡を使用 |
| ブラケット幅 | 82 mm | 外側幅を維持。内部や QC の嵌合は推定 |
| 標準 EPDM の幅 × 長さ × 奥行 | 25 × 37 × 13.15 mm | この外形で独立生成した開放背面スリーブ |
| 閉 / 開の図面長さ | 262 / 208 mm | **ブラケット肩から裸の金属指先まで**。mount から EPDM 先端までの長さではない |
| 旧 URDF の固定 TCP | 268.1 mm | mount からの高さをバイト単位で維持。新 visual の指先ではない |

**上表以外の輪郭、内部構造、フィンガーの座り、取付穴位置、ピン、ブラケット・QC 部は写真からの推定**。
図面をトレースしたメッシュではなく、独立した曲線・押出形状で著作した。
[出典と不確かさ](./authoring/provenance.json)。

## 外観の改修

- 2 個の箱だった筐体を、曲線のくびれ・広い頭部を持つ銀色の表裏カバーと内部フレームに分割
- RG2 / RG6 で本体幅、厚さ、腕長、ピボット位置、パッド・キャリア寸法を別々に保持
- 均一な棒を、丸いピボット端、層の異なるプレート、軸端、広い黒色安全スイッチカバーに変更
- 金属キャリアと丸い EPDM スリーブを分離し、パッドがピボットを貫通していた旧配置を修正
- ブラケットの側面チルトカバー、支持部、青色 QC 包絡を追加。機能する嵌合やチルト関節は著作していない

[同条件の前後比較](./docs/before-after.png) / [開・中間・閉姿勢](./docs/pose-views.png) / [詳細](./docs/detail-views.png)。

## 保持した互換性と重要な限界

URDF は main `61759a3219bf36677374d733f2cfbd19aa2ac72a` と完全一致。
リンク名、関節原点・軸・制限・mimic、mount / tcp、collision、メッシュ参照パスを変更していない。
`rg6_v2_gripper_joint=0` が開、`1.3` が閉。
速度 0.5 rad/s と effort 10 は旧シミュレーション値で、実機性能ではない。

旧モデルには、肩基準の裸指先の長さを mount 基準のパッド長と扱う混同があった。
30 mm をゴム幅とする旧記述も誤りで、図面の 30 mm はリンクの奥行を指す。
今回、EPDM の公表外形とピボットから離れた座りを優先した。
**新 visual の閉時先端高さは mount から約 291 mm**。
これは推定配置の結果で、実機の mount-to-tip 測定値ではない。旧寸法値に合うようにゴムを縮めていない。

- 旧 collision は変更しておらず、新しいブーツ位置・外装を精密に囲まない
- 元から body / arm の collision 同士に重なりがある。安全経路・組付け・狭い隙間の適合には使えない
- 新 visual の自己干渉検査は離散姿勢のソリッド交差計算。連続全域の非干渉証明ではない
- ベアリングの嵌合、支持部品の接合は視覚的な重なりを許す。穴・軸の実測クリアランスではない
- 黒いスイッチカバーの先端側の逃げは、保持した旧運動学と追加支持軸の干渉を避ける当方の推定形状。実機写真のカバー輪郭を完全再現していない
- チルトカバーのねじ・QC ラッチ・嵌合穴などの小部品は未再現または簡略化
- QC は簡略化した表示形状で、穴・ラッチ・取付互換性を保証しない。ロボット側アダプタは含まない
- 質量・慣性、接触力、弾性、安全スイッチ動作、ケーブル、実機の寸法公差は未検証

## 再生成と検証

Node.js 22 以降。共通依存を準備して実行する。

```sh
npm --prefix authoring ci --ignore-scripts --no-audit --no-fund
node onrobot-rg6/authoring/export.mjs
node --test onrobot-rg6/authoring/model.test.mjs
node --test authoring/test/onrobot-contract.test.mjs
node onrobot-rg6/authoring/export.mjs --check
python3 onrobot-rg6/authoring/verify_obj.py
```

両モデルの契約テストは双方のディレクトリを必要とする。
[検証記録](./docs/verification.md)。ポータブル ZIP には両モデルと共通コードを含む。
Three.js のビューアは `python3 -m http.server 8765 --bind 127.0.0.1` で配信し、
`/onrobot-rg6/authoring/` を開く。ブラウザ UI は本環境で未検証。
静止画は Blender 4.3.2 による実 OBJ / URDF のレンダーであり、ブラウザ操作の代用とはしない。
