"use strict";

const fetch_1 = require("@libs/fetch");
const cheerio_1 = require("cheerio");
const defaultCover_1 = require("@libs/defaultCover");

class GiantessWorldPlugin {
    constructor() {
        this.id = 'giantessworld';
        this.name = 'GiantessWorld';
        this.icon = '';
        this.site = 'https://giantessworld.net';
        this.version = '3.0.0'; // Salto radical de versión para romper cualquier caché
    }

    resolveUrl(path) {
        let cleanPath = path || '';
        if (cleanPath.startsWith('/')) {
            cleanPath = cleanPath.substring(1);
        }
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
            
            // Limpiar la URL para dejar solo el sid base
            let cleanPath = href.replace('https://giantessworld.net', '').replace('http://giantessworld.net', '');
            if (cleanPath.startsWith('/')) {
                cleanPath = cleanPath.substring(1);
            }
            if (cleanPath.includes('&')) {
                cleanPath = cleanPath.split('&')[0];
            }

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

    // 📚 Novelas Recientes
    async popularNovels(pageNo) {
        const url = `${this.site}/browse.php?type=recent&page=${pageNo}`;
        const html = await (0, fetch_1.fetchText)(url);
        const $ = (0, cheerio_1.load)(html);
        return this.extractNovels($);
    }

    // 📖 Detalles e Índice de Capítulos
    async parseNovel(novelPath) {
        const url = this.resolveUrl(novelPath);
        const html = await (0, fetch_1.fetchText)(url);
        const $ = (0, cheerio_1.load)(html);
        
        const title = $('.story-title a').first().text().trim() || $('#pagetitle a').first().text().trim() || 'Unknown Title';
        const author = $('a[href*="viewuser.php"]').first().text().trim() || 'Unknown Author';
        const summary = $('.content').first().text().replace(/Summary:/i, '').trim() || 'No summary available.';

        const novel = {
            path: novelPath,
            name: title,
            author: author,
            cover: defaultCover_1.defaultCover,
            chapters: [],
            summary: summary,
        };

        const chapters = [];
        const options = $('select[name="chapter"] option');
        
        if (options.length > 0) {
            options.each((_, el) => {
                const number = Number($(el).attr('value'));
                const name = $(el).text().trim();
                if (!number) return;
                
                chapters.push({
                    name: name,
                    chapterNumber: number,
                    path: `${novelPath}&textsize=0&chapter=${number}`,
                    releaseTime: '',
                });
            });
        } else {
            chapters.push({
                name: 'Chapter 1',
                chapterNumber: 1,
                path: `${novelPath}&textsize=0&chapter=1`,
                releaseTime: '',
            });
        }

        novel.chapters = chapters;
        return novel;
    }

    // 📄 Contenido del Capítulo
    async parseChapter(chapterPath) {
        const url = this.resolveUrl(chapterPath);
        const html = await (0, fetch_1.fetchText)(url);
        const $ = (0, cheerio_1.load)(html);
        
        // Selector ultra-amplio para capturar el texto principal en eFiction sin fallar
        let storyContainer = $('#story');
        if (!storyContainer.length) storyContainer = $('.listbox .content');
        if (!storyContainer.length) storyContainer = $('td[align="left"][valign="top"]').has('br');
        if (!storyContainer.length) {
            storyContainer = $('div').filter((_, el) => $(el).text().length > 400 && $(el).find('br').length > 5).first();
        }

        if (!storyContainer.length) {
            return 'Could not parse chapter text automatically. Please use WebView.';
        }

        storyContainer.find('script, style, iframe, noscript, select, form, .label, #ad').remove();
        return (storyContainer.html() || storyContainer.text() || '').trim();
    }

    // 🔍 Buscador Directo
    async searchNovels(searchTerm, pageNo) {
        // Usamos el sistema de listado por títulos inyectando el término directamente
        const url = `${this.site}/browse.php?type=titles&searchterm=${encodeURIComponent(searchTerm)}&page=${pageNo}`;
        const html = await (0, fetch_1.fetchText)(url);
        const $ = (0, cheerio_1.load)(html);
        return this.extractNovels($);
    }
}

exports.GiantessWorldPlugin = GiantessWorldPlugin;
const pluginInstance = new GiantessWorldPlugin();
exports.default = pluginInstance;
