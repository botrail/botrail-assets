# Piab piCOBOT UR — original 7 kg air-driven visual study

参照実機は **Piab piCOBOT for Universal Robots（初代空圧式 7 kg）＋ Adjustable Gripper 0212848 / Interface 16×17**。piCOBOT L / Electric / ActiNav ではない。公表された組立外形と実機写真を使った独自著作。現行キットの完全注文コードは未特定。

**既存互換の外観改良版**: main `c945d9e6257a66539b4d0495c30f89d1040b95bf` の URDF、固定リンク、TCP、collision をバイト単位で保持する。そのため旧モデルの Ø40×22 mm カップ・120 mm 間隔を残す。公式写真の B35XP 0205105 は Ø37 mm であり、このモデルはその実寸再現・OEM適合証明ではない。catalog `piab/picobot/picobot/r1` の公開元 SHA は更新していない。配布には新 rev が必要。

## 出典と値

- [UR 公式 Marketplace](https://www.universal-robots.com/marketplace/products/01tP40000071NYNIA2/): 初代 UR 用エジェクタ Ø93×74 mm、Adjustable Gripper 174×72×38 mm、最大 7 kg、8 個のカップを含むキット
- [Piab piCOBOT UR](https://www.piab.com/robot-and-cobot-gripping-solutions/cobots-and-robot-grippers/picobot-vacuum-gripper-unit/picobot-for-universal-robots): 実機写真・製品レンダー
- [Piab Adjustable Gripper 0212848](https://www.piab.com/robot-and-cobot-gripping-solutions/cobots-and-robot-grippers/picobot-vacuum-gripper-unit/0212848): 製品ページ・公開英語データシート・単体外観
- [Piab B35XP PU30/60 G1/4 male 0205105](https://www.piab.com/suction-cups-and-soft-grippers/round-suction-cups/bellows-suction-cups/0205105): 写真に一致するカップ構成。すべてのキットの同梱品を意味しない

| 項目 | 公表値 | このモデルと制限 |
|---|---|---|
| UR エジェクタ外形 | Ø93×74 mm | 幅93 / 高さ74を基準、コネクタ突起は別。詳細輪郭は写真から推定 |
| グリッパ最大外形 | 174×72×38 mm、現行図174×72.2×37.55 | 既存collision174×72×38を保持。120mm間隔の運転姿勢を描く |
| 調整 | カップ間隔97–142 mm、傾き±15° | 120 mm / 0°固定。架空の駆動関節なし |
| 写真のB35XP | lip Ø37、rubber18.6、ねじ込み前全高33.6 mm | 旧Ø40×22を保持。色とベローズの輪郭のみ参照 |
| グリッパ接続 | 16×17 mm、4×Ø4.2、カップG1/4 | 新しい精密取付穴・ねじ適合は追加しない |
| UR 接続 | ISO9409-1-50-M6 | 旧Ø50PCD・Ø6.6穴4個、板厚5を維持。詳細穴寸法／板厚は未認証 |
| 質量 | 現行グリッパminimum210g、旧kit値と異なる | 慣性は未設定、旧約0.89kgを精密値として継承しない |

## 改善と推定

銀色の段付き上蓋、黒い樽型筐体、前面HMIの張り出し、LED窓、左側緑ボタン、右側丸ボタン、青い表示ストローク、緑COAXカートリッジと6個のねじ、右側空気エルボ、後方M8ソケットを追加。OLED文字・ロゴは複製せず独自の抽象表示。細部寸法・裏面配置は推定。

中央カバー、独立したスライドアーム、二ねじクランプ、円板付き傾斜ホルダ、**前後反対側**の短い真空管、緑ベローズと黄色リップ、実際に開いたカップ空洞を作った。写真の青ノブ付き調整ピンは着脱式アクセサリのため運転状態には付けない。外部エアホース・電源ケーブル・ロボットは対象外。

## フレームと衝突の注意

root `mount` はロボット取付面、+Zはツール方向。`cup_a` / `cup_b` = Z112mm、接触面と`tcp` = Z134mm。カップ中心はX±60mm。全5関節は固定。

collisionは旧版と同一で、詳細外観を完全には包まない。計測上、空気コネクタは旧collisionから最大約17.17mm、カップ上部は約1mm外側。外観の移動ではなく、元の単純collisionを保持した結果である。狭い空間の干渉評価や安全設計には使わない。可撓管に専用collisionなし。吸着・漏れ・変形・手動幅調整は模擬しない。

## 再生成・確認

```sh
npm --prefix authoring ci
node piab-picobot/authoring/export.mjs
node piab-picobot/authoring/export.mjs --check
node --test piab-picobot/authoring/model.test.mjs
python3 piab-picobot/authoring/verify_obj.py
node piab-picobot/authoring/verify_clearance.mjs
npm --prefix authoring test
python3 -m http.server 8765 --bind 127.0.0.1
```

`http://127.0.0.1:8765/piab-picobot/authoring/` を開く。OBJは同一属性の損失なし再利用で圧縮し、法線・UV・材質・全三角形を保持する。共有authoringは変更しない。

## 権利

独自モデルはCC0-1.0。OEM CAD・メッシュ・写真・図面・ロゴ・画面素材は同梱しない。著作の寸法ソースに複製制限付きマニュアルは使っていない。写真と公開データシートは事実／外観参照のみで、再配布権があるとは扱わない。
