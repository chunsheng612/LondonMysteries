const CACHE_NAME = "london-mysteries-shell-v9";
const ASSET_VERSION = "20260501-gameflow2";
const CORE_ASSETS = [
    "./",
    "./index.html",
    `./manifest.webmanifest?v=${ASSET_VERSION}`,
    `./css/style.css?v=${ASSET_VERSION}`,
    `./js/app.js?v=${ASSET_VERSION}`,
    `./js/audio.js?v=${ASSET_VERSION}`,
    `./js/pwa.js?v=${ASSET_VERSION}`,
    `./js/firebase-config.js?v=${ASSET_VERSION}`,
    `./js/firebase-auth.js?v=${ASSET_VERSION}`,
    `./js/firebase-save.js?v=${ASSET_VERSION}`,
    "./assets/bg_boot_industrial.png",
    "./assets/bg_detective_office.png",
    "./assets/bg_chapter_1.png",
    "./assets/bg_chapter_2.png",
    "./assets/bg_chapter_3.png",
    "./assets/bg_chapter_4.png",
    "./assets/bg_chapter_5.png",
    "./assets/char_alchemist.png",
    "./assets/char_mentor.png",
    "./assets/char_scout.png",
    "./assets/char_broker.png",
    "./assets/char_rival.png",
    "./assets/char_client.png",
    "./assets/chars/female_stage1.png",
    "./assets/chars/female_stage2.png",
    "./assets/chars/female_stage3.png",
    "./assets/chars/male_stage1.png",
    "./assets/chars/male_stage2.png",
    "./assets/chars/male_stage3.png",
    "./assets/icons/coin.png",
    "./assets/icons/star.png",
    "./assets/icons/ui_casefile.png",
    "./assets/icons/ui_monster_codex.png",
    "./assets/icons/ui_audio.png",
    "./assets/icons/nav_home.png",
    "./assets/icons/nav_shop.png",
    "./assets/icons/nav_story.png",
    "./assets/icons/nav_daily.png",
    "./assets/icons/nav_inventory.png",
    "./assets/icons/nav_settings.png",
    "./assets/icons/potion_blue.png",
    "./assets/icons/potion_green.png",
    "./assets/icons/potion_purple.png",
    "./assets/icons/potion_red.png",
    "./assets/icons/potion_yellow.png",
    "./assets/enemies/starry_slime.png",
    "./assets/enemies/cinder_fox.png",
    "./assets/enemies/leafy_dragon.png",
    "./assets/enemies/moonlight_owl.png",
    "./assets/enemies/solar_sprite.png",
    "./assets/enemies/mist_jellyfish.png",
    "./assets/enemies/crystal_turtle.png",
    "./assets/enemies/shadow_cat.png",
    "./assets/enemies/clockwork_bird.png",
    "./assets/enemies/cloud_sheep.png",
    "./assets/enemies/enemies.png",
    "./assets/pwa/apple-touch-icon.png",
    "./assets/pwa/icon-192.png",
    "./assets/pwa/icon-512.png"
];

async function cacheCoreAssets(cache) {
    const results = await Promise.allSettled(
        CORE_ASSETS.map((assetUrl) => cache.add(assetUrl))
    );

    results.forEach((result, index) => {
        if (result.status === "rejected") {
            console.warn("[SW] Core asset cache skipped:", CORE_ASSETS[index], result.reason);
        }
    });
}

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cacheCoreAssets).then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const { request } = event;

    if (request.method !== "GET") return;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    const isDocument = request.mode === "navigate";
    const isVersionSensitiveAsset = ["script", "style", "manifest", "worker"].includes(request.destination);

    if (isDocument) {
        event.respondWith(
            fetch(request, { cache: "reload" })
                .then((response) => {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy));
                    return response;
                })
                .catch(() => caches.match("./index.html"))
        );
        return;
    }

    if (isVersionSensitiveAsset) {
        event.respondWith(
            fetch(request, { cache: "reload" })
                .then((response) => {
                    if (!response || response.status !== 200) return response;
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    return response;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;

            return fetch(request).then((response) => {
                if (!response || response.status !== 200) return response;
                const copy = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                return response;
            });
        })
    );
});
