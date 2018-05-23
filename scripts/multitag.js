function add_search_bar() {
    let input = document.createElement("input");
    input.type = "button";
    input.id = "multitag_search";
    input.className = "ui-button ui-widget ui-corner-all tiny gradient";
    input.value = "Multi-tag search";
    input.addEventListener("click", multitag_search);

    $("#search-box").append(input);
}

var initial_tags = [];
var extra_tags = [];
var page_index = 0;
var max_posts = 0;

function multitag_search() {
    const tags = document.getElementById("tags").value.trim().split(" ");

    if (tags.length == 1 && tags[0] === "") {
        console.info("No tags to search!");

        return;
    }

    if (tags.length <= 2) {
        console.info("Using default search");

        $("#search-box input[type='submit']").click();

        return;
    }

    console.info("Got tags:", tags);

    $("#posts").empty();

    initial_tags = tags.slice(0, 2);
    extra_tags = tags.slice(2);

    $.ajax({
        type: "GET",
        url: "https://danbooru.donmai.us/counts/posts.json?tags=" + initial_tags.join("+"),
        dataType: "json"
    }).done(async function(data) {
        max_posts = data.counts.posts;
        console.info("Got", max_posts, "posts for tags:", initial_tags.join(", "));

        load_additional();
    });

    $(window).scroll(function() {
        if ($(window).scrollTop() + $(window).height() == $(document).height()) {
            console.info("Reached bottom, loading more");
            load_additional();
        }
    })
}

async function load_additional() {
    let posts_added = 0;

    while (posts_added < 30) {
        if (page_index  * 50 > max_posts) {
            console.info("Aborted page", page_index);
    
            $(window).off("scroll");
    
            return;
        }

        console.info("Got total of", posts_added, "posts, loading next page");
        let new_posts = await load_page_for_tags(initial_tags, page_index++);
        let matching_posts = have_tags(extra_tags, new_posts);

        console.info("Picked out", matching_posts.length, "post with tags:", extra_tags.join(", "));

        add_posts(matching_posts);

        reload_settings();
        
        posts_added += matching_posts.length;
    }
}

function add_posts(posts) {
    for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        let article = document.createElement("article");
        article.className = "post-preview";

        let link = document.createElement("a");
        link.href = "/posts/" + post.id;
        link.target = "_blank";

        let img = document.createElement("img");
        img.src = post.preview_file_url;
        img.alt = post.tag_string;
        img.title = post.tag_string;

        let extras = document.createElement("div");
        extras.className = "awoo awoo-extras";

        let preview = document.createElement("a");
        preview.className = "awoo-preview";
        preview.innerHTML = "Preview";
        preview.dataset.preview = post.large_file_url;
        preview.dataset.url = post.file_url;
        preview.dataset.md5 = post.md5;
        preview.dataset.ext = post.file_ext;
        preview.dataset.width = post.image_width;
        preview.dataset.height = post.image_height;
        preview.dataset.id = post.id;

        preview.addEventListener("click", (e) => {
            if ($(e.target.parentElement).find(".modal[id^='awoo-preview-modal']").length < 1) {
                let img = document.createElement("img");
                img.className = "awoo";
                img.src = e.target.dataset.preview;
    
                let modal = generate_modal({
                    title: `<a href="${e.target.dataset.url}" 
                                download="${e.target.dataset.md5 + "." + e.target.dataset.ext}">
                                ${e.target.dataset.md5 + "." + e.target.dataset.ext}</a> 
                                (${e.target.dataset.width + " x " + e.target.dataset.height})`,
                    id: "awoo-preview-modal-" + e.target.dataset.id
                });
    
                $(modal).find(".modal-body").append(img);
    
                e.target.parentElement.appendChild(modal);
            }

            $("#awoo-preview-modal-" + e.target.dataset.id).modal();
        });

        let sep0 = document.createElement("span");
        sep0.className = "awoo-sep0";
        sep0.innerHTML = "|";

        let download = document.createElement("a");
        download.className = "awoo-download";
        download.innerHTML = "Download";
        download.href = post.file_url;
        download.download = post.md5 + "." + post.file_ext;

        extras.appendChild(preview);
        extras.appendChild(sep0);
        extras.appendChild(download);

        link.appendChild(img);
        article.appendChild(link);
        article.appendChild(extras);
        document.getElementById("posts").appendChild(article);
    }
}

function have_tags(tags, search) {
    let ret = [];

    for (let i = 0; i < search.length; i++) {
        if (has_tags(tags, search[i].tag_string)) {
            ret.push(search[i]);
        }
    }

    return ret;
}

function has_tags(tags, search) {
    for (let i = 0; i < tags.length; i++) {
        if (!search.includes(tags[i])) {
            return false;
        }
    }

    return true;
}

function load_page_for_tags(tags, page) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            type: "GET",
            url: "https://danbooru.donmai.us/posts.json?tags=" + encodeURIComponent(tags.join("+")).replace("%2B", "+") + "&page=" + page + "&limit=50",
            dataType: "json",
            beforeSend: function(xhr, settings) {
                console.info("Loading page", page, "for tags", tags.join(", "), "with settings", settings)
            },
            success: resolve
        });
    });
}

if (document.location.pathname === "/posts" || document.location.pathname === "/") {
    add_search_bar();
}