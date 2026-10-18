const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

class Element {
    constructor() {
        this.style = {};
        this.children = [];
        this.offsetWidth = 1000;
        this.offsetHeight = 800;
    }
    appendChild(child) { child.parentElement = this; this.children.push(child); }
    append(...children) { children.forEach(child => this.appendChild(child)); }
    replaceChildren() { this.children = []; }
    getAttribute(name) { return this[name]; }
}
const elements = new Map();
for (const [, id] of html.matchAll(/id="([^"]+)"/g)) elements.set(id, new Element());
elements.get('lightbox-img').parentElement = elements.get('lightbox-container');
const context = vm.createContext({
    document: {
        getElementById(id) { assert.ok(elements.has(id), `Missing element: ${id}`); return elements.get(id); },
        createElement() { return new Element(); },
        querySelectorAll() { return [...elements].filter(([id]) => id.endsWith('-story-section')).map(([, element]) => element); }
    },
    window: { scrollTo() {}, addEventListener() {} }
});
const run = script => vm.runInContext(script, context);
// Execute the actual scripts in document order, including external files.
for (const [, attrs, body] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    const source = attrs.match(/src="([^"]+)"/);
    run(source ? fs.readFileSync(path.join(root, source[1]), 'utf8') : body);
}
const albums = run('gridData');
for (const album of Object.values(albums)) {
    for (const image of album.images) assert.ok(fs.existsSync(path.join(root, image)), image);
}
const cardHandlers = [...html.matchAll(/class="album-card" onclick="([^"]+)"/g)].map(match => match[1]);
assert.equal(cardHandlers.length, 5);
for (const handler of cardHandlers) {
    run(handler);
    assert.equal(elements.get('album-view-section').style.display, 'none', handler);
    assert.equal(elements.get('global-back-btn').style.display, 'block', handler);
    if (handler.startsWith('openGrid')) {
        const id = handler.match(/'([^']+)'/)[1];
        assert.equal(elements.get('grid-gallery-section').style.display, 'block');
        assert.equal(elements.get('gallery-content').children.length, albums[id].images.length);
        elements.get('gallery-content').children[0].onclick();
        assert.equal(run('currentAlbum'), id);
    } else {
        const id = handler.match(/'([^']+)'/)[1];
        assert.equal(elements.get(`${id}-story-section`).style.display, 'block');
    }
    run('closeLB(); showHomeScreen()');
    assert.equal(elements.get('album-view-section').style.display, 'block');
}
const gardaseeImages = elements.get('gardasee-story-content').children.flatMap(row => row.children[0].children);
assert.equal(gardaseeImages.length, 268);
gardaseeImages[267].onclick();
assert.equal(run('currentIndex'), 267);
run('nextImage()');
assert.equal(run('currentIndex'), 0);
run('prevImage()');
assert.equal(run('currentIndex'), 267);
run("openLBStory({getAttribute: () => gridData.brasilien.images[0]})");
assert.equal(run('currentAlbum'), 'brasilien');
run("document.onkeydown({key: 'ArrowRight'})");
assert.equal(run('currentIndex'), 1);
run("document.onkeydown({key: 'Escape'})");
assert.equal(elements.get('lightbox').style.display, 'none');
console.log('PASS: actual page scripts, all 5 album click handlers, 435 gallery images, 268 Gardasee story images, overview, lightbox and keyboard navigation.');
