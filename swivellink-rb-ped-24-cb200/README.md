# Swivellink RB-PED-24-CB200 (24 in コボット用ペデスタル) — 包絡ベースの参照モデル (図面未入手)

参照実機: **Swivellink COBOT Robot Pedestal RB-PED-24-CB200** (CB200 シリーズの 24 in。溶接鋼製、RAL 7010 粉体塗装)。
カタログ `swivellink/rb-ped/rb-ped-24-cb200/r1`。CC0-1.0。メーカー CAD・画像・第三者メッシュを使っていない。

**公表されている寸法は高さだけ**で、図面は無い (CAD は会員登録者向け)。台板・柱・天板の寸法は**推定**なので、
このモデルは外形の目安として使い、取付穴や干渉の厳密な検討には使わないこと。

出典: [製品ページ](https://swivellink.com/products/robot-accessories/cobot-pedestals/rb-ped-24-cb200/) (高さ、対応ロボット、アンカー穴、梱包寸法・梱包質量)、
[COBOT Accessories カタログ](https://swivellink.com/wp-content/uploads/2021/01/COBOT-Accessories.pdf) (高さの測り方、仕上げ、構造)。2026-10-06 取得。

| 項目 | 出典値 | 本モデル |
| --- | --- | --- |
| 高さ | 24 in、"height measurement = base to base" | 609.6 mm (床 → ロボット取付面) |
| 梱包寸法 | 11.875 × 11.875 × 24 in | 台板を 11.875 in 角 (301.6 mm) とした (**推定**: 梱包寸法 = 台板の外形とみなした) |
| 梱包質量 | 45 lb (20.4 kg) | specs に梱包質量として記載。製品の質量は公表されていない |
| 柱 | 寸法の公表なし | 外径 6 in (152.4 mm) の円管 (**推定**: 製品画像の比率を台板に当てた) |
| 天板 | 寸法の公表なし。UR3〜UR16e、TM5 / 12 / 14、CRX-3iA〜20iA/L 用に加工 | Φ8 in (203.2 mm) の円板 (**推定**: 同上)。ロボットの取付穴は描いていない |
| 板厚 | 寸法の公表なし | 3/8 in (9.5 mm) (**推定**: 柱の肉厚 3/16 in とあわせて鋼材が約 19 kg になり、梱包質量と合う) |
| 配線用の貫通穴 | "thru-hole for routing cables" (径の公表なし) | 天板の中央に Φ70 の穴 (**推定**) |
| アンカー穴 / レベリング | 1/2 in / 1/2-13 UNC | 描いていない (位置が公表されていない) |
| 仕上げ | RAL 7010 粉体塗装、溶接構造 | RAL 7010 相当の色 |

同シリーズは 12 / 18 / 24 / 30 / 36 / 42 / 48 in (RB-PED-xx-CB200) があり、このモデルは 24 in だけ。

## フレーム

- root の `base_link` = 台板の中心直下の床面、+Z 上。
- `mount` = `base_link` と同位置・同向き (床に置く契約)。
- `robot_mount` = 天板の上面の中心 `[0, 0, 0.6096]` (ロボットの基部が載る)。向きは `base_link` と同じ。

## 再生成・表示

```sh
npm --prefix authoring ci
node swivellink-rb-ped-24-cb200/authoring/export.mjs
node swivellink-rb-ped-24-cb200/authoring/export.mjs --check
node --test swivellink-rb-ped-24-cb200/authoring/model.test.mjs
python3 -m http.server 8765 --bind 127.0.0.1
```

`http://127.0.0.1:8765/swivellink-rb-ped-24-cb200/authoring/` で確認できる。
