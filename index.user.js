// ==UserScript==
// @name         Precal thing
// @namespace    http://tampermonkey.net/
// @version      0.1.2
// @description  precal thing
// @author       You (not Watanabe)
// @match        https://www.desmos.com/calculator*
// @icon         https://www.google.com/s2/favicons?domain=desmos.com
// @grant        unsafeWindow
// @updateURL    https://github.com/Auriga05/graph-art-creator/raw/master/index.user.js
// @downloadURL  https://github.com/Auriga05/graph-art-creator/raw/master/index.user.js
// @require      https://code.jquery.com/jquery-3.5.1.slim.min.js
// @require      https://cdn.jsdelivr.net/npm/evaluatex@2.2.0/dist/evaluatex.min.js
// ==/UserScript==

    function includeJs(jsFilePath) {
        const js = document.createElement('script');

        js.type = 'text/javascript';
        js.src = jsFilePath;

        document.body.appendChild(js);
    }
    
    unsafeWindow.unsafeWindow = unsafeWindow
    unsafeWindow.evaluatex = evaluatex
    unsafeWindow.$ = $
    includeJs('https://cdn.jsdelivr.net/gh/Auriga05/graph-art-creator@master/index-experimental.user.js');