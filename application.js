// application.js
/* - HTMLのdata属性とDATAオブジェクトを使って
     サイドバーとコンテンツを動的に切り替える */

const sidebar     = document.getElementById("sidebar");
const sidebarMenu = document.getElementById("sidebarMenu");
const mainContent = document.getElementById("mainContent");
const contentText = document.getElementById("contentText");
const nav         = document.querySelector(".nav");

// アプリの状態管理 - 現在開いているメニューとコンテンツキーを保持する
const state = {
  menu:    null, // 例: "about" | "portfolio" | "contact" | null
  content: null, // 例: "site" | "author" | null
};

// データ定義
let DATA = {}; // 空の状態で宣言しておく
fetch("data.json")
  .then((response) => response.json()) // jsonをオブジェクトに変換
  .then((json) => {
    DATA = json; // 読み込んだデータをDATAに代入
  });

/* UI制御
 - ヘッダーメニューをクリックしたときの処理
 - 同じメニューを再クリックしたら閉じる（トグル）
 - 別のメニューならサイドバーを更新して開く
 - @param {string} menuKey - DATA のキー名（例: "about"） */
function openMenu(menuKey) {
  if (menuKey === "top") {
    closeAll();
    return;
  }

  // DATAに存在しないキーは何もしない
  if (!DATA[menuKey]) return;

  // 同じメニューをもう一度クリックしたら閉じる
  if (state.menu === menuKey) {
    closeAll();
    return;
  }

  // 状態を更新
  state.menu    = menuKey;
  state.content = null;

  // サイドバーを描画して表示。コンテンツボックスは一旦隠す
  renderSidebar(DATA[menuKey].menu);
  sidebar.classList.add("active");
  mainContent.classList.remove("active");
  contentText.textContent = "";
}

/* サイドバーのメニュー項目を描画する
 - @param {{ key: string, label: string }[]} items */
function renderSidebar(items) {
  // テンプレートリテラルでHTMLを組み立てて一括挿入
  sidebarMenu.innerHTML = items
    .map(
      (item) => `
      <li>
        <a href="#" data-content="${item.key}">${item.label}</a>
      </li>
    `
    )
    .join("");
}

/* サイドバー項目をクリックしたときの処理
 - 同じ項目を再クリックしたらコンテンツを閉じる（トグル）
 - @param {string} contentKey - DATA[menuKey].content のキー名 */
function showContent(contentKey) {
  // 現在のメニューのデータが存在しない場合は何もしない
  if (!DATA[state.menu]) return;

  // 同じ項目をもう一度クリックしたらコンテンツを閉じる
  if (state.content === contentKey) {
    contentText.innerHTML = "";
    mainContent.classList.remove("active");
    state.content = null;
    return;
  }

  const raw = DATA[state.menu].content[contentKey];
  contentText.innerHTML = Array.isArray(raw) ? raw.join("") : raw;

  // コンテンツを表示して状態を更新
  // contentText.innerHTML = DATA[state.menu].content[contentKey];
  mainContent.classList.add("active");
  state.content = contentKey;
}

// サイドバーとコンテンツをすべて閉じる
function closeAll() {
  sidebar.classList.remove("active");
  mainContent.classList.remove("active");
  contentText.textContent = "";
  state.menu    = null;
  state.content = null;
}

// イベントリスナー
// ヘッダー内のリンククリック
nav.addEventListener("click", (event) => {
  // クリックされた要素から最も近い <a> を取得する
  const link = event.target.closest("a");
  if (!link) return;

  // data-menu 属性がないリンク（外部リンクなど）はスルー
  const menuKey = link.dataset.menu;
  if (!menuKey) return;

  event.preventDefault();
  openMenu(menuKey);
});

// サイドバー内のリンククリック
sidebar.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (!link) return;

  event.preventDefault();
  showContent(link.dataset.content);
});

// サイドバー・ナビ・コンテンツボックス以外をクリックしたら閉じる
document.addEventListener("click", (event) => {
  const isInsideSidebar = sidebar.contains(event.target);
  const isInsideNav     = nav.contains(event.target);
  const isInsideMain    = mainContent.contains(event.target);

  if (!isInsideSidebar && !isInsideNav && !isInsideMain) {
    closeAll();
  }
});
