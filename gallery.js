const backBtn = document.getElementById('global-back-btn');
const lb = document.getElementById('lightbox');
const lbImg = document.getElementById('lightbox-img');
let scale = 1;
let panX = 0;
let panY = 0;
let isDragging = false;
let startX = 0;
let startY = 0;
let currentAlbum = '';
let currentIndex = 0;
let maxPanX = 0;
let maxPanY = 0;

function showHomeScreen() {
    document.getElementById('album-view-section').style.display = 'block';
    document.getElementById('grid-gallery-section').style.display = 'none';
    document.querySelectorAll('[id$="-story-section"]').forEach(section => {
        section.style.display = 'none';
    });
    backBtn.style.display = 'none';
}

function openGrid(id) {
    showHomeScreen();
    const album = gridData[id];
    document.getElementById('gallery-title').textContent = album.title;
    const content = document.getElementById('gallery-content');
    content.replaceChildren();
    album.images.forEach((src, index) => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = `${album.title} – Bild ${index + 1}`;
        img.loading = 'lazy';
        img.onclick = () => openLB(id, index);
        content.appendChild(img);
    });
    document.getElementById('album-view-section').style.display = 'none';
    document.getElementById('grid-gallery-section').style.display = 'block';
    backBtn.style.display = 'block';
    window.scrollTo(0, 0);
}

function openStory(id) {
    showHomeScreen();
    document.getElementById('album-view-section').style.display = 'none';
    document.getElementById(`${id}-story-section`).style.display = 'block';
    backBtn.style.display = 'block';
    window.scrollTo(0, 0);
}

function buildGardaseeStory() {
    const content = document.getElementById('gardasee-story-content');
    const chapters = [
        ['Von Linz Richtung Alpen', 'Unsere Radreise startete in Linz und führte uns über Frankenmarkt, Salzburg, Oberndorf in Tirol und Innsbruck bis nach Südtirol.'],
        ['Erinnerungen von unterwegs', 'Burgen, Flüsse, Apfelplantagen und Begegnungen mit anderen Radreisenden begleiteten uns. Besonders in Erinnerung blieb die Rettung eines Vogels auf der Brennerstraße.'],
        ['Zeit am Gardasee', 'Nach mehreren Nächten in der Natur erreichten wir Riva del Garda und verbrachten dort zwei Tage in einem Airbnb. Danach führte uns die Reise entlang der Westseite weiter nach San Felice del Benaco und später nach Malcesine.']
    ];
    const images = gridData.gardasee.images;
    const groupSize = 4;
    const groups = Math.ceil(images.length / groupSize);
    for (let offset = 0; offset < images.length; offset += groupSize) {
        const group = offset / groupSize;
        const row = document.createElement('div');
        row.className = `story-row ${group % 2 ? 'odd' : 'even'}`;
        const imageGroup = document.createElement('div');
        imageGroup.className = 'story-images images-4';
        images.slice(offset, offset + groupSize).forEach((src, index) => {
            const img = document.createElement('img');
            img.src = src;
            img.alt = `Gardasee-Radreise 2026 – Bild ${offset + index + 1}`;
            img.loading = 'lazy';
            img.decoding = 'async';
            img.onclick = () => openLB('gardasee', offset + index);
            imageGroup.appendChild(img);
        });
        const text = document.createElement('div');
        text.className = 'story-text';
        const heading = document.createElement('h3');
        const paragraph = document.createElement('p');
        if (group === 0 || group === Math.floor(groups / 2) || group === groups - 1) {
            const chapter = group === 0 ? 0 : group === groups - 1 ? 2 : 1;
            heading.textContent = chapters[chapter][0];
            paragraph.textContent = chapters[chapter][1];
        } else {
            heading.textContent = 'Reisemomente';
            paragraph.textContent = `Bilder ${offset + 1}–${Math.min(offset + groupSize, images.length)}`;
        }
        text.append(heading, paragraph);
        row.append(imageGroup, text);
        content.appendChild(row);
    }
}

function updateTransform() {
    lbImg.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
}

function updatePanLimits() {
    maxPanX = Math.max(0, (lbImg.offsetWidth * scale - lbImg.parentElement.offsetWidth) / 2);
    maxPanY = Math.max(0, (lbImg.offsetHeight * scale - lbImg.parentElement.offsetHeight) / 2);
    panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
    panY = Math.max(-maxPanY, Math.min(maxPanY, panY));
    updateTransform();
}

function showLightboxImage(src) {
    scale = 1;
    panX = 0;
    panY = 0;
    isDragging = false;
    lbImg.onload = updatePanLimits;
    lbImg.src = src;
    updateTransform();
}

function openLB(albumId, index) {
    currentAlbum = albumId;
    currentIndex = index;
    lb.style.display = 'flex';
    lbImg.alt = `${gridData[albumId].title} – Bild ${index + 1}`;
    showLightboxImage(gridData[albumId].images[index]);
    document.getElementById('prev-arrow').style.display = 'block';
    document.getElementById('next-arrow').style.display = 'block';
}

function openLBStory(image) {
    const src = image.getAttribute('src');
    const index = gridData.brasilien.images.indexOf(src);
    if (index !== -1) openLB('brasilien', index);
}

function nextImage() {
    if (!currentAlbum) return;
    openLB(currentAlbum, (currentIndex + 1) % gridData[currentAlbum].images.length);
}

function prevImage() {
    if (!currentAlbum) return;
    openLB(currentAlbum, (currentIndex - 1 + gridData[currentAlbum].images.length) % gridData[currentAlbum].images.length);
}

function closeLB() {
    lb.style.display = 'none';
    currentAlbum = '';
    isDragging = false;
    document.getElementById('prev-arrow').style.display = 'none';
    document.getElementById('next-arrow').style.display = 'none';
}

function zoom(event) {
    event.preventDefault();
    scale = Math.min(Math.max(1, scale * (event.deltaY > 0 ? 0.9 : 1.1)), 5);
    updatePanLimits();
}

lb.onclick = event => {
    if (event.target === lb || event.target.id === 'lightbox-container') closeLB();
};
lbImg.onmousedown = event => {
    if (scale > 1) {
        isDragging = true;
        startX = event.clientX - panX;
        startY = event.clientY - panY;
        event.preventDefault();
    }
};
document.onmousemove = event => {
    if (!isDragging) return;
    panX = event.clientX - startX;
    panY = event.clientY - startY;
    updatePanLimits();
};
document.onmouseup = () => { isDragging = false; };
document.onkeydown = event => {
    if (lb.style.display !== 'flex') return;
    if (event.key === 'ArrowRight') nextImage();
    else if (event.key === 'ArrowLeft') prevImage();
    else if (event.key === 'Escape') closeLB();
};
window.addEventListener('resize', updatePanLimits);

buildGardaseeStory();
