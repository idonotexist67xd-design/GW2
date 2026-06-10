(function() {
  "use strict";

  const plugin = {
    id: "giantessworld",
    name: "GiantessWorld",
    icon: "https://giantessworld.net/favicon.ico",
    site: "https://giantessworld.net",
    version: "1.0.0",
    lang: "English",

    async popularNovels(page) {
      const res = await fetch(`${this.site}/browse.php?type=recent&page=${page}`);
      const text = await res.text();
      const novels = [];
      const matches = text.matchAll(/href="(viewstory\.php\?sid=\d+)"[^>]*><b>(.*?)<\/b>/g);
      for (const match of matches) {
        novels.push({
          name: match[2].replace(/<[^>]*>/g, "").trim(),
          path: match[1],
          cover: "https://giantessworld.net/images/no_cover.png"
        });
      }
      return novels;
    },

    async parseNovel(novelPath) {
      const res = await fetch(`${this.site}/${novelPath}&index=1`);
      const text = await res.text();
      const novel = {
        path: novelPath,
        name: "Story",
        cover: "https://giantessworld.net/images/no_cover.png",
        summary: "No summary available",
        author: "Unknown",
        chapters: []
      };

      const chMatches = text.matchAll(/href="(viewchapter\.php\?id=\d+)"[^>]*>(.*?)<\/a>/g);
      let index = 1;
      for (const match of chMatches) {
        novel.chapters.push({
          name: match[2].trim(),
          path: match[1],
          chapterNumber: index++
        });
      }
      return novel;
    },

    async parseChapter(chapterPath) {
      const res = await fetch(`${this.site}/${chapterPath}`);
      const html = await res.text();
      const match = html.match(/<td align="left" valign="top">([\s\S]*?)<\/td>/);
      if (match) {
        return match[1].replace(/<script[\s\S]*?<\/script>/gi, "")
                       .replace(/<style[\s\S]*?<\/style>/gi, "")
                       .replace(/<br\s*\/?>/gi, "\n")
                       .replace(/<[^>]+>/g, "");
      }
      return "Could not load chapter content.";
    },

    async searchNovels(term) {
      const res = await fetch(`${this.site}/search.php?search=${encodeURIComponent(term)}`);
      const text = await res.text();
      const novels = [];
      const matches = text.matchAll(/href="(viewstory\.php\?sid=\d+)"[^>]*><b>(.*?)<\/b>/g);
      for (const match of matches) {
        novels.push({
          name: match[2].trim(),
          path: match[1],
          cover: "https://giantessworld.net/images/no_cover.png"
        });
      }
      return novels;
    }
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = plugin;
  } else {
    return plugin;
  }
})();
