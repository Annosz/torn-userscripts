// ==UserScript==
// @name         Larger chain timer
// @namespace    annosz.torn-usercripts.larger-chain-timer
// @version      1.0.1
// @description  Make chain timer bigger for better visibility
// @author       Annosz [2896714]
// @match        https://www.torn.com/*
// @updateURL    https://github.com/Annosz/torn-userscripts/raw/main/larger_chain_timer.user.js
// @downloadURL  https://github.com/Annosz/torn-userscripts/raw/main/larger_chain_timer.user.js
// @require      https://gist.github.com/raw/2625891/waitForKeyElements.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @grant        none
// ==/UserScript==

waitForKeyElements('[class^="speed"]', actionFunction);

function actionFunction(jNode) {
    'use strict';

    const timeLeft = document.querySelector('[class^="bar-timeleft"]');
    const speed = document.querySelector('[class^="speed"]');
    const tickList = document.querySelector('[class^="tick-list"]');
    const barStats = timeLeft.parentElement;

    barStats.style.display = "block";
    timeLeft.style.fontSize = "60px";
    timeLeft.style.height = "62px";
    speed.style.top = "unset";
    tickList.style.height = "8px";
};

