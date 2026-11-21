// メモを読みに行く GAS の URL（デプロイしたウェブアプリの URL を貼る）
const GAS_URL = "https://script.google.com/macros/s/AKfycbyUJfZNBAJYpTpU1iW27ah55LwiXqTVBDtsFziA93YLcNCbY-k6-P2Q7Iaxc2EQUKoO/exec";

// 時計と日付を表示する
const clockEl = document.getElementById("clock");
const dateEl = document.getElementById("date");
const fridayEl = document.getElementById("friday");
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function pad(n) {
  return String(n).padStart(2, "0");
}

function update() {
  const now = new Date();

  clockEl.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  dateEl.textContent =
    `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日（${WEEKDAYS[now.getDay()]}）`;

  // 金曜日まであと何日（getDay() は 日=0 … 金=5 … 土=6）
  const day = now.getDay();
  if (day === 0 || day === 6) {
    fridayEl.textContent = "今日はお休み🎉";
  } else if (day === 5) {
    fridayEl.textContent = "今日は金曜日！";
  } else {
    fridayEl.textContent = `あと ${5 - day}日`;
  }
}

update();
setInterval(update, 1000);

// ===== サブネット電卓 =====

// "192.168.10.0/24" を読んで、結果を返す。読めないときは { error: "…" } を返す
function calcSubnet(text) {
  const match = text.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/);
  if (!match) {
    return { error: "192.168.10.0/24 のような形で入れてください" };
  }

  const octets = match.slice(1, 5).map(Number);
  const prefix = Number(match[5]);
  if (octets.some((n) => n > 255)) {
    return { error: "数字は 0〜255 で入れてください" };
  }
  if (prefix > 32) {
    return { error: "/ のあとは 0〜32 で入れてください" };
  }

  // IP アドレスを 32 ビットの数にする（>>> 0 で符号なしにそろえる）
  const ip = ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const network = (ip & mask) >>> 0;
  const broadcast = (network | ~mask) >>> 0;
  const size = 2 ** (32 - prefix);

  let first, last, hosts;
  if (prefix === 32) {
    // 1台だけ
    first = last = network;
    hosts = 1;
  } else if (prefix === 31) {
    // 2台で直結する特別な使い方（RFC 3021）
    first = network;
    last = broadcast;
    hosts = 2;
  } else {
    // ネットワークアドレスとブロードキャストアドレスの2つは使えない
    first = network + 1;
    last = broadcast - 1;
    hosts = size - 2;
  }

  return {
    network: toIp(network),
    broadcast: toIp(broadcast),
    range: first === last ? toIp(first) : `${toIp(first)} 〜 ${toIp(last)}`,
    hosts: `${hosts.toLocaleString("ja-JP")}台`,
  };
}

function toIp(n) {
  return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}

const subnetInput = document.getElementById("subnet-input");
const subnetError = document.getElementById("subnet-error");
const subnetResult = document.getElementById("subnet-result");
const subnetFields = {
  network: document.getElementById("subnet-network"),
  broadcast: document.getElementById("subnet-broadcast"),
  range: document.getElementById("subnet-range"),
  hosts: document.getElementById("subnet-hosts"),
};

function updateSubnet() {
  const result = calcSubnet(subnetInput.value);
  const hasError = Boolean(result.error);

  // 入れている途中（空欄）はエラーを出さない
  subnetError.textContent = hasError && subnetInput.value.trim() !== "" ? result.error : "";
  subnetResult.classList.toggle("is-empty", hasError);
  for (const key in subnetFields) {
    subnetFields[key].textContent = hasError ? "-" : result[key];
  }
}

subnetInput.addEventListener("input", updateSubnet);
updateSubnet();

// ===== メモ（スプレッドシートから読む） =====

const memoTitle = document.getElementById("memo-title");
const memoStatus = document.getElementById("memo-status");
const memoList = document.getElementById("memo-list");

async function loadMemo() {
  if (!GAS_URL.startsWith("https://")) {
    memoStatus.textContent = "script.js の GAS_URL に URL を貼ってください";
    return;
  }

  try {
    const res = await fetch(GAS_URL);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];

    // シートの文字はそのまま文字として出す（HTML としては読ませない）
    memoTitle.textContent = data.title || "";
    memoList.replaceChildren(
      ...items.map((text) => {
        const li = document.createElement("li");
        li.textContent = text;
        return li;
      })
    );
    memoStatus.textContent = items.length === 0 ? "メモはまだありません" : "";
  } catch (err) {
    console.error(err);
    memoStatus.textContent = "メモを読み込めませんでした";
  }
}

loadMemo();
