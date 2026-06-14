# 問診トレーニング（視能訓練士向け・無料版 / 音声つき）

患者と会話しながら、問診（病歴聴取）→検査→疾患予測→追加検査→鑑別→フィードバックまでを
体験できる、視能訓練士（CO）向けの教育アプリです。

## 特長（ここがポイント）
- **追加料金ゼロ**：AI（外部API）を使いません。すべてブラウザ内で完結し、Vercel無料枠で動きます。
- **音声つき（無料）**：患者の返事はブラウザ標準の音声で自動読み上げ。質問はマイクで話しかけてもOK。
  - 音声入力・読み上げともブラウザ標準機能で、料金は一切かかりません（Chrome推奨）。
- **問診のやり方は2通り**：質問ボタンを押す／マイクで自由に話す（話した言葉を近い質問へ自動マッチ）。
- **表情の変化**：要点を聞き出すほど患者アバターが明るくなります（ロジックのみ）。
- **フィードバック**：聞けた項目／聞けなかった項目／次回アドバイスを自動表示（ルールベース・無料）。

> ⚠️ 収録症例（`lib/case.js`）は叩き台です。教育に使う前に指導役の視能訓練士・眼科医のレビューを。
> 視能訓練士は診断職ではないため、「疾患を選ぶ」工程は *鑑別を考える臨床推論トレーニング* として設計しています。

---

## Vercelで公開する（GitHub経由）
1. このフォルダを GitHub のリポジトリに push（または Web からアップロード）。
2. Vercel で「Add New → Project」→ そのリポジトリを Import。
3. **環境変数（ANTHROPIC_API_KEY）は不要**です。そのまま「Deploy」。
4. 以降は GitHub に変更を push するたびに自動で再公開されます。

## ローカルで動かす
```bash
npm install
npm run dev
# http://localhost:3000 を Chrome で開く（音声はChrome推奨）
```

---

## 画像をあとから入れる方法（重くならない正しいやり方）
チャットやコードに画像を埋め込むと重くなります。代わりに **public/images フォルダに画像ファイルを置き、パスで指定**します。

1. 画像ファイル（例 `patient.png`, `fundus.png`, `diagram.png`）を `public/images/` に入れる
   （GitHubのWeb画面なら、`public/images` を開いて「Add file → Upload files」でアップロード）
2. `lib/case.js` の該当箇所に、先頭を `/images/` にしたパスを書く：
   - 患者の写真　→ `patient.image: "/images/patient.png"`
   - 検査画像　　→ `examImage: "/images/fundus.png"`
   - 解説図　　　→ `explanation.image: "/images/diagram.png"`
3. 値が空 `""` の間は「ここに画像を入れられます」という差し込み口が表示されます。

※ ネット上の他人の画像は著作権があります。ご自身の画像か、利用許可のあるものを使ってください。

## 症例を追加・差し替えるには
`lib/case.js` を編集するだけです。特に重要なのは：
- `questionBank`：質問・患者のセリフ・マイク認識用キーワード・聞き出せる項目（satisfies）
- `requiredItems`：採点ルーブリック（label と why）
- `examResults` / `additionalTests` / `diagnoses` / `explanation`

## 構成
```
app/
  layout.js, page.js, globals.css   画面とデザイン
components/
  PatientAvatar.js   表情が変わるSVGアバター
  ImageSlot.js       画像の差し込み口（未設定ならプレースホルダー）
lib/
  case.js            症例データ（ここを編集）
public/
  images/            画像はここに置く
```
