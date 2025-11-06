
/* ===========================================================
   WOMEN SELF HELP GROUP PORTAL - FOCUS MODE JS
   =========================================================== */

const $ = (id) => document.getElementById(id);
const show = (el) => el?.classList.remove("hidden");
const hide = (el) => el?.classList.add("hidden");

// Toast utility
function showToast(msg) {
  const t = $("toast");
  if (!t) return;
  t.textContent = msg;
  show(t);
  setTimeout(() => hide(t), 2500);
}

// Load user data
let users = JSON.parse(localStorage.getItem("wshg_users")) || [];
let currentUser = JSON.parse(localStorage.getItem("wshg_current")) || null;

/* --------------------------
   LOGIN & LOGOUT SYSTEM
--------------------------- */
if ($("form-login")) {
  $("form-login").addEventListener("submit", (e) => {
    e.preventDefault();
    const uname = $("login-username").value.trim();
    const pass = $("login-password").value.trim();
    const user = users.find(
      (u) => u.username === uname && u.password === pass
    );
    if (!user) return showToast("Invalid username or password!");
    currentUser = user;
    localStorage.setItem("wshg_current", JSON.stringify(user));
    showToast("✅ Login Successful!");
    setTimeout(() => (window.location.href = "dashboard.html"), 1000);
  });
}

if ($("btn-logout")) {
  $("btn-logout").onclick = () => {
    localStorage.removeItem("wshg_current");
    showToast("Logging out...");
    setTimeout(() => (window.location.href = "login.html"), 800);
  };
}

/* --------------------------
   DASHBOARD INITIALIZATION
--------------------------- */
if (window.location.pathname.includes("dashboard.html")) {
  if (!currentUser) window.location.href = "login.html";

  $("welcome-user").textContent = `Welcome, ${currentUser.name} 🌸`;
  const hr = new Date().getHours();
  $("time-greet").textContent =
    hr < 12
      ? "☀️ Good Morning"
      : hr < 18
      ? "🌤 Good Afternoon"
      : "🌙 Good Evening";

  renderBalance();
  renderTransactions();

  $("prof-name").textContent = currentUser.name;
  $("prof-mobile").textContent = currentUser.mobile;
  $("prof-email").textContent = currentUser.email;
  $("prof-username").textContent = currentUser.username;
}

/* --------------------------
   RENDER FUNCTIONS
--------------------------- */
function renderBalance() {
  $("current-balance").textContent = "₹" + currentUser.balance;
  $("total-savings").textContent = "₹" + currentUser.totalSavings;
  $("last-payment").textContent = currentUser.lastPayment || "—";
}

