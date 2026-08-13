# botrail-assets

[botrail](https://github.com/botrail/botrail) の公開カタログ
[`botrail/botrail-catalog`](https://huggingface.co/datasets/botrail/botrail-catalog)
に収録している**自作アセットのソース**。ベンダーがオープンな 3D モデルを配布して
いない機材 (スポット溶接ガン、ツールチェンジャ、真空グリッパ、ワークピース等) を、
実機の公表仕様に合わせて独自に著作している。

- **ライセンス: 全ファイル CC0-1.0** ([LICENSE](./LICENSE)) — 帰属表示なしで商用含め自由に利用可
- 各アセットは**参照実機を 1 つ定め、公表されている寸法・仕様に一致させた独自著作**
  (メーカー CAD の複製ではない)。どの値をどこから採ったか・意図的に変えた点は、
  各アセットの README に表で明記してある
- 形式: URDF + STL (visual / collision 分離済み)。Z-up、メートル単位

## 使い方

**このリポジトリのファイルを直接使う必要はない。** ビルド・検証済みのパッケージが
Hugging Face の公開カタログに載っているので、botrail からはそちらを使う:

```python
import botrail as bt

gun = bt.Robot.from_catalog("weld-gun-x1")  # 公開カタログから解決される
```

ここはそのカタログの**ソース側**で、
[botrail-catalog-builder](https://github.com/neka-nat/botrail-catalog-builder) が
取得してビルド・検証・公開する。手元でソースからビルドしたい場合はそちらを参照。

## アセット一覧

| アセット | 種別 | 参照実機 (寸法・仕様の出典) |
|---|---|---|
| [weld-gun-x16005](./weld-gun-x16005) | サーボスポットガン (X 型 / シザー式, 1 DOF) | HERON DB6-075-X16005-00 |
| [weld-gun-xr637](./weld-gun-xr637) | サーボスポットガン (C 型 / 直動, 1 DOF) | Milco XR 637-12402-15 |
| [tool-changer-sws011](./tool-changer-sws011) | ツールチェンジャ (マスタ + ツール側) | SCHUNK SWS-011 (SWK-011 / SWA-011) |
| [vacuum-gripper-ecbpi](./vacuum-gripper-ecbpi) | 電動真空グリッパ (4 カップ) | Schmalz CobotPump ECBPi |
| [flange-plate-sws011](./flange-plate-sws011) | アダプタ: ISO 9409-1-50-4-M6 ↔ SWS-011 | SCHUNK A-SWK-011-ISO-A50 |
| [flange-plate-ecbpi](./flange-plate-ecbpi) | アダプタ: ISO 9409-1-50-4-M6 ↔ ECBPi | Schmalz ROB-SET ECBPi 同梱プレート |
| [biw-sedan](./biw-sedan) | ワークピース: BIW (コンパクトセダン) | — (独自著作) |

ディレクトリ名は参照実機の型番を含む。カタログ上の製品 ID は互換維持のため
歴史的な名前のまま (`weld-gun-x1` / `weld-gun-c1` など) — `from_catalog()` で
使う ID は公開カタログの index を参照。

## 著作・貢献

参照実機の選び方、実機忠実の方針、rev 運用などの著作規約は
[CONTRIBUTING.md](./CONTRIBUTING.md) にまとめてある。
