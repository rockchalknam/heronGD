/* Classroom Lock - VRMS edition
   Replaces the original sitelock.js.
   Instead of redirecting blocked sites to Discord, this blocks ALL
   navigation away from the game. Students stay in the game, period. */
(() => {
    "use strict";

    function isSameOrigin(url) {
        try {
            return new URL(url, location.href).origin === location.origin;
        } catch {
            return false;
        }
    }

    /* Kill window.open to external sites */
    const originalWindowOpen = window.open;
    window.open = function (url, ...args) {
        if (url && !isSameOrigin(url)) {
            console.warn("[ClassroomLock] Blocked window.open:", url);
            return null;
        }
        return originalWindowOpen.call(window, url, ...args);
    };

    /* Kill Unity Application.OpenURL to external sites */
    if (window.Application && window.Application.OpenURL) {
        const originalAppOpen = window.Application.OpenURL;
        window.Application.OpenURL = function (url) {
            if (url && !isSameOrigin(url)) {
                console.warn("[ClassroomLock] Blocked OpenURL:", url);
                return;
            }
            return originalAppOpen.call(window.Application, url);
        };
    }

    /* Block external <a> clicks (covers injected "more games" links) */
    document.addEventListener("click", (event) => {
        const link = event.target.closest("a[href]");
        if (!link) return;
        if (!isSameOrigin(link.href)) {
            event.preventDefault();
            console.warn("[ClassroomLock] Blocked link:", link.href);
        }
    }, true);

    /* Block location.href redirects to external sites */
    const locationProto = Object.getPrototypeOf(window.location);
    try {
        Object.defineProperty(locationProto, "href", {
            set(url) {
                if (!isSameOrigin(url)) {
                    console.warn("[ClassroomLock] Blocked redirect:", url);
                    return;
                }
                window.location.assign(url);
            }
        });
    } catch (e) {
        /* Some browsers lock this down. Fine, the other guards still hold. */
    }

    /* Neutralize iframe popup trick from the original script */
    const originalCreateElement = document.createElement;
    document.createElement = function (tagName) {
        const element = originalCreateElement.call(document, tagName);
        if (String(tagName).toLowerCase() === "iframe") {
            Object.defineProperty(element, "contentWindow", {
                get() {
                    return { open: () => null };
                }
            });
        }
        return element;
    };
})();
