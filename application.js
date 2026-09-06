// application.js
/* - HTMLのdata属性とDATAオブジェクトを使って
     サイドバーとコンテンツを動的に切り替える
   - アプリ一覧は畝マップから各作品を開く */

const sidebar     = document.getElementById("sidebar");
const sidebarMenu = document.getElementById("sidebarMenu");
const mainContent = document.getElementById("mainContent");
const contentText = document.getElementById("contentText");
const nav         = document.querySelector(".nav");
const fieldMap    = document.getElementById("fieldMap");
const farmView    = document.getElementById("farmView");
const header      = document.querySelector(".header");

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
    renderFields(DATA.fields || []);
  })
  .catch(() => {
    fieldMap.innerHTML = "<p class='farm__lead'>アプリ一覧を読み込めませんでした。</p>";
  });

// ヘッダーの実高さをCSS変数へ反映する（折り返し対策）
function syncHeaderHeight() {
  if (!header) return;
  document.documentElement.style.setProperty(
    "--header-height",
    `${header.offsetHeight}px`
  );
}

window.addEventListener("resize", syncHeaderHeight);
window.addEventListener("load", syncHeaderHeight);
syncHeaderHeight();

/* 畝マップを描画する
 - @param {{ key: string, label: string, mark: string, stage: string }[]} fields */
function renderFields(fields) {
  fieldMap.innerHTML = fields
    .map((field) => {
      return `
        <button
          type="button"
          class="plot plot--${field.stage}"
          role="listitem"
          data-field="${field.key}"
          aria-pressed="false"
        >
          <span class="plot__mark" aria-hidden="true">${field.mark}</span>
          <span class="plot__name">${field.label}</span>
        </button>
      `;
    })
    .join("");
}

function setFieldsVisible(visible) {
  fieldMap.classList.toggle("is-visible", visible);
  fieldMap.hidden = !visible;
  farmView.classList.toggle("is-listing", visible);
}

function highlightPlot(contentKey) {
  fieldMap.querySelectorAll(".plot").forEach((plot) => {
    const selected = plot.dataset.field === contentKey;
    plot.classList.toggle("is-selected", selected);
    plot.setAttribute("aria-pressed", selected ? "true" : "false");
  });
}

/* UI制御
 - ヘッダーメニューをクリックしたときの処理
 - 同じメニューを再クリックしたら閉じる（トグル）
 - 別のメニューならサイドバーを更新して開く
 - @param {string} menuKey - DATA のキー名（例: "about"） */
function openMenu(menuKey, contentKey = null) {
  if (menuKey === "top") {
    closeAll();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  // アプリ一覧はサイドバーではなく畝マップを開く
  if (menuKey === "portfolio" && !contentKey) {
    if (state.menu === "portfolio" && !state.content && fieldMap.classList.contains("is-visible")) {
      closeAll();
      return;
    }
    showFieldMap();
    return;
  }

  // 畝から作品詳細を開く
  if (menuKey === "portfolio" && contentKey) {
    openField(contentKey);
    return;
  }

  // DATAに存在しないキーは何もしない
  if (!DATA[menuKey]) return;

  // 同じメニューをもう一度クリックしたら閉じる（コンテンツ指定がある場合は遷移を優先）
  if (state.menu === menuKey && !contentKey) {
    closeAll();
    return;
  }

  // 状態を更新
  state.menu    = menuKey;
  state.content = null;

  // サイドバーを描画して表示。コンテンツボックスは一旦隠す
  renderSidebar(DATA[menuKey].menu);
  sidebar.classList.add("active");
  document.body.classList.add("has-sidebar");
  document.body.classList.remove("has-panel");
  mainContent.classList.remove("active");
  contentText.textContent = "";
  setFieldsVisible(false);
  highlightPlot(null);

  // コンテンツキーが指定されていれば、その項目を開く
  if (contentKey) {
    showContent(contentKey);
  } else if (menuKey === "contact" && DATA.contact.menu[0]) {
    // お問い合わせは項目が1つなので直接開く
    showContent(DATA.contact.menu[0].key);
  }
}

/* 畝マップを表示する */
function showFieldMap() {
  sidebar.classList.remove("active");
  mainContent.classList.remove("active");
  document.body.classList.remove("has-sidebar", "has-panel");
  contentText.textContent = "";
  state.menu    = "portfolio";
  state.content = null;
  highlightPlot(null);
  setFieldsVisible(true);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* 畝をクリックして作品詳細を開く */
function openField(contentKey) {
  if (!DATA.portfolio) return;

  state.menu = "portfolio";
  sidebar.classList.remove("active");
  document.body.classList.remove("has-sidebar");
  document.body.classList.add("has-panel");
  setFieldsVisible(true);
  showContent(contentKey);
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
    document.body.classList.remove("has-panel");
    state.content = null;
    highlightPlot(null);
    return;
  }

  const raw = DATA[state.menu].content[contentKey];
  contentText.innerHTML = Array.isArray(raw) ? raw.join("") : raw;

  // コンテンツを表示して状態を更新
  mainContent.classList.add("active");
  state.content = contentKey;

  if (state.menu === "portfolio") {
    highlightPlot(contentKey);
  } else {
    highlightPlot(null);
  }
}

// サイドバーとコンテンツをすべて閉じる
function closeAll() {
  sidebar.classList.remove("active");
  mainContent.classList.remove("active");
  document.body.classList.remove("has-sidebar", "has-panel");
  contentText.textContent = "";
  state.menu    = null;
  state.content = null;
  setFieldsVisible(false);
  highlightPlot(null);
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

// 畝マップのクリック
fieldMap.addEventListener("click", (event) => {
  const plot = event.target.closest("[data-field]");
  if (!plot) return;

  event.preventDefault();
  event.stopPropagation();
  openField(plot.dataset.field);
});

// メインコンテンツ内のメニュー遷移リンク（例: 連絡先への導線）
mainContent.addEventListener("click", (event) => {
  const link = event.target.closest("a[data-menu]");
  if (!link) return;

  // openMenu 内でコンテンツが差し替わるとクリック元要素がDOMから消える。
  // その後 document の外側クリック判定が誤作動しないよう伝播を止める。
  event.preventDefault();
  event.stopPropagation();
  openMenu(link.dataset.menu, link.dataset.content || null);
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
  // クリック中にDOMから外れた要素（コンテンツ差し替え時など）は無視する
  if (!(event.target instanceof Node) || !event.target.isConnected) return;

  const isInsideSidebar = sidebar.contains(event.target);
  const isInsideNav     = nav.contains(event.target);
  const isInsideMain    = mainContent.contains(event.target);
  const isInsideFields  = fieldMap.contains(event.target);

  if (!isInsideSidebar && !isInsideNav && !isInsideMain && !isInsideFields) {
    closeAll();
  }
});