function renderTransactions() {
  const tbody = document.querySelector("#txn-table tbody");
  tbody.innerHTML = "";
  (currentUser.transactions || []).forEach((txn) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${txn.date}</td>
      <td>₹${txn.amount}</td>
      <td>${txn.mode}</td>
      <td>₹${txn.balance}</td>`;
    tbody.appendChild(tr);
  });
}

/* --------------------------
   PAYMENT FUNCTIONALITY
--------------------------- */
if ($("form-pay")) {
  $("form-pay").addEventListener("submit", (e) => {
    e.preventDefault();
    const amt = parseFloat($("pay-amount").value);
    const mode = $("pay-mode").value;
    if (isNaN(amt) || amt <= 0) {
      showToast("Enter valid amount!");
      return;
    }

    currentUser.balance += amt;
    currentUser.totalSavings += amt;
    currentUser.lastPayment = new Date().toLocaleString();

    const txn = {
      date: new Date().toLocaleDateString(),
      amount: amt,
      mode,
      balance: currentUser.balance,
    };

    if (!currentUser.transactions) currentUser.transactions = [];
    currentUser.transactions.unshift(txn);

    const idx = users.findIndex((u) => u.username === currentUser.username);
    if (idx !== -1) users[idx] = currentUser;

    localStorage.setItem("wshg_users", JSON.stringify(users));
    localStorage.setItem("wshg_current", JSON.stringify(currentUser));

    renderBalance();
    renderTransactions();
    showToast("✅ Payment Successful!");
    $("form-pay").reset();
  });
}

/* --------------------------
   PANEL TOGGLE SYSTEM
--------------------------- */
const panels = {
  balance: $("panel-balance"),
  pay: $("panel-pay"),
  trans: $("panel-trans"),
  help: $("panel-help"),
  profile: $("panel-profile"),
  group: $("panel-group"),
  meetings: $("panel-meetings"),
  internal: $("panel-internal-loans"),
  bank: $("panel-bank-loans"),
  enterprises: $("panel-enterprises"),
};

const mainCards = $("main-cards");

// Hide all cards & panels
function hideAll() {
  hide(mainCards);
  Object.values(panels).forEach((p) => hide(p));
}

// Show specific card & panel only
function showPanel(cardId, panelId) {
  const allCards = document.querySelectorAll(".dash-card");
  allCards.forEach((c) => (c.style.display = "none")); // hide all cards

  const selectedCard = document.getElementById(cardId);
  selectedCard.style.display = "flex"; // show only clicked card
  selectedCard.style.margin = "0 auto"; // center it
  hideAll();
  show(panels[panelId]);
}

// Go back to full dashboard
function goBack() {
  Object.values(panels).forEach((p) => hide(p));
  const allCards = document.querySelectorAll(".dash-card");
  allCards.forEach((c) => (c.style.display = "flex")); // show all cards
  show(mainCards);
}

/* --- CARD TO PANEL MAP --- */
const cardToPanelMap = {
  "card-balance": "balance",
  "card-pay": "pay",
  "card-trans": "trans",
  "card-help": "help",
  "card-profile": "profile",
  "card-group": "group",
  "card-meetings": "meetings",
  "card-internal-loans": "internal",
  "card-bank-loans": "bank",
  "card-enterprises": "enterprises",
};

Object.entries(cardToPanelMap).forEach(([cardId, panelId]) => {
  const card = $(cardId);
  if (card) card.onclick = () => showPanel(cardId, panelId);
});

/* --- BACK BUTTONS --- */
["balance-back", "pay-cancel", "trans-back", "help-back", "profile-back", "group-back"].forEach(
  (id) => {
    if ($(id)) $(id).onclick = goBack;
  }
);

/* --------------------------
   GROUP MANAGEMENT
--------------------------- */
function getGroup() {
  return JSON.parse(localStorage.getItem("wshg_group")) || null;
}
function setGroup(group) {
  localStorage.setItem("wshg_group", JSON.stringify(group));
}

function createGroup(name, leaderUsername) {
  const leader = users.find((u) => u.username === leaderUsername);
  if (!leader) return showToast("Leader not found!");
  const group = {
    groupName: name,
    leaderUsername,
    members: [{ username: leader.username, name: leader.name }],
  };
  setGroup(group);
  renderGroupUI();
  showToast("✅ Group Created!");
}

function addMemberToGroup(username) {
  const group = getGroup();
  const user = users.find((u) => u.username === username);
  if (!group) return showToast("No group found!");
  if (!user) return showToast("User not found!");
  if (group.members.some((m) => m.username === username))
    return showToast("Already a member!");
  group.members.push({ username: user.username, name: user.name });
  setGroup(group);
  renderGroupUI();
  showToast("Member added!");
}

function renderGroupUI() {
  const group = getGroup();
  const createBlock = $("group-create-block");
  const existsBlock = $("group-exists-block");
  if (!group) {
    show(createBlock);
    hide(existsBlock);
    return;
  }
  hide(createBlock);
  show(existsBlock);
  $("group-name-display").textContent = group.groupName;
  $("group-leader-display").textContent = group.leaderUsername;
  $("group-member-count").textContent = group.members.length;
  const ul = $("group-members-list");
  ul.innerHTML = "";
  group.members.forEach((m) => {
    const li = document.createElement("li");
    li.textContent = `${m.name} (${m.username})`;
    ul.appendChild(li);
  });
}

function initGroupModules() {
  renderGroupUI();
}

function wireGroupFormHandlers() {
  if ($("form-create-group"))
    $("form-create-group").addEventListener("submit", (e) => {
      e.preventDefault();
      createGroup(
        $("input-group-name").value.trim(),
        $("input-group-leader").value.trim()
      );
      $("form-create-group").reset();
    });

  if ($("form-add-member"))
    $("form-add-member").addEventListener("submit", (e) => {
      e.preventDefault();
      addMemberToGroup($("input-new-member").value.trim());
      $("form-add-member").reset();
    });
}
