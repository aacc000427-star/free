
const $ = id => document.getElementById(id);

async function api(url, options = {}) {
  const response = await fetch(
    "/api/roblox?url=" + encodeURIComponent(url),
    {
      method: options.method || "GET",
      headers: options.headers || {},
      body: options.body
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `API 錯誤：${response.status}`);
  }

  return data;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function accountAge(value) {
  const start = new Date(value);
  const now = new Date();

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();

  if (days < 0) {
    months--;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return `${years} 年 ${months} 個月 ${days} 天`;
}

$("searchForm").addEventListener("submit", async event => {
  event.preventDefault();

  const username = $("username").value.trim();
  if (!username) return;

  $("searchBtn").disabled = true;
  $("status").textContent = "查詢中……";
  $("result").classList.add("hidden");

  try {
    const search = await api(
      "https://users.roblox.com/v1/usernames/users",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usernames: [username],
          excludeBannedUsers: false
        })
      }
    );

    if (!search.data?.length) {
      throw new Error("找不到這個玩家，請確認使用者名稱。");
    }

    const id = search.data[0].id;

    const [user, friends, avatar] = await Promise.all([
      api(`https://users.roblox.com/v1/users/${id}`),
      api(`https://friends.roblox.com/v1/users/${id}/friends/count`),
      api(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${id}&size=150x150&format=Png&isCircular=false`)
    ]);

    $("displayName").textContent = user.displayName || user.name;
    $("userName").textContent = "@" + user.name;
    $("userId").textContent = "User ID：" + user.id;
    $("created").textContent = formatDate(user.created);
    $("age").textContent = accountAge(user.created);
    $("friends").textContent = Number(friends.count ?? 0).toLocaleString("zh-TW");
    $("avatar").src = avatar.data?.[0]?.imageUrl || "";
    $("profileLink").href = `https://www.roblox.com/users/${id}/profile`;

    $("result").classList.remove("hidden");
    $("status").textContent = "查詢完成。";
  } catch (error) {
    $("status").textContent = "查詢失敗：" + error.message;
  } finally {
    $("searchBtn").disabled = false;
  }
});

let selectedAmount = 0;

document.querySelectorAll(".amount").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".amount").forEach(item =>
      item.classList.remove("selected")
    );

    button.classList.add("selected");
    selectedAmount = Number(button.dataset.value);

    $("extractStatus").textContent = `已選擇 ${selectedAmount} R$`;
  });
});

$("extractBtn").addEventListener("click", () => {
  if (!selectedAmount) {
    $("extractStatus").textContent = "請先選擇提取數量。";
    return;
  }

  $("extractStatus").textContent =
    `模擬提取 ${selectedAmount} R$ 完成，不會真的增加 Robux。`;
});
