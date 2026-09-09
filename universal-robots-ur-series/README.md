# Universal Robots UR Series — 独自形状の参照モデル

参照実機は **UR8 Long、UR15、UR18、UR20、UR30**。表示形状と衝突用の近似形状は
CC0-1.0の独自著作。メーカーのCAD、DAE、STL、画像、テクスチャは取り込んでいない。
カタログの `universal_robots/ur/{ur8-long,ur15,ur18,ur20,ur30}/r2` に使用する。

運動学、関節制限、慣性は、公式の
[Universal_Robots_ROS2_Description](https://github.com/UniversalRobots/Universal_Robots_ROS2_Description/tree/89bbe795f38a7ab00fb66fe8831dfff79dc99edf)
の **BSD-3-Clauseのコード・数値設定**をbuilderが別途取得する。
このディレクトリはそれらを再ライセンスしない。上流 `meshes/` は取得・配布しない。
`urdf/reference.urdf.xacro` は公式マクロに独自のvisual設定を渡す。

| 参照実機 | 公式default_kinematics: d1 / a2 / a3 / d4 / d5 / d6 (mm) | 本モデル |
| --- | --- | --- |
| [UR8 Long](https://www.universal-robots.com/products/ur8-long/) | 218.6 / 898.9 / 714.9 / 182.4 / 136.1 / 143.4 | 同じ関節原点 |
| [UR15](https://www.universal-robots.com/products/ur15/) | 218.6 / 647.5 / 516.4 / 182.4 / 136.1 / 143.4 | 同じ関節原点 |
| [UR18](https://www.universal-robots.com/products/ur18/) | 218.6 / 475 / 338.9 / 182.4 / 136.1 / 143.4 | 同じ関節原点 |
| [UR20](https://www.universal-robots.com/products/ur20/) | 236.3 / 862 / 728.7 / 201 / 159.3 / 154.3 | 同じ関節原点 |
| [UR30](https://www.universal-robots.com/products/ur30/) | 236.3 / 637 / 503.7 / 201 / 159.3 / 154.3 | 同じ関節原点 |
| UR8 Long / UR15 / UR18 工具側 | ISO 9409-1-50-4-M6 | 50 mm PCD、4穴。ねじ山・位置決め穴・公差は省略 |
| UR20 / UR30 工具側 | ISO 9409-1-80-6-M8 | 80 mm PCD、6穴。同上 |

数値の出典は上記固定コミットの各 `config/<type>/default_kinematics.yaml`、フランジは
製品データシート。a2/a3は表では長さの絶対値、実際の関節並進は負のX。
ブラウザ用の関節ツリーは読みやすい理想角度で記述するが、カタログは上流の微小な
並進・回転を含む完全なマクロ出力を使用する。`tool0`と6駆動関節名を維持する。

## 表現範囲

筐体の半径、テーパの代わりの直管、軸受カバー、面取り、仕上げは近似。
各関節に独立した形状を持ち、工具接触面はwrist_3原点に置く。
中空フランジ穴はvisualのみ。collisionは円筒の組み合わせで、詳細形状を包絡する保証はない。
実機の狭い隙間や自己干渉の可否を確定するモデルではない。
ケーブル、シリアル固有の校正、取付ボルト、ベース穴、公差は含まない。
公式の慣性は維持し、近似筐体から質量を再推定しない。公称製品質量とURDFリンク質量和は
一致するとは限らない。条件付き最大可搬質量を無条件の公称可搬質量へ置き換えない。

## 再生成・表示

リポジトリのルートで:

```sh
npm --prefix universal-robots-ur-series/authoring ci
npm --prefix universal-robots-ur-series/authoring run export
npm --prefix universal-robots-ur-series/authoring test
npm --prefix universal-robots-ur-series/authoring run check
python3 -m http.server 8737 --bind 127.0.0.1
```

`http://127.0.0.1:8737/universal-robots-ur-series/authoring/` で5機種を切り替えられる。
Three.jsで手続き的にOBJ/MTLを生成し、builderがURDF/USDとプレビューを作る。
`config/*-collisions.json` は同じソースから生成したレシピ用collision値。
