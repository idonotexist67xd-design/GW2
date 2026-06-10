"use strict";
const fetch_1 = require("@libs/fetch");
const cheerio_1 = require("cheerio");
const defaultCover_1 = require("@libs/defaultCover");

class GiantessWorldPlugin {
    constructor() {
        this.id = 'giantessworld';
        this.name = 'GiantessWorld';
        this.icon = 'https://giantessworld.net/favicon.ico';
        this.site = 'https://giantessworld.net';
        this.version = '3.1.0';
    }

    resolveUrl(path) {
        let cleanPath = path || '';
        if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);
        return `${this.site}/${cleanPath}`;
    }

    extractNovels($) {
        const novels = [];
        const seen = new Set();
        $('a[href*="viewstory.php?sid="]').each((_, el) => {
            const name = $(el).text().trim();
            let href = $(el).attr('href') || '';
            if (!href || !name) return;
            if (name.toLowerCase().includes('reviews') || name.toLowerCase().includes('table of contents')) return;

            let cleanPath = href.replace(/https?:\/\/giantessworld\.net/, '').replace(/^\/+/, '');
            if (cleanPath.includes('&')) cleanPath = cleanPath.split('&')[0];

            if (seen.has(cleanPath)) return;
            seen.add(cleanPath);

            novels.push({
                name: name,
                path: cleanPath,
                cover: defaultCover_1.defaultCover,
            });
        });
        return novels;
    }

    async popularNovels(pageNo) {
        const url = `${this.site}/browse.php?type=recent&page=${pageNo}`;
        const html = await (0, fetch_1.fetchText)(url);
        const $ = (0, cheerio_1.load)(html);
        return this.extractNovels($);
    }

    async parseNovel(novelPath) {
        let url = this.resolveUrl(novelPath);
        if (!url.includes('index=1')) {
            url += (url.includes('?') ? '&' : '?') + 'index=1';
        }

        const html = await (0, fetch_1.fetchText)(url);
        const $ = (0, cheerio_1.load)(html);

        const title = $('h1').first().text().trim() || $('.story-title a').first().text().trim() || 'Sin título';
        const author = $('a[href*="viewuser.php"]').first().text().trim() || 'Desconocido';
        const summary = $('td:contains("Summary"), .content, .summary').first().text().trim() || 'Sin resumen';

        const novel = {
            path: novelPath,
            name: title,
            author: author,
            cover: defaultCover_1.defaultCover,
            summary: summary,
            chapters: []
        };

        // Mejor extracción de capítulos (TOC)
        $('a[href*="viewchapter.php"], a[href*="viewstory.php?sid="][href*="chapter="]').each((_, el) => {
            const name = $(el).text().trim();
            const href = $(el).attr('href') || '';
            if (name && href && !name.toLowerCase().includes('table of contents')) {
                novel.chapters.push({
                    name: name,
                    path: href.replace(/https?:\/\/giantessworld\.net/, ''),
                    chapterNumber: novel.chapters.length + 1,
                    releaseTime: ''
                });
            }
        });

        // Fallback con select si existe
        if (novel.chapters.length === 0) {
            $('select[name="chapter"] option').each((_, el) => {
                const value = $(el).attr('value');
                const name = $(el).text().trim();
                if (value && name) {
                    novel.chapters.push({
                        name: name,
                        path: `${novelPath}&chapter=${value}`,
                        chapterNumber: parseInt(value) || novel.chapters.length + 1
                    });
                }
            });
        }

        return novel;
    }

    async parseChapter(chapterPath) {
        const url = this.resolveUrl(chapterPath);
        const html = await (0, fetch_1.fetchText)(url);
        const $ = (0, cheerio_1.load)(html);

        // Selectores mejorados para el texto del capítulo
        let content = '';
        const selectors = [
            '#story', 
            '.content', 
            'td[align="left"]', 
            'td[valign="top"]',
            '.chapter-content',
            'body'
        ];

        for (const sel of selectors) {
            const el = $(sel);
            if (el.length && el.text().trim().length > 100) {
                content = el.html() || el.text();
                break;
            }
        }

        // Limpieza fuerte
        content = content
            .replace(/<script.*?<\/script>/gis, '')
            .replace(/<style.*?<\/style>/gis, '')
            .replace(/<a[^>]*>(.*?)<\/a>/gi, '$1')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/?(p|div|h[1-6]|li)[^>]*>/gi, '\n')
            .replace(/\n\s+/g, '\n\n')
            .trim();

        return content || 'No se pudo extraer el texto del capítulo. Prueba abrir en WebView.';
    }

    async searchNovels(searchTerm, pageNo = 1) {
        const url = `${this.site}/search.php?search=${encodeURIComponent(searchTerm)}`;
        const html = await (0, fetch_1.fetchText)(url);
        const $ = (0, cheerio_1.load)(html);
        return this.extractNovels($);
    }
}

exports.GiantessWorldPlugin = GiantessWorldPlugin;
const pluginInstance = new GiantessWorldPlugin();
exports.default = pluginInstance;
