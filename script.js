(() => {
  const desktop = document.getElementById("desktop");
  const startButton = document.getElementById("start-button");
  const startMenu = document.getElementById("start-menu");
  const taskbarTasks = document.getElementById("taskbar-tasks");
  const trayClock = document.getElementById("tray-clock");

  const windows = Array.from(document.querySelectorAll(".window"));
  let zCounter = 10;
  const openTasks = new Map(); // windowId -> task button element

  function bringToFront(win) {
    windows.forEach(w => w.classList.remove("active"));
    win.classList.add("active");
    zCounter += 1;
    win.style.zIndex = zCounter;
    taskbarTasks.querySelectorAll(".task-button").forEach(btn => btn.classList.remove("active"));
    const task = openTasks.get(win.id);
    if (task) task.classList.add("active");
  }

  function getTitleText(win) {
    const el = win.querySelector(".title-bar-text");
    return el ? el.textContent.trim() : win.id;
  }

  function getTitleIconSrc(win) {
    const img = win.querySelector(".title-icon");
    return img ? img.getAttribute("src") : "";
  }

  function createTaskButton(win) {
    const btn = document.createElement("button");
    btn.className = "task-button active";
    const img = document.createElement("img");
    img.src = getTitleIconSrc(win);
    const span = document.createElement("span");
    span.textContent = getTitleText(win);
    btn.appendChild(img);
    btn.appendChild(span);
    btn.addEventListener("click", () => {
      if (win.style.display === "none") {
        win.style.display = "flex";
        bringToFront(win);
      } else if (win.classList.contains("active")) {
        win.style.display = "none";
      } else {
        bringToFront(win);
      }
    });
    taskbarTasks.appendChild(btn);
    openTasks.set(win.id, btn);
  }

  function openWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    win.style.display = "flex";
    if (!openTasks.has(id)) createTaskButton(win);
    bringToFront(win);
  }

  function closeWindow(win) {
    win.style.display = "none";
    const task = openTasks.get(win.id);
    if (task) {
      task.remove();
      openTasks.delete(win.id);
    }
  }

  // Window controls: close / minimize / maximize(toggle-ish) + focus on mousedown
  windows.forEach(win => {
    win.addEventListener("mousedown", () => bringToFront(win));

    const closeBtn = win.querySelector(".close-btn");
    const minBtn = win.querySelector(".min-btn");
    const maxBtn = win.querySelector(".max-btn");

    if (closeBtn) closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeWindow(win);
    });

    if (minBtn) minBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      win.style.display = "none";
      const task = openTasks.get(win.id);
      if (task) task.classList.remove("active");
    });

    if (maxBtn) maxBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (win.dataset.maximized === "true") {
        win.style.top = win.dataset.prevTop;
        win.style.left = win.dataset.prevLeft;
        win.style.width = win.dataset.prevWidth;
        win.style.height = win.dataset.prevHeight;
        win.dataset.maximized = "false";
      } else {
        win.dataset.prevTop = win.style.top;
        win.dataset.prevLeft = win.style.left;
        win.dataset.prevWidth = win.style.width;
        win.dataset.prevHeight = win.style.height;
        win.style.top = "0px";
        win.style.left = "0px";
        win.style.width = "100%";
        win.style.height = "100%";
        win.dataset.maximized = "true";
      }
    });

    // Dragging via title bar
    const titleBar = win.querySelector(".title-bar");
    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    titleBar.addEventListener("mousedown", (e) => {
      if (e.target.closest(".title-bar-controls")) return;
      dragging = true;
      const rect = win.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      bringToFront(win);
      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      if (win.dataset.maximized === "true") return;
      let newLeft = e.clientX - offsetX;
      let newTop = e.clientY - offsetY;
      newTop = Math.max(0, Math.min(newTop, window.innerHeight - 30 - 30));
      newLeft = Math.max(-win.offsetWidth + 60, Math.min(newLeft, window.innerWidth - 60));
      win.style.left = newLeft + "px";
      win.style.top = newTop + "px";
    });

    document.addEventListener("mouseup", () => {
      dragging = false;
    });

    titleBar.addEventListener("dblclick", (e) => {
      if (e.target.closest(".title-bar-controls")) return;
      if (maxBtn) maxBtn.click();
    });
  });

  // Desktop icons: single click select, double click open
  const icons = document.querySelectorAll("#icons .icon");
  icons.forEach(icon => {
    icon.addEventListener("click", (e) => {
      icons.forEach(i => i.classList.remove("selected"));
      icon.classList.add("selected");
    });
    function activateIcon() {
      if (icon.dataset.url) {
        window.open(icon.dataset.url, "_blank", "noopener");
      } else if (icon.dataset.window) {
        openWindow(icon.dataset.window);
      }
    }
    icon.addEventListener("dblclick", activateIcon);
    icon.addEventListener("keydown", (e) => {
      if (e.key === "Enter") activateIcon();
    });
  });

  // Deselect icons when clicking empty desktop
  desktop.addEventListener("mousedown", (e) => {
    if (e.target === desktop || e.target.id === "icons") {
      icons.forEach(i => i.classList.remove("selected"));
    }
  });

  // Start menu toggle
  startButton.addEventListener("click", (e) => {
    e.stopPropagation();
    startMenu.classList.toggle("open");
    startButton.classList.toggle("active");
  });

  document.addEventListener("click", (e) => {
    if (!startMenu.contains(e.target) && !startButton.contains(e.target)) {
      startMenu.classList.remove("open");
      startButton.classList.remove("active");
    }
  });

  startMenu.querySelectorAll("li[data-window]").forEach(item => {
    item.addEventListener("click", () => {
      openWindow(item.dataset.window);
      startMenu.classList.remove("open");
      startButton.classList.remove("active");
    });
  });

  document.getElementById("shutdown-item").addEventListener("click", () => {
    startMenu.classList.remove("open");
    startButton.classList.remove("active");
    alert("It's now safe to close this browser tab.");
  });

  // Explorer: selecting a project swaps the detail panel
  document.querySelectorAll(".explorer").forEach(explorer => {
    const items = explorer.querySelectorAll(".explorer-item");
    const details = explorer.querySelectorAll(".project-detail");

    function selectProject(id) {
      items.forEach(i => i.classList.toggle("selected", i.dataset.project === id));
      details.forEach(d => d.classList.toggle("active", d.dataset.project === id));
    }

    items.forEach(item => {
      item.addEventListener("click", () => selectProject(item.dataset.project));
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectProject(item.dataset.project);
        }
      });
    });

    // Show the first project on load
    if (items.length) selectProject(items[0].dataset.project);
  });

  // Open Welcome window by default
  openWindow("welcome-window");

  // Clock
  function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    if (hours === 0) hours = 12;
    trayClock.textContent = `${hours}:${minutes} ${ampm}`;
  }
  updateClock();
  setInterval(updateClock, 1000 * 10);
})();
