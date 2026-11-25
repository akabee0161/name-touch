# Session Handover

## 進捗
作業: 幼児向け知育ゲーム
工程:
1. 共通素材を作る（forge のコピー・21 種類の絵・声・鳴き声・copy-assets.sh）（完了）
2. なまえタッチを作って公開する ← 今ここ
3. ひな形を作り、残りの 8 本を作って公開する
段階: 実装（11 タスク中 10）
次にやること:
- Task 11: なまえタッチの PR（機能ブランチ → main）を依頼者がマージし、本番デプロイの成功を確かめる。そのあと main から develop を作り、プレビューが Access に転送されることを確かめる
- ankardo のカタログに登録する（ジャンル「知育」・name-touch.json・スクリーンショット・_redirects）

## 今の状態

- 遊び（`src/game/`: 種類ごとの 5 ページ・触って声とはねる・矢印・⏏ の長押しで戻る）まで動く。依頼者が横向きのスマホ・タブレット・PC の画面を承認済み（声の聞こえ方と実機の触り心地は、公開後のプレビューで確かめる）
- 計画は ankardo の `docs/superpowers/plans/2026-11-24-chiiku-games-step1-2.md`（ログ。現状と食い違うときは README と CLAUDE.md が正）。計画の「20 種類」は 21 種類（たべもの 5）、種類キー `fish` は `sea`（うみのいきもの）に読み替える
- 素材は ankardo の `shared-assets/chiiku/` のコピー（`chiiku-assets.md`）。名前の声は VOICEVOX:ずんだもん
