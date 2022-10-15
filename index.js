import { Grid } from "https://unpkg.com/gridjs?module";

new Grid({
  columns: [
    "Name",
    "Description",
    "Author",
    {
      name: "Version",
      sort: {
        compare: compareSemanticVersions,
      },
    },
    "Dependencies",
    {
      name: "@salesforce/command",
      sort: {
        compare: compareSemanticVersions,
      },
    },
  ],
  server: {
    url: "/build/packages.json",
    then: (data) =>
      data.map((pkg) => [
        pkg.name,
        pkg.description,
        pkg.author?.name,
        pkg.version,
        Object.keys(pkg.dependencies || []).length,
        pkg.dependencies?.["@salesforce/command"],
      ]),
  },
  sort: true,
  search: {
    enabled: true,
  },
}).render(document.getElementById("wrapper-plugins"));

new Grid({
  columns: ["Plugin", "Command", "Description"],
  server: {
    url: "/build/commands.json",
    then: (data) =>
      data.map((cmd) => [cmd.pluginName, cmd.id, cmd.description]),
  },
  sort: true,
  search: {
    enabled: true,
  },
}).render(document.getElementById("wrapper-commands"));

window.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll('[role="tab"]');
  const tabList = document.querySelector('[role="tablist"]');

  // Add a click event handler to each tab
  tabs.forEach((tab) => {
    tab.addEventListener("click", changeTabs);
  });

  // Enable arrow navigation between tabs in the tab list
  let tabFocus = 0;

  tabList.addEventListener("keydown", (e) => {
    // Move right
    if (e.keyCode === 39 || e.keyCode === 37) {
      tabs[tabFocus].setAttribute("tabindex", -1);
      if (e.keyCode === 39) {
        tabFocus++;
        // If we're at the end, go to the start
        if (tabFocus >= tabs.length) {
          tabFocus = 0;
        }
        // Move left
      } else if (e.keyCode === 37) {
        tabFocus--;
        // If we're at the start, move to the end
        if (tabFocus < 0) {
          tabFocus = tabs.length - 1;
        }
      }

      tabs[tabFocus].setAttribute("tabindex", 0);
      tabs[tabFocus].focus();
    }
  });
});

function changeTabs(e) {
  const target = e.target;
  const parent = target.parentNode;
  const grandparent = parent.parentNode;

  // Remove all current selected tabs
  parent
    .querySelectorAll('[aria-selected="true"]')
    .forEach((t) => t.setAttribute("aria-selected", false));

  // Set this tab as selected
  target.setAttribute("aria-selected", true);

  // Hide all tab panels
  grandparent
    .querySelectorAll('[role="tabpanel"]')
    .forEach((p) => p.setAttribute("hidden", true));

  // Show the selected panel
  grandparent.parentNode
    .querySelector(`#${target.getAttribute("aria-controls")}`)
    .removeAttribute("hidden");
}

function compareSemanticVersions(a = "0.0.0", b = "0.0.0") {
  a = a.replace("^", "");
  b = b.replace("^", "");
  return a.localeCompare(b, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}
