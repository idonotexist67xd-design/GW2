const plugin = {
    id: "giantessworld",
    name: "GiantessWorld",
    site: "https://giantessworld.net",
    version: "1.0.1",
    lang: "English",
    icon: "https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/book/default/48px.svg",

    popularNovels: function(page) {
        return fetch(this.site + "/browse.php?type=recent&page=" + page)
            .then(function(res) { return res.text(); })
            .then(function(text) {
                var novels = [];
                var regex = /href="(viewstory\.php\?sid=(\d+))"[^>]*><b>(.*?)<\/b>/g;
                var match;
                while ((match = regex.exec(text)) !== null) {
                    novels.push({
                        name: match[3].replace(/<[^>]*>/g, "").trim(),
                        path: match[1],
                        cover: "https://giantessworld.net/images/no_cover.png"
                    });
                }
                return novels;
            });
    },

    parseNovel: function(novelPath) {
        return fetch(this.site + "/" + novelPath + "&index=1")
            .then(function(res) { return res.text(); })
            .then(function(text) {
                var novel = {
                    path: novelPath,
                    name: "Story",
                    cover: "https://giantessworld.net/images/no_cover.png",
                    summary: "No summary available",
                    author: "Unknown",
                    chapters: []
                };

                var regex = /href="(viewchapter\.php\?id=\d+))"[^>]*>(.*?)<\/a>/g;
                var match;
                var index = 1;
                while ((match = regex.exec(text)) !== null) {
                    novel.chapters.push({
                        name: match[3].trim(),
                        path: match[1],
                        chapterNumber: index++
                    });
                }
                return novel;
            });
    },

    parseChapter: function(chapterPath) {
        return fetch(this.site + "/" + chapterPath)
            .then(function(res) { return res.text(); })
            .then(function(text) {
                var startIdx = text.indexOf('<td align="left" valign="top">');
                if (startIdx !== -1) {
                    var endIdx = text.indexOf('</td>', startIdx);
                    var html = text.substring(startIdx, endIdx);
                    return html.replace(/<script[\s\S]*?<\/script>/gi, "")
                               .replace(/<style[\s\S]*?<\/style>/gi, "")
                               .replace(/<br\s*\/?>/gi, "\n")
                               .replace(/<[^>]+>/g, "").trim();
                }
                return "Could not load chapter content.";
            });
    },

    searchNovels: function(term) {
        return fetch(this.site + "/search.php?search=" + encodeURIComponent(term))
            .then(function(res) { return res.text(); })
            .then(function(text) {
                var novels = [];
                var regex = /href="(viewstory\.php\?sid=(\d+))"[^>]*><b>(.*?)<\/b>/g;
                var match;
                while ((match = regex.exec(text)) !== null) {
                    novels.push({
                        name: match[3].trim(),
                        path: match[1],
                        cover: "https://giantessworld.net/images/no_cover.png"
                    });
                }
                return novels;
            });
    }
};

export default plugin;
