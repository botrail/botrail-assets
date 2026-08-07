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
- 開口を持つツール (ガン等) の collision は **URDF プリミティブ (box/cylinder) のみ**で
  著作し、開口を保つ (builder がプリミティブを素通しするため VHACD を回避できる)

## レイアウト

```
<asset-slug>/
  urdf/<asset-slug>.urdf
  meshes/            # 必要な場合のみ (ワークピース等)
  README.md          # アセットカード (状態・寸法・フレーム)
```

## アセット一覧

| slug | 種別 | 状態 |
|------|------|------|
| [weld-gun-x1](./weld-gun-x1) | サーボスポットガン (X ガン, 1 DOF) | **draft** — 寸法プレースホルダ |
