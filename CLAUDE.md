# CLAUDE.md

name-touch で作業する際の指針。

## ブランチとプレビュー

- 機能ブランチから `develop` への PR を最初に作る。`develop` にマージすると、Cloudflare Access の受付の後ろに確認用のプレビューが固定の URL に自動で上がる（`.github/workflows/preview.yml`）
- 本番に出すときは、`develop` から `main` への PR をマージする（`deploy.yml` が本番に出す）
- `preview.yml` は `develop` への push と、`develop` を選んだ手動実行（`workflow_dispatch`。ankardo のひな形どおりで、`site/lib/preview-template.test.ts` が固定している）だけで動き、`wrangler deploy` は書かない。`wrangler.toml` の `preview_urls = true` は確認用プレビューのためで、本番の `workers.dev` は開かない
- `develop` ができるまでの最初の PR（なまえタッチの公開そのもの）だけは `main` に向ける

## 共通部分（src/common/）とゲームの部分

- `src/common/`（素材の一覧の読み込み・音・長押し・タイトル画面・共通の見た目）は、知育ゲーム 9 本で共通の部分。あとで ankardo のひな形に切り出すので、**なまえタッチだけの決まりを入れない**。なまえタッチの遊びは `src/game/` に書く
- 共通部分の変更は、他のゲームにも要るかを考えてから行う。要らないなら `src/game/` に置く

## 守ること（知育ゲームの決まり）

- 字が読めない子どもが遊ぶ。指示は声、ボタンは絵だけ。字を出すのは、親のための題とクレジットだけ
- 時間制限・ゲームオーバー・点数を付けない。記録はサーバーにも端末にも残さない（`localStorage` も使わない）
- 最初に大きな「はじめる」ボタンを押してもらう。その**タッチの中で**（`await` の前に）`audio.unlock()` を呼ぶ。そうしないと iOS Safari は音を出さない（`showTitle` の `unlock` がそれを行う）
- ゲームを終えるボタンは長押し 1.5 秒で、タイトル画面に戻る（子どもが間違えて出ないように）
- 同じ絵を続けて叩いたら前の声を止めて最初から鳴らし、別の絵を叩いたら前の声を止める
- 素材は ankardo の `shared-assets/chiiku/` が正で、`public/chiiku/` はそのコピー。**手で直さない**。直すときは ankardo の素材を直し、`ankardo/scripts/copy-assets.sh chiiku . --no-cry` でコピーし直す（`--no-cry` を付ける。なまえタッチは鳴き声を鳴らさないので、CC BY-SA の録音を配らず、画面のクレジットも VOICEVOX の 1 行だけで済む）（コピー元の commit は `chiiku-assets.md`）。クレジットは `public/chiiku/CREDITS.md`
- 計画の種類キー `fish` は `sea`（みずのいきもの。金魚を含むため）、種類は 21（たべもの 5）。素材の一覧（`items.json`）を正とし、ゲーム側に一覧を書き写さない

## 確認

```sh
npx vitest run && npx biome check . && npm run build
```
