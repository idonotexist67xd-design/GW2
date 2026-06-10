"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

var fetchModule = require("@libs/fetch");
var defaultCoverModule = require("@libs/defaultCover");

var GiantessWorldPlugin = /** @class */ (function () {
    function GiantessWorldPlugin() {
        this.id = "giantessworld";
        this.name = "GiantessWorld";
        this.icon = "https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/book/default/48px.svg";
        this.site = "https://giantessworld.net";
        this.version = "2.1.0";
    }

    // Listado principal (Explorar / Populares)
    GiantessWorldPlugin.prototype.popularNovels = function (pageNo) {
        return fetchModule.fetchText(this.site + "/browse.php?type=recent&page=" + pageNo)
            .then(function (html) {
                var novels = [];
                // Regex para cazar enlaces viewstory.php?sid=XXX y el título en negrita
                var regex = /href="(viewstory\.php\?sid=(\d+))"[^>]*><b>(.*?)<\/b>/g;
                var match;
                while ((match = regex.exec(html)) !== null) {
                    var title = match[3].replace(/<[^>]*>/g, "").trim();
                    if (title) {
                        novels.push({
                            name: title,
                            path: match[1], // "viewstory.php?sid=XXX"
                            cover: defaultCoverModule.defaultCover
                        });
                    }
                }
                return novels;
            });
    };

    // Detalle de la Novela + Lista de Capítulos
    GiantessWorldPlugin.prototype.parseNovel = function (novelPath) {
        var _this = this;
        // Forzamos index=1 para asegurarnos de que liste los capítulos si es multi-página
        var url = this.site + "/" + novelPath + "&index=1";
        return fetchModule.fetchText(url)
            .then(function (html) {
                var novel = {
                    path: novelPath,
                    name: "Story Details",
                    cover: defaultCoverModule.defaultCover,
                    summary: "No summary available.",
                    author: "Unknown",
                    chapters: []
                };

                // Intentar extraer un título mejor desde el HTML si es posible
                var titleMatch = html.match(/<td class="title">(.*?)<\/td>/i);
                if (titleMatch) {
                    novel.name = titleMatch[1].replace(/<[^>]*>/g, "").trim();
                }

                // Intentar extraer autor
                var authorMatch = html.match(/by\s*<a[^>]*>(.*?)<\/a>/i);
                if (authorMatch) {
                    novel.author = authorMatch[1].trim();
                }

                // Buscar capítulos dinámicos (viewchapter.php?id=XXX)
                var regex = /href="(viewchapter\.php\?id=(\d+))"[^>]*>(.*?)<\/a>/g;
                var match;
                var index = 1;
                while ((match = regex.exec(html)) !== null) {
                    novel.chapters.push({
                        name: match[3].replace(/<[^>]*>/g, "").trim(),
                        path: match[1],
                        chapterNumber: index++,
                        releaseTime: ""
                    });
                }

                // Si no tiene capítulos listados (es un "one-shot" de un solo capítulo independiente)
                if (novel.chapters.length === 0) {
                    novel.chapters.push({
                        name: "Chapter 1",
                        path: novelPath.replace("viewstory.php", "viewchapter.php"), 
                        chapterNumber: 1,
                        releaseTime: ""
                    });
                }

                return novel;
            });
    };

    // Contenido del capítulo
    GiantessWorldPlugin.prototype.parseChapter = function (chapterPath) {
        var url = this.site + "/" + chapterPath;
        return fetchModule.fetchText(url)
            .then(function (html) {
                var startIdx = html.indexOf('<td align="left" valign="top">');
                var chapterText = "";

                if (startIdx !== -1) {
                    var endIdx = html.indexOf('</td>', startIdx);
                    var storyHtml = html.substring(startIdx, endIdx);
                    
                    // Limpieza del HTML para dejar texto plano legible o saltos básicos
                    chapterText = storyHtml
                        .replace(/<script[\s\S]*?<\/script>/gi, "")
                        .replace(/<style[\s\S]*?<\/style>/gi, "")
                        .replace(/<br\s*\/?>/gi, "\n")
                        .replace(/<[^>]+>/g, "")
                        .trim();
                }

                if (!chapterText) {
                    chapterText = "Could not parse chapter text. Please open in WebView.";
                }

                // Tsundoku/LNReader suele pedir un string directo o un objeto con la propiedad
                return chapterText;
            });
    };

    // Buscador
    GiantessWorldPlugin.prototype.searchNovels = function (searchTerm, pageNo) {
        var url = this.site + "/search.php?search=" + encodeURIComponent(searchTerm) + "&page=" + pageNo;
        return fetchModule.fetchText(url)
            .then(function (html) {
                var novels = [];
                var regex = /href="(viewstory\.php\?sid=(\d+))"[^>]*><b>(.*?)<\/b>/g;
                var match;
                while ((match = regex.exec(html)) !== null) {
                    novels.push({
                        name: match[3].replace(/<[^>]*>/g, "").trim(),
                        path: match[1],
                        cover: defaultCoverModule.defaultCover
                    });
                }
                return novels;
            });
    };

    return GiantessWorldPlugin;
}());

exports.GiantessWorldPlugin = GiantessWorldPlugin;

var pluginInstance = new GiantessWorldPlugin();
exports.default = pluginInstance;
