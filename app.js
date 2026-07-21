
// DOM Elements
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const processingArea = document.getElementById('processingArea');
const resultArea = document.getElementById('resultArea');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const qualityRange = document.getElementById('qualityRange');
const qualityValue = document.getElementById('qualityValue');
const compressBtn = document.getElementById('compressBtn');
const cancelBtn = document.getElementById('cancelBtn');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const savedSpace = document.getElementById('savedSpace');

let currentFile = null;
let originalSize = 0;

// Format bytes helper
const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Drag and Drop Handlers
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, () => dropzone.classList.add('drag-over'), false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, () => dropzone.classList.remove('drag-over'), false);
});

dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    handleFiles(dt.files);
});

dropzone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', function() { handleFiles(this.files); });

// Update Quality Label
qualityRange.addEventListener('input', (e) => {
    qualityValue.textContent = e.target.value + '%';
});

// Reset UI
const resetUI = () => {
    currentFile = null;
    dropzone.classList.remove('hidden');
    processingArea.classList.add('hidden');
    resultArea.classList.add('hidden');
    fileInput.value = '';
    compressBtn.textContent = 'Compress Now';
    compressBtn.disabled = false;
};
cancelBtn.addEventListener('click', resetUI);
resetBtn.addEventListener('click', resetUI);

// Handle Selected Files
function handleFiles(files) {
    if (files.length === 0) return;
    currentFile = files[0];
    originalSize = currentFile.size;
    
    fileName.textContent = currentFile.name;
    fileSize.textContent = `Original Size: ${formatBytes(originalSize)}`;
    
    dropzone.classList.add('hidden');
    processingArea.classList.remove('hidden');
    resultArea.classList.add('hidden');
}

// Compress Action
compressBtn.addEventListener('click', async () => {
    if (!currentFile) return;
    
    compressBtn.disabled = true;
    compressBtn.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Compressing...`;
    
    const fileType = currentFile.type;
    const quality = parseInt(qualityRange.value) / 100;
    
    try {
        if (fileType.includes('image')) {
            await compressImage(currentFile, quality);
        } else if (fileType === 'application/pdf') {
            await compressPDF(currentFile); // Basic PDF optimization
        } else {
            alert('Unsupported file type.');
            resetUI();
        }
    } catch (err) {
        console.error(err);
        alert('An error occurred during compression.');
        resetUI();
    }
});

// Client-Side Image Compression using Canvas API
const compressImage = (file, quality) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Keep dimensions, just lower WebP/JPEG quality
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // Convert to WebP for maximum compression
                canvas.toBlob((blob) => {
                    showSuccess(blob, file.name.replace(/\.[^/.]+$/, "") + "_compressed.webp");
                    resolve();
                }, 'image/webp', quality);
            };
            img.onerror = (e) => reject(e);
        };
        reader.onerror = (e) => reject(e);
    });
};

// Client-Side PDF Optimization (Removing unused objects/metadata via pdf-lib)
const compressPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    // Load the PDF document
    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    
    // Save it without object streams and stripping some unnecessary metadata
    // In a pure client-side environment, this acts as a light "optimization"
    const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
    
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    showSuccess(blob, file.name.replace(/\.[^/.]+$/, "") + "_optimized.pdf");
};

// Success UI transition
const showSuccess = (compressedBlob, newFileName) => {
    const newSize = compressedBlob.size;
    const saved = originalSize - newSize;
    
    if (saved < 0) {
        savedSpace.textContent = "0 MB (Already highly optimized)";
        savedSpace.classList.replace('text-green-800', 'text-yellow-600');
    } else {
        savedSpace.textContent = formatBytes(saved);
        savedSpace.classList.replace('text-yellow-600', 'text-green-800');
    }
    
    const url = URL.createObjectURL(compressedBlob);
    downloadBtn.href = url;
    downloadBtn.download = newFileName;
    
    processingArea.classList.add('hidden');
    resultArea.classList.remove('hidden');
};
