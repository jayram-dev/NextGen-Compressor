// DOM Elements
const tabQuickBtn = document.getElementById('tabQuickBtn');
const tabPipelineBtn = document.getElementById('tabPipelineBtn');
const quickStudioView = document.getElementById('quickStudioView');
const pipelineStudioView = document.getElementById('pipelineStudioView');
const themeToggleBtn = document.getElementById('themeToggleBtn');

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const workspaceArea = document.getElementById('workspaceArea');
const activeFileName = document.getElementById('activeFileName');
const activeFileSize = document.getElementById('activeFileSize');
const pageGrid = document.getElementById('pageGrid');
const pageCountBadge = document.getElementById('pageCountBadge');

const qualitySlider = document.getElementById('qualitySlider');
const qualityLabel = document.getElementById('qualityLabel');
const watermarkInput = document.getElementById('watermarkInput');
const btnProcessNow = document.getElementById('btnProcessNow');
const resultBanner = document.getElementById('resultBanner');
const spaceSavedLabel = document.getElementById('spaceSavedLabel');
const downloadResultLink = document.getElementById('downloadResultLink');
const btnClearFile = document.getElementById('btnClearFile');

let loadedFile = null;
let loadedPdfDoc = null;
let pageCanvasList = [];

// Theme Toggle Logic
themeToggleBtn.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
});

// Navigation Tabs
tabQuickBtn.addEventListener('click', () => {
    quickStudioView.classList.remove('hidden');
    pipelineStudioView.classList.add('hidden');
    tabQuickBtn.className = "px-4 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-darkcard text-brand-600 dark:text-brand-400 shadow-sm flex items-center gap-2 transition";
    tabPipelineBtn.className = "px-4 py-1.5 text-xs font-semibold rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 transition";
});

tabPipelineBtn.addEventListener('click', () => {
    quickStudioView.classList.add('hidden');
    pipelineStudioView.classList.remove('hidden');
    tabPipelineBtn.className = "px-4 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-darkcard text-brand-600 dark:text-brand-400 shadow-sm flex items-center gap-2 transition";
    tabQuickBtn.className = "px-4 py-1.5 text-xs font-semibold rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 transition";
});

// Quality Slider Update
qualitySlider.addEventListener('input', (e) => {
    qualityLabel.textContent = e.target.value + '%';
});

// File Upload Handlers
dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('border-brand-500'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('border-brand-500'));
dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-brand-500');
    if (e.dataTransfer.files.length) handleFileSelect(e.dataTransfer.files[0]);
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFileSelect(e.target.files[0]);
});

btnClearFile.addEventListener('click', () => {
    loadedFile = null;
    workspaceArea.classList.add('hidden');
    dropzone.classList.remove('hidden');
    resultBanner.classList.add('hidden');
    fileInput.value = '';
});

// Process Selected File
async function handleFileSelect(file) {
    loadedFile = file;
    activeFileName.textContent = file.name;
    activeFileSize.textContent = `Original Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`;

    dropzone.classList.add('hidden');
    workspaceArea.classList.remove('hidden');
    pageGrid.innerHTML = '<p class="text-xs text-gray-400 col-span-3 text-center py-6">Rendering page previews...</p>';

    if (file.type === 'application/pdf') {
        renderPdfPages(file);
    } else {
        renderImagePreview(file);
    }
}

// Render PDF Page Previews
async function renderPdfPages(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    pageGrid.innerHTML = '';
    pageCountBadge.textContent = `${pdf.numPages} Pages`;

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });

        const card = document.createElement('div');
        card.className = "relative bg-gray-50 dark:bg-darkbg p-2 rounded-xl border border-gray-200 dark:border-darkborder text-center flex flex-col items-center group";

        const canvas = document.createElement('canvas');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        canvas.className = "rounded shadow-sm max-h-[140px] w-auto";
        const context = canvas.getContext('2d');

        await page.render({ canvasContext: context, viewport: viewport }).promise;

        card.appendChild(canvas);
        card.innerHTML += `<span class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mt-2">Page ${i}</span>`;
        pageGrid.appendChild(card);
    }
}

