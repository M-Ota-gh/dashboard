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
  const daysToFriday = (5 - now.getDay() + 7) % 7;
  fridayEl.textContent = daysToFriday === 0 ? "今日は金曜日！" : `あと ${daysToFriday}日`;
}

update();
setInterval(update, 1000);
