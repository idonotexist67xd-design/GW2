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
        this.version = '3.2.0';
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

            let cleanPath = href.replace(/https?:\/\/giantessworld\.net\/?/, '');
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

        // Mejores selectores para el título
        const title = 
            $('h1').first().text().trim() ||
            $('.story-title a').first().text().trim() ||
            $('#pagetitle a').first().text().trim() ||
            $('strong').first().text().trim() ||
            'Sin título';

        const author = $('a[href*="viewuser.php"]').first().text().trim() || 'Desconocido';

        const summary = 
            $('td:contains("Summary"), td:contains("Description"), .content, .summary').first().text().trim() ||
            'Sin resumen disponible.';

        const novel = {
            path: novelPath,
            name: title,
            author: author,
            cover: defaultCover_1.defaultCover,
            summary: summary,
            chapters: []
        };

        // Extracción de capítulos (mejorada)
        $('a[href*="viewchapter.php"], a[href*="viewstory.php?sid="][href*="chapter="]').each((_, el) => {
            const name = $(el).text().trim();
            const href = $(el).attr('href') || '';
            if (name && href && !name.toLowerCase().includes('table of contents')) {
                novel.chapters.push({
                    name: name,
                    path: href.replace(/https?:\/\/giantessworld\.net\/?/, ''),
                    chapterNumber: novel.chapters.length + 1,
                    releaseTime: ''
                });
            }
        });

        // Fallback con select
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
        let url = this.resolveUrl(chapterPath);
        
        // Forzar vista imprimible (la más limpia)
        if (!url.includes('action=printable')) {
            url = url.replace(/viewstory\.php/, 'viewstory.php?action=printable');
        }

        const html = await (0, fetch_1.fetchText)(url);
        const $ = (0, cheerio_1.load)(html);

        // Selectores fuertes para printable view
        let storyContainer = 
            $('#story') ||
            $('div[style*="margin"]') ||
            $('td[valign="top"]').first() ||
            $('body');

        // Eliminar basura
        storyContainer.find('script, style, header, nav, footer, form, select, input, .ad, #menu, a[href*="report"], a[href*="review"]').remove();

        let text = storyContainer.html() || storyContainer.text() || '';

        // Limpieza agresiva
        text = text
            .replace(/Home|Register|Login|Featured Stories|Most Recent|Browse|Old Archive|Writing Tools|Images|Search|Help|Penname:|Password:|Remember Me|Disclaimer:|Vote on|Categories:|Characters:|Warnings:|Challenges:|Series:/gi, '')
            .replace(/<script.*?<\/script>/gis, '')
            .replace(/<style.*?<\/style>/gis, '')
            .replace(/<a[^>]*>(.*?)<\/a>/gi, '$1')
            .replace(/<br\s*\/?>/gi, '\n\n')
            .replace(/<\/?(p|div|h[1-6]|li|ul|ol|table|tr|td)[^>]*>/gi, '\n\n')
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            .trim();

        if (text.length > 300) {
            return text;
        }

        // Último fallback
        return 'No se pudo extraer el texto correctamente.\n\nPrueba abrir el capítulo con el botón de WebView (icono de ojo).';
    }

   async searchNovels(searchTerm, pageNo = 1) {
        // GiantessWorld usa browse.php con parámetros para búsqueda
        const url = `${this.site}/browse.php?type=titles&searchterm=${encodeURIComponent(searchTerm)}&page=${pageNo}`;
        const html = await (0, fetch_1.fetchText)(url);
        const $ = (0, cheerio_1.load)(html);
        return this.extractNovels($);
    }
}

exports.GiantessWorldPlugin = GiantessWorldPlugin;
const pluginInstance = new GiantessWorldPlugin();
exports.default = pluginInstance;
