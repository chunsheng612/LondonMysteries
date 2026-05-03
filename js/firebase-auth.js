import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAnalytics, isSupported as analyticsSupported } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-analytics.js";
import {
    browserLocalPersistence,
    getAuth,
    GoogleAuthProvider,
    getRedirectResult,
    onAuthStateChanged,
    setPersistence,
    signInWithPopup,
    signInWithRedirect,
    signOut
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";

const firebaseConfig = window.__FIREBASE_CONFIG__;

if (!firebaseConfig) {
    throw new Error("Missing window.__FIREBASE_CONFIG__");
}

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
auth.languageCode = "zh-TW";
const authReady = setPersistence(auth, browserLocalPersistence).catch(() => {
    // Keep default persistence if the environment refuses explicit local persistence.
});

analyticsSupported().then((supported) => {
    if (supported) {
        getAnalytics(firebaseApp);
    }
}).catch(() => {
    // Ignore analytics initialization issues on unsupported environments.
});

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

let loginInProgress = false;

window.firebaseAuth = { firebaseApp, auth, authReady, loginWithGoogle, logoutUser };

const els = {
    guest: document.getElementById("auth-guest"),
    user: document.getElementById("auth-user"),
    loginGoogle: document.getElementById("btn-login-google"),
    loginGoogleSettings: document.getElementById("btn-settings-login-google"),
    logout: document.getElementById("btn-logout"),
    avatar: document.getElementById("auth-avatar"),
    name: document.getElementById("auth-name"),
    email: document.getElementById("auth-email")
};

function showMessage(text, type = "info") {
    if (window.app && typeof window.app.showMessage === "function") {
        window.app.showMessage(text, type);
        return;
    }
    console.log(text);
}

function isMobileDevice() {
    return window.matchMedia("(pointer: coarse)").matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isStandaloneApp() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function getAuthErrorMessage(error) {
    switch (error?.code) {
        case "auth/popup-closed-by-user":
            return "登入視窗已關閉，尚未完成 Google 驗證。";
        case "auth/popup-blocked":
            return "瀏覽器擋下了登入視窗，請允許彈出視窗後再試一次。";
        case "auth/cancelled-popup-request":
            return "登入程序已被新的請求取代，請再點一次 Google 登入。";
        case "auth/unauthorized-domain":
            return `目前網域 ${window.location.hostname} 尚未加入 Firebase Authorized domains。`;
        case "auth/network-request-failed":
            return "網路請求失敗，請確認目前頁面可正常連線到 Firebase。";
        default:
            return `登入失敗：${error?.code || error?.message || "未知錯誤"}`;
    }
}

function shouldFallbackToRedirect(error) {
    const redirectReadyCodes = new Set([
        "auth/popup-blocked",
        "auth/cancelled-popup-request",
        "auth/operation-not-supported-in-this-environment"
    ]);
    return isMobileDevice() && redirectReadyCodes.has(error?.code);
}

function setLoginButtonsBusy(isBusy) {
    document.querySelectorAll("#btn-login-google, #btn-settings-login-google").forEach((button) => {
        button.disabled = isBusy;
        button.setAttribute("aria-busy", isBusy ? "true" : "false");
    });
}

async function loginWithGoogle() {
    if (loginInProgress) return;

    loginInProgress = true;
    setLoginButtonsBusy(true);

    try {
        await authReady;
        
        // 在行動裝置或 PWA 環境下，優先使用 signInWithRedirect，因為彈窗在行動瀏覽器中非常容易被阻擋或出錯
        if (isMobileDevice() || isStandaloneApp()) {
            console.log("[Auth] Mobile/Standalone detected, using Redirect flow.");
            await signInWithRedirect(auth, provider);
            return; // 重新導向後頁面會刷掉，後續代碼不會執行
        }

        // 桌面端則優先嘗試彈窗，體驗較好
        console.log("[Auth] Desktop detected, using Popup flow.");
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Auth Error:", error);
        
        // 如果彈窗失敗（例如被阻擋），降級到重新導向
        if (error.code === "auth/popup-blocked" || error.code === "auth/operation-not-supported-in-this-environment") {
            try {
                showMessage("目前的環境需要跳轉頁面進行驗證，請在完成後返回遊戲。");
                await signInWithRedirect(auth, provider);
            } catch (redirectError) {
                console.error("Redirect Error:", redirectError);
                showMessage(getAuthErrorMessage(redirectError), "error");
            }
            return;
        }
        
        // 專門處理授權網域錯誤
        if (error.code === "auth/unauthorized-domain") {
            showMessage(`登入失敗：當前網域尚未加入 Firebase 授權清單。請在 Firebase 控制台添加 ${window.location.hostname}`, "error");
        } else {
            showMessage(getAuthErrorMessage(error), "error");
        }
    } finally {
        loginInProgress = false;
        setLoginButtonsBusy(false);
    }
}


async function logoutUser() {
    try {
        await signOut(auth);
        showMessage("已登出");
    } catch (error) {
        console.error(error);
        showMessage(`登出失敗：${error.code || error.message}`, "error");
    }
}

function updateAuthUI(user) {
    if (!els.guest || !els.user) return;

    if (user) {
        els.guest.classList.add("hidden");
        els.user.classList.remove("hidden");

        if (els.avatar) {
            els.avatar.src = user.photoURL || "assets/icons/potion_blue.png";
        }
        if (els.name) {
            els.name.textContent = user.displayName || "已登入玩家";
        }
        if (els.email) {
            els.email.textContent = user.email || "";
        }

        window.currentUser = user;
        if (window.app) {
            window.app.currentUser = user;
            if (typeof window.app.onAuthChanged === "function") {
                window.app.onAuthChanged(user);
            }
        }
    } else {
        els.guest.classList.remove("hidden");
        els.user.classList.add("hidden");

        window.currentUser = null;
        if (window.app) {
            window.app.currentUser = null;
            if (typeof window.app.onAuthChanged === "function") {
                window.app.onAuthChanged(null);
            }
        }
    }
}

// 使用事件代理 (Event Delegation) 監聽所有 Google 登入按鈕
// 這能確保即使按鈕是動態生成的或是被 app.js 重新操作過，依然能正確觸發
document.addEventListener('click', (e) => {
    const loginBtn = e.target.closest('#btn-login-google, #btn-settings-login-google');
    if (loginBtn) {
        e.preventDefault();
        // 播放點擊音效 (如果有的話)
        if (window.audio) window.audio.playClick();
        console.log(`[Auth] Login triggered via ${loginBtn.id}`);
        void loginWithGoogle();
    }
});

if (els.logout) {
    els.logout.addEventListener("click", logoutUser);
}

// 處理重新導向結果
authReady.then(() => getRedirectResult(auth))
    .then((result) => {
        if (result?.user) {
            showMessage("Google 登入完成");
        }
    })
    .catch((error) => {
        console.error("[Auth] Redirect Result Error:", error);
        if (error?.code === "auth/no-auth-event") return;
        showMessage(getAuthErrorMessage(error), "error");
    });

onAuthStateChanged(auth, (user) => {
    loginInProgress = false;
    setLoginButtonsBusy(false);
    updateAuthUI(user);
});
