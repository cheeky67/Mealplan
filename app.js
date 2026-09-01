// Firebase Authentication wiring for the Harvest sign in / sign up page.
// Uses the Firebase v10 modular SDK loaded straight from the CDN, so this
// project needs no build step and can be served as-is from GitHub Pages.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// --- Tab switching -----------------------------------------------------

const tabSignin = document.getElementById("tab-signin");
const tabSignup = document.getElementById("tab-signup");
const panelSignin = document.getElementById("panel-signin");
const panelSignup = document.getElementById("panel-signup");

function showPanel(which) {
  const isSignin = which === "signin";

  tabSignin.classList.toggle("is-active", isSignin);
  tabSignup.classList.toggle("is-active", !isSignin);
  tabSignin.setAttribute("aria-selected", String(isSignin));
  tabSignup.setAttribute("aria-selected", String(!isSignin));

  panelSignin.hidden = !isSignin;
  panelSignup.hidden = isSignin;
  panelSignin.classList.toggle("is-active", isSignin);
  panelSignup.classList.toggle("is-active", !isSignin);

  clearMessage();
}

tabSignin.addEventListener("click", () => showPanel("signin"));
tabSignup.addEventListener("click", () => showPanel("signup"));

// --- Status message ------------------------------------------------------

const formMsg = document.getElementById("form-msg");

function showMessage(text, kind = "error") {
  formMsg.textContent = text;
  formMsg.classList.toggle("is-success", kind === "success");
}

function clearMessage() {
  formMsg.textContent = "";
  formMsg.classList.remove("is-success");
}

// Turns Firebase's error codes into copy a person can actually act on.
function friendlyError(error) {
  const code = error && error.code;
  switch (code) {
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Email or password is incorrect.";
    case "auth/email-already-in-use":
      return "An account with that email already exists — try signing in instead.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/popup-closed-by-user":
      return "Google sign-in was closed before it finished.";
    case "auth/network-request-failed":
      return "Can't reach the server — check your connection and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

function setBusy(button, busy, busyLabel, idleLabel) {
  button.disabled = busy;
  button.textContent = busy ? busyLabel : idleLabel;
}

// --- Sign in ---------------------------------------------------------

panelSignin.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();

  const form = event.currentTarget;
  const email = form.email.value.trim();
  const password = form.password.value;
  const button = document.getElementById("btn-signin");

  setBusy(button, true, "Signing in…", "Sign in");
  try {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged below handles the redirect.
  } catch (error) {
    showMessage(friendlyError(error));
  } finally {
    setBusy(button, false, "Signing in…", "Sign in");
  }
});

// --- Sign up -----------------------------------------------------------

panelSignup.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();

  const form = event.currentTarget;
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;
  const button = document.getElementById("btn-signup");

  setBusy(button, true, "Creating account…", "Create account");
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (name) {
      await updateProfile(credential.user, { displayName: name });
    }
    // onAuthStateChanged below handles the redirect.
  } catch (error) {
    showMessage(friendlyError(error));
  } finally {
    setBusy(button, false, "Creating account…", "Create account");
  }
});

// --- Google sign-in ------------------------------------------------------

document.getElementById("btn-google").addEventListener("click", async () => {
  clearMessage();
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    showMessage(friendlyError(error));
  }
});

// --- Forgot password -----------------------------------------------------

document.getElementById("btn-forgot").addEventListener("click", async () => {
  clearMessage();
  const email = panelSignin.email.value.trim();
  if (!email) {
    showMessage("Enter your email above first, then tap \u201CForgot password?\u201D");
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    showMessage("Password reset email sent — check your inbox.", "success");
  } catch (error) {
    showMessage(friendlyError(error));
  }
});

// --- Redirect once signed in -----------------------------------------

onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "dashboard.html";
  }
});