
const notificationToggle = document.getElementById(
    "notificationToggle"
);

const notificationStatus = document.getElementById(
    "notificationStatus"
);

const STORAGE_KEY = "shinjukuNotificationEnabled";

// 保存された設定を読み込む。
// 初めて開いたときはオフにする。
function loadSettings() {
    const savedValue = localStorage.getItem(STORAGE_KEY);

    notificationToggle.checked = savedValue === "true";

    updateStatus();
}

// 画面の表示を更新する
function updateStatus() {
    if (notificationToggle.checked) {
        notificationStatus.textContent = "通知：オン";
    } else {
        notificationStatus.textContent = "通知：オフ";
    }
}

// スイッチを操作したときの処理
notificationToggle.addEventListener("change", () => {
    localStorage.setItem(
        STORAGE_KEY,
        notificationToggle.checked
    );

    updateStatus();
});

// 初期化
loadSettings();
