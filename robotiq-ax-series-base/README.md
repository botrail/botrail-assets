# Robotiq AX Series — legacy 基台・昇降柱の外観参照モデル

参照する外観: **2022-01 の公式 AX/PE product sheet に掲載された、旧 AX Series / UR10e 構成の基台・昇降柱・Robotiq リニア軸コントローラ**。
独自著作、CC0-1.0。メーカー CAD・写真・図面・ロゴ・画面画像は配布物に含めない。
ロボット、グリッパ、灰色の UR ロボットコントローラ、ティーチペンダントは対象外。

カタログ ID は `robotiq/ax/ax10/r2`（公開前）。旧外観・旧 collision の `r1` は以前のコミットを固定参照する。

## 世代と出典を固定する

今回の外観は [Robotiq Palletizing AX/PE product sheet, 2022-01, pp.2–3](https://distributors.robotiq.com/hubfs/Robotiq%20Kits%20for%20Partners/UR%20Robotiq%20Kit%20for%20Partners/Application%20Solutions/Robotiq%20Palletizing%20Solution/Product%20Sheet/Robotiq_Palletizing_AX_PE_2022-01_4pages_EN.pdf)
の公開写真を参照した。開いたレール状基台、黒いマストと銀色の縁、深い三角形の昇降ブラケット、
別体の黒い軸制御盤、白い表示灯 2 本を独立した形状として作り直した。
この資料は外観の根拠であり、各部の実寸を公表する寸法図ではない。

[公式製品ページ](https://palletizing.robotiq.com/palletizing-solution) の公開画像は構造の補助確認に使用。
撮影世代は確定できないため、後年の制御盤・寸法を旧モデルへ混在させない。
[公式センサ識別記事](https://blog.robotiq.com/knowledge/identifying-pallet-sensors-5-1736280792480)
は 2 × PAL-SENS-A + 2 × PAL-SENS-B の数量を確認する出典。センサ形状や配置寸法の根拠ではない。

**2334 mm と 2369 mm を同一寸法として扱わない。** 旧 README の 2023-05-31 manual と
後年の 2024-02-27 AX10 manual には異なる高さがある。床から表示灯上端という基準は同じで、
35 mm の差の原因は確認できていない。両マニュアルには複製制限があるため、
CONTRIBUTING に従い今回の新しい寸法著作には使用していない。
既存値は互換性のため残すが、制限のない出典による再検証済み寸法とは扱わない。

したがってこれは **旧データと 2022 年の外観を組み合わせた互換参照モデル**。
特定シリアルの完全再現、現行 AX10 / AX20 / AX30 への適合を保証するものではない。

## 寸法・互換性・推定値

| 項目 | 公開資料から今回確認できたこと | 本モデル |
| --- | --- | --- |
| 基台外形・全高 | 適格な新しい寸法出典なし | 既存値 809 × 1370 × 2334 mm を保持 |
| 昇降ストローク | 今回新たな寸法採用なし | 既存 `lift_joint` 0–1500 mm を保持 |
| マスト断面・位置 | 黒い広幅面と銀色の縁は写真で確認、実寸不明 | 旧推定 220 × 160 mm、Y = −350 mm |
| ロボット取付板 | 三角形支持と水平板を写真で確認、寸法・穴位置不明 | 旧推定 300 × 300 × 20 mm、最下上面 Z = 550 mm |
| 前方張り出し | 実寸不明 | 旧推定フレーム値 420 mm を保持 |
| 軸コントローラ | 黒い別体キャビネットを写真で確認 | 旧推定 420 × 200 × 400 mm、中心 Z = 1000 mm |
| 灯・センサ | 灯 2 本を写真、センサ 4 個を公式記事で確認 | 数量を維持、寸法・設置点は推定 |
| 質量・電気仕様 | 今回の独立した再検証対象外 | 旧参照 155 kg。慣性・電気性能は未同定 |

旧 README は 2023 manual を寸法出典としていたが、これは今回その制限付き文書から寸法を新規採用したという意味ではない。
柱・足・レール・側板・制御盤・センサ・表示灯の細部はすべて写真から独立に割り付けた概形。
推定値は `authoring/model.mjs` の `D`（旧互換定数）、`E`（今回の案）と部品定義にある。
ガイドの 2 条の走行面、4 個の U 字状シューは運動を説明する概略配置で、内部の軸受構造を確認したものではない。
横方向 1 mm の隙間は表示用の逃げであり、実機の軸受公差ではない。

### 意図的な違い・未検証部分

- `robot_mount` の穴・ダウエル座標は確認できないため、板は無穴のまま。UR10e が直接締結できるとの主張はしない
- 灰色の UR 制御盤とティーチペンダントは AX 装置の写真に写るが、既存アセット境界を守るため追加しない
- 軸制御盤の寸法・高さは旧推定のまま。古い写真の黒い制御盤そのものの寸法を測定したわけではない
- 写真にある上端の吊りアイは省略。吊り荷重・形状寸法が不明で、旧全高の外側に推測の吊り具を追加しない
- 表示灯は無点灯の拡散カバー。信号状態や安全機能を再現しない
- 外部コネクタは汎用の外形のみ。内部ピン、電気配線、リフトの隠れた駆動部は作らない
- 可動ケーブルとケーブルベアは全ストロークの実際の経路が確定できず省略。剛体メッシュを伸縮ケーブルに見せない
- アンカーのタブ開口は独立した概形で、穴位置・実機締結・床への固定を保証しない
- 旧 `lift_joint` 速度 0.3 m/s、推力 3000 N はシミュレーション設定値。実機仕様ではない

## フレームと collision

- `base_link`: 基台中心の床面、+Z 上、柱 −Y 側、ロボット板 +Y 側
- `carriage`: `lift_joint` の子。キャリッジと三角形支持・ロボット板
- `robot_mount`: 板の上面中心。世界位置は `[0, 0.160, 0.550 + q]` m

関節・frame・可動域・駆動設定は r1 の URDF と同じ。collision は 2026-10-11 に、描いた部品を包む箱に作り直した
（基台 16 個、キャリッジ 6 個。0.1 mm 単位で外側に丸め、全頂点が 1 µm 以内で内側にある）。

- 基台は開いた枠のまま: 左右のレール、前後の横材（四隅のアンカーのタブを含む）、マストの横材、マストの台座板、
  足元の補強板、パレットセンサ 4 個。枠の内側の開口に collision は無い
- マスト（正面のねじと上下のキャップを含む）、その前のガイドレール、上端の表示灯、制御盤（扉・蝶番・通気口・
  取付ブリッジ・グランド）、アイソレータ
- キャリッジ: ガイドシュー・背板・後ろの補強をまとめた箱、天板と三角形の側板を前後 4 区間に分けた箱
  （側板の下辺の傾きに沿う）、ロボット取付板（上面が `robot_mount`）
- r1 の collision（全面の床板、マスト、制御盤、キャリッジの 3 個の box）では、見た目が基台で最大 80 mm
  （表示灯）、キャリッジで最大 55 mm（三角形の側板）外に出ていた
- 基台とキャリッジは親子なので、相互の重なりは自己干渉の判定対象外。collision は計画用の包絡で、
  製造・据付のクリアランスは保証しない

URDF SHA-256: `a1a117ad656548fb70fdd8d24a2a73ddfe6da8085c8946bd1e35d91a32f9cd0c`

## 再生成・検証・表示

リポジトリルートから、既存の承認済み依存を準備した上で:

```sh
npm --prefix authoring ci
node robotiq-ax-series-base/authoring/export.mjs
node robotiq-ax-series-base/authoring/export.mjs --check
node --test robotiq-ax-series-base/authoring/model.test.mjs
python3 robotiq-ax-series-base/authoring/verify_obj.py
python3 robotiq-ax-series-base/authoring/verify_motion.py
npm --prefix authoring test
python3 -m http.server 8765 --bind 127.0.0.1
```

`http://127.0.0.1:8765/robotiq-ax-series-base/authoring/` が表示ページ。
リフトの slider は 0–1.5 m。ブラウザ実行の検証状況は `docs/verification.md` に区別して記録する。

Blender 4.x による同一カメラの比較・ポーズ描画:

```sh
blender -b -t 6 --python robotiq-ax-series-base/authoring/render_review.py -- \
  robotiq-ax-series-base/urdf/robotiq-ax-series-base.urdf /tmp/ax-mid.png \
  --pose '{"lift_joint":0.75}' --materials robotiq-ax-series-base/docs/materials.json
```

`--view` は `iso/front/side/rear/top/base/carriage/controller`。
描画は実際に出力した OBJ/MTL と URDF を読み込む。OEM 画像をレンダリングに混ぜない。
