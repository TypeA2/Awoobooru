"use strict";

/** @returns HTMLElement | null */
function id(name) {
    return document.getElementById(name);
}

/** @returns NodeListOf<any> */
function query(str) {
    return document.querySelectorAll(str);
}

/** @returns Promise */
function ensure_post_data(target) {
    if (!target.dataset.humanFile) {
        console.info("Retrieving post data for", parseInt(target.dataset.id));
        return fetch(`https://danbooru.donmai.us/posts/${target.dataset.id}`)
            .then((response) => response.text())
            .then((html) => {
                let doc = new DOMParser().parseFromString(html, "text/html");
                const download = doc.querySelector("#post-option-download > a");

                target.dataset.humanFile = download.href;
                target.dataset.humanFileName = download.download;

                const img = doc.getElementById("image");
                target.dataset.displayFile = img.src;
                target.dataset.displayType = img.tagName.toLowerCase();

                const size = doc.getElementById("post-info-size");
                const size_text = size.childNodes[1].innerHTML;
                target.dataset.fileSize = size_text.substr(0, size_text.lastIndexOf(" "));
                target.dataset.fileType = size_text.substr(size_text.lastIndexOf(" "));

                let image_size_match = size.childNodes[2].textContent.match(/\((\d+)x(\d+)\)/);
                target.dataset.imageWidth = image_size_match[1];
                target.dataset.imageHeight = image_size_match[2];
            });
    } else {
        return Promise.resolve();
    }
}

function Awoobooru() {
    console.info("Awooo!");

    if (window.location.pathname == "/posts") {
        query("#posts article").forEach((post) => {
            let extras = document.createElement("div");
            extras.className = "awoo awoo-extras";

            let preview = document.createElement("a");
            preview.className = "awoo-preview";
            preview.innerHTML = "Preview";

            preview.addEventListener("click", (e) => {
                let post = e.target.parentElement.parentElement;
                ensure_post_data(post)
                    .then(_ => {
                        if (!post.modal) {
                            let display = document.createElement(post.dataset.displayType);
                            display.className = "awoo";
                            display.src = post.dataset.displayFile;

                            if (post.dataset.displayType == "video") {
                                display.loop = "loop";
                                display.controls = "controls";
                            }

                            let title = document.createElement("span");

                            let title_post_link = document.createElement("a");
                            title_post_link.target = "_blank";
                            title_post_link.href = `https://danbooru.donmai.us/posts/${post.dataset.id}`;
                            title_post_link.innerHTML = `#${post.dataset.id}`;

                            let title_link = document.createElement("a");
                            title_link.href = post.dataset.humanFile;
                            title_link.download = post.dataset.humanFileName;
                            title_link.innerHTML = post.dataset.humanFileName;

                            let title_extra = document.createTextNode(` ${post.dataset.fileSize} (${post.dataset.imageWidth + " x " + post.dataset.imageHeight})`);

                            title.appendChild(document.createTextNode("Post "));
                            title.appendChild(title_post_link);
                            title.appendChild(document.createTextNode(" | "));
                            title.appendChild(title_link);
                            title.appendChild(title_extra);
                
                            let modal = generate_modal({
                                title: title,
                                id: `awoo-preview-modal-${post.dataset.id}`,
                                body: display
                            });

                            modal.addEventListener("shown.bs.modal", _ => {
                                post.dataset.shown = true;
                                if (post.dataset.displayType == "video") {
                                    display.play();
                                }
                            });

                            modal.addEventListener("hide.bs.modal", _ => {
                                post.dataset.shown = false;
                                if (post.dataset.displayType == "video") {
                                    display.pause();
                                }
                            });

                            e.target.parentElement.appendChild(modal);

                            post.modal = new bootstrap.Modal(modal);
                            console.log(post.modal);
                        }

                        post.modal.show();
                    })
                
            });

            let sep0 = document.createElement("span");
            sep0.className = "awoo-sep0";
            sep0.innerHTML = "&nbsp;|&nbsp;";

            let download = document.createElement("a");
            download.className = "awoo-download";
            download.innerHTML = "Download";
            download.addEventListener("click", (e) => {
                let post = e.target.parentElement.parentElement;
                ensure_post_data(post)
                    .then(_ => {
                        if (!e.target.href) {
                            e.target.href = post.dataset.humanFile;
                            e.target.download = post.dataset.humanFileName;
                            e.target.click();
                        }
                    });
            });

            extras.appendChild(preview);
            extras.appendChild(sep0);
            extras.appendChild(download);

            post.appendChild(extras);
        });
    }

    reload_settings(null);
}

function generate_modal(options = {}) {
    let root = document.createElement("div");
    root.className = "modal";
    if (options.id) {
        root.id = options.id;
    }

    let dialog = document.createElement("div");
    dialog.className = "modal-dialog";

    let content = document.createElement("div");
    content.className = "modal-content";

    let header = document.createElement("div");
    header.className = "modal-header";

    let title = document.createElement("h6");
    title.class = "modal-title";
    if (options.title) {
        title.appendChild(options.title);
    }
    
    let close = document.createElement("button");
    close.className = "btn-close"
    close.type = "button";
    close.dataset.bsDismiss = "modal";

    header.appendChild(title);
    header.appendChild(close);

    content.appendChild(header);

    let body = document.createElement("div");
    body.className = "modal-body";

    if (options.body) {
        body.appendChild(options.body);
    }

    content.appendChild(body);
    dialog.appendChild(content);
    root.appendChild(dialog);

    return root;
}

function set_class_for_query(str, cls, condition) {
    if (condition) {
        query(str).forEach(e => e.classList.add(cls))
    } else {
        query(str).forEach(e => e.classList.remove(cls));
    }
}

function reload_settings(settings) {
    chrome.storage.sync.get(
    settings,
    function(items) {
        console.info("(Re)loaded settings:", items);

        set_class_for_query("body", "dark", items.dark_theme);
        if (window.location.pathname == "/posts") {
            set_class_for_query(".awoo-extras", "awoo-enabled", items.preview_button || items.download_button);
            set_class_for_query(".awoo-preview", "awoo-shown", items.preview_button);
            set_class_for_query(".awoo-download", "awoo-shown", items.download_button);
            set_class_for_query(".awoo-sep0", "awoo-shown", items.preview_button && items.download_button);
        } else if (window.location.pathname.match(/\/posts\/\d.+/)) {
            if (items.extra_dl_link) {
                let btn = query("#post-options a[download]")[0].cloneNode(true);
                btn.classList.add("awoo-dl-btn");
                
                id("tag-list").prepend(btn);
            } else {
                query(".awoo-dl-btn").forEach(e => e.remove());
            }
        }
    });
}

chrome.runtime.onMessage.addListener(function(message, sender, reply) {
    if (message.name === "reload_settings") {
        reload_settings(message.settings);
    }
})

Awoobooru();
