# botrail-assets

[botrail](https://github.com/botrail/botrail) カタログ用の**自作アセットの原本**置き場。
ベンダー OSS モデルが存在しない機材 (スポット溶接ガン、ワークピース等) をここで著作し、
[botrail-catalog-builder](https://github.com/neka-nat/botrail-catalog-builder) が
`fetch: git` (sparse + コミット SHA ピン) で取得してビルド・検証・公開する。

- ここは**入口 (ソース)**。ビルド済み・検証済みの**出口 (公開カタログ)** は
  Hugging Face の `botrail/botrail-catalog` — 直接ここを消費しないこと
- ライセンス: 全ファイル **CC0-1.0** (LICENSE 参照)

## 著作規約 (botrail カタログ準拠)

### 参照実機を必ず 1 つ定める

自作アセットは**ゼロから想像で作らない**。実在する製品を 1 つ「参照実機」に定め、
**その公表値に寸法・性能を合わせた上での独自著作**にする。README に次の 3 つを必ず書く:

1. **参照実機の型番と出典 URL** — 「〜クラス」「一般的な〜」のような曖昧な書き方はしない。
   型番まで特定できない値は、特定できないと明記する
2. **参照実機から採った値の一覧** — 公表値と本アセットの値を並べた表にする
3. **意図的に変えた点と、その理由** — 変更は歓迎される (カタログ内での組み合わせ都合など)。
   隠さず差分として書くことが条件

参照実機の**寸法図そのものは複製しない**。採ってよいのは公表されている数値 (facts) で、
外観は独自著作にする。**再配布を制限している文書 (社外秘条項・複製禁止条項つきの
マニュアル等) は寸法ソースに使わない** — 制限のない公式製品ページ・データシート・
公開規格を選ぶこと。適切な参照実機が見つからない場合は、探した範囲を README に記録する
(例: tool-changer-a1 が ATI QC-11 を参照実機にしなかった理由)。

### 形状・データの規約

- Z-up / メートル単位
- リンク・フレーム名は USD-safe (`[A-Za-z_][A-Za-z0-9_]*`)
- ツール類: root リンク `mount` = フランジ接触面 (+Z がツール内側へ向く)。
  `tcp` は固定リンクとして URDF 内で宣言 (recipe の extra_frames 不要)
- **visual と collision を分ける**。visual はメッシュで作り込んでよいが、
  開口を持つツール (ガン等) の collision は **URDF プリミティブ (box/cylinder)
  のみ**で著作して開口を保つ (builder がプリミティブを素通しするため VHACD を
  回避できる)。可撓物 (ホース・ケーブル) には collision を与えない
- メッシュは手続き的生成 (`tools/generate_meshes.py`) を基本とし、寸法定数を
  スクリプト冒頭に集約する。実機値への差し替えと再生成が 1 箇所で済む

## レイアウト

```
<asset-slug>/
  urdf/<asset-slug>.urdf
  meshes/            # visual メッシュ (生成物)
  tools/             # メッシュ生成スクリプト
  docs/              # 外観プレビュー
  README.md          # アセットカード (状態・実測値・フレーム)
```

## アセット一覧

| slug | 種別 | 参照実機 | 状態 |
|------|------|----------|------|
| [weld-gun-x1](./weld-gun-x1) | サーボスポットガン (X ガン, 1 DOF) | Electroweld SP-xxIT-X (のど深さ 400 mm) + OBARA DB3-160 (トランス) + ISO 5821 Type F 16x20 | 規約どおり |
| [weld-gun-c1](./weld-gun-c1) | サーボスポットガン (C ガン, 1 DOF) | Milco XR 637-12402-15 / HERON DB6-110-C16027 (ストローク) | 規約どおり |
| [tool-changer-a1](./tool-changer-a1) | ツールチェンジャ (マスタ + ツール) | SCHUNK SWS-011 (SWK-011 / SWA-011) | 規約どおり |
| [vacuum-gripper-v1](./vacuum-gripper-v1) | 電動真空グリッパ (4 カップ) | Schmalz CobotPump ECBPi | 規約どおり |
| [biw-sedan](./biw-sedan) | ワークピース: BIW (ジョイントレス) | — | 凸 49 ピースの authored collision compound。URDF 版と UsdPhysics 版 |

> **公開済み rev の中身は動かさないこと。** カタログの recipe は公開 rev の
> ソースをコミット SHA でピン留めしている。アセットを変えたら**新しい rev を切る**
> — 同一 rev で差し替えると、その rev を記録した既存 project が再現できなくなる
> (2026-08-08 に weld-gun-x1 r1 で実際に起きた)。
