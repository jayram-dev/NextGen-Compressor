# NextGen Document Compressor

A 100% Client-Side Web Application to compress Images and PDFs. Because it operates entirely within the browser using standard Web APIs, it is perfectly suited for free hosting on GitHub Pages and requires no backend server.

## 🚀 Features
* **Zero-Upload "Incognito" Compression**: Files are processed in your device's memory. No data is sent over the internet, ensuring 100% privacy.
* **Image Compression Engine**: Uses HTML5 Canvas API to convert heavy JPEGs/PNGs into highly optimized next-gen WebP formats.
* **PDF Optimizer**: Uses `pdf-lib` to parse and re-save PDFs, stripping unnecessary metadata and unneeded object streams to reduce file size.
* **Sleek UI**: Built entirely with Tailwind CSS.

## 🛠️ How to Host on GitHub Pages (For Free!)

Since this app doesn't rely on Node.js or a backend server, hosting it on GitHub is incredibly simple.

### Step 1: Create a GitHub Repository
1. Log in to [GitHub](https://github.com).
2. Click the `+` icon in the top right and select **New repository**.
3. Name it something like `nextgen-compressor`.
4. Make it **Public** (required for free GitHub Pages).
5. Click **Create repository**.

### Step 2: Upload these files
1. On the repository page, click **"uploading an existing file"**.
2. Drag and drop the following files from this ZIP directly into the browser:
   - `index.html`
   - `app.js`
   - `README.md`
3. Click **Commit changes** at the bottom.

### Step 3: Enable GitHub Pages
1. In your GitHub repository, click on the **Settings** tab (the gear icon).
2. On the left sidebar, scroll down and click on **Pages**.
3. Under "Build and deployment", look for **Source** and select **Deploy from a branch**.
4. Under **Branch**, change `None` to `main` (or `master`), and keep the folder as `/ (root)`.
5. Click **Save**.
6. Wait about 1-2 minutes. Refresh the page, and GitHub will provide you with a live link (e.g., `https://yourusername.github.io/nextgen-compressor/`).

🎉 **Your compression app is now live to the world!**
