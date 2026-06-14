// App logic for Foundation Gazette — Magazine Redesign
// Preserves all existing data binding, export, share card, and archive logic.
// Adds: sidebar toggle, editor drawer, syncMagazineView, scroll reveal, reading progress, dark mode.

window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Global error:', msg, url, lineNo, columnNo, error);
};

function initializeApp() {
    try {
        let isRestoring = false;

        // =====================================================================
        // INPUT ELEMENT REFERENCES
        // =====================================================================
        const inputGalaxyEra = document.getElementById('inputGalaxyEra');
        const inputDate = document.getElementById('inputDate');
        const inputCoordinates = document.getElementById('inputCoordinates');
        const labelLayoutScheme = document.getElementById('labelLayoutScheme');
        const inputSparkTitle = document.getElementById('inputSparkTitle');
        const inputSparkFullTitle = document.getElementById('inputSparkFullTitle');
        const inputSparkIntro = document.getElementById('inputSparkIntro');
        const inputSparkContent = document.getElementById('inputSparkContent');
        const inputQuoteText = document.getElementById('inputQuoteText');
        const inputQuoteAuthor = document.getElementById('inputQuoteAuthor');
        const inputImageUrl = document.getElementById('inputImageUrl');
        const inputImageCaption = document.getElementById('inputImageCaption');
        const inputShareCardText = document.getElementById('inputShareCardText');

        // =====================================================================
        // GAZETTE CARD (HIDDEN EXPORT CARD) ELEMENT REFERENCES
        // =====================================================================
        const gazetteCard = document.getElementById('gazetteCard');
        const cardGalaxyEra = document.getElementById('cardGalaxyEra');
        const cardCoordinates = document.getElementById('cardCoordinates');
        const cardDate = document.getElementById('cardDate');
        const cardEdition = document.getElementById('cardEdition');
        const cardSparkTitle = document.getElementById('cardSparkTitle');
        const cardSparkIntro = document.getElementById('cardSparkIntro');
        const cardQuoteText = document.getElementById('cardQuoteText');
        const cardQuoteAuthor = document.getElementById('cardQuoteAuthor');

        const cardImage = document.getElementById('cardImage');
        const cardImageError = document.getElementById('cardImageError');
        const cardImageCaption = document.getElementById('cardImageCaption');

        const cardNewsList = document.getElementById('cardNewsList');
        const cardArticlesArea = document.getElementById('cardArticlesArea');

        // =====================================================================
        // ACTION BUTTONS & ZONES
        // =====================================================================
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        const btnDownloadJson = document.getElementById('btnDownloadJson');
        const btnExportPng = document.getElementById('btnExportPng');
        const btnClearDraft = document.getElementById('btnClearDraft');
        const toggleInkFilter = document.getElementById('toggleInkFilter');
        const newsInputsContainer = document.getElementById('newsInputsContainer');

        // =====================================================================
        // NEW MAGAZINE UI ELEMENT REFERENCES
        // =====================================================================
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.getElementById('sidebarToggle');
        const magazine = document.getElementById('magazineMain');
        const editorDrawer = document.getElementById('editorDrawer');
        const editorOverlay = document.getElementById('editorOverlay');
        const btnToggleEditor = document.getElementById('btnToggleEditor');
        const btnCloseEditor = document.getElementById('btnCloseEditor');

        // =====================================================================
        // DEBOUNCED MAGAZINE SYNC
        // =====================================================================
        let _syncTimer = null;
        function scheduleMagazineSync() {
            if (_syncTimer) clearTimeout(_syncTimer);
            _syncTimer = setTimeout(syncMagazineView, 50);
        }

        // =====================================================================
        // SIDEBAR TOGGLE
        // =====================================================================
        if (sidebarToggle && sidebar && magazine) {
            sidebarToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.innerWidth <= 768) {
                    sidebar.classList.toggle('mobile-open');
                } else {
                    sidebar.classList.toggle('expanded');
                    magazine.classList.toggle('sidebar-expanded');
                }
            });
        }

        const btnSidebarArchive = document.getElementById('btnSidebarArchive');
        if (btnSidebarArchive && sidebar && magazine) {
            btnSidebarArchive.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.innerWidth <= 768) {
                    if (!sidebar.classList.contains('mobile-open')) {
                        sidebar.classList.add('mobile-open');
                    }
                } else {
                    sidebar.classList.toggle('expanded');
                    magazine.classList.toggle('sidebar-expanded');
                }
                if (selectArchive) {
                    setTimeout(() => selectArchive.focus(), 100);
                }
            });
        }

        // Close sidebar on mobile when a link is clicked or clicking outside
        if (sidebar) {
            const sidebarLinks = sidebar.querySelectorAll('.sidebar-link');
            sidebarLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth <= 768) {
                        sidebar.classList.remove('mobile-open');
                    }
                });
            });

            document.addEventListener('click', (e) => {
                if (window.innerWidth <= 768 && sidebar.classList.contains('mobile-open')) {
                    if (!sidebar.contains(e.target)) {
                        sidebar.classList.remove('mobile-open');
                    }
                }
            });
        }

        // =====================================================================
        // EDITOR DRAWER
        // =====================================================================
        function openEditor() {
            if (editorDrawer) editorDrawer.classList.add('open');
            if (editorOverlay) editorOverlay.classList.add('active');
        }
        function closeEditor() {
            if (editorDrawer) editorDrawer.classList.remove('open');
            if (editorOverlay) editorOverlay.classList.remove('active');
        }
        if (btnToggleEditor) btnToggleEditor.addEventListener('click', openEditor);
        if (btnCloseEditor) btnCloseEditor.addEventListener('click', closeEditor);
        if (editorOverlay) editorOverlay.addEventListener('click', closeEditor);

        // =====================================================================
        // IMAGE CHECK & FALLBACK HANDLER
        // =====================================================================

        function setupImageCheck(imgElement, errorPlaceholderElement) {
            if (!imgElement || !errorPlaceholderElement) return;

            imgElement.onerror = () => {
                imgElement.style.display = 'none';
                errorPlaceholderElement.style.display = 'flex';
            };
            imgElement.onload = () => {
                imgElement.style.display = 'block';
                errorPlaceholderElement.style.display = 'none';
            };

            // 防禦性檢查：若圖片已快取加載完成，主動觸發 onload/onerror 狀態同步
            if (imgElement.complete) {
                if (imgElement.naturalWidth === 0) {
                    imgElement.onerror();
                } else {
                    imgElement.onload();
                }
            }
        }

        function handleImageFileSelect(fileInputEl, textUrlInputEl) {
            if (!fileInputEl || !textUrlInputEl) return;
            fileInputEl.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                    textUrlInputEl.value = event.target.result;
                    textUrlInputEl.dispatchEvent(new Event('input'));
                };
                reader.readAsDataURL(file);
            });
        }

        // =====================================================================
        // LAYOUT SCHEME SELECTOR SYSTEM
        // =====================================================================
        let currentLayoutScheme = 'classic-split';

        function updateLayoutScheme(scheme) {
            currentLayoutScheme = scheme || 'classic-split';
            // Remove existing layouts
            gazetteCard.classList.remove('layout-classic-split', 'layout-feature-image', 'layout-minimalist-text');
            // Add current layout
            gazetteCard.classList.add(`layout-${currentLayoutScheme}`);

            // Update label text
            let displayLabel = '經典雙欄 (Classic Split)';
            if (currentLayoutScheme === 'feature-image') displayLabel = '海報大圖 (Feature Image)';
            else if (currentLayoutScheme === 'minimalist-text') displayLabel = '學術純文字 (Minimalist Text)';

            if (labelLayoutScheme) {
                labelLayoutScheme.textContent = displayLabel;
            }
        }
        updateLayoutScheme('classic-split'); // Init

        // =====================================================================
        // HELPER FUNCTIONS FOR FORMATTING NAMES
        // =====================================================================
        function escapeHtml(text) {
            if (text === null || text === undefined) return '';
            return String(text)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        function panguSpace(text) {
            if (!text) return '';
            const cjk = '[\u2e80-\u2fd5\u3190-\u319f\u3400-\u4dbf\u4e00-\u9fcc\u3040-\u30ff\u3100-\u312f]';
            const latin = '[a-zA-Z0-9]';
            let result = text;
            result = result.replace(new RegExp(`(${cjk})(${latin})`, 'g'), '$1 $2');
            result = result.replace(new RegExp(`(${latin})(${cjk})`, 'g'), '$1 $2');
            return result;
        }
        window.panguSpace = panguSpace;

        function wrapForeignNames(text) {
            if (!text) return '';
            // Matches foreign names like 諾曼·麥克萊倫, R·丹尼爾·奧立瓦, etc.
            // Prevents over-matching sentences by excluding common grammatical particles, punctuation, and verbs/adjectives, limiting component length to 1-5 chars.
            let result = text.replace(/([^\s，。：、；「」《》（）()""\"\'的與和是了在及但而也或與以其為將從被向\u00b7\u30fb經典發表創作引進說導演製指出示透露認下新舊古代世界年月日時]{1,5}(?:[\u00b7\u30fb][^\s，。：、；「」《》（）()""\"\'的與和是了在及但而也或與以其為將從被向\u00b7\u30fb經典發表創作引進說導演製指出示透露認下新舊古代世界年月日時]{1,5})+)/g, '<span class="text-nowrap">$1</span>');
            // Matches CJK book/movie titles wrapped in double angle brackets \u300a...\u300b to prevent wrapping inside them (only for short titles under 12 chars to avoid layout overflow)
            result = result.replace(/(\u300a[^\u300b]{1,12}\u300b)/g, '<span class="text-nowrap">$1</span>');
            return result;
        }
        window.wrapForeignNames = wrapForeignNames;

        // =====================================================================
        // DYNAMIC IMMERSIVE COLOR EXTRACTION (THEMING & CONTRAST ASSURANCE)
        // =====================================================================
        function extractThemeColor(img) {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Scale down the image to 40x40px to process quickly and average details
                canvas.width = 40;
                canvas.height = 40;

                ctx.drawImage(img, 0, 0, 40, 40);

                const imgData = ctx.getImageData(0, 0, 40, 40);
                const data = imgData.data;

                let rSum = 0, gSum = 0, bSum = 0, count = 0;
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i+1];
                    const b = data[i+2];
                    const a = data[i+3];

                    if (a < 200) continue; // Ignore transparent pixels

                    // Exclude pure white/black to avoid washing out the color hue
                    const brightness = (r + g + b) / 3;
                    if (brightness > 242 || brightness < 12) continue;

                    rSum += r;
                    gSum += g;
                    bSum += b;
                    count++;
                }

                if (count === 0) {
                    for (let i = 0; i < data.length; i += 4) {
                        rSum += data[i];
                        gSum += data[i+1];
                        bSum += data[i+2];
                        count++;
                    }
                }

                const avgR = Math.round(rSum / count);
                const avgG = Math.round(gSum / count);
                const avgB = Math.round(bSum / count);

                const [h, s, l] = rgbToHsl(avgR, avgG, avgB);

                // Design System Token Mapping with Accessibility contrast guarantees:
                // 1. Paper Background: extremely light, soft tinted paper (saturation <= 12%, lightness locked at 98%)
                const paperBgS = Math.min(s, 12);
                const paperBgL = 98;

                // 2. Paper Accent: readable contrast ink color (saturation >= 55%, lightness locked at 18% - 26%)
                const paperAccentS = Math.max(s, 55);
                const paperAccentL = Math.max(18, Math.min(l * 0.45, 26)); // Lower lightness to guarantee > 7.5:1 contrast

                // 3. Border/Lines color: soft beige/gray border tint
                const paperBorderLightS = Math.min(s, 14);
                const paperBorderLightL = 83;

                const gazetteCardEl = document.getElementById('gazetteCard');
                const shareCard = document.getElementById('shareCard');
                [gazetteCardEl, shareCard].forEach(card => {
                    if (card) {
                        card.style.setProperty('--paper-bg', `hsl(${h}, ${paperBgS}%, ${paperBgL}%)`);
                        card.style.setProperty('--paper-accent', `hsl(${h}, ${paperAccentS}%, ${paperAccentL}%)`);
                        card.style.setProperty('--paper-accent-alpha-04', `hsla(${h}, ${paperAccentS}%, ${paperAccentL}%, 0.04)`);
                        card.style.setProperty('--paper-accent-alpha-45', `hsla(${h}, ${paperAccentS}%, ${paperAccentL}%, 0.45)`);
                        card.style.setProperty('--paper-border-light', `hsl(${h}, ${paperBorderLightS}%, ${paperBorderLightL}%)`);
                    }
                });
                console.log(`[Theme Extracted] HSL(${h}, ${s}%, ${l}%) -> Accent: hsl(${h}, ${paperAccentS}%, ${paperAccentL}%)`);
            } catch (e) {
                console.warn('Theme color extraction failed (probably CORS block):', e);
                resetThemeColors();
            }
        }

        function resetThemeColors() {
            const gazetteCardEl = document.getElementById('gazetteCard');
            const shareCard = document.getElementById('shareCard');
            [gazetteCardEl, shareCard].forEach(card => {
                if (card) {
                    card.style.removeProperty('--paper-bg');
                    card.style.removeProperty('--paper-accent');
                    card.style.removeProperty('--paper-accent-alpha-04');
                    card.style.removeProperty('--paper-accent-alpha-45');
                    card.style.removeProperty('--paper-border-light');
                }
            });
            console.log('[Theme Reset] Reverted to default ivory and jujube red theme.');
        }

        function rgbToHsl(r, g, b) {
            r /= 255;
            g /= 255;
            b /= 255;
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;

            if (max === min) {
                h = s = 0;
            } else {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }

            return [
                Math.round(h * 360),
                Math.round(s * 100),
                Math.round(l * 100)
            ];
        }

        // =====================================================================
        // DATA BINDING FUNCTIONS
        // =====================================================================

        function syncText(input, cardElement, isParagraph = false) {
            if (!input || !cardElement) return;

            const update = () => {
                const val = panguSpace(input.value.trim());
                if (isParagraph) {
                    // Split paragraphs by newline and wrap each in <p>
                    cardElement.innerHTML = val.split('\n')
                        .map(p => p.trim() ? `<p>${wrapForeignNames(escapeHtml(p))}</p>` : '')
                        .join('');
                } else {
                    cardElement.innerHTML = wrapForeignNames(escapeHtml(val));
                }
                scheduleMagazineSync();
            };

            input.addEventListener('input', update);
            update(); // Initial sync
        }

        // Bind standard text fields for Cover
        syncText(inputGalaxyEra, cardGalaxyEra);

        // Bind dynamic edition number based on inputDate
        const updateEdition = () => {
            const dateStr = inputDate.value.trim();
            let issueNum = '001';

            let dates = [];
            if (window.FOUNDATION_ARCHIVES) {
                dates = Object.keys(window.FOUNDATION_ARCHIVES).filter(k => k !== 'draft');
            }

            if (dateStr && !dates.includes(dateStr)) {
                dates.push(dateStr);
            }

            // Sort dates chronologically (ascending)
            dates.sort((a, b) => a.localeCompare(b));

            const index = dates.indexOf(dateStr);
            if (index !== -1) {
                issueNum = String(index + 1).padStart(3, '0');
            }

            cardEdition.textContent = `NO. ${issueNum}`;
            scheduleMagazineSync();
        };
        inputDate.addEventListener('input', updateEdition);
        updateEdition();

        syncText(inputCoordinates, cardCoordinates);
        syncText(inputDate, cardDate);
        syncText(inputSparkTitle, cardSparkTitle);
        syncText(inputSparkIntro, cardSparkIntro, true);
        syncText(inputQuoteText, cardQuoteText);

        // Bind quote author (prepending em-dash)
        const updateAuthor = () => {
            const author = inputQuoteAuthor.value.trim();
            cardQuoteAuthor.innerHTML = author ? `— ${wrapForeignNames(escapeHtml(author))}` : '';
            scheduleMagazineSync();
        };
        inputQuoteAuthor.addEventListener('input', updateAuthor);
        updateAuthor();

        // Bind Image URL & Caption
        const updateImage = () => {
            const url = inputImageUrl.value.trim();
            if (url) {
                const tempImg = new Image();
                const isExternal = url.startsWith('http://') || url.startsWith('https://');
                if (isExternal) {
                    tempImg.setAttribute('crossorigin', 'anonymous');
                }
                
                // Synchronously set backgrounds immediately to prevent headless screenshot race conditions
                cardImage.style.backgroundImage = `url("${url}")`;
                cardImage.style.backgroundPosition = 'center';
                cardImage.style.display = 'block';
                cardImageError.style.display = 'none';
                
                const heroImage = document.getElementById('heroImage');
                if (heroImage) {
                    heroImage.style.backgroundImage = `url("${url}")`;
                }

                tempImg.onload = () => {
                    cardImage.style.backgroundImage = `url("${url}")`;
                    cardImage.style.backgroundPosition = 'center';
                    cardImage.style.display = 'block';
                    cardImageError.style.display = 'none';
                    if (heroImage) {
                        heroImage.style.backgroundImage = `url("${url}")`;
                    }
                    extractThemeColor(tempImg);
                    scheduleMagazineSync();
                };
                tempImg.onerror = () => {
                    cardImage.style.backgroundImage = 'none';
                    cardImage.style.display = 'none';
                    cardImageError.style.display = 'flex';
                    if (heroImage) {
                        heroImage.style.backgroundImage = 'none';
                    }
                    resetThemeColors();
                    scheduleMagazineSync();
                };
                tempImg.src = url;
            } else {
                cardImage.style.backgroundImage = 'none';
                cardImage.style.display = 'none';
                cardImageError.style.display = 'flex';
                const heroImage = document.getElementById('heroImage');
                if (heroImage) {
                    heroImage.style.backgroundImage = 'none';
                }
                resetThemeColors();
                scheduleMagazineSync();
            }
        };
        inputImageUrl.addEventListener('input', updateImage);
        updateImage();

        // Bind file upload for cover image
        const inputImageFile = document.getElementById('inputImageFile');
        const btnUploadImageFile = document.getElementById('btnUploadImageFile');
        if (btnUploadImageFile && inputImageFile) {
            btnUploadImageFile.addEventListener('click', () => inputImageFile.click());
            handleImageFileSelect(inputImageFile, inputImageUrl);
        }

        syncText(inputImageCaption, cardImageCaption);

        // =====================================================================
        // MARKDOWN-LIKE PARSER FOR ARTICLE SYSTEM
        // =====================================================================

        function parseArticleMarkdown(text) {
            if (!text) return '';
            const spacedText = panguSpace(text);
            return spacedText.split('\n')
                .map(line => {
                    const trimmed = line.trim();
                    if (!trimmed) return '';

                    let htmlContent;
                    let isSubtitle = false;
                    let isSlogan = false;

                    if (trimmed.startsWith('#### ')) {
                        htmlContent = wrapForeignNames(escapeHtml(trimmed.substring(5)));
                        isSubtitle = true;
                    } else if (trimmed.startsWith('> ')) {
                        htmlContent = wrapForeignNames(escapeHtml(trimmed.substring(2)));
                        isSlogan = true;
                    } else {
                        htmlContent = wrapForeignNames(escapeHtml(trimmed));
                    }

                    // Parse markdown bold **text** to <strong>text</strong>
                    htmlContent = htmlContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

                    if (isSubtitle) {
                        return `<h4 class="article-subtitle">${htmlContent}</h4>`;
                    }
                    if (isSlogan) {
                        return `<div class="article-slogan">${htmlContent}</div>`;
                    }
                    return `<p class="article-paragraph">${htmlContent}</p>`;
                })
                .filter(Boolean)
                .join('');
        }

        // =====================================================================
        // DYNAMIC ARTICLES SYSTEM (GAZETTE CARD)
        // =====================================================================

        function updateArticlesArea() {
            if (!cardArticlesArea) return;
            cardArticlesArea.innerHTML = '';

            // Count active news items to toggle grid layout
            const newsRows = newsInputsContainer.querySelectorAll('.news-item-input');
            let activeNewsCount = 0;
            newsRows.forEach((row) => {
                const headline = row.querySelector('.input-news-headline').value.trim();
                const summary = row.querySelector('.input-news-summary').value.trim();
                if (headline || summary) activeNewsCount++;
            });
            cardArticlesArea.classList.toggle('has-two-news', activeNewsCount >= 2);

            // 1. Render Main Article (Aesthetic Spark) Full Version
            const sparkTitle = inputSparkTitle.value.trim();
            const sparkFullTitle = inputSparkFullTitle.value.trim() || sparkTitle;
            const sparkContent = inputSparkContent.value.trim();

            if (sparkTitle || sparkContent) {
                const articleDiv = document.createElement('div');
                articleDiv.className = 'article-item spark-full';

                var wrappedTitle = wrapForeignNames(escapeHtml(sparkFullTitle));
                window.debugWrappedTitle = wrappedTitle;

                articleDiv.innerHTML = `
                    <div class="section-tag">READING / 專題深讀</div>
                    <h3 class="spark-title">${wrappedTitle}</h3>
                    <div class="spark-content-full">
                        ${parseArticleMarkdown(sparkContent)}
                    </div>
                `;
                cardArticlesArea.appendChild(articleDiv);
            }

            // 2. Render News Articles Full Version
            newsRows.forEach((row) => {
                const cat = row.querySelector('.input-news-cat').value.trim();
                const headline = row.querySelector('.input-news-headline').value.trim();
                const imgUrl = row.querySelector('.input-news-img-url').value.trim();
                const imgCap = row.querySelector('.input-news-img-caption').value.trim();
                const summary = row.querySelector('.input-news-summary').value.trim();

                if (headline || summary) {
                    const articleDiv = document.createElement('div');
                    articleDiv.className = 'article-item news-full';

                    let imageHtml = '';
                    if (imgUrl) {
                        const isExternal = imgUrl.startsWith('http://') || imgUrl.startsWith('https://');
                        const crossOriginAttr = isExternal ? 'crossorigin="anonymous"' : '';
                        imageHtml = `
                             <div class="article-image-block">
                                 <img src="${imgUrl}" alt="${headline}" class="news-full-img" ${crossOriginAttr}>
                                 <div class="image-error-placeholder news-img-error-placeholder" style="display: none;">
                                     <div class="placeholder-icon">📡</div>
                                     <div class="placeholder-text">影像暫停連線 / NO SIGNAL</div>
                                     <div class="placeholder-subtext">請確認圖片連結是否有效</div>
                                 </div>
                                 ${imgCap ? `<p class="article-image-caption">${imgCap}</p>` : ''}
                             </div>
                         `;
                    }

                    articleDiv.innerHTML = `
                        <div class="section-tag">${cat ? cat.toUpperCase() + ' REPORT' : 'NEWS REPORT'} / 時事深讀</div>
                        <h3 class="spark-title">${wrapForeignNames(escapeHtml(headline))}</h3>
                        ${imageHtml}
                        <div class="spark-content-full" style="margin-top: 15px;">
                            ${parseArticleMarkdown(summary)}
                        </div>
                    `;
                    cardArticlesArea.appendChild(articleDiv);

                    // Setup dynamic image check for this news item
                    if (imgUrl) {
                        const newsImg = articleDiv.querySelector('.news-full-img');
                        const newsImgPlaceholder = articleDiv.querySelector('.news-img-error-placeholder');
                        setupImageCheck(newsImg, newsImgPlaceholder);
                    }
                }
            });

            scheduleMagazineSync();
        }

        // Trigger update for articles area when main article titles/content change
        inputSparkTitle.addEventListener('input', updateArticlesArea);
        inputSparkFullTitle.addEventListener('input', updateArticlesArea);
        inputSparkContent.addEventListener('input', updateArticlesArea);

        // =====================================================================
        // DYNAMIC NEWS BINDING ON COVER
        // =====================================================================

        // Render the news list on the preview card (just Category and Headline as Cover Index!)
        function updateCardNews() {
            cardNewsList.innerHTML = '';
            const newsRows = newsInputsContainer.querySelectorAll('.news-item-input');

            newsRows.forEach(row => {
                const cat = row.querySelector('.input-news-cat').value.trim();
                const headline = row.querySelector('.input-news-headline').value.trim();

                if (cat || headline) {
                    const li = document.createElement('li');

                    const catSpan = document.createElement('span');
                    catSpan.className = 'news-cat';
                    catSpan.textContent = cat || 'NEWS';

                    const headlineSpan = document.createElement('span');
                    headlineSpan.className = 'news-headline';
                    headlineSpan.innerHTML = wrapForeignNames(escapeHtml(panguSpace(headline || '')));

                    li.appendChild(catSpan);
                    li.appendChild(headlineSpan);
                    cardNewsList.appendChild(li);
                }
            });

            scheduleMagazineSync();
        }

        // Set up listeners for news inputs
        function setupNewsListeners() {
            const newsInputs = newsInputsContainer.querySelectorAll('input, textarea');
            newsInputs.forEach(input => {
                input.removeEventListener('input', updateCardNews);
                input.removeEventListener('input', updateArticlesArea);
                input.addEventListener('input', updateCardNews);
                input.addEventListener('input', updateArticlesArea);
            });

            // Set up upload buttons for each news item
            const newsRows = newsInputsContainer.querySelectorAll('.news-item-input');
            newsRows.forEach(row => {
                const btnUpload = row.querySelector('.btn-upload-news-img');
                const fileInputEl = row.querySelector('.input-news-img-file');
                const textInput = row.querySelector('.input-news-img-url');
                if (btnUpload && fileInputEl && textInput) {
                    if (!btnUpload.dataset.listenerAttached) {
                        btnUpload.addEventListener('click', () => fileInputEl.click());
                        handleImageFileSelect(fileInputEl, textInput);
                        btnUpload.dataset.listenerAttached = 'true';
                    }
                }
            });

            updateCardNews();
            updateArticlesArea();
        }
        setupNewsListeners();

        // Re-create the HTML inputs for news based on data array
        function rebuildNewsInputs(newsArray) {
            newsInputsContainer.innerHTML = '';

            // Default to empty array if not present
            const news = newsArray || [{category: 'GAME', headline: '', imageUrl: '', imageCaption: '', summary: ''}];

            news.forEach((item, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'news-item-input';
                itemDiv.dataset.index = index;

                itemDiv.innerHTML = `
                    <div class="input-row">
                        <div class="input-group flex-3">
                            <label>類別 / Category</label>
                            <input type="text" class="input-news-cat" value="${item.category || ''}">
                        </div>
                        <div class="input-group flex-7">
                            <label>新聞標題 / Headline</label>
                            <input type="text" class="input-news-headline" value="${item.headline || ''}">
                        </div>
                    </div>
                    <div class="input-row" style="margin-top: 8px;">
                        <div class="input-group flex-6">
                            <label>圖片網址 / Image URL</label>
                            <div style="display: flex; gap: 8px;">
                                <input type="text" class="input-news-img-url" value="${item.imageUrl || ''}" style="flex: 1;">
                                <input type="file" class="input-news-img-file" accept="image/*" style="display: none;">
                                <button type="button" class="btn btn-secondary btn-upload-news-img" style="padding: 0 12px; font-size: 0.8rem; white-space: nowrap; margin-top: 0; min-height: 38px; flex: none;">上傳</button>
                            </div>
                        </div>
                        <div class="input-group flex-4">
                            <label>圖片說明 / Caption</label>
                            <input type="text" class="input-news-img-caption" value="${item.imageCaption || ''}">
                        </div>
                    </div>
                    <div class="input-group" style="margin-top: 8px;">
                        <label>詳細報導 / Full Report (支援 #### 子標題)</label>
                        <textarea class="input-news-summary" rows="4">${item.summary || ''}</textarea>
                    </div>
                `;
                newsInputsContainer.appendChild(itemDiv);
            });

            setupNewsListeners();
        }

        // =====================================================================
        // JSON DRAG & DROP / LOAD
        // =====================================================================

        dropZone.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                handleFile(e.dataTransfer.files[0]);
            }
        });

        function handleFile(file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    loadData(data);

                    dropZone.style.borderColor = '#34d399';
                    dropZone.querySelector('p').innerHTML = `✅ 已成功載入 <strong>${file.name}</strong>`;
                    setTimeout(() => {
                        dropZone.style.borderColor = '';
                        dropZone.querySelector('p').innerHTML = `拖曳 <code>draft.json</code> 至此或點擊上傳`;
                    }, 3000);
                } catch (err) {
                    alert('JSON 解析失敗，請檢查檔案格式！\n錯誤資訊: ' + err.message);
                }
            };
            reader.readAsText(file);
        }

        // Load data structure into input fields and trigger binding updates
        function loadData(data) {
            isRestoring = true;
            try {
                if (data.galaxyEra !== undefined) inputGalaxyEra.value = data.galaxyEra;
                if (data.dateString !== undefined) inputDate.value = data.dateString;
                if (data.coordinates !== undefined) inputCoordinates.value = data.coordinates;
                if (data.layoutScheme !== undefined) {
                    updateLayoutScheme(data.layoutScheme);
                } else {
                    updateLayoutScheme('classic-split');
                }

                if (data.inkFilterActive !== undefined) {
                    toggleInkFilter.checked = data.inkFilterActive;
                    gazetteCard.classList.toggle('ink-filter', data.inkFilterActive);
                    const magazineMain = document.getElementById('magazineMain');
                    if (magazineMain) magazineMain.classList.toggle('ink-filter', data.inkFilterActive);
                } else {
                    toggleInkFilter.checked = false;
                    gazetteCard.classList.toggle('ink-filter', false);
                    const magazineMain = document.getElementById('magazineMain');
                    if (magazineMain) magazineMain.classList.toggle('ink-filter', false);
                }

                if (data.aestheticSpark) {
                    if (data.aestheticSpark.title !== undefined) inputSparkTitle.value = data.aestheticSpark.title;
                    if (data.aestheticSpark.fullTitle !== undefined) {
                        inputSparkFullTitle.value = data.aestheticSpark.fullTitle;
                    } else {
                        inputSparkFullTitle.value = '';
                    }
                    if (data.aestheticSpark.intro !== undefined) inputSparkIntro.value = data.aestheticSpark.intro;
                    if (data.aestheticSpark.content !== undefined) inputSparkContent.value = data.aestheticSpark.content;
                    if (data.aestheticSpark.shareCardText !== undefined) {
                        inputShareCardText.value = data.aestheticSpark.shareCardText;
                    } else {
                        inputShareCardText.value = data.aestheticSpark.intro ? data.aestheticSpark.intro.substring(0, 45) : '';
                    }
                }

                if (data.guardiansQuote) {
                    if (data.guardiansQuote.quote !== undefined) inputQuoteText.value = data.guardiansQuote.quote;
                    if (data.guardiansQuote.author !== undefined) inputQuoteAuthor.value = data.guardiansQuote.author;
                }

                if (data.visualArtifact) {
                    if (data.visualArtifact.imageUrl !== undefined) inputImageUrl.value = data.visualArtifact.imageUrl;
                    if (data.visualArtifact.caption !== undefined) inputImageCaption.value = data.visualArtifact.caption;
                }

                // Rebuild news inputs dynamically
                rebuildNewsInputs(data.dynamicNews);

                // Manually dispatch events to force visual update
                inputGalaxyEra.dispatchEvent(new Event('input'));
                inputCoordinates.dispatchEvent(new Event('input'));
                inputDate.dispatchEvent(new Event('input'));
                inputSparkTitle.dispatchEvent(new Event('input'));
                inputSparkFullTitle.dispatchEvent(new Event('input'));
                inputSparkIntro.dispatchEvent(new Event('input'));
                inputSparkContent.dispatchEvent(new Event('input'));
                inputQuoteText.dispatchEvent(new Event('input'));
                inputQuoteAuthor.dispatchEvent(new Event('input'));
                inputImageUrl.dispatchEvent(new Event('input'));
                inputImageCaption.dispatchEvent(new Event('input'));
                inputShareCardText.dispatchEvent(new Event('input'));

                // Re-render articles
                updateArticlesArea();

                // Sync magazine view after all data is loaded
                syncMagazineView();

                // 載入完成後滾動到頁面頂端
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } finally {
                isRestoring = false;
            }
        }

        // =====================================================================
        // JSON DOWNLOADING (SAVE STATE)
        // =====================================================================

        btnDownloadJson.addEventListener('click', () => {
            const newsItems = [];
            newsInputsContainer.querySelectorAll('.news-item-input').forEach(row => {
                newsItems.push({
                    category: row.querySelector('.input-news-cat').value.trim(),
                    headline: row.querySelector('.input-news-headline').value.trim(),
                    imageUrl: row.querySelector('.input-news-img-url').value.trim(),
                    imageCaption: row.querySelector('.input-news-img-caption').value.trim(),
                    summary: row.querySelector('.input-news-summary').value.trim()
                });
            });

            const currentData = {
                galaxyEra: inputGalaxyEra.value.trim(),
                dateString: inputDate.value.trim(),
                coordinates: inputCoordinates.value.trim(),
                layoutScheme: currentLayoutScheme,
                inkFilterActive: toggleInkFilter.checked,
                aestheticSpark: {
                    title: inputSparkTitle.value.trim(),
                    fullTitle: inputSparkFullTitle.value.trim(),
                    intro: inputSparkIntro.value.trim(),
                    content: inputSparkContent.value.trim(),
                    shareCardText: inputShareCardText.value.trim()
                },
                guardiansQuote: {
                    quote: inputQuoteText.value.trim(),
                    author: inputQuoteAuthor.value.trim()
                },
                dynamicNews: newsItems,
                visualArtifact: {
                    imageUrl: inputImageUrl.value.trim(),
                    caption: inputImageCaption.value.trim()
                }
            };

            const jsonString = JSON.stringify(currentData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const dateSanitized = inputDate.value.trim().replace(/[^a-zA-Z0-9]/g, '_');
            const filename = `draft_${dateSanitized || 'new'}.json`;

            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();

            URL.revokeObjectURL(url);
        });

        // =====================================================================
        // PNG EXPORT WITH HIGH-RES html2canvas
        // =====================================================================

        btnExportPng.addEventListener('click', () => {
            const card = document.getElementById('gazetteCard');

            btnExportPng.textContent = '⏳ 正在導出...';
            btnExportPng.disabled = true;

            const options = {
                scale: 2,
                useCORS: true,
                allowTaint: false,
                backgroundColor: '#fdfcf9',
                logging: false,
                scrollX: 0,
                scrollY: 0,
                height: card.scrollHeight,
                windowHeight: card.scrollHeight + 200,
                onclone: (clonedDoc) => {
                    // Remove all script tags to prevent JS from re-running in the html2canvas iframe
                    const scripts = clonedDoc.querySelectorAll('script');
                    scripts.forEach(s => s.remove());

                    // Fix html2canvas object-fit cover bug by converting img tags to divs with background-size: cover
                    const originalCard = document.getElementById('gazetteCard');
                    const clonedCard = clonedDoc.getElementById('gazetteCard');
                    if (originalCard && clonedCard) {
                        const originalImgs = originalCard.querySelectorAll('img');
                        const clonedImgs = clonedCard.querySelectorAll('img');
                        clonedImgs.forEach((clonedImg, idx) => {
                            const originalImg = originalImgs[idx];
                            if (originalImg && originalImg.src && originalImg.style.display !== 'none' && originalImg.offsetHeight > 0) {
                                const div = clonedDoc.createElement('div');
                                div.className = (clonedImg.className || '') + ' cloned-bg-image';
                                div.style.cssText = clonedImg.style.cssText;

                                // Copy dimensions from original rendered image
                                div.style.width = `${originalImg.offsetWidth}px`;
                                div.style.height = `${originalImg.offsetHeight}px`;
                                div.style.display = 'block';

                                // Replicate object-fit: cover via background-image
                                div.style.backgroundImage = `url("${clonedImg.src}")`;
                                div.style.backgroundSize = 'cover';
                                div.style.backgroundRepeat = 'no-repeat';

                                // Copy object-position
                                const computedStyle = window.getComputedStyle(originalImg);
                                div.style.backgroundPosition = computedStyle.objectPosition || 'center';

                                // Replace in cloned DOM
                                clonedImg.parentNode.replaceChild(div, clonedImg);
                            }
                        });
                    }

                    clonedCard.style.transform = 'none';
                    clonedCard.style.boxShadow = 'none';
                    clonedCard.style.border = 'none';
                }
            };

            setTimeout(() => {
                html2canvas(card, options).then(canvas => {
                    const imgData = canvas.toDataURL('image/png');

                    const dateSanitized = inputDate.value.trim().replace(/[^a-zA-Z0-9]/g, '_');
                    const filename = `foundation_gazette_${dateSanitized || 'daily'}.png`;

                    const a = document.createElement('a');
                    a.href = imgData;
                    a.download = filename;
                    a.click();

                    btnExportPng.textContent = '🖼️ 導出日報圖 (PNG)';
                    btnExportPng.disabled = false;
                }).catch(err => {
                    console.error(err);
                    alert('導出圖片時出錯，可能是跨域圖片資源 (CORS) 限制導致。\n\n💡 解決方案：\n如果您是在本地直接以雙擊打開 index.html，請點擊控制台中的「上傳」按鈕重新選取本地圖片（這會將圖片轉換為免跨域的 Base64 數據流），即可正常導出！\n\n您也可以雙擊我們在專案根目錄為您建立的「啟動本地伺服器.bat」檔案，透過 http://localhost:8000 瀏覽網頁，即可一鍵免設定導出。');
                    btnExportPng.textContent = '🖼️ 導出日報圖 (PNG)';
                    btnExportPng.disabled = false;
                });
            }, 100);
        });

        // =====================================================================
        // TOGGLE INK FILTER
        // =====================================================================
        if (toggleInkFilter) {
            toggleInkFilter.addEventListener('change', () => {
                if (isRestoring) return;
                const active = toggleInkFilter.checked;
                gazetteCard.classList.toggle('ink-filter', active);
                const magazineMain = document.getElementById('magazineMain');
                if (magazineMain) {
                    magazineMain.classList.toggle('ink-filter', active);
                }
                autoSaveDraft();
            });
        }

        // =====================================================================
        // RESET DRAFT BUTTON
        // =====================================================================
        if (btnClearDraft) {
            btnClearDraft.addEventListener('click', () => {
                if (confirm('確定要清除瀏覽器中的暫存草稿並重設為預設狀態嗎？\n這將會重新載入初始內容。')) {
                    localStorage.removeItem('foundation_gazette_auto_draft');
                    window.location.reload();
                }
            });
        }

        // =====================================================================
        // LOCAL AUTO-SAVE SYSTEM
        // =====================================================================
        function showAutosaveToast() {
            const toast = document.getElementById('editorAutosaveToast');
            if (toast) {
                toast.classList.add('show');
                clearTimeout(window._autosaveToastTimeout);
                window._autosaveToastTimeout = setTimeout(() => {
                    toast.classList.remove('show');
                }, 1500);
            }
        }

        function autoSaveDraft() {
            const newsItems = [];
            newsInputsContainer.querySelectorAll('.news-item-input').forEach(row => {
                newsItems.push({
                    category: row.querySelector('.input-news-cat').value.trim(),
                    headline: row.querySelector('.input-news-headline').value.trim(),
                    imageUrl: row.querySelector('.input-news-img-url').value.trim(),
                    imageCaption: row.querySelector('.input-news-img-caption').value.trim(),
                    summary: row.querySelector('.input-news-summary').value.trim()
                });
            });

            const currentData = {
                galaxyEra: inputGalaxyEra.value.trim(),
                dateString: inputDate.value.trim(),
                coordinates: inputCoordinates.value.trim(),
                layoutScheme: currentLayoutScheme,
                inkFilterActive: toggleInkFilter ? toggleInkFilter.checked : false,
                aestheticSpark: {
                    title: inputSparkTitle.value.trim(),
                    fullTitle: inputSparkFullTitle.value.trim(),
                    intro: inputSparkIntro.value.trim(),
                    content: inputSparkContent.value.trim(),
                    shareCardText: inputShareCardText.value.trim()
                },
                guardiansQuote: {
                    quote: inputQuoteText.value.trim(),
                    author: inputQuoteAuthor.value.trim()
                },
                dynamicNews: newsItems,
                visualArtifact: {
                    imageUrl: inputImageUrl.value.trim(),
                    caption: inputImageCaption.value.trim()
                }
            };

            localStorage.setItem('foundation_gazette_auto_draft', JSON.stringify(currentData));
            console.log('Draft auto-saved to localStorage');
            showAutosaveToast();
        }

        // Global listener for auto-save on input
        const inputsToWatch = [
            inputGalaxyEra, inputDate, inputCoordinates,
            inputSparkTitle, inputSparkFullTitle, inputSparkIntro, inputSparkContent,
            inputQuoteText, inputQuoteAuthor, inputImageUrl, inputImageCaption,
            inputShareCardText
        ];
        inputsToWatch.forEach(inputEl => {
            if (inputEl) {
                inputEl.addEventListener('input', () => {
                    if (isRestoring) return;
                    clearTimeout(window.autoSaveTimeout);
                    window.autoSaveTimeout = setTimeout(autoSaveDraft, 800);
                });
            }
        });

        if (newsInputsContainer) {
            newsInputsContainer.addEventListener('input', () => {
                if (isRestoring) return;
                clearTimeout(window.autoSaveTimeout);
                window.autoSaveTimeout = setTimeout(autoSaveDraft, 800);
            });
        }

        // =====================================================================
        // ARCHIVE SELECTOR, SHARE MODAL, AND URL PARAMETERS
        // =====================================================================
        const selectArchive = document.getElementById('selectArchive');
        const btnOpenShareModal = document.getElementById('btnOpenShareModal');
        const btnCloseShareModal = document.getElementById('btnCloseShareModal');
        const shareModalOverlay = document.getElementById('shareModalOverlay');
        const btnCopyTeaserText = document.getElementById('btnCopyTeaserText');
        const btnDownloadShareCard = document.getElementById('btnDownloadShareCard');
        const shareTeaserText = document.getElementById('shareTeaserText');

        const shareCardDate = document.getElementById('shareCardDate');
        const shareCardTitle = document.getElementById('shareCardTitle');
        const shareCardIntro = document.getElementById('shareCardIntro');
        const shareCardImage = document.getElementById('shareCardImage');

        // Handle Issue Loading
        function loadArchiveEdition(editionValue) {
            if (editionValue === 'draft') {
                try {
                    const isScreenshotMode = window.navigator.webdriver || 
                                             window.location.search.includes('screenshot=true') || 
                                             window.location.search.includes('headless=true');
                    const savedDraft = isScreenshotMode ? null : localStorage.getItem('foundation_gazette_auto_draft');
                    if (savedDraft) {
                        const parsed = JSON.parse(savedDraft);
                        loadData(parsed);
                        console.log('Restored draft from localStorage for select option "draft"');
                        return;
                    }
                } catch (err) {
                    console.error('Failed to parse auto-save draft from localStorage:', err);
                }
            }

            // check in-memory fallback first (synchronous!)
            if (window.FOUNDATION_ARCHIVES) {
                if (window.FOUNDATION_ARCHIVES[editionValue]) {
                    loadData(window.FOUNDATION_ARCHIVES[editionValue]);
                    console.log(`Successfully loaded edition synchronously from memory: ${editionValue}`);
                    return;
                }
                const isScreenshotMode = window.navigator.webdriver || 
                                         window.location.search.includes('screenshot=true') || 
                                         window.location.search.includes('headless=true');
                if (isScreenshotMode) {
                    const draftData = window.FOUNDATION_ARCHIVES['draft'];
                    if (draftData && draftData.dateString === editionValue) {
                        loadData(draftData);
                        console.log(`Successfully loaded current draft synchronously as ${editionValue} from memory (screenshot mode)`);
                        return;
                    }
                }
            }

            let fetchUrl = 'data/draft.json';
            if (editionValue !== 'draft') {
                // Convert e.g., "2026.05.20" to "2026_05_20.json"
                const filename = editionValue.replace(/\./g, '_') + '.json';
                fetchUrl = `data/archive/${filename}`;
            }

            fetch(fetchUrl)
                .then(res => {
                    if (!res.ok) throw new Error(`無法載入期數檔案 (${fetchUrl})`);
                    return res.json();
                })
                .then(data => {
                    loadData(data);
                    console.log(`Loaded edition: ${editionValue}`);
                })
                .catch(err => {
                    console.warn(`Fetch failed for ${editionValue}:`, err);
                    alert(`載入錯誤: ${err.message}\n\n💡 提示：請確保該期數的 JSON 檔案存在於 data/archive 目錄下。`);
                    if (selectArchive) selectArchive.value = 'draft';
                });
        }

        if (selectArchive) {
            selectArchive.addEventListener('change', (e) => {
                loadArchiveEdition(e.target.value);
            });
        }

        // =====================================================================
        // SHARE MODAL & TEASER TEXT GENERATION
        // =====================================================================
        function generateTeaserText() {
            const title = inputSparkTitle.value.trim();
            let introText = '';
            if (inputSparkIntro) {
                introText = inputSparkIntro.value.trim().replace(/\n/g, ' ').substring(0, 100);
            }
            const date = inputDate.value.trim();

            const newsItems = [];
            newsInputsContainer.querySelectorAll('.news-item-input').forEach(row => {
                const headline = row.querySelector('.input-news-headline').value.trim();
                if (headline) newsItems.push(headline);
            });

            let teaser = `【基地日報 | FOUNDATION GAZETTE】\n`;
            teaser += `📅 出版日期：${date}\n\n`;
            teaser += `✨ 本期美學專題：${title}\n`;
            if (introText) {
                teaser += `「${introText}...」\n`;
            }
            teaser += `\n`;

            if (newsItems.length > 0) {
                teaser += `🔥 時事與遊戲動態：\n`;
                newsItems.forEach(item => {
                    teaser += `📍 ${item}\n`;
                });
                teaser += `\n`;
            }

            // Get current URL and append mode=read and issue
            let readUrl = window.location.origin + window.location.pathname;
            const currentEdition = selectArchive ? selectArchive.value : 'draft';
            if (currentEdition !== 'draft') {
                readUrl += `?mode=read&issue=${currentEdition}`;
            } else {
                readUrl += `?mode=read`;
            }

            teaser += `👉 點擊連結閱讀排版優美的數位報紙（支援手機與電腦）：\n🔗 ${readUrl}`;
            return teaser;
        }

        function updateShareCardPreview() {
            if (shareCardDate) shareCardDate.textContent = inputDate.value.trim();
            if (shareCardTitle) shareCardTitle.innerHTML = wrapForeignNames(escapeHtml(panguSpace(inputSparkTitle.value.trim())));

            if (shareCardIntro) {
                shareCardIntro.innerHTML = wrapForeignNames(escapeHtml(panguSpace(inputShareCardText.value.trim())));
            }

            if (shareCardImage) {
                const imgUrl = inputImageUrl.value.trim() || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=800&auto=format&fit=crop';
                shareCardImage.style.backgroundImage = `url("${imgUrl}")`;
                shareCardImage.style.backgroundPosition = 'center';
            }

            // Dynamically update the issue volume number (e.g., FOUNDATION ERA 01 -> N° 01)
            const shareCardVol = document.querySelector('.share-card-vol');
            const secureTrans = document.querySelector('.secure-trans');
            if (shareCardVol || secureTrans) {
                const eraText = inputGalaxyEra ? inputGalaxyEra.value.trim() : '';
                const match = eraText.match(/\d+/);
                const issueNum = match ? match[0].padStart(2, '0') : '02';
                if (shareCardVol) shareCardVol.textContent = `N° ${issueNum}`;
                if (secureTrans) secureTrans.textContent = `FOUNDATION SECURED TRANSMISSION PROTOCOL // ARCHIVE N° ${issueNum}`;
            }

            // Get the first two news headlines for the sharing card footer
            const shareCardNews1 = document.getElementById('shareCardNews1');
            const shareCardNews2 = document.getElementById('shareCardNews2');
            const newsItems = [];
            newsInputsContainer.querySelectorAll('.news-item-input').forEach(row => {
                const category = row.querySelector('.input-news-cat').value.trim();
                const headline = row.querySelector('.input-news-headline').value.trim();
                if (headline) {
                    newsItems.push({ category: category || 'NEWS', headline });
                }
            });

            if (shareCardNews1) {
                if (newsItems[0]) {
                    const tagEl = shareCardNews1.querySelector('.share-news-tag');
                    const titleEl = shareCardNews1.querySelector('.share-news-title');
                    if (tagEl) tagEl.textContent = newsItems[0].category;
                    if (titleEl) titleEl.innerHTML = wrapForeignNames(escapeHtml(panguSpace(newsItems[0].headline)));
                    shareCardNews1.style.display = 'flex';
                } else {
                    shareCardNews1.style.display = 'none';
                }
            }
            if (shareCardNews2) {
                if (newsItems[1]) {
                    const tagEl = shareCardNews2.querySelector('.share-news-tag');
                    const titleEl = shareCardNews2.querySelector('.share-news-title');
                    if (tagEl) tagEl.textContent = newsItems[1].category;
                    if (titleEl) titleEl.innerHTML = wrapForeignNames(escapeHtml(panguSpace(newsItems[1].headline)));
                    shareCardNews2.style.display = 'flex';
                } else {
                    shareCardNews2.style.display = 'none';
                }
            }
        }

        if (btnOpenShareModal) {
            btnOpenShareModal.addEventListener('click', () => {
                if (shareTeaserText) {
                    shareTeaserText.value = generateTeaserText();
                }
                updateShareCardPreview();
                if (shareModalOverlay) {
                    shareModalOverlay.style.display = 'flex';
                }
            });
        }

        if (btnCloseShareModal) {
            btnCloseShareModal.addEventListener('click', () => {
                if (shareModalOverlay) {
                    shareModalOverlay.style.display = 'none';
                }
            });
        }

        if (shareModalOverlay) {
            shareModalOverlay.addEventListener('click', (e) => {
                if (e.target === shareModalOverlay) {
                    shareModalOverlay.style.display = 'none';
                }
            });
        }

        const btnCloseNewsModal = document.getElementById('btnCloseNewsModal');
        const newsDetailModal = document.getElementById('newsDetailModal');
        if (btnCloseNewsModal && newsDetailModal) {
            btnCloseNewsModal.addEventListener('click', () => {
                newsDetailModal.style.display = 'none';
            });
            newsDetailModal.addEventListener('click', (e) => {
                if (e.target === newsDetailModal) {
                    newsDetailModal.style.display = 'none';
                }
            });
        }

        if (btnCopyTeaserText) {
            btnCopyTeaserText.addEventListener('click', () => {
                if (shareTeaserText) {
                    shareTeaserText.select();
                    navigator.clipboard.writeText(shareTeaserText.value)
                        .then(() => {
                            btnCopyTeaserText.textContent = '✅ 已複製！';
                            setTimeout(() => {
                                btnCopyTeaserText.textContent = '📋 複製導讀文案';
                            }, 2000);
                        })
                        .catch(err => {
                            console.error('複製失敗: ', err);
                            // Fallback copy method
                            document.execCommand('copy');
                            btnCopyTeaserText.textContent = '✅ 已複製！';
                            setTimeout(() => {
                                btnCopyTeaserText.textContent = '📋 複製導讀文案';
                            }, 2000);
                        });
                }
            });
        }

        if (btnDownloadShareCard) {
            btnDownloadShareCard.addEventListener('click', () => {
                const card = document.getElementById('shareCard');
                btnDownloadShareCard.textContent = '⏳ 正在導出...';
                btnDownloadShareCard.disabled = true;

                const options = {
                    scale: 3, // High-res
                    useCORS: true,
                    backgroundColor: '#fdfcf9',
                    logging: false,
                    onclone: (clonedDoc) => {
                        const clonedCard = clonedDoc.getElementById('shareCard');
                        clonedCard.style.boxShadow = 'none';
                        clonedCard.style.border = 'none';

                        // Copy loaded fonts to the cloned document to prevent duplicate/double text rendering from font fallbacks
                        if (document.fonts && clonedDoc.fonts) {
                            document.fonts.forEach(font => {
                                clonedDoc.fonts.add(font);
                            });
                        }

                        // 保留 Google Fonts Stylesheets 連結，以利 html2canvas 在 iframe 中解析並套用正確的襯線與宋體字型

                        // html2canvas text scale bug workaround:
                        // html2canvas fails to correctly scale the text inside stamps when transform: scale(...) is combined with high options.scale.
                        // Overriding transform to remove the scale component, leaving only the rotation.
                        // We also slightly adjust font-size and padding inside the clone to ensure the text remains beautifully centered and legible.
                        const tags = clonedDoc.querySelectorAll('.share-news-tag');
                        tags.forEach((tag, idx) => {
                            tag.style.fontSize = '0.58rem';
                            tag.style.padding = '2.5px 4px 1.5px 4px';
                            if (idx === 1) {
                                tag.style.transform = 'rotate(0.8deg)';
                            } else {
                                tag.style.transform = 'rotate(-1deg)';
                            }
                        });
                    }
                };

                document.fonts.ready.then(() => {
                    setTimeout(() => {
                        html2canvas(card, options).then(canvas => {
                            const imgData = canvas.toDataURL('image/png');

                        // Automation/Testing: If downloadShare=true parameter is set, render the image to the body and POST to server
                        const urlParams = new URLSearchParams(window.location.search);
                        if (urlParams.get('downloadShare') === 'true') {
                            document.body.innerHTML = '';
                            const img = document.createElement('img');
                            img.src = imgData;
                            img.style.width = '100vw';
                            img.style.height = 'auto';
                            img.style.display = 'block';
                            document.body.appendChild(img);
                            document.body.style.margin = '0';
                            document.body.style.padding = '0';
                            document.body.style.overflow = 'visible';
                            document.title = 'TEST_RENDER_COMPLETE';

                            fetch('/save-test-image', {
                                method: 'POST',
                                headers: { 'Content-Type': 'text/plain' },
                                body: imgData
                            }).then(r => r.text())
                              .then(msg => console.log('POST success:', msg))
                              .catch(e => console.error('POST error:', e));

                            return;
                        }

                        const filename = `gazette_share_card_${inputDate.value.trim().replace(/\./g, '_')}.png`;
                        const a = document.createElement('a');
                        a.href = imgData;
                        a.download = filename;
                        a.click();

                        btnDownloadShareCard.textContent = '🖼️ 下載直向分享卡 (PNG)';
                        btnDownloadShareCard.disabled = false;
                    }).catch(err => {
                        console.error(err);
                        alert('導出分享卡失敗，可能由於圖片 CORS 限制。\n\n💡 提示：若使用本地圖片，請利用「上傳」按鈕重新載入，或使用本地伺服器瀏覽網頁。');
                        btnDownloadShareCard.textContent = '🖼️ 下載直向分享卡 (PNG)';
                        btnDownloadShareCard.disabled = false;
                    });
                }, 1500);
                });
            });
        }

        // =====================================================================
        // DYNAMICALLY POPULATE ARCHIVES SELECT OPTIONS
        // =====================================================================
        if (window.FOUNDATION_ARCHIVES && selectArchive) {
            selectArchive.innerHTML = '';

            // Add draft option first
            const optDraft = document.createElement('option');
            optDraft.value = 'draft';
            optDraft.textContent = '當前編輯草稿 (Latest)';
            selectArchive.appendChild(optDraft);

            // Get sorted keys descending (excluding draft)
            const archiveKeys = Object.keys(window.FOUNDATION_ARCHIVES)
                .filter(k => k !== 'draft')
                .sort((a, b) => b.localeCompare(a));

            archiveKeys.forEach((key, index) => {
                const opt = document.createElement('option');
                opt.value = key;
                const noNum = String(archiveKeys.length - index).padStart(3, '0');
                opt.textContent = `NO. ${noNum} - ${key}`;
                selectArchive.appendChild(opt);
            });
        }

        // =====================================================================
        // URL QUERY PARAMETERS
        // =====================================================================
        const urlParams = new URLSearchParams(window.location.search);
        const paramMode = urlParams.get('mode');
        const paramIssue = urlParams.get('issue');

        // =====================================================================
        // INITIAL STARTUP DATA LOAD
        // =====================================================================
        let restoredFromLocal = false;

        // Check URL parameters first!
        if (paramIssue) {
            if (selectArchive) selectArchive.value = paramIssue;
            loadArchiveEdition(paramIssue);
            restoredFromLocal = true;
        } else {
            try {
                const isScreenshotMode = window.navigator.webdriver || 
                                         window.location.search.includes('screenshot=true') || 
                                         window.location.search.includes('headless=true');
                const savedDraft = isScreenshotMode ? null : localStorage.getItem('foundation_gazette_auto_draft');
                if (savedDraft) {
                    const parsed = JSON.parse(savedDraft);
                    loadData(parsed);
                    restoredFromLocal = true;
                    console.log('Successfully restored draft from localStorage auto-save.');
                }
            } catch (err) {
                console.error('Failed to parse auto-save draft from localStorage:', err);
            }
        }

        if (!restoredFromLocal) {
            const isScreenshotMode = window.navigator.webdriver || 
                                     window.location.search.includes('screenshot=true') || 
                                     window.location.search.includes('headless=true');
            if (isScreenshotMode && window.FOUNDATION_ARCHIVES && window.FOUNDATION_ARCHIVES['draft']) {
                loadData(window.FOUNDATION_ARCHIVES['draft']);
                restoredFromLocal = true;
                console.log('Successfully loaded default draft synchronously from memory (screenshot mode).');
            } else {
                // Attempt Auto-loading local draft.json
                fetch('data/draft.json')
                    .then(response => {
                        if (response.ok) return response.json();
                        throw new Error('Not ok');
                    })
                    .then(data => {
                        loadData(data);
                        console.log('Automatically loaded data/draft.json');
                    })
                    .catch(err => {
                        console.log('Auto-load of data/draft.json failed or skipped (common for local file:// protocol). Trying memory fallback.');
                        if (window.FOUNDATION_ARCHIVES && window.FOUNDATION_ARCHIVES['draft']) {
                            loadData(window.FOUNDATION_ARCHIVES['draft']);
                            console.log('Successfully loaded default draft from memory fallback.');
                        }
                    });
            }
        }

        if (paramMode === 'edit') {
            setTimeout(openEditor, 300);
        }

        // =====================================================================
        // AUTO-OPEN SHARE MODAL (HEADLESS TESTING HOOK)
        // =====================================================================
        const paramOpenShare = urlParams.get('openShare');
        const paramDownloadShare = urlParams.get('downloadShare');
        if (paramOpenShare === 'true') {
            setTimeout(() => {
                if (shareTeaserText) {
                    shareTeaserText.value = generateTeaserText();
                }
                updateShareCardPreview();
                if (shareModalOverlay) {
                    shareModalOverlay.style.display = 'flex';
                }
                if (paramDownloadShare === 'true' && btnDownloadShareCard) {
                    setTimeout(() => {
                        btnDownloadShareCard.click();
                    }, 300);
                }
            }, 500);
        }

        // =====================================================================
        // TELEGRAM REVISION FEEDBACK POLLING SYSTEM
        // =====================================================================
        (function setupFeedbackPolling() {
            const feedbackBanner = document.getElementById('feedback-banner');
            const feedbackText = document.getElementById('feedback-text');
            const feedbackTime = document.getElementById('feedback-time');
            const btnDismissFeedback = document.getElementById('btnDismissFeedback');

            if (!feedbackBanner || !feedbackText || !feedbackTime || !btnDismissFeedback) return;

            let lastTimestamp = '';
            let dismissedTimestamps = new Set();

            btnDismissFeedback.addEventListener('click', () => {
                feedbackBanner.classList.add('feedback-banner-hidden');
                if (lastTimestamp) {
                    dismissedTimestamps.add(lastTimestamp);
                }
            });

            function pollFeedback() {
                fetch(`data/feedback.json?t=${Date.now()}`)
                    .then(response => {
                        if (response.ok) return response.json();
                        throw new Error('No feedback or not found');
                    })
                    .then(data => {
                        if (data && data.content && data.timestamp) {
                            const content = data.content.trim();
                            const timestamp = data.timestamp.trim();

                            if (content) {
                                feedbackText.textContent = content;
                                feedbackTime.textContent = timestamp;

                                lastTimestamp = timestamp;

                                // Only show if not dismissed in this session
                                if (!dismissedTimestamps.has(timestamp)) {
                                    feedbackBanner.classList.remove('feedback-banner-hidden');
                                }
                            } else {
                                feedbackBanner.classList.add('feedback-banner-hidden');
                            }
                        } else {
                            feedbackBanner.classList.add('feedback-banner-hidden');
                        }
                    })
                    .catch(err => {
                        feedbackBanner.classList.add('feedback-banner-hidden');
                    });
            }

            pollFeedback();
            setInterval(pollFeedback, 3000);
        })();

        // =====================================================================
        // NEW MODULE: syncMagazineView()
        // Syncs the magazine reading view with the gazette-card's rendered content
        // =====================================================================

        function setText(id, text) {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        }

        function syncTocNews() {
            const tocNewsList = document.getElementById('tocNewsList');
            if (!tocNewsList) return;
            tocNewsList.innerHTML = '';
            const newsRows = newsInputsContainer.querySelectorAll('.news-item-input');
            newsRows.forEach((row, i) => {
                const cat = row.querySelector('.input-news-cat').value.trim();
                const headline = row.querySelector('.input-news-headline').value.trim();
                if (headline) {
                    const item = document.createElement('a');
                    item.className = 'toc-news-item';
                    item.href = `#newsCard${i}`;
                    item.innerHTML = `
                        <span class="toc-news-cat">${escapeHtml(cat || 'NEWS')}</span>
                        <span class="toc-news-title">${wrapForeignNames(escapeHtml(panguSpace(headline)))}</span>
                    `;
                    item.addEventListener('click', (e) => {
                        e.preventDefault();
                        const target = document.getElementById(`newsCard${i}`);
                        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    });
                    tocNewsList.appendChild(item);
                }
            });
        }

        function syncNewsCards() {
            const newsCards = document.getElementById('newsCards');
            if (!newsCards) return;
            newsCards.innerHTML = '';
            const newsRows = newsInputsContainer.querySelectorAll('.news-item-input');
            newsRows.forEach((row, i) => {
                const cat = row.querySelector('.input-news-cat').value.trim();
                const headline = row.querySelector('.input-news-headline').value.trim();
                const imgUrl = row.querySelector('.input-news-img-url').value.trim();
                const imgCap = row.querySelector('.input-news-img-caption').value.trim();
                const summary = row.querySelector('.input-news-summary').value.trim();
                if (headline || summary) {
                    const card = document.createElement('article');
                    const isScreenshotMode = window.navigator.webdriver || 
                                             window.location.search.includes('screenshot=true') || 
                                             window.location.search.includes('headless=true');
                    if (isScreenshotMode) {
                        card.className = 'news-card reveal-on-scroll revealed';
                    } else {
                        card.className = 'news-card reveal-on-scroll';
                    }
                    card.id = `newsCard${i}`;

                    // Click to show news detail modal
                    card.style.cursor = 'pointer';
                    card.addEventListener('click', () => {
                        const modal = document.getElementById('newsDetailModal');
                        const modalBadge = document.getElementById('newsModalBadge');
                        const modalTitle = document.getElementById('newsModalTitle');
                        const modalImage = document.getElementById('newsModalImage');
                        const modalExcerpt = document.getElementById('newsModalExcerpt');
                        
                        if (modal && modalTitle && modalExcerpt) {
                            modalBadge.textContent = cat || 'NEWS';
                            modalTitle.textContent = headline;
                            modalExcerpt.innerHTML = parseArticleMarkdown(summary);
                            
                            const modalImageCaption = document.getElementById('newsModalImageCaption');
                            if (imgUrl) {
                                modalImage.style.backgroundImage = `url('${imgUrl}')`;
                                modalImage.style.display = 'block';
                                if (modalImageCaption) {
                                    if (imgCap) {
                                        modalImageCaption.textContent = imgCap;
                                        modalImageCaption.style.display = 'block';
                                    } else {
                                        modalImageCaption.style.display = 'none';
                                    }
                                }
                            } else {
                                modalImage.style.display = 'none';
                                if (modalImageCaption) modalImageCaption.style.display = 'none';
                            }
                            
                            modal.style.display = 'flex';
                        }
                    });

                    let imageHtml = '';
                    if (imgUrl) {
                        imageHtml = `<div class="news-card-image" style="background-image: url('${imgUrl}')">
                            <div class="news-card-badge">${escapeHtml(cat || 'NEWS')}</div>
                        </div>`;
                    }

                    card.innerHTML = `
                        ${imageHtml}
                        ${!imgUrl ? `<div class="news-card-badge" style="position:relative;top:0;left:0;display:inline-block;margin:16px 0 0 20px;">${escapeHtml(cat || 'NEWS')}</div>` : ''}
                        <div class="news-card-body">
                            <h3 class="news-card-title">${wrapForeignNames(escapeHtml(panguSpace(headline)))}</h3>
                            <div class="news-card-excerpt">${parseArticleMarkdown(summary)}</div>
                        </div>
                    `;
                    newsCards.appendChild(card);

                    // Re-observe for scroll animation
                    if (window._scrollObserver) window._scrollObserver.observe(card);
                }
            });
        }

        function applyMagazineTheme() {
            // Mirror the gazette card's extracted theme CSS custom properties to the magazine container
            const magazineEl = document.getElementById('magazineMain');
            if (!magazineEl || !gazetteCard) return;

            const themeProps = [
                '--paper-bg',
                '--paper-accent',
                '--paper-accent-alpha-04',
                '--paper-accent-alpha-45',
                '--paper-border-light'
            ];

            themeProps.forEach(prop => {
                const val = gazetteCard.style.getPropertyValue(prop);
                if (val) {
                    magazineEl.style.setProperty(prop, val);
                } else {
                    magazineEl.style.removeProperty(prop);
                }
            });
        }

        function syncMagazineView() {
            // Hero image — prioritize inputImageUrl directly, fallback to cardImage
            const heroImage = document.getElementById('heroImage');
            if (heroImage) {
                const imgUrl = document.getElementById('inputImageUrl')?.value?.trim();
                if (imgUrl) {
                    heroImage.style.backgroundImage = `url('${imgUrl}')`;
                } else if (cardImage) {
                    heroImage.style.backgroundImage = cardImage.style.backgroundImage;
                }
            }

            // Hero metadata
            if (cardGalaxyEra) setText('heroGalaxyEra', cardGalaxyEra.textContent);
            if (cardDate) setText('heroDate', cardDate.textContent);
            if (cardEdition) setText('heroEdition', cardEdition.textContent);
            if (cardCoordinates) setText('heroCoordinates', cardCoordinates.textContent);

            // Cover TOC
            const tocTitle = document.getElementById('tocSparkTitle');
            if (tocTitle && cardSparkTitle) tocTitle.innerHTML = cardSparkTitle.innerHTML;

            const tocIntro = document.getElementById('tocSparkIntro');
            if (tocIntro && cardSparkIntro) tocIntro.innerHTML = cardSparkIntro.innerHTML;

            // TOC News list
            syncTocNews();

            // TOC Quote
            setText('tocQuoteText', inputQuoteText.value.trim());
            setText('tocQuoteAuthor', inputQuoteAuthor.value.trim());

            // Article Deep Reading
            const readingTitle = document.getElementById('readingTitle');
            const sparkFullTitle = inputSparkFullTitle.value.trim() || inputSparkTitle.value.trim();
            if (readingTitle) readingTitle.innerHTML = wrapForeignNames(escapeHtml(panguSpace(sparkFullTitle)));

            const readingBody = document.getElementById('readingBody');
            if (readingBody) readingBody.innerHTML = parseArticleMarkdown(inputSparkContent.value.trim());

            // News Cards
            syncNewsCards();

            // Quote Banner
            const bannerQuoteText = document.getElementById('bannerQuoteText');
            if (bannerQuoteText) bannerQuoteText.innerHTML = escapeHtml(panguSpace(inputQuoteText.value.trim()));

            const bannerQuoteAuthor = document.getElementById('bannerQuoteAuthor');
            if (bannerQuoteAuthor) {
                const author = inputQuoteAuthor.value.trim();
                bannerQuoteAuthor.innerHTML = author ? `— ${wrapForeignNames(escapeHtml(author))}` : '';
            }

            // Apply dynamic theme to magazine sections too
            applyMagazineTheme();
        }

        // =====================================================================
        // NEW MODULE: SCROLL REVEAL OBSERVER
        // =====================================================================
        function initScrollReveal() {
            const isScreenshotMode = window.navigator.webdriver || 
                                     window.location.search.includes('screenshot=true') || 
                                     window.location.search.includes('headless=true');
            if (isScreenshotMode) {
                const style = document.createElement('style');
                style.textContent = `
                    .reveal-on-scroll {
                        opacity: 1 !important;
                        transform: none !important;
                        transition: none !important;
                        transition-delay: 0s !important;
                    }
                    /* 自動化截圖下停用側邊欄與編輯面板的過渡動畫，直接呈現最終開啟狀態 */
                    .sidebar, .magazine, .editor-drawer {
                        transition: none !important;
                    }
                `;
                document.head.appendChild(style);

                document.querySelectorAll('.reveal-on-scroll').forEach(el => {
                    el.classList.add('revealed');
                });
                return;
            }

            window._scrollObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                    }
                });
            }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

            document.querySelectorAll('.reveal-on-scroll').forEach(el => {
                window._scrollObserver.observe(el);
            });
        }

        // =====================================================================
        // NEW MODULE: READING PROGRESS BAR
        // =====================================================================
        function initReadingProgress() {
            const bar = document.getElementById('readingProgress');
            if (!bar) return;
            window.addEventListener('scroll', () => {
                const scrollTop = window.scrollY;
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
                bar.style.width = progress + '%';
            }, { passive: true });
        }

        // =====================================================================
        // NEW MODULE: DARK MODE TOGGLE
        // =====================================================================
        function initThemeToggle() {
            const btn = document.getElementById('btnToggleTheme');
            const saved = localStorage.getItem('fg-theme');
            if (saved) document.documentElement.dataset.theme = saved;

            if (btn) {
                btn.addEventListener('click', () => {
                    const current = document.documentElement.dataset.theme;
                    const next = current === 'dark' ? 'light' : 'dark';
                    document.documentElement.dataset.theme = next;
                    localStorage.setItem('fg-theme', next);
                    // Update button icon
                    const icon = btn.querySelector('.sidebar-link-icon');
                    if (icon) icon.textContent = next === 'dark' ? '☀️' : '🌙';
                });
            }
        }

        // =====================================================================
        // ACCORDION, MOBILE MENU & SCROLLSPY MODULES
        // =====================================================================
        function initAccordion() {
            document.querySelectorAll('.accordion-header').forEach(header => {
                header.addEventListener('click', () => {
                    const item = header.parentElement;
                    item.classList.toggle('open');
                });
            });
        }

        function initMobileMenu() {
            const btnMobileMenu = document.getElementById('btnMobileMenu');
            const sidebarEl = document.getElementById('sidebar');
            if (btnMobileMenu && sidebarEl) {
                btnMobileMenu.addEventListener('click', () => {
                    sidebarEl.classList.toggle('mobile-open');
                    btnMobileMenu.classList.toggle('open-active');
                });
            }
            
            // Close sidebar when clicking on any link or tool button in mobile view
            document.querySelectorAll('.sidebar-link, .sidebar-tool-btn').forEach(link => {
                link.addEventListener('click', () => {
                    if (sidebarEl) sidebarEl.classList.remove('mobile-open');
                    if (btnMobileMenu) btnMobileMenu.classList.remove('open-active');
                });
            });
        }

        function initScrollspy() {
            const sections = document.querySelectorAll('section[id], header[id]');
            const navLinks = document.querySelectorAll('.sidebar-link');
            if (sections.length === 0 || navLinks.length === 0) return;

            const observerOptions = {
                root: null,
                rootMargin: '-20% 0px -60% 0px',
                threshold: 0
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const id = entry.target.getAttribute('id');
                        navLinks.forEach(link => {
                            const href = link.getAttribute('href');
                            if (href === `#${id}`) {
                                link.classList.add('active-section');
                            } else {
                                if ((id === 'articleSection' || id === 'newsSection') && href === '#heroSection') {
                                    link.classList.add('active-section');
                                } else {
                                    link.classList.remove('active-section');
                                }
                            }
                        });
                    }
                });
            }, observerOptions);

            sections.forEach(section => observer.observe(section));
        }

        // =====================================================================
        // INITIALIZATION — NEW MODULES
        // =====================================================================
        initThemeToggle();
        initScrollReveal();
        initReadingProgress();
        syncMagazineView();
        initAccordion();
        initMobileMenu();
        initScrollspy();

        // 解析 URL 參數來自動開啟新聞彈窗 (輔助截圖與自動化驗證)
        const openNewsIndex = urlParams.get('openNews');
        if (openNewsIndex !== null) {
            const card = document.getElementById(`newsCard${openNewsIndex}`);
            if (card) {
                card.click();
            }
        }

    } catch (e) {
        if (!window.location.search.includes('screenshot=true')) {
            alert("⚠️ 捕獲到 app.js 執行期錯誤：\n\n錯誤描述: " + e.message + "\n\n詳細堆疊資訊:\n" + e.stack);
        } else {
            console.error("⚠️ 捕獲到 app.js 執行期錯誤: " + e.message + "\n" + e.stack);
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
