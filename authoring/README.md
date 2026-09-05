# 共通著作ライブラリ

Node.js 22 + Three.js + three-usd-robot を用いる、自作モデル用の非公開npmパッケージ
`@botrail/authoring`。npmレジストリへの公開は不要。CC0-1.0。

**製品を生成するテンプレートではなく、製品固有の著作を支える小さな部品集**。
型番、公表寸法、取付インターフェース、材質の値、推定の根拠は各モデルの
`model.mjs` / `provenance.json` に残す。未確認の取付穴・アダプタを自動生成しない。

## 使用範囲

| モジュール | 役割 | 利用モデル |
|---|---|---|
| `geometry.mjs` | 名前付きPBR材質、面取り箱、円筒、実形状の穴・リング、配管、mm→m変換 | X16005、Mid-360、ECBPi |
| `fixed-usd.mjs` | `mount` / `body` / 固定フレーム、質量特性、独立した解析的collisionをUSD出力 | Mid-360、ECBPi |
| `cli.mjs` | Node専用のUSDファイル出力。import時には書き込まない | Mid-360、ECBPi |

X16005の関節・リンク原点・速度・慣性配分・collision配置は製品固有のまま。
ECBPiの三角筐体とカップ断面、Mid-360のドームも製品側に置く。
共通材質プリセットで全製品を同じ色・粗さに置き換えない。
既存のPython/xacro著作系やBIWの著作系は今回の移行対象ではない。

## インストールと回帰確認

リポジトリのルートから:

```sh
npm --prefix authoring ci
for asset in mid-360 vacuum-gripper-ecbpi weld-gun-x16005; do
  (cd "$asset/authoring" && npm ci) || exit
done
npm --prefix authoring test
npm --prefix authoring run test:models
```

各モデルは`file:../../authoring`で依存するため、共通`authoring/`も同じチェックアウトに必要。
モデル側の`.npmrc`の`install-links=true`により、ローカル依存はsymlinkではなく
`node_modules/@botrail/authoring/`にコピーされる。これによりNodeのpeer依存解決と、
既存の`npm run view`によるモデル単位のHTTP配信が成立する。
ブラウザのimport mapはそのコピーを参照し、Three.jsはモデル側と同じインスタンスを使う。

**共通モジュールを編集したら、利用する各モデルで`npm ci`を再実行すること。**
古いコピーで検証しないよう`test:models`は共通ソースとの一致も確認する。
このコマンドはモデルのテストを実行し、メモリ上で再生成したUSDをチェックイン済みUSDと
SHA-256比較する。生成物を上書きしてから比較するテストではない。

`.github/workflows/authoring.yaml`は共通部と3モデルの回帰確認を実行する。
Hugging FaceへのアップロードやUSDの自動更新は行わない。

## APIと単位

`geometry.mjs`の長さは**呼び出し側が明示する同一単位**。mmで作るMid-360/ECBPiは
最後に`fromMillimeters(body)`を一度だけ適用する。mで作るX16005は適用しない。
`fixed-usd.mjs`に渡すframe/collision/centerOfMassはm、massはkg、inertiaはkg·m²。

```js
import { namedMaterial, addMesh, roundedBox, fromMillimeters }
  from "@botrail/authoring/geometry.mjs";

// Mid-360の既存定義から抜粋。寸法・仕上げの根拠は製品側に記録する。
const shell = namedMaterial("anodized_graphite", 0x42484b, 0.65, 0.35);
addMesh(body, "base_upper", roundedBox([65, 65, 2], 0.6, 3), shell, [0, 0, 6]);
fromMillimeters(body);
```

- `cylinderZ(radius, height, {radial, open})`: +Z軸。`cylinderBetween`は2端点間。
- `roundedRectangle` + `ellipseHole`: ExtrudeGeometryに渡す実際の穴。
  ねじ山・公差・穴どうしの干渉や外周からのはみ出しを自動検証するものではない。
- `ringGeometry(outer, inner, depth, holes)`: Z=0から押し出す。各追加穴は`[x,y,r]`。
- `tubeGeometry(points, radius, {tubular, radial})`: visualのみ。ホースcollisionは作らない。
- `exportFixedModel(definition)`:既存Mid-360/ECBPiの`definition()`が使用例。
  collisionはbox/cylinder限定、Z軸の解析形状を維持し、X/Y向きは姿勢で表す。
  不正な名前・寸法・重複・未対応形状はエラーにする。

## 出力互換とrev

共通化時に3モデルすべての再生成USDが既存ソースとバイト一致することを確認した。
USD/URDF/STL、製品寸法、材質パラメータ、関節、公開レシピの取得SHAは変更しない。
したがって、この著作コードの整理だけでは新しい製品revを切らない。

今後、形状や出力が意図的に変わる場合は、差分・出典・検証結果を確認して新revとして
生成物を更新する。同じrevを公開したSHAへ後付けで差し替えない。
共通化のテストは実機適合、ねじはめあい、吸着・光学・接触性能の検証ではない。
