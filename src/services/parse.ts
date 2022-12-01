import { unzip } from "unzipit";
import type { Metadata, Book } from "./types";

let sections: { id: string, href: string }[] = [];
let images: { name: string, blob: Blob }[] = [];
let htmls: { name: string, html: string }[] = [];
let styles: { name: string, css: string }[] = [];
let fonts: { name: string, blob: Blob }[] = [];
let coverFilename: string = "";

let meta: Metadata;

const domParser = new DOMParser();

const parseOpf = (xml: string) => {
    const parsed = domParser.parseFromString(xml, "text/xml");

    const manifestSections = parseManifest(parsed.querySelector("manifest").children)
    meta = parseMeta(parsed.querySelector("metadata"))

    parseSpine(parsed.querySelector("spine"), manifestSections);
}

const extract = async (file: File) => {
    const { entries } = await unzip(file);

    let opf = "";
    for (const [name, entry] of Object.entries(entries)) {
        switch (name.substring(name.lastIndexOf("."))) {
            case ".opf":
                opf = await entry.text();
                break;
            case ".png":
            case ".jpg":
            case ".jpeg":
            case ".gif": {
                const blob = await entry.blob();
                images.push({ name, blob });
                break;
            }
            case ".css": {
                const css = await entry.text();
                styles.push({ name, css });
                break;
            }
            case ".htm":
            case ".xml":
            case ".html":
            case ".xhtml": {
                const html = await entry.text();
                htmls.push({ name, html });
                break;
            }
            case ".otf":
            case ".ttf":
            case ".woff": {
                const blob = await entry.blob();
                fonts.push({ name, blob });
            }
            default: break;
        }
    }

    return opf;
}

const parseMeta = (meta: Element) => {
    const title = meta.querySelector("title").textContent;
    let author = [];
    for (let author2 of meta.querySelectorAll("creator")) {
        author.push(author2.textContent);
    }
    let cover = images[0].blob;
    for (let { name, blob } of images) {
        if (name.includes(coverFilename)) {
            cover = blob;
            break;
        } else if (name.includes("cover")) {
            cover = blob;
        }
    }
    return { title, author, cover };
}

const parseManifest = (manifest: HTMLCollection) => {
    let tempSections: { id: string, href: string }[] = [];

    for (const item of manifest) {
        if (item.attributes["media-type"].value === "application/xhtml+xml") {
            tempSections.push({ id: item.attributes["id"].value, href: item.attributes["href"].value });
        } else if (item.attributes["media-type"].value.includes("image") && item.attributes["id"].value.includes("cover")) {
            coverFilename = item.attributes["href"].value;
        }
    }

    return tempSections;
}

const parseSpine = (spine: Element, manifestSec: { id: string, href: string }[]) => {
    let sortArr = [];
    spine.querySelectorAll("itemref").forEach(obj => sortArr.push(obj.attributes["idref"].value));

    sections = sortArr.map((i) => manifestSec.find((j) => j.id === i));
}

const removePath = (filename: string) => {
    return filename.split('\\').pop().split('/').pop();
}

const getNameWithIndex = (filename: string, array: { name: string, blob: Blob }[]) => {
    for (const [i, { name }] of array.entries()) {
        if (name.includes(filename)) {
            return "ESSENCE-READER-IMAGE-" + i;
        }
    }

    return "";
}

const updateHTML = (html: string, images: { name: string, blob: Blob }[]) => {
    let newHTML = domParser.parseFromString(html, "application/xhtml+xml");

    const errorNode = newHTML.querySelector('parsererror');
    if (errorNode) {
        // Try parsing as HTML if error when parsing as XHTML.
        // Can solve issues with mismatched tags
        newHTML = domParser.parseFromString(html, "text/html");
    }
    for (const e of newHTML.querySelectorAll<HTMLElement>('[src],[href], image')) {
        switch (e.tagName) {
            case "img": {
                const filename = removePath(e.getAttribute("src"));
                e.setAttribute("src", getNameWithIndex(filename, images));
                e.style.cssText += 'max-height: 100%; max-width: 100%; object-fit: scale-down;';
                break;
            }

            case "image": {
                const filename = removePath(e.getAttributeNS('http://www.w3.org/1999/xlink', 'href'));
                e.setAttributeNS('http://www.w3.org/1999/xlink', 'href', getNameWithIndex(filename, images));
                break;
            }

            default: {
                if (e.getAttribute("href") !== null && !e.getAttribute("href").includes("http")) {
                    e.removeAttribute("href");
                } else if (e.getAttribute("src") !== null && !e.getAttribute("src").includes("http")) {
                    e.removeAttribute("src");
                }
                break;
            }
        }
    }

    return newHTML.body.innerHTML;
}

const cssNester = (css: string, nestWith: string) => {
    // Found on Stackoverflow and works great: https://stackoverflow.com/a/67517828
    let kframes = [];
    css = css.replace(/@(-moz-|-webkit-|-ms-)*keyframes\s(.*?){([0-9%a-zA-Z,\s.]*{(.*?)})*[\s\n]*}/g, x => kframes.push(x) && '__keyframes__');
    css = css.replace(/([^\r\n,{}]+)(,(?=[^}]*{)|\s*{)/g, x => x.trim()[0] === '@' ? x : x.replace(/(\s*)/, '$1' + nestWith + ' '));
    return css.replace(/__keyframes__/g, x => kframes.shift());
}

export const parser = async (epub: File): Promise<Book> => {
    images = [];
    sections = [];
    htmls = [];
    fonts = [];
    try {
        parseOpf(await extract(epub));
    } catch (e) {
        throw new Error(epub.name + " does not appear to be a valid EPUB file");
    }

    let contents: string[] = [];
    for (let i = 0; i < sections.length; i++) {
        for (const { name, html } of htmls) {
            if (name.includes(sections[i].href)) {
                contents.push(updateHTML(html, images));
                break;
            }
        }
    }

    for (let i = 0; i < styles.length; i++) {
        styles[i].css = cssNester(styles[i].css, "#container");
    }

    return { meta, contents, files: { images, fonts, styles } };
}