import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getAnalytics, isSupported as analyticsSupported } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-analytics.js";
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
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

const firebaseConfig = window.__FIREBASE_CONFIG__;

if (!firebaseConfig) {
    console.error("[Auth] Missing window.__FIREBASE_CONFIG__");
    throw new Error("Missing window.__FIREBASE_CONFIG__");
}

console.log("[Auth] Initializing Firebase...");
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
auth.languageCode = "zh-TW";
const authReady = setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn("[Auth] Persistence error:", err);
});

analyticsSupported().then((supported) => {
    if (supported) {
        getAnalytics(firebaseApp);
    }
}).catch(() => {
    // Ignore analytics initialization
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
    console.log(`[Message] ${text}`);
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
            return "登入視窗已關閉。";
        case "auth/popup-blocked":
            return "彈出視窗被阻擋，請允許權限。";
        case "auth/unauthorized-domain":
            return `網域未授權：${window.location.hostname}`;
        case "auth/network-request-failed":
            return "網路連線失敗。";
        default:
            return `錯誤：${error?.code || error?.message || "未知"}`;
    }
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
        
        // 在 PWA 獨立模式下，signInWithPopup 通常比 Redirect 更能保持 App 的上下文 (Context)
        // 尤其是在 iOS 上，Redirect 可能會導致 App 狀態重置
        console.log("[Auth] Attempting Popup login (optimized for PWA/Mobile)...");
        await signInWithPopup(auth, provider);
        
    } catch (error) {

        console.error("[Auth] Login Error:", error);
        
        if (
            error.code === "auth/popup-blocked" || 
            error.code === "auth/operation-not-supported-in-this-environment" ||
            error.code === "auth/cancelled-popup-request"
        ) {
            try {
                console.log("[Auth] Falling back to Redirect...");
                showMessage("即將跳轉進行驗證...");
                await signInWithRedirect(auth, provider);
            } catch (redirectError) {
                console.error("[Auth] Redirect Fallback Error:", redirectError);
                showMessage(getAuthErrorMessage(redirectError), "error");
            }
            return;
        }
        
        showMessage(getAuthErrorMessage(error), "error");
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
        showMessage(`登出失敗：${error.code}`, "error");
    }
}

function updateAuthUI(user) {
    console.log("[Auth] Updating UI for user:", user?.email || "Guest");
    if (!els.guest || !els.user) return;

    if (user) {
        els.guest.classList.add("hidden");
        els.user.classList.remove("hidden");

        if (els.avatar) els.avatar.src = user.photoURL || "assets/icons/potion_blue.png";
        if (els.name) els.name.textContent = user.displayName || "已登入玩家";
        if (els.email) els.email.textContent = user.email || "";

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

// Global click listener using event delegation
document.addEventListener('click', (e) => {
    const loginBtn = e.target.closest('#btn-login-google, #btn-settings-login-google');
    if (loginBtn) {
        e.preventDefault();
        if (window.audio) window.audio.playClick();
        console.log(`[Auth] Login triggered via ${loginBtn.id}`);
        void loginWithGoogle();
    }
});

if (els.logout) {
    els.logout.addEventListener("click", logoutUser);
}

// Handle redirect result
authReady.then(() => {
    console.log("[Auth] Checking redirect result...");
    return getRedirectResult(auth);
}).then((result) => {
    if (result?.user) {
        console.log("[Auth] Redirect login success:", result.user.email);
        showMessage("Google 登入完成");
        updateAuthUI(result.user);
    }
}).catch((error) => {
    console.error("[Auth] Redirect error:", error);
    if (error?.code !== "auth/no-auth-event") {
        showMessage(getAuthErrorMessage(error), "error");
    }
});

// Monitor auth state
onAuthStateChanged(auth, (user) => {
    console.log("[Auth] Auth state changed:", user ? "LoggedIn" : "LoggedOut");
    loginInProgress = false;
    setLoginButtonsBusy(false);
    updateAuthUI(user);
});
