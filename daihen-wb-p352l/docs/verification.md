# WB-P352L 詳細化の検証記録

2026-10-08。基準: `origin/main` の `23ea277` (PR #8 マージ後)。
変更対象: WB-P352L、ルートの当該アセット行、当該 CI 追加のみ。CM-7403 や他モデルの形状は変更しない。

## 自動検証

- Node.js の製品テスト 16 件: 合格
- 共通 authoring テスト 27 件: 合格
- OBJ / MTL / URDF の `export.mjs --check`: 合格。比較前に生成物を上書きしない
- 全 visual 部品: 有限の座標・法線、退化三角形なし、頂点を溶接したエッジの閉鎖、正の符号付き体積
- 独立した Python 標準ライブラリによる実際の OBJ 検査: 251 部品、44,640 三角形、全品の閉鎖・面の向き・正の体積を確認
- アイボルト以外の visual 包絡: 395 × 710 × 640 mm。接地面 z = 0
- 車輪径 50 mm、幅 26 mm、4 輪の接地、旧版互換の 320 × 460 mm 車軸配置と後方 100 mm を検証
- 前面通風穴、側面通風穴、背面通風穴、アイボルトと出力端子の穴はレイテストで実開口を検証
- 背面入力カバー・クランプ・ラベル・接地端子と前面電圧検出端子は、背板に埋まらず外から最初に見えることを検証
- 背面の左右関係 (右にグロメット・通風、左に入力カバー類) と、成形枠側面の冠部・段間が開きっぱなしでないことをレイテストで確認
- OBJ 縮小前後の全コーナーの位置・UV・法線、面・オブジェクト・材質の順序を厳密に比較。44,640 面を維持し、数値丸めや面削減なし
- 19,868,777 → 5,209,213 bytes。各オブジェクト内の重複属性記録のみ再利用し、再実行結果も同一
- 原 URDF の SHA-256 を固定したバイト比較。全フレーム・固定関節・collision は変更なし

URDF SHA-256:
`0f6ed08b2eddccdb7f6d4857f860ea1e2deac6444c7f5811131a5bfc6062a533`

各部品の閉鎖は、部品同士を融合した単一ソリッドや防水性を意味しない。
実機の形状一致・部品適合・安全性能を証明する検査でもない。

## 静止画検証

Blender 4.3.2 で実際の URDF / OBJ / MTL を読み込み、変更前後を同じ条件でレンダリング。
カメラ中心 (0, 0, 0.34) m、正投影の幅 1.0 m、1200 × 1200、48 samples。
材質の色は MTL、metalness / roughness は各版の著作ソースから `export-materials.mjs` で読み込む。
OBJ/MTL 単独に PBR 値が保持されているという主張ではない。

- 斜視、前面、左側面の変更前後を同一カメラで比較
- 更新版の背面と上面を別途検査
- 大きい後傾上段 + 小さい垂直下段、2 個の対角アイボルト、11 穴 × 2 バンク、4 列の側面ルーバーを写真と比較
- Blender ビルドに OpenImageDenoise がないため denoise は無効。レンダリング結果の実ファイル存在を確認

OBJ の属性インデックスを共通化した後も全コーナー属性が厳密に一致するため、比較画像の形状は変化しない。
比較画像は独自生成した画像のみ。メーカー写真・PDF・CAD は配布物に含めない。

## 出典と意図的な限界

公表外形・質量・前面と側面の構成は、適格な公式製品ページと公開カタログを根拠にした。
転載禁止付き取扱説明書は、今回の新寸法の根拠として除外した。
車軸配置は旧版互換の継承値、キャスタ実機同定と背面型番対応は未確認、局所寸法は推定。
詳細は README と provenance.json を参照。

`torch_outlet` は旧版からの経路マーカー。端子の visual は写真に合わせて下段右側へ置く。
軽量な box collision は従来どおりで、vent・小部品・車輪回転を接触モデルとして表現しない。

## 未実施

- 実ブラウザの WebGL / OrbitControls / ボタン / リサイズ操作の端末上検証
  - この環境では以前の Chromium 起動が UNIX socket 制約で拒否され、クラウドブラウザは隔離 localhost に接続できない
  - 制約の迂回や追加インストールは行わない。HTML の import とカメラ処理は静的に確認
- リモート CI、GitHub への push / PR、カタログ公開
- 他モデル全件の USD 再生成テスト (共通コードは未変更。共通単体テストは実施)

## 再現コマンド

```sh
npm --prefix authoring ci --ignore-scripts --no-audit --no-fund
node --test daihen-wb-p352l/authoring/model.test.mjs
node daihen-wb-p352l/authoring/export.mjs --check
python3 daihen-wb-p352l/authoring/verify_obj.py
npm --prefix authoring test
```

## Outlet frame and collision revision (2026-10-10)

A follow-up change moved `torch_outlet` from the legacy routing marker `[-0.060, -0.355, 0.300]` onto
the torch-side (image-right) output terminal: the centre of its brass lip face `[0.136, -0.326, 0.195]`,
base_link orientation. Two boxes around the lifting-eye rings, which stood 6.5 mm above the cabinet box,
complete the collision. The visual meshes, `mount` and the cabinet/caster boxes are unchanged.

- Every visual vertex lies inside the collision boxes; `torch_outlet` sits on the `output_1_brass_lip`
  face (new and revised tests)
- URDF SHA-256 `9d480de5054d…`; 17 model tests, `--check` and the OBJ audit pass
- The terminal position remains a photo estimate, not a measured socket centre

