import { html, Grid } from "./vendor/gridjs.module.js";

const defaultGridSettings = {
  sort: true,
  autoWidth: false,
  search: {
    enabled: true,
  },
  pagination: {
    limit: 20,
  },
  className: {
    container: "slds-p-horizontal_small",
    table: "slds-table slds-table_bordered slds-table_fixed-layout",
    td: "slds-truncate",
    pagination: "slds-button-group",
    paginationButton: "slds-button slds-button_neutral",
    paginationButtonCurrent: "slds-is-selected",
    search: "slds-p-bottom_small",
    footer: "slds-p-vertical_small",
  },
};

const formatWithTitle = (cell) => html(`<div title="${cell}">${cell}</div>`);
const pluginsGrid = new Grid({
  ...defaultGridSettings,
  columns: [
    {
      name: "Name",
      width: "200px",
      formatter: (_, row) =>
        row.cells[1]?.data
          ? html(
              `<a href="${row.cells[1]?.data}" title="${row.cells[0]?.data}" target="_blank">${row.cells[0].data}</a>`
            )
          : row.cells[0].data,
    },
    {
      name: "NpmLink",
      hidden: true,
    },
    {
      name: html(`<span title="GitHub Stars"># ★</span>`),
      width: "45px",
      sort: {
        compare: compareWithUndefined,
        // https://github.com/grid-js/gridjs/pull/1366
        direction: -1,
      },
      formatter: (_, row) =>
        row.cells[3]?.data
          ? html(
              `<a href="${row.cells[3]?.data}" title="${row.cells[2].data}" target="_blank">${row.cells[2].data}</a>`
            )
          : row.cells[2].data,
    },
    {
      name: "GitHubLink",
      hidden: true,
    },
    {
      name: html(`<span title="Weekly NPM downloads"># ⬇</span>`),
      width: "80px",
    },
    {
      name: "Description",
      formatter: formatWithTitle,
    },
    {
      name: "Author",
      width: "120px",
      formatter: formatWithTitle,
    },
    {
      name: "Version",
      width: "70px",
      sort: {
        compare: compareSemanticVersions,
      },
    },
    {
      name: html(
        `<span title="Date of last released version">Last Release</span>`
      ),
      width: "95px",
      formatter: (cell) => cell?.substring(0, 10),
    },
    {
      name: html(`<span title="Number of package dependencies"># Deps</span>`),
      width: "60px",
    },
    {
      name: "Library",
      width: "245px",
      formatter: formatWithTitle,
      sort: {
        compare: compareSemanticVersions,
      },
    },
  ],
  server: {
    url: "data/plugins.min.json",
    then: (data) =>
      data.map((pkg) => [
        pkg.name,
        pkg.npmLink,
        pkg.gitHubStargazersCount,
        pkg.gitHubLink,
        pkg.npmDownloads,
        pkg.description,
        pkg.authorName,
        pkg.version,
        pkg.date,
        pkg.dependenciesCount,
        pkg.pluginLibrary,
      ]),
  },
  language: {
    search: {
      placeholder: "Search plugin name or description...",
    },
  },
});
pluginsGrid.render(document.getElementById("wrapper-plugins"));

const commandsGrid = new Grid({
  ...defaultGridSettings,
  columns: [
    {
      name: "Plugin",
      width: "200px",
      formatter: (_, row) =>
        row.cells[3]?.data
          ? html(
              `<a href="${row.cells[3]?.data}" title="${row.cells[0]?.data}" target="_blank">${row.cells[0].data}</a>`
            )
          : row.cells[0].data,
    },
    {
      name: "Command",
      width: "255px",
      formatter: formatWithTitle,
    },
    {
      name: "Description",
      formatter: formatWithTitle,
    },
    {
      name: "Link",
      hidden: true,
    },
  ],
  server: {
    url: "data/commands.min.json",
    then: (data) =>
      data.map((cmd) => [cmd.pluginName, cmd.id, cmd.description, cmd.link]),
  },
  language: {
    search: {
      placeholder: "Search command or description...",
    },
  },
});

commandsGrid.render(document.getElementById("wrapper-commands"));

function compareSemanticVersions(a = "0.0.0", b = "0.0.0") {
  a = a.replace("^", "");
  b = b.replace("^", "");
  return a.localeCompare(b, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function compareWithUndefined(a, b) {
  if (a === b) {
    return 0;
  }
  if (a === undefined) {
    return -1;
  }
  if (b === undefined) {
    return 1;
  }
  return a - b;
}

window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".gridjs-search-input").forEach((input) => {
    input.classList.add("slds-input");
  });
  const tabs = document.querySelectorAll('[role="tab"]');
  tabs.forEach((tab) => {
    tab.addEventListener("click", changeTabs);
  });
});

try {
  const response = await fetch("data/meta.json");
  const data = await response.json();
  document.querySelector(".meta time").innerHTML = data.lastUpdated;
} catch (_) {}

function changeTabs(e) {
  const tab = e.target.closest("[aria-controls]");
  const tabList = tab.closest("[role='tablist']");
  const tabPanelId = tab.getAttribute("aria-controls");
  const tabPanel = document.getElementById(tabPanelId);

  // Remove all current selected tabs
  tabList.querySelectorAll('[aria-selected="true"]').forEach((tab) => {
    tab.setAttribute("aria-selected", false);
    tab.classList.remove("slds-is-active");
  });

  // Set this tab as selected
  tab.setAttribute("aria-selected", true);
  tab.classList.add("slds-is-active");

  // Hide all tab panels
  document.querySelectorAll('[role="tabpanel"]').forEach((p) => {
    p.setAttribute("hidden", true);
  });

  // Show the selected panel
  tabPanel.removeAttribute("hidden");
}
