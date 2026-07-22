// ==UserScript==
// @name         [TORN] OC 2.0 Statistics
// @namespace    oc2-stats
// @version      1.0.3
// @description  Adds weekly and monthly OC 2.0 completion statistics to the Torn faction crimes page.
// @author       Annosz [2896714]
// @match        https://www.torn.com/*
// @updateURL    https://github.com/Annosz/torn-userscripts/raw/main/oc2_stats.user.js
// @downloadURL  https://github.com/Annosz/torn-userscripts/raw/main/oc2_stats.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @connect      api.torn.com
// @grant        GM.xmlHttpRequest
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function () {
  "use strict";

  const API_KEY_STORAGE = "oc2-stats-api-key";
  const PANEL_ID = "oc2-stats-panel";
  const PAGE_LIMIT = 100;

  let apiKey = "";
  let reportMode = "weekly";
  let retryTimer = null;

  start();

  function start() {
    insertPanelWhenReady();
    window.addEventListener("hashchange", insertPanelWhenReady);
  }

  async function insertPanelWhenReady() {
    clearTimeout(retryTimer);

    if (!isCrimesPage()) {
      document.getElementById(PANEL_ID)?.remove();
      return;
    }

    const crimesPage = document.querySelector("#faction-crimes");
    if (!crimesPage) {
      retryTimer = setTimeout(insertPanelWhenReady, 500);
      return;
    }

    if (document.getElementById(PANEL_ID)) {
      return;
    }

    apiKey = await getStoredApiKey();
    crimesPage.insertAdjacentHTML("beforebegin", panelHtml());
    bindEvents();
    showCorrectView();
  }

  function isCrimesPage() {
    return (
      location.href.includes("step=your") &&
      location.href.includes("tab=crimes")
    );
  }

  async function getStoredApiKey() {
    return localStorage.getItem(API_KEY_STORAGE) || "";
  }

  function panelHtml() {
    return `
      <section id="${PANEL_ID}" class="category-wrap OC2-statsViewer m-top10">
        <div class="title-black top-round t-overflow">
          OC 2.0 Statistics
        </div>

        <div id="oc2Body" class="cont-gray">
          <div id="oc2KeyView">
            <input id="oc2ApiKey" type="password" placeholder="API key" autocomplete="off">
            <button id="oc2TestKey" type="button">Test</button>
            <button id="oc2SaveKey" type="button" disabled>Save</button>
          </div>

          <div id="oc2ReportView">
            <div id="oc2ModeToggle" class="oc2ModeToggle is-weekly" role="group" aria-label="Report period">
              <button id="oc2Weekly" class="oc2ModeOption" type="button">Weekly</button>
              <button id="oc2Monthly" class="oc2ModeOption" type="button">Monthly</button>
            </div>
            <button id="oc2Load" type="button">Load</button>

            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Success</th>
                  <th>Failure</th>
                  <th>Success Rate</th>
                  <th>Total Income</th>
                  <th>Total Item Cost</th>
                  <th>Total Respect</th>
                </tr>
              </thead>
              <tbody id="oc2Rows"></tbody>
            </table>
          </div>

          <p id="oc2Status"></p>
        </div>
      </section>

      <style>
        #${PANEL_ID} {
          color: #333;
          margin: 10px 0;
        }

        body.dark-mode #${PANEL_ID} {
          color: #ddd;
        }

        #${PANEL_ID} .title-black {
          position: relative;
        }

        #oc2Title {
          color: inherit;
          display: block;
          font: 700 14px Arial, Helvetica, sans-serif;
          line-height: 17px;
          margin: 0;
          padding: 0;
        }

        #oc2Body {
          border: 1px solid #999;
          border-top: 0;
          box-sizing: border-box;
          padding: 10px;
        }

        body.dark-mode #oc2Body {
          border-color: #555;
        }

        #${PANEL_ID} button {
          background: linear-gradient(#fff 0%, #ddd 100%);
          border: 1px solid #999;
          border-radius: 2px;
          color: #666;
          cursor: pointer;
          font: 700 12px Arial, Helvetica, sans-serif;
          line-height: 16px;
          margin: 0 6px 8px 0;
          padding: 2px 7px;
        }

        body.dark-mode #${PANEL_ID} button {
          background: linear-gradient(#555 0%, #333 100%);
          border-color: #222;
          color: #ddd;
        }

        #${PANEL_ID} button:hover:not(:disabled) {
          background: #c8c8c8;
        }

        body.dark-mode #${PANEL_ID} button:hover:not(:disabled) {
          background: #1c1c1c;
        }

        #${PANEL_ID} button.oc2Active,
        #${PANEL_ID} button:disabled {
          cursor: default;
          opacity: 0.7;
          text-decoration: underline;
        }

        #${PANEL_ID} .oc2ModeToggle {
          background: #d7d7d7;
          border: 1px solid #999;
          border-radius: 3px;
          box-sizing: border-box;
          display: inline-grid;
          grid-template-columns: 1fr 1fr;
          height: 24px;
          margin: 0 8px 8px 0;
          padding: 2px;
          position: relative;
          vertical-align: top;
          width: 132px;
        }

        body.dark-mode #${PANEL_ID} .oc2ModeToggle {
          background: #202020;
          border-color: #555;
        }

        #${PANEL_ID} .oc2ModeToggle::before {
          background: linear-gradient(#fff 0%, #ddd 100%);
          border: 1px solid #999;
          border-radius: 2px;
          box-sizing: border-box;
          content: "";
          height: 18px;
          left: 2px;
          position: absolute;
          top: 2px;
          transition: transform 140ms ease;
          width: calc(50% - 2px);
        }

        body.dark-mode #${PANEL_ID} .oc2ModeToggle::before {
          background: linear-gradient(#555 0%, #333 100%);
          border-color: #222;
        }

        #${PANEL_ID} .oc2ModeToggle.is-monthly::before {
          transform: translateX(100%);
        }

        #${PANEL_ID} .oc2ModeOption,
        body.dark-mode #${PANEL_ID} .oc2ModeOption,
        #${PANEL_ID} .oc2ModeOption:hover:not(:disabled),
        body.dark-mode #${PANEL_ID} .oc2ModeOption:hover:not(:disabled) {
          background: transparent;
          border: 0;
          color: inherit;
          height: 18px;
          line-height: 18px;
          margin: 0;
          opacity: 1;
          padding: 0;
          position: relative;
          text-decoration: none;
          z-index: 1;
        }

        #${PANEL_ID} .oc2ModeOption:not(:disabled) {
          opacity: 0.75;
        }

        #${PANEL_ID} .oc2ModeOption:disabled {
          color: #333;
        }

        body.dark-mode #${PANEL_ID} .oc2ModeOption:disabled {
          color: #fff;
        }

        #${PANEL_ID} input {
          background: #fff;
          border: 1px solid #999;
          box-sizing: border-box;
          color: #333;
          font: 12px Arial, Helvetica, sans-serif;
          margin: 0 6px 8px 0;
          min-width: 240px;
          padding: 3px 6px;
        }

        body.dark-mode #${PANEL_ID} input {
          background: #1f1f1f;
          border-color: #555;
          color: #ddd;
        }

        #${PANEL_ID} table {
          border-collapse: collapse;
          font: 12px Arial, Helvetica, sans-serif;
          margin-top: 2px;
          width: 100%;
        }

        #${PANEL_ID} th,
        #${PANEL_ID} td {
          border: 1px solid #999;
          color: #333;
          line-height: 16px;
          padding: 4px 6px;
          text-align: right;
        }

        body.dark-mode #${PANEL_ID} th,
        body.dark-mode #${PANEL_ID} td {
          border-color: #555;
        }

        body.dark-mode #${PANEL_ID} td {
          color: #ddd !important;
        }

        #${PANEL_ID} th {
          background: repeating-linear-gradient(90deg, #2e2e2e, #2e2e2e 2px, #282828 0, #282828 4px);
          color: #fff;
          font-weight: 700;
        }

        #${PANEL_ID} th:first-child,
        #${PANEL_ID} td:first-child {
          text-align: left;
        }

        #${PANEL_ID} tbody tr:nth-child(even) {
          background: rgba(150, 150, 150, 0.1);
        }

        body.dark-mode #${PANEL_ID} tbody tr:nth-child(even) {
          background: rgba(0, 0, 0, 0.2);
        }

        #oc2Status {
          font: 12px Arial, Helvetica, sans-serif;
          line-height: 16px;
          margin: 8px 0 0;
        }
      </style>
    `;
  }

  function bindEvents() {
    document.getElementById("oc2ApiKey").addEventListener("input", () => {
      document.getElementById("oc2SaveKey").disabled = true;
      setStatus("");
    });

    document.getElementById("oc2TestKey").addEventListener("click", testApiKey);
    document.getElementById("oc2SaveKey").addEventListener("click", saveApiKey);
    document
      .getElementById("oc2Weekly")
      .addEventListener("click", () => setMode("weekly"));
    document
      .getElementById("oc2Monthly")
      .addEventListener("click", () => setMode("monthly"));
    document.getElementById("oc2Load").addEventListener("click", loadReport);
  }

  function showCorrectView() {
    document.getElementById("oc2KeyView").style.display = apiKey ? "none" : "";
    document.getElementById("oc2ReportView").style.display = apiKey
      ? ""
      : "none";

    if (apiKey) {
      setMode(reportMode);
      setStatus("API key saved. Pick weekly or monthly, then load the report.");
    } else {
      setStatus("Test and save a minimal API key with faction API access to enable the report.");
    }
  }

  async function testApiKey() {
    const inputKey = getInputApiKey();

    if (!inputKey) {
      setStatus("Enter an API key first.");
      return;
    }

    setStatus("Testing API key...");
    document.getElementById("oc2SaveKey").disabled = true;

    try {
      const data = await getJson(
        `https://api.torn.com/key/?selections=info&key=${encodeURIComponent(inputKey)}`,
      );

      if (data.error) {
        throw new Error(data.error.error || "API key rejected.");
      }

      const hasCrimesAccess =
        Array.isArray(data.selections?.faction) &&
        data.selections.faction.includes("crimes");

      if (!hasCrimesAccess) {
        throw new Error("This key does not have faction crimes access.");
      }

      document.getElementById("oc2SaveKey").disabled = false;
      setStatus("API key works. Save it to continue.");
    } catch (error) {
      setStatus(error.message || "API key test failed.");
    }
  }

  async function saveApiKey() {
    apiKey = getInputApiKey();
    localStorage.setItem(API_KEY_STORAGE, apiKey);
    showCorrectView();
  }

  function getInputApiKey() {
    return document.getElementById("oc2ApiKey").value.trim();
  }

  function setMode(nextMode) {
    reportMode = nextMode;
    const toggle = document.getElementById("oc2ModeToggle");
    const weekly = document.getElementById("oc2Weekly");
    const monthly = document.getElementById("oc2Monthly");

    toggle.classList.toggle("is-weekly", reportMode === "weekly");
    toggle.classList.toggle("is-monthly", reportMode === "monthly");
    weekly.disabled = reportMode === "weekly";
    monthly.disabled = reportMode === "monthly";
    weekly.classList.toggle("oc2Active", reportMode === "weekly");
    monthly.classList.toggle("oc2Active", reportMode === "monthly");
  }

  async function loadReport() {
    const loadButton = document.getElementById("oc2Load");
    loadButton.disabled = true;
    setStatus("Loading completed crimes...");

    try {
      const crimes = await getCompletedCrimes(getPeriodStart());
      setStatus(
        `Loaded ${crimes.length.toLocaleString()} completed crimes. Loading item prices...`,
      );

      const itemPrices = await getItemPrices(crimes);
      drawTable(crimes, itemPrices);
      setStatus(
        `Report loaded from ${crimes.length.toLocaleString()} completed crimes.`,
      );
    } catch (error) {
      setStatus(error.message || "Could not load report.");
    } finally {
      loadButton.disabled = false;
    }
  }

  async function getCompletedCrimes(fromTimestamp) {
    const crimes = [];
    let offset = 0;

    while (true) {
      const data = await getJson(
        `https://api.torn.com/v2/faction/crimes?filters=executed_at&cat=completed&limit=${PAGE_LIMIT}&offset=${offset}`,
        { headers: { Authorization: `ApiKey ${apiKey}` } },
      );

      if (data.error) {
        throw new Error(data.error.error || "Torn API returned an error.");
      }

      const page = data.crimes || [];
      crimes.push(
        ...page.filter((crime) => crime.executed_at >= fromTimestamp),
      );

      const reachedOldCrimes = page.some(
        (crime) => crime.executed_at < fromTimestamp,
      );
      if (page.length < PAGE_LIMIT || reachedOldCrimes) {
        break;
      }

      offset += PAGE_LIMIT;
    }

    return crimes;
  }

  function getPeriodStart() {
    const now = new Date();

    if (reportMode === "monthly") {
      return toTimestamp(
        new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 4, 1)),
      );
    }

    const monday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const day = monday.getUTCDay() || 7;
    monday.setUTCDate(monday.getUTCDate() - day + 1 - 28);
    return toTimestamp(monday);
  }

  async function getItemPrices(crimes) {
    const ids = [
      ...new Set(
        crimes.flatMap((crime) => [
          ...(crime.rewards?.items || []).map((item) => item.id),
          ...getConsumedItemIds(crime),
        ]),
      ),
    ];
    const prices = {};

    await Promise.all(
      ids.map(async (id) => {
        try {
          const data = await getJson(
            `https://api.torn.com/v2/market/${id}/itemmarket?limit=20&offset=0`,
            { headers: { Authorization: `ApiKey ${apiKey}` } },
          );
          prices[id] = data.itemmarket?.item?.average_price || 0;
        } catch {
          prices[id] = 0;
        }
      }),
    );

    return prices;
  }

  function getConsumedItemIds(crime) {
    return (crime.slots || [])
      .filter(
        (slot) =>
          slot.item_requirement?.is_reusable === false &&
          slot.user?.item_outcome?.outcome === "used",
      )
      .map(
        (slot) =>
          slot.user.item_outcome.item_id || slot.item_requirement.id,
      )
      .filter(Boolean);
  }

  function drawTable(crimes, itemPrices) {
    const buckets = {};

    crimes.forEach((crime) => {
      const period =
        reportMode === "monthly"
          ? getMonth(crime.executed_at)
          : getWeek(crime.executed_at);
      buckets[period] ||= {
        success: 0,
        failure: 0,
        compensation: 0,
        itemCost: 0,
        respect: 0,
      };

      if ((crime.status || "").toLowerCase().includes("success")) {
        buckets[period].success++;
      } else {
        buckets[period].failure++;
      }

      const rewards = crime.rewards || {};
      buckets[period].compensation += rewards.money || 0;
      buckets[period].respect += rewards.respect || 0;

      (rewards.items || []).forEach((item) => {
        buckets[period].compensation +=
          (itemPrices[item.id] || 0) * item.quantity;
      });

      getConsumedItemIds(crime).forEach((itemId) => {
        buckets[period].itemCost += itemPrices[itemId] || 0;
      });
    });

    const rows = document.getElementById("oc2Rows");
    const periods = Object.keys(buckets).sort().reverse();

    if (!periods.length) {
      rows.innerHTML = `<tr><td colspan="7">No completed crimes found for this range.</td></tr>`;
      return;
    }

    rows.innerHTML = periods
      .map((period) => {
        const row = buckets[period];
        const total = row.success + row.failure;
        const successRate = total
          ? ((row.success / total) * 100).toFixed(1)
          : "0.0";

        return `
          <tr>
            <td>${period}</td>
            <td>${row.success}</td>
            <td>${row.failure}</td>
            <td>${successRate}%</td>
            <td>$${Math.round(row.compensation).toLocaleString()}</td>
            <td>$${Math.round(row.itemCost).toLocaleString()}</td>
            <td>${Math.round(row.respect).toLocaleString()}</td>
          </tr>
        `;
      })
      .join("");
  }

  function getWeek(timestamp) {
    const period = getWeekPeriod(timestamp);
    return period === getWeekPeriod(toTimestamp(new Date()))
      ? `${period} (uncomplete)`
      : period;
  }

  function getWeekPeriod(timestamp) {
    const date = new Date(timestamp * 1000);
    const thursday = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
    thursday.setUTCDate(
      thursday.getUTCDate() + 4 - (thursday.getUTCDay() || 7),
    );

    const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((thursday - yearStart) / 86400000 + 1) / 7);
    return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
  }

  function getMonth(timestamp) {
    const period = getMonthPeriod(timestamp);
    return period === getMonthPeriod(toTimestamp(new Date()))
      ? `${period} (uncomplete)`
      : period;
  }

  function getMonthPeriod(timestamp) {
    const date = new Date(timestamp * 1000);
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  }

  function toTimestamp(date) {
    return Math.floor(date.getTime() / 1000);
  }

  function setStatus(message) {
    document.getElementById("oc2Status").textContent = message;
  }

  function getJson(url, options = {}) {
    const request = getTampermonkeyRequest();

    if (!request) {
      return fetch(url, options).then((response) => response.json());
    }

    return new Promise((resolve, reject) => {
      request({
        method: "GET",
        url,
        headers: options.headers || {},
        responseType: "json",
        onload: (response) => {
          if (response.status < 200 || response.status >= 300) {
            reject(new Error(`Request failed with status ${response.status}.`));
            return;
          }

          resolve(
            response.response || JSON.parse(response.responseText || "{}"),
          );
        },
        onerror: () => reject(new Error("Network request failed.")),
      });
    });
  }

  function getTampermonkeyRequest() {
    if (typeof GM !== "undefined" && GM.xmlHttpRequest) {
      return GM.xmlHttpRequest;
    }

    if (typeof GM_xmlhttpRequest !== "undefined") {
      return GM_xmlhttpRequest;
    }

    return null;
  }
})();
