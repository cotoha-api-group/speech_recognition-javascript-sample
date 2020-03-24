COTOHA 音声認識API サンプルコード(JavaScript)
====
音声認識関連APIを利用して、GUIで音声認識を利用できるデモサイトを実装した場合の例となる素材群です。

# Usage
1. 全てのファイルを同一ディレクトリに配置してください。
1. ブラウザ(google chrome)で`sample_js.html`を開いてください。
1. JavaScriptが正常に動作している場合、認証設定ページへ遷移するのでCOTOHA API Portalアカウントページで表示される`client id`、`client secret`及び`domain id`をそれぞれ入力し、認証ボタンを押下してください。
    - 本手順での`client id`、`client secret`及び`domain id`の入力を省略したい場合は、`sample_js.html`の176,178,180行目のinputタグ内のvalue属性の値として、それぞれ入力してください。
1. 認証が正しく完了した場合、音声認識ページへ遷移します。これ以降の操作はデモサイト内の操作マニュアルページをご参照ください。

# 各ファイルの説明
- sample_js.html：デモサイトのGUI部分を実装したhtml
- sample_js.css：GUI部分の一部styleを調整しているcss
- html_ctrl.js：htmlの動作を実装しているJavaScript
- auth_and_http.js：アクセストークン取得とhttp通信を実装しているJavaScript
- streaming_stt.js：ストリーミング音声認識APIのコール及び後処理を実装しているJavaScript
- file_stt.js：ファイル音声認識APIのコール及び後処理を実装しているJavaScript
- dict_manage.js：音声認識ユーザ辞書の操作を行うAPIのコール及び後処理を実装しているJavaScript

# Requirements
動作確認を行ったバージョンとなります。
- Google Chrome 79.X.X.X