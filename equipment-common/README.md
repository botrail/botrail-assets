# 設備用 visual primitives

X-Guard Classic、Type34-S1、FZのxacroで共有する描画用マクロ。
`box`, `cylinder`, `mesh` はルートリンク `root` に固定リンクを追加する。
寸法はm、姿勢はrad、色は呼出し側で定義するURDF material名。
製品固有の寸法・型番・仕上げはこの共通部には置かない。

生成されるURDFはvisualのみ。botrailの`components[].trim`として読み込むと、
各描画要素は衝突無効となり、別途置かれた簡略ボックスが衝突判定を担う。
