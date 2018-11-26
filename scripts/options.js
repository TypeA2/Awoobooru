function save() {
    if ($("#dark_switch")[0].checked) {
        $("#darkmode_state").html("enabled");

        document.body.classList.add("dark");
    } else {
        $("#darkmode_state").html("disabled");

        document.body.classList.remove("dark");
    }

    let settings = {};

    for (let i = 0; i < $(".switch input").length; i++) {
        const current = $(".switch input")[i];

        settings[current.dataset.settingName] = current.checked;
    }

    browser.storage.sync.set(settings);
}

function load() {
    let settings = {};

    for (let i = 0; i < $(".switch input").length; i++) {
        settings[$(".switch input")[i].dataset.settingName] = false;
    }

    browser.storage.sync.get(
        settings,
        function(items) {
            console.info("Loaded settings");
            console.info(items);

            Object.entries(items).forEach(
                ([key, val]) => {
                    $("input[data-setting-name='" + key + "']")[0].checked = val;
                }
            );

            save();
        });
}

function toggle_switch(e) {
    save();

    let settings = {};

    for (let i = 0; i < $(".switch input").length; i++) {
        const current = $(".switch input")[i];

        settings[current.dataset.settingName] = current.checked;
    }

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

$(document).ready(function() {
    $(".switch input").on("input", toggle_switch);

    load();
});