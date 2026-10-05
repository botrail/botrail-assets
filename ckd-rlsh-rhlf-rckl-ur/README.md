# CKD RLSH-UR / RHLF-UR / RCKL-UR — 独自形状の参照モデル (包絡ベース)

参照実機: **CKD ユニバーサルロボット認証グリッパ** RLSH-UR (コンパクト)、RHLF-UR (ロングストローク)、RCKL-UR (三方爪)。
カタログ `ckd/rlsh/rlsh-ur/r1`、`ckd/rhlf/rhlf-ur/r1`、`ckd/rckl/rckl-ur/r1`。CC0-1.0。
メーカー CAD・画像・第三者メッシュを使わず、公表数値から著作した。

出典:

- CKD 製品ページ [RLSH-UR](https://www.ckd.co.jp/kiki/jp/product/detail/955/RLSH) / [RHLF-UR](https://www.ckd.co.jp/kiki/jp/product/detail/956/RHLF-UR) / [RCKL-UR](https://www.ckd.co.jp/kiki/jp/product/detail/957/RCKL-UR):
  ストローク 18 / 32 / 10 mm、把持力 42 / 85 / 125 N、質量 0.8 / 1.0 / 1.1 kg。
- [UR Marketplace 掲載 (CKD Pneumatic Grippers)](https://www.universal-robots.com/marketplace/products/01tP40000071NGzIAM/): 外形 148 × 83 × 76 / 111 × 138 × 79 / 119.4 × 76 × 87 mm、同梱品 (本体、ロボットフランジ、アタッチメント、方向制御弁、URCap)。
- [CKD リーフレット (カンタム配布)](https://www.kantum.co.jp/content/download/3005/43804/file/RLSH%E3%83%BBRHLF%E3%83%BBRCKL%E3%82%B7%E3%83%AA%E3%83%BC%E3%82%BA%20.pdf)
  (sha256 dbee9c0b1aeb09ca63d2cbc24aa5d8497cdbda4055286aa1ecb5c47f4474c55a): 共通ロボットフランジ + クランプリングの構成、360° インジケータ。

**CKD の外形図はデジタルカタログ (会員向け) にしか無く、取り寄せていない。** そのため、共通フランジ (Ø76 × 18 mm)、
本体の分割、閉時の爪間隔 (10 / 20 mm)、三方爪の閉時半径 (15 mm)、爪の形は UR 掲載の外形包絡とリーフレットの写真から置いた
当方の割り付けで、実機の寸法と一致しない。確かなのは全高・幅・奥行の包絡、ストローク、把持力、質量だけ。
図面が得られたら新 rev で置き換える。

| 変種 | 包絡 (H × W × D) | 爪 | ストローク | 把持力 (0.5 MPa、ℓ=20) | 質量 |
| --- | --- | --- | --- | --- | --- |
| RLSH-UR | 148 × 83 × 76 | 平行 2 爪 | 18 mm (各 9) | 42 N | 0.8 kg |
| RHLF-UR | 111 × 138 × 79 | 平行 2 爪 | 32 mm (各 16) | 85 N | 1.0 kg |
| RCKL-UR | 119.4 × 76 × 87 | 三方爪 (半径方向) | 10 mm (各爪 5 mm と解釈、定義は未確認) | 125 N | 1.1 kg |

## フレーム

- root の `mount` = 同梱ロボットフランジのロボット側 (ISO 9409-1-50-4-M6) の面。+Z がツール内部へ。
- `finger_joint` = 0 が閉。2 爪は右爪が mimic、三方爪は jaw_2 / jaw_3 が mimic。`*_contact` = 爪の内側面、`tcp` = 爪先から 10 mm 上の軸上。

## 再生成・表示

```sh
npm --prefix authoring ci
node ckd-rlsh-rhlf-rckl-ur/authoring/export.mjs
node ckd-rlsh-rhlf-rckl-ur/authoring/export.mjs --check
node --test ckd-rlsh-rhlf-rckl-ur/authoring/model.test.mjs
python3 -m http.server 8765 --bind 127.0.0.1
```
