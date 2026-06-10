"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};

Object.defineProperty(exports, "__esModule", { value: true });
exports.GiantessWorldPlugin = void 0;

// Vinculación con las librerías nativas del core de Tsundoku
var fetch_1 = require("@libs/fetch");
var cheerio_1 = require("cheerio");
var defaultCover_1 = require("@libs/defaultCover");

var GiantessWorldPlugin = /** @class */ (function () {
    function GiantessWorldPlugin() {
        this.id = 'giantessworld';
        this.name = 'GiantessWorld';
        this.icon = '';
        this.site = 'https://giantessworld.net';
        this.version = '2.1.0';
    }

    GiantessWorldPlugin.prototype.resolveUrl = function (path) {
        return this.site + path;
    };

    // =========================
    // 📚 POPULAR (RECIENTES)
    // =========================
    GiantessWorldPlugin.prototype.popularNovels = function (pageNo) {
        return __awaiter(this, void 0, void 0, function () {
            var url, html, $, novels, _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = "".concat(this.site, "/browse.php?type=recent&page=").concat(pageNo);
                        return [4 /*yield*/, (0, fetch_1.fetchText)(url)];
                    case 1:
                        html = _a.sent();
                        $ = (0, cheerio_1.load)(html);
                        novels = [];
                        $('a[href*="viewstory.php?sid="]').each(function (_, el) {
                            var name = $(el).text().trim();
                            var href = $(el).attr('href');
                            if (!href || !name)
                                return;
                            novels.push({
                                name: name,
                                path: href.replace(_this.site, ''),
                                cover: defaultCover_1.defaultCover,
                            });
                        });
                        return [2 /*return*/, novels];
                }
            });
        });
    };

    // =========================
    // 📖 NOVEL PARSE (DETALLES)
    // =========================
    GiantessWorldPlugin.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var url, html, $, title, author, novel, chapters, options;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = this.resolveUrl(novelPath);
                        return [4 /*yield*/, (0, fetch_1.fetchText)(url)];
                    case 1:
                        html = _a.sent();
                        $ = (0, cheerio_1.load)(html);
                        title = $('#pagetitle a').first().text().trim() ||
                            $('title').text().split(' by ')[0].trim() ||
                            'Unknown Title';
                        author = $('#pagetitle a').eq(1).text().trim() || '';
                        novel = {
                            path: novelPath,
                            name: title,
                            author: author,
                            cover: defaultCover_1.defaultCover,
                            chapters: [],
                            summary: '',
                        };
                        chapters = [];
                        options = $('select[name="chapter"] option');
                        if (options.length > 0) {
                            options.each(function (_, el) {
                                var number = Number($(el).attr('value'));
                                var name = $(el).text().trim();
                                if (!number)
                                    return;
                                chapters.push({
                                    name: name,
                                    chapterNumber: number,
                                    path: "".concat(novelPath, "&textsize=0&chapter=").concat(number),
                                    releaseTime: '',
                                });
                            });
                        }
                        else {
                            // Fallback si es un One-Shot sin menú desplegable
                            chapters.push({
                                name: 'Chapter 1',
                                chapterNumber: 1,
                                path: novelPath,
                                releaseTime: '',
                            });
                        }
                        novel.chapters = chapters;
                        return [2 /*return*/, novel];
                }
            });
        });
    };

    // =========================
    // 📄 CHAPTER PARSE (TEXTO)
    // =========================
    GiantessWorldPlugin.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var url, html, $, story, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        url = this.resolveUrl(chapterPath);
                        return [4 /*yield*/, (0, fetch_1.fetchText)(url)];
                    case 1:
                        html = _b.sent();
                        $ = (0, cheerio_1.load)(html);
                        story = $('#story');
                        if (!story.length)
                            return [2 /*return*/, ''];
                        // Limpieza activa anti-basura HTML inyectada
                        story.find('script, style, iframe, noscript').remove();
                        return [2 /*return*/, (null === (_a = story.html()) || void 0 === _a ? void 0 : _a.trim()) || story.text().trim() || ''];
                }
            });
        });
    };

    // =========================
    // 🔍 SEARCH (BUSCADOR)
    // =========================
    GiantessWorldPlugin.prototype.searchNovels = function (searchTerm, pageNo) {
        return __awaiter(this, void 0, void 0, function () {
            var url, html, $, novels, seen, _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = "".concat(this.site, "/search.php?query=").concat(encodeURIComponent(searchTerm), "&page=").concat(pageNo);
                        return [4 /*yield*/, (0, fetch_1.fetchText)(url)];
                    case 1:
                        html = _a.sent();
                        $ = (0, cheerio_1.load)(html);
                        novels = [];
                        seen = new Set();
                        $('a[href*="viewstory.php?sid="]').each(function (_, el) {
                            var name = $(el).text().trim();
                            var href = $(el).attr('href');
                            if (!href || !name)
                                return;
                            if (seen.has(href))
                                return;
                            seen.add(href);
                            novels.push({
                                name: name,
                                path: href.replace(_this.site, ''),
                                cover: defaultCover_1.defaultCover,
                            });
                        });
                        return [2 /*return*/, novels];
                }
            });
        });
    };

    return GiantessWorldPlugin;
}());

exports.GiantessWorldPlugin = GiantessWorldPlugin;

// Exportación exacta compatible con el cargador de Tsundoku
var pluginInstance = new GiantessWorldPlugin();
exports.default = pluginInstance;
