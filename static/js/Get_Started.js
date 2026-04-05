/* ==============================
   THEME / LAMP TOGGLE
============================== */
let themeBtn = null;
let light = null;

function initTheme() {
    themeBtn = document.getElementById("btn");
    light = document.getElementById("light");
}

function togglebtn() {
    if (themeBtn && light) {
        themeBtn.classList.toggle("active");
        light.classList.toggle("on");
    }
}

/* ==============================
   MODALS
============================== */

function clearFields(id) {
    document.querySelectorAll(`#${id} input`).forEach(i => i.value = "");
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add("show");
    clearFields(id);
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove("show");
    clearFields(id);
}

function switchModal(from, to) {
    closeModal(from);
    openModal(to);
}

/* ==============================
   AUTH / PROFILE
============================== */
let authButtons = null;
let profileContainer = null;
let profileTrigger = null;
let profileDropdown = null;
let usernameSpan = null;
let avatar = null;
let logoutBtn = null;

function initAuth() {
    authButtons = document.getElementById("authButtons");
    profileContainer = document.getElementById("profileContainer");
    profileTrigger = document.getElementById("profileTrigger");
    profileDropdown = document.getElementById("profileDropdown");
    usernameSpan = document.getElementById("username");
    avatar = document.getElementById("avatar");
    logoutBtn = document.getElementById("logoutBtn");

    if (profileTrigger) {
        profileTrigger.addEventListener("click", e => {
            e.stopPropagation();
            profileDropdown.style.display =
                profileDropdown.style.display === "block" ? "none" : "block";
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }

    // Add Profile button click handler
    const profileButton = profileDropdown?.querySelector(".dropdown-item:not(.logout)");
    if (profileButton) {
        profileButton.addEventListener("click", () => {
            window.location.href = window.location.origin + "/profile-page";
        });
    }

    document.addEventListener("click", () => {
        if (profileDropdown) profileDropdown.style.display = "none";
    });
}

function showProfile(user) {
    usernameSpan.textContent = user.name;
    avatar.textContent = user.name.charAt(0).toUpperCase();

    authButtons.classList.add("hidden");
    profileContainer.classList.remove("hidden");

    localStorage.setItem("user", JSON.stringify(user));
}

async function logout() {
    await fetch(window.location.origin + "/logout", {
        method: "POST",
        credentials: "include"
    });

    localStorage.removeItem("user");
    profileContainer.classList.add("hidden");
    profileDropdown.style.display = "none";
    authButtons.classList.remove("hidden");
}


/* ==============================
   TEMP LOGIN / SIGNUP
============================== */
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!email || !password) {
        alert("Fill all fields");
        return;
    }

    const res = await fetch(window.location.origin + "/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
        alert(data.detail || "Login failed");
        return;
    }

    showProfile({
        name: email.split("@")[0],
        email
    });

    closeModal("loginModal");
}

async function handleSignup(e) {
    e.preventDefault();

    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value.trim();

    if (!name || !email || !password) {
        alert("Fill all fields");
        return;
    }

    const res = await fetch(window.location.origin + "/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
        alert(data.detail || "Signup failed");
        return;
    }

    alert("Signup successful! Please login.");
    switchModal("signupModal", "loginModal");
}

/* ==============================
   DROPDOWN
============================== */

/* ==============================
   RESTORE SESSION
============================== */
async function restoreSession() {
    try {
        // Check if user has valid JWT cookie by calling a protected endpoint
        const res = await fetch(window.location.origin + "/protected", {
            method: "GET",
            credentials: "include"
        });

        console.log("Protected endpoint response:", res.status);

        if (res.ok) {
            const data = await res.json();
            console.log("Session data received:", data);
            
            const userName = data.user_name || data.user_email.split("@")[0];
            const userEmail = data.user_email;
            
            if (userName && userEmail) {
                showProfile({
                    name: userName,
                    email: userEmail
                });
                console.log("Session restored successfully");
            } else {
                throw new Error("Missing user data in response");
            }
        } else {
            console.log("Session restore failed, response status:", res.status);
            localStorage.removeItem("user");
            if (profileContainer) profileContainer.classList.add("hidden");
            if (authButtons) authButtons.classList.remove("hidden");
        }
    } catch (error) {
        console.error("Session restore error:", error);
        localStorage.removeItem("user");
        if (profileContainer) profileContainer.classList.add("hidden");
        if (authButtons) authButtons.classList.remove("hidden");
    }
}

/* ==============================
   INITIALIZE ON PAGE LOAD
============================== */
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initAuth();
    
    // First check if user data exists in localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            showProfile(user);
            console.log("User restored from localStorage:", user);
        } catch (e) {
            console.error("Error parsing stored user:", e);
            restoreSession();
        }
    } else {
        // No localStorage, try to restore from server
        restoreSession();
    }
});
