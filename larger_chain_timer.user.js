// ==UserScript==
// @name         Larger chain timer
// @namespace    annosz.torn-usercripts.larger-chain-timer
// @version      1.0.3
// @description  Make chain timer bigger for better visibility
// @author       Annosz [2896714]
// @match        https://www.torn.com/*
// @updateURL    https://github.com/Annosz/torn-userscripts/raw/main/larger_chain_timer.user.js
// @downloadURL  https://github.com/Annosz/torn-userscripts/raw/main/larger_chain_timer.user.js
// @require      https://gist.github.com/raw/2625891/waitForKeyElements.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @grant        none
// ==/UserScript==

/* globals jQuery, $, waitForKeyElements */
waitForKeyElements(
    '[class*="bar-timeleft"], [class*="barTimeLeft"]',
    actionFunction
);

function actionFunction(jNode) {
    'use strict';

    const timeLeft = jNode?.jquery ? jNode[0] : jNode;
    if (!timeLeft) return;

    const barStats = timeLeft.parentElement;
    const chainBar = timeLeft.closest('a');
    const speed = chainBar?.querySelector('[class*="speed___"]');
    const tickList = chainBar?.querySelector('[class*="tickList___"]');

    if (timeLeft.textContent.trim() !== '00:00') {
        barStats.style.display = 'flex';
        barStats.style.flexWrap = 'wrap';

        timeLeft.style.fontSize = '60px';
        timeLeft.style.height = '62px';
        timeLeft.style.flexBasis = '100%';

        speed.style.top = 'unset';
        tickList.style.height = '8px';
    }
};
