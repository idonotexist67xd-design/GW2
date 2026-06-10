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

// Usamos el cliente fetch inyectado por Tsundoku
var fetchModule = require("@libs/fetch");
var defaultCoverModule = require("@libs/defaultCover");

var GiantessWorldPlugin = /** @class */ (function () {
    function GiantessWorldPlugin(config) {
        this.id = config.id;
        this.name = config.sourceName;
        this.site = config.sourceSite;
        this.version = "2.1.0";
        this.icon = "https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/book/default/48px.svg";
    }

    GiantessWorldPlugin.prototype.popularNovels = function (pageNo, t) {
        return __awaiter(this, void 0, void 0, function () {
            var url, html, novels, regex, match;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = this.site + "/browse.php?type=recent&page=" + pageNo;
                        return [4, (0, fetchModule.fetchText)(url)];
                    case 1:
                        html = _a.sent();
                        novels = [];
                        regex = /href="(viewstory\.php\?sid=(\d+))"[^>]*><b>(.*?)<\/b>/g;
                        while ((match = regex.exec(html)) !== null) {
                            novels.push({
                                name: match[3].replace(/<[^>]*>/g, "").trim(),
                                path: "/" + match[1],
                                cover: defaultCoverModule.defaultCover
                            });
                        }
                        return [2, novels];
                }
            });
        });
    };

    GiantessWorldPlugin.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var url, html, novel, regex, match, index;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = this.site + novelPath + "&index=1";
                        return [4, (0, fetchModule.fetchText)(url)];
                    case 1:
                        html = _a.sent();
                        novel = {
                            path: novelPath,
                            name: "Story Details",
                            cover: defaultCoverModule.defaultCover,
                            summary: "No summary available",
                            author: "Unknown",
                            chapters: []
                        };
                        regex = /href="(viewchapter\.php\?id=(\d+))"[^>]*>(.*?)<\/a>/g;
                        index = 1;
                        while ((match = regex.exec(html)) !== null) {
                            novel.chapters.push({
                                name: match[3].trim(),
                                path: "/" + match[1],
                                chapterNumber: index++,
                                releaseTime: ""
                            });
                        }
                        if (novel.chapters.length === 0) {
                            novel.chapters.push({
                                name: "Chapter 1",
                                path: novelPath + "&chapter=1",
                                chapterNumber: 1,
                                releaseTime: ""
                            });
                        }
                        return [2, novel];
                }
            });
        });
    };

    GiantessWorldPlugin.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var url, html, startIdx, endIdx, storyHtml;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = this.site + chapterPath;
                        return [4, (0, fetchModule.fetchText)(url)];
                    case 1:
                        html = _a.sent();
                        startIdx = html.indexOf('<td align="left" valign="top">');
                        if (startIdx !== -1) {
                            endIdx = html.indexOf('</td>', startIdx);
                            storyHtml = html.substring(startIdx, endIdx);
                            return [2, storyHtml.replace(/<script[\s\S]*?<\/script>/gi, "")
                                                 .replace(/<style[\s\S]*?<\/style>/gi, "")
                                                 .replace(/<br\s*\/?>/gi, "\n")
                                                 .replace(/<[^>]+>/g, "").trim()];
                        }
                        return [2, "Could not load chapter text."];
                }
            });
        });
    };

    GiantessWorldPlugin.prototype.searchNovels = function (searchTerm, pageNo) {
        return __awaiter(this, void 0, void 0, function () {
            var url, html, novels, regex, match;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = this.site + "/search.php?search=" + encodeURIComponent(searchTerm);
                        return [4, (0, fetchModule.fetchText)(url)];
                    case 1:
                        html = _a.sent();
                        novels = [];
                        regex = /href="(viewstory\.php\?sid=(\d+))"[^>]*><b>(.*?)<\/b>/g;
                        while ((match = regex.exec(html)) !== null) {
                            novels.push({
                                name: match[3].trim(),
                                path: "/" + match[1],
                                cover: defaultCoverModule.defaultCover
                            });
                        }
                        return [2, novels];
                }
            });
        });
    };

    return GiantessWorldPlugin;
}());

exports.GiantessWorldPlugin = GiantessWorldPlugin;

// Instanciación oficial calcada al final de tu ejemplo
var pluginInstance = new GiantessWorldPlugin({
    id: "giantessworld",
    sourceSite: "https://giantessworld.net",
    sourceName: "GiantessWorld"
});

exports.default = pluginInstance;
