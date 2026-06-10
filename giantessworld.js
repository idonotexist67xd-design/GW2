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
        this.version = '3.4.0';
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

        // Selectores más precisos para GiantessWorld
        let storyContainer = 
            $('#story') ||
            $('.listbox .content') ||
            $('td[align="left"][valign="top"]') ||
            $('td[valign="top"]').has('br').first() ||
            $('div').filter((i, el) => {
                return $(el).text().length > 300 && 
                       $(el).find('br').length > 3;
            }).first();

        if (!storyContainer || !storyContainer.length) {
            // Último intento amplio pero inteligente
            storyContainer = $('body').clone();
            // Eliminar elementos no deseados
            storyContainer.find('header, nav, footer, .menu, #menu, form, select, input, script, style, iframe, .ad, .sidebar').remove();
        }

        // Limpieza muy fuerte
        storyContainer.find('script, style, iframe, noscript, select, form, .label, #ad, header, nav, footer').remove();

        let text = storyContainer.html() || storyContainer.text() || '';

        text = text
            .replace(/Home|Register|Login|Featured Stories|Most Recent|Browse|Old Archive|Writing Tools|Images|Search|Help/gi, '')
            .replace(/Penname:|Password:|Remember Me|Disclaimer:/gi, '')
            .replace(/<script.*?<\/script>/gis, '')
            .replace(/<style.*?<\/style>/gis, '')
            .replace(/<a[^>]*>(.*?)<\/a>/gi, '$1')
            .replace(/<br\s*\/?>/gi, '\n\n')
            .replace(/<\/?(p|div|h[1-6]|li|ul|ol)[^>]*>/gi, '\n\n')
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            .trim();

        if (text.length < 100) {
            return 'No se pudo extraer bien el texto. Abre el capítulo en WebView (botón de ojo).';
        }

        return text;
    }
    
    async searchNovels(searchTerm, pageNo = 1) {
        // En eFiction, el script "search.php" procesa búsquedas si se le indica la acción de envío y el campo correcto "searchtext"
        const url = `${this.site}/search.php?action=search&searchtext=${encodeURIComponent(searchTerm)}&searchtype=titles&page=${pageNo}`;
        const html = await (0, fetch_1.fetchText)(url);
        const $ = (0, cheerio_1.load)(html);
        return this.extractNovels($);
    }
}

exports.GiantessWorldPlugin = GiantessWorldPlugin;
const pluginInstance = new GiantessWorldPlugin();
exports.default = pluginInstance;
