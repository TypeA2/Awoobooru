"use strict";

/** @returns HTMLElement | null */
function id(name) {
    return document.getElementById(name);
}

/** @returns NodeListOf<any> */
function query(str) {
    return document.querySelectorAll(str);
}

function save() {
    if (id("dark_switch").checked) {
        id("darkmode_state").innerHTML = "enabled";

        document.body.classList.add("awoo-dark");
    } else {
        id("darkmode_state").innerHTML = "disabled";

        document.body.classList.remove("awoo-dark");
    }

    let settings = {};
    query(".switch input").forEach(e => settings[e.dataset.settingName] = e.checked);

    browser.storage.sync.set(settings);
}

function load() {
    let settings = {};
    query(".switch input").forEach(e => settings[e.dataset.settingName] = false);

    browser.storage.sync.get(
        settings,
        function(items) {
            console.info("Loaded settings");
            console.info(items);

            Object.entries(items).forEach(
                ([key, val]) => {
                    query("input[data-setting-name='" + key + "']")[0].checked = val;
                }
            );

            save();
        });
}

function toggle_switch(e) {
    save();

    let settings = {};
    query(".switch input").forEach(e => settings[e.dataset.settingName] = e.checked);

    browser.tabs.query(
        {
            active: true,
            currentWindow: true,
            url: "*://*.donmai.us/*"
        },
        function (tabs) {
            if (tabs.length) {
                browser.tabs.sendMessage(
                    tabs[0].id,
                    {
                        name: "reload_settings",
                        settings_list: settings
                    }
                );
            }
        }
    )
}

function ready(cb) {
    if (document.readyState != "loading") {
        cb();
    } else {
        document.addEventListener("DOMContentLoaded", cb);
    }
}

ready(function() {
    query(".switch input").forEach(e => e.addEventListener("input", toggle_switch));

    load();
});
