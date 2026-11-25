# なまえタッチ

2 歳向けの知育ゲーム。種類ごとのページに絵が並び、触ると絵がはねて、なまえを読み上げる。字が読めなくても遊べる。

公開先: https://ankardo.com/play/name-touch/ （カタログは https://ankardo.com/games/name-touch ）

## 作り方

- Vite + TypeScript + Vitest + Biome。`base` は `/play/name-touch/`、ビルドの出力は `out/play/name-touch/`
- `src/common/`: 知育ゲーム 9 本で共通の部分（素材の一覧・音・長押し・タイトル画面）。あとで ankardo のひな形に切り出す
- `src/game/`: なまえタッチの遊び
- `public/chiiku/`: 共通素材（絵・声・鳴き声・一覧・クレジット）。ankardo の `shared-assets/chiiku/` のコピーで、手で直さない。コピーし直すには ankardo のフォルダで `./scripts/copy-assets.sh chiiku <このリポジトリのパス>`。コピー元は `chiiku-assets.md`

```sh
npm install
npm run dev     # 開発サーバ
npm test        # Vitest
npm run lint    # Biome
npm run build   # tsc → vite build（out/ に出る）
```

## クレジット

- 声: VOICEVOX:ずんだもん（タイトル画面の下に出す）
- 絵: illust-asset-forge で生成
- 素材の出典と条件は `public/chiiku/CREDITS.md`

## デプロイ

- `develop` へのマージ: 確認用のプレビュー（`.github/workflows/preview.yml`）
- `main` へのマージ: 本番（`.github/workflows/deploy.yml`）。ankardo のカタログへの登録は ankardo 側で行う（`.claude/skills/new-game/SKILL.md`）