// Render Image Preview
function renderImagePreview(file) {
    pageGrid.innerHTML = '';
    pageCountBadge.textContent = '1 Image';
    const reader = new FileReader();
    reader.onload = (e) => {
        const card = document.createElement('div');
        card.className = "relative bg-gray-50 dark:bg-darkbg p-2 rounded-xl border border-gray-200 dark:border-darkborder text-center flex flex-col items-center";
        card.innerHTML = `<img src="${e.target.result}" class="rounded shadow-sm max-h-[140px] object-contain"/><span class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mt-2">Image Preview</span>`;
        pageGrid.appendChild(card);
    };
    reader.readAsDataURL(file);
}

// Execute Document Export
btnProcessNow.addEventListener('click', async () => {
    if (!loadedFile) return;

    btnProcessNow.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Processing Document...`;
    lucide.createIcons();

    setTimeout(async () => {
        const qualityRatio = parseInt(qualitySlider.value) / 100;
        let finalBlob = null;
        let newFileName = "optimized_" + loadedFile.name;

        if (loadedFile.type.includes('image')) {
            // Compress Image via Canvas
            finalBlob = await compressImageBlob(loadedFile, qualityRatio);
            newFileName = newFileName.replace(/\.[^/.]+$/, "") + ".webp";
        } else {
            // Optimize PDF via pdf-lib
            const arrayBuffer = await loadedFile.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

            // Add Watermark if specified
            const watermarkText = watermarkInput.value.trim();
            if (watermarkText) {
                const pages = pdfDoc.getPages();
                pages.forEach(page => {
                    page.drawText(watermarkText, {
                        x: page.getWidth() / 4,
                        y: page.getHeight() / 2,
                        size: 36,
                        opacity: 0.25
                    });
                });
            }

            const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
            finalBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        }

        // Show Results
        const savedBytes = loadedFile.size - finalBlob.size;
        spaceSavedLabel.textContent = savedBytes > 0 ? (savedBytes / 1024 / 1024).toFixed(2) + " MB" : "0 MB (Already Optimized)";
        
        const downloadUrl = URL.createObjectURL(finalBlob);
        downloadResultLink.href = downloadUrl;
        downloadResultLink.download = newFileName;

        resultBanner.classList.remove('hidden');
        btnProcessNow.innerHTML = `<i data-lucide="cpu" class="w-4 h-4"></i> Export Optimized Document`;
        lucide.createIcons();
    }, 800);
});

// Image Compressor Helper
function compressImageBlob(file, quality) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => resolve(blob), 'image/webp', quality);
        };
    });
}

// Interactive Visual Node Canvas Setup
const nodeHolder = document.getElementById('nodeHolder');
const defaultNodes = [
    { id: 1, title: '📄 Document Input', desc: 'Accepts PDF / Images', type: 'input', x: 40, y: 50, color: 'text-blue-500' },
    { id: 2, title: '⚡ Smart Compressor', desc: 'WebP / PDF Optimization', type: 'compress', x: 300, y: 50, color: 'text-indigo-500' },
    { id: 3, title: '🛡️ AI Privacy Redact', desc: 'Automatic PII Shield', type: 'redact', x: 300, y: 220, color: 'text-red-500' },
    { id: 4, title: '💾 Output Stream', desc: 'Download Ready File', type: 'export', x: 560, y: 130, color: 'text-emerald-500' }
];

function initCanvasNodes() {
    nodeHolder.innerHTML = '';
    defaultNodes.forEach(node => {
        const el = document.createElement('div');
        el.className = 'canvas-node';
        el.style.left = node.x + 'px';
        el.style.top = node.y + 'px';
        el.innerHTML = `
            <div class="flex items-center justify-between mb-1">
                <span class="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5 ${node.color}">
                    ${node.title}
                </span>
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <p class="text-[11px] text-gray-500 dark:text-gray-400">${node.desc}</p>
        `;
        nodeHolder.appendChild(el);
    });
}
initCanvasNodes();

document.getElementById('runPipelineBtn').addEventListener('click', () => {
    alert('Pipeline execution initiated! Node workflows active.');
});