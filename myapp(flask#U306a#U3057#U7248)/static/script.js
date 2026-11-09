const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

const startButton = document.getElementById("startButton");
const status = document.getElementById("status");
const result = document.getElementById("result");

const STORAGE_KEY = "shinjukuNotificationEnabled";

// 通知済みかどうかを管理する変数
let notifiedShinjukuSanchome = false;
let notifiedShinjuku = false;

// 音声認識を継続するかどうか
let isRecognizingContinuously = false;

// 自動再開のタイマー
let restartTimer = null;

function isNotificationEnabled() {
    return localStorage.getItem(STORAGE_KEY) === "true";
}

// ブラウザが音声認識に対応しているか確認
if (!SpeechRecognition) {
    status.textContent = "このブラウザは音声認識に対応していません";
} else {
    const recognition = new SpeechRecognition();

    recognition.lang = "ja-JP";
    recognition.interimResults = true;
    recognition.continuous = true;

    // 「はじめる」で開始し、認識中に押すと終了する
    startButton.addEventListener("click", () => {
        if (isRecognizingContinuously) {
            // 継続・自動再開を停止
            isRecognizingContinuously = false;

            if (restartTimer !== null) {
                clearTimeout(restartTimer);
                restartTimer = null;
            }

            startButton.textContent = "はじめる";
            status.textContent = "音声認識を終了しています...";

            try {
                recognition.stop();
            } catch (error) {
                // すでに終了している場合も、停止状態を維持する
                status.textContent = "音声認識終了";
            }
            return;
        }

        if (notifiedShinjuku) {
            status.textContent = "新宿駅を検出済みです";
            return;
        }

        isRecognizingContinuously = true;
        startButton.textContent = "終了する";
        status.textContent = "音声認識を開始しています...";

        try {
            recognition.start();
        } catch (error) {
            isRecognizingContinuously = false;
            startButton.textContent = "はじめる";
            status.textContent = "音声認識を開始できませんでした";
        }
    });

    // 音声認識が開始されたとき
    recognition.onstart = () => {
        status.textContent = "音声認識中...";
    };

    // 音声認識の結果を受け取ったとき
    recognition.onresult = (event) => {
        // 今回の認識結果を表示
        let text = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
            text += event.results[i][0].transcript;
        }

        result.textContent = text;

        // 新しく確定した文章だけを取得
        const finalText = Array.from(event.results)
            .slice(event.resultIndex)
            .filter(item => item.isFinal)
            .map(item => item[0].transcript)
            .join("");

        if (!finalText) return;

        // 1回目：新宿三丁目駅
        if (
            !notifiedShinjukuSanchome &&
            (finalText.includes("新宿三丁目") || finalText.includes("新宿3丁目")) &&
            (
                finalText.includes("次は") ||
                finalText.includes("まもなく") ||
                finalText.includes("到着")
            )
        ) {
            notifiedShinjukuSanchome = true;
            status.textContent = "新宿三丁目駅！起きる時間です！";

            if (isNotificationEnabled()) {
                if ("vibrate" in navigator) {
                    navigator.vibrate([300, 100, 300]);
                }
                alert("新宿三丁目駅です！起きてください！");
            }
        }

        // 2回目：新宿駅
        if (
            notifiedShinjukuSanchome &&
            !notifiedShinjuku &&
            (
                finalText.includes("まもなく新宿") ||
                finalText.includes("新宿駅に到着") ||
                finalText.includes("新宿に到着")
            ) &&
            !finalText.includes("新宿三丁目")
        ) {
            notifiedShinjuku = true;

            // 新宿駅を検出したので自動再開を終了
            isRecognizingContinuously = false;
            startButton.textContent = "はじめる";

            // 予約済みの再開処理があれば解除
            if (restartTimer !== null) {
                clearTimeout(restartTimer);
                restartTimer = null;
            }

            status.textContent = "新宿駅に到着します！";

            if (isNotificationEnabled()) {
                if ("vibrate" in navigator) {
                    navigator.vibrate([300, 100, 300]);
                }
                alert("まもなく新宿です！降りる準備をしてください！");
            }
        }
    };

    // 音声認識が終了したとき
    recognition.onend = () => {
        if (isRecognizingContinuously && !notifiedShinjuku) {
            status.textContent = "音声認識を再開します...";

            restartTimer = setTimeout(() => {
                restartTimer = null;

                if (isRecognizingContinuously && !notifiedShinjuku) {
                    try {
                        recognition.start();
                    } catch (error) {
                        status.textContent =
                            "音声認識を再開できませんでした";
                    }
                }
            }, 1000);
        } else {
            startButton.textContent = "はじめる";
            status.textContent = notifiedShinjuku
                ? "新宿駅を検出済みです"
                : "音声認識終了";
        }
    };

    // 音声認識でエラーが発生したとき
    recognition.onerror = (event) => {
        status.textContent = "エラー：" + event.error;
    };
}