# botrail-assets

[botrail](https://github.com/botrail/botrail) カタログ用の**自作アセットの原本**置き場。
ベンダー OSS モデルが存在しない機材 (スポット溶接ガン、ワークピース等) をここで著作し、
[botrail-catalog-builder](https://github.com/neka-nat/botrail-catalog-builder) が
`fetch: git` (sparse + コミット SHA ピン) で取得してビルド・検証・公開する。

- ここは**入口 (ソース)**。ビルド済み・検証済みの**出口 (公開カタログ)** は
  Hugging Face の `botrail/botrail-catalog` — 直接ここを消費しないこと
- ライセンス: 全ファイル **CC0-1.0** (LICENSE 参照)

## 著作規約 (botrail カタログ準拠)

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

| slug | 種別 | 状態 |
|------|------|------|
| [weld-gun-x1](./weld-gun-x1) | サーボスポットガン (X ガン, 1 DOF) | 寸法は ISO 5821 等の公開規格に整合 (カタログ r2) |
| [biw-sedan](./biw-sedan) | ワークピース: BIW (ジョイントレス) | 凸 49 ピースの authored collision compound |

> **公開済み rev の中身は動かさないこと。** カタログの recipe は公開 rev の
> ソースをコミット SHA でピン留めしている。アセットを変えたら**新しい rev を切る**
> — 同一 rev で差し替えると、その rev を記録した既存 project が再現できなくなる
> (2026-08-08 に weld-gun-x1 r1 で実際に起きた)。
