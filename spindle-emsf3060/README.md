# spindle-emsf3060

ロボット切削用モータスピンドルの自作アセット (CC0-1.0)。カタログの `tool.spindle`
カテゴリ初号機。

- **参照実機**: ナカニシ **EMSF-3060K** (フランジ付きモータスピンドル、E3000 シリーズ)
  — φ30 / 最大出力 350 W / 最高 60,000 min⁻¹ / CHK コレット ø0.5〜6.35 mm / 620 g。
  寸法は E3000 カタログ p.2-43 の公表寸法図から採った。複製ではない —
  細部意匠は独自著作 (詳細は `urdf/spindle-emsf3060.urdf` のヘッダ)
- **構成**: `mount` (root, フランジ前面) → `body` → `collet` → `cutter` → `tip`
  の固定チェーン。可動 DOF ゼロ。`tip` は X 軸半回転で反転してあり +Z が
  「先端 → 工具本体」方向 (botrail の `PathTarget.tool_axis` 規約)
- **カッタ**: ø6 × 突き出し 30 mm (当方設計)。collision は実半径の細円柱 1 本で、
  botrail 側の `allow_link_obstacle_contact(cutter, stock)` の免除対象になるよう
  単独リンクにしてある
- **取付**: 実機どおりフランジ 4-ø4.2 貫通 / ボルト円 ø39 (M4×16 × 4)。
  ISO 9409-1 ではないためロボットフランジへはブラケット (ホルダ) を介する。
  胴がフランジ後方へ 97.3 mm 突き出す点に注意

## 再生成

```sh
python spindle-emsf3060/tools/generate_meshes.py   # 依存: trimesh
```

`meshes/{body,collet,cutter}.stl` (メートル単位, Z-up) が更新される。
