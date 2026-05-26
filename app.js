// App logic for Foundation Gazette Generator (Expanded Version with Dynamic Templates & Image Checking)

document.addEventListener('DOMContentLoaded', () => {
    try {
        let isRestoring = false;
        
        // Inputs elements
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
    
    // Preview card elements
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
    
    // Action buttons & zones
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const btnDownloadJson = document.getElementById('btnDownloadJson');
    const btnExportPng = document.getElementById('btnExportPng');
    const btnClearDraft = document.getElementById('btnClearDraft');
    const toggleInkFilter = document.getElementById('toggleInkFilter');
    const newsInputsContainer = document.getElementById('newsInputsContainer');

    // --- Image Check & Fallback Handler ---
    
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

    // Set up cover image checking (handled inside updateImage since cardImage is a div)

    // --- Layout Scheme Selector System ---
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

    // --- Helper functions for formatting names ---
    function escapeHtml(text) {
        if (text === null || text === undefined) return '';
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function wrapForeignNames(text) {
        if (!text) return '';
        // Matches foreign names like 諾曼·麥克萊倫, R·丹尼爾·奧立瓦, etc.
        // It allows Chinese/English characters connected by middle dots (\u00b7 or \u30fb)
        let result = text.replace(/([\u4e00-\u9fa5a-zA-Z]+(?:[\u00b7\u30fb][\u4e00-\u9fa5a-zA-Z]+)+)/g, '<span class="text-nowrap">$1</span>');
        // Matches CJK book/movie titles wrapped in double angle brackets \u300a...\u300b to prevent wrapping inside them
        result = result.replace(/(\u300a[^\u300b]+\u300b)/g, '<span class="text-nowrap">$1</span>');
        return result;
    }
    window.wrapForeignNames = wrapForeignNames;

    // --- Data Binding Functions ---
    
    function syncText(input, cardElement, isParagraph = false) {
        if (!input || !cardElement) return;
        
        const update = () => {
            const val = input.value.trim();
            if (isParagraph) {
                // Split paragraphs by newline and wrap each in <p>
                cardElement.innerHTML = val.split('\n')
                    .map(p => p.trim() ? `<p>${wrapForeignNames(escapeHtml(p))}</p>` : '')
                    .join('');
            } else {
                cardElement.innerHTML = wrapForeignNames(escapeHtml(val));
            }
        };
        
        input.addEventListener('input', update);
        update(); // Initial sync
    }

    // Bind standard text fields for Cover
    syncText(inputGalaxyEra, cardGalaxyEra);
    
    // Bind dynamic edition number based on inputGalaxyEra
    const updateEdition = () => {
        const eraText = inputGalaxyEra.value.trim();
        const match = eraText.match(/\d+/);
        if (match) {
            const issueNum = match[0].padStart(3, '0');
            cardEdition.textContent = `NO. ${issueNum}`;
        } else {
            cardEdition.textContent = 'NO. 001';
        }
    };
    inputGalaxyEra.addEventListener('input', updateEdition);
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
            tempImg.onload = () => {
                cardImage.style.backgroundImage = `url("${url}")`;
                cardImage.style.backgroundPosition = 'center';
                cardImage.style.display = 'block';
                cardImageError.style.display = 'none';
            };
            tempImg.onerror = () => {
                cardImage.style.backgroundImage = 'none';
                cardImage.style.display = 'none';
                cardImageError.style.display = 'flex';
            };
            tempImg.src = url;
        } else {
            cardImage.style.backgroundImage = 'none';
            cardImage.style.display = 'none';
            cardImageError.style.display = 'flex';
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

    // --- Markdown-like Parser for Article System ---

    function parseArticleMarkdown(text) {
        if (!text) return '';
        return text.split('\n')
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

    // --- Dynamic Articles System ---

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
    }

    // Trigger update for articles area when main article titles/content change
    inputSparkTitle.addEventListener('input', updateArticlesArea);
    inputSparkFullTitle.addEventListener('input', updateArticlesArea);
    inputSparkContent.addEventListener('input', updateArticlesArea);

    // --- Dynamic News Binding on Cover ---
    
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
                headlineSpan.innerHTML = wrapForeignNames(escapeHtml(headline || ''));
                
                li.appendChild(catSpan);
                li.appendChild(headlineSpan);
                cardNewsList.appendChild(li);
            }
        });
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
            const fileInput = row.querySelector('.input-news-img-file');
            const textInput = row.querySelector('.input-news-img-url');
            if (btnUpload && fileInput && textInput) {
                if (!btnUpload.dataset.listenerAttached) {
                    btnUpload.addEventListener('click', () => fileInput.click());
                    handleImageFileSelect(fileInput, textInput);
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

    // --- JSON Drag & Drop / Load ---

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
            } else {
                toggleInkFilter.checked = false;
                gazetteCard.classList.toggle('ink-filter', false);
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
        } finally {
            isRestoring = false;
        }
    }

    // --- JSON Downloading (Save State) ---

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

    // --- PNG Export with High-Res html2canvas ---

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

    // --- Toggle Ink Filter ---
    if (toggleInkFilter) {
        toggleInkFilter.addEventListener('change', () => {
            if (isRestoring) return;
            const active = toggleInkFilter.checked;
            gazetteCard.classList.toggle('ink-filter', active);
            autoSaveDraft();
        });
    }

    // --- Reset Draft Button ---
    if (btnClearDraft) {
        btnClearDraft.addEventListener('click', () => {
            if (confirm('確定要清除瀏覽器中的暫存草稿並重設為預設狀態嗎？\n這將會重新載入初始內容。')) {
                localStorage.removeItem('foundation_gazette_auto_draft');
                window.location.reload();
            }
        });
    }

    // --- Local Auto-save System ---
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

    // --- Phase 4: URL Parameters & Mode Toggle Handling ---
    const appContainer = document.querySelector('.app-container');
    const btnModeEdit = document.getElementById('btnModeEdit');
    const btnModeRead = document.getElementById('btnModeRead');
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

    // Function to toggle Reader/Editor mode
    function setMode(mode) {
        if (mode === 'read') {
            if (appContainer) appContainer.classList.add('mode-reader');
            if (btnModeRead) btnModeRead.classList.add('active');
            if (btnModeEdit) btnModeEdit.classList.remove('active');
            localStorage.setItem('foundation_gazette_mode', 'read');
        } else {
            if (appContainer) appContainer.classList.remove('mode-reader');
            if (btnModeEdit) btnModeEdit.classList.add('active');
            if (btnModeRead) btnModeRead.classList.remove('active');
            localStorage.setItem('foundation_gazette_mode', 'edit');
        }
    }

    if (btnModeEdit) btnModeEdit.addEventListener('click', () => setMode('edit'));
    if (btnModeRead) btnModeRead.addEventListener('click', () => setMode('read'));

    // Handle Issue Loading
    function loadArchiveEdition(editionValue) {
        if (editionValue === 'draft') {
            try {
                const savedDraft = localStorage.getItem('foundation_gazette_auto_draft');
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
        
        let fetchUrl = 'data/draft.json';
        if (editionValue !== 'draft') {
            // Convert e.g., "2026.05.20" to "2026_05_20.json"
            const filename = editionValue.replace(/\./g, '_') + '.json';
            fetchUrl = `data/archive/${filename}`;
        }
        
        fetch(fetchUrl)
            .then(res => {
                if (!res.ok) throw new Error(`無法載入該期數檔案 (${fetchUrl})`);
                return res.json();
            })
            .then(data => {
                loadData(data);
                console.log(`Loaded edition: ${editionValue}`);
            })
            .catch(err => {
                console.warn(`Fetch failed for ${editionValue}, attempting memory fallback:`, err);
                if (window.FOUNDATION_ARCHIVES && window.FOUNDATION_ARCHIVES[editionValue]) {
                    loadData(window.FOUNDATION_ARCHIVES[editionValue]);
                    console.log(`Successfully loaded edition from memory fallback: ${editionValue}`);
                } else {
                    alert(`載入錯誤: ${err.message}\n\n💡 提示：若您是在本機以雙擊 index.html 開啟網頁，請使用專案目錄下的「啟動本地伺服器.bat」或確保 data/archive_data.js 已正確引入且包含此期數資料。`);
                    if (selectArchive) selectArchive.value = 'draft';
                }
            });
    }

    if (selectArchive) {
        selectArchive.addEventListener('change', (e) => {
            loadArchiveEdition(e.target.value);
        });
    }

    // Share Modal & Teaser Text Generation
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
        if (shareCardTitle) shareCardTitle.innerHTML = wrapForeignNames(escapeHtml(inputSparkTitle.value.trim()));
        
        if (shareCardIntro) {
            shareCardIntro.innerHTML = wrapForeignNames(escapeHtml(inputShareCardText.value.trim()));
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
                if (titleEl) titleEl.innerHTML = wrapForeignNames(escapeHtml(newsItems[0].headline));
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
                if (titleEl) titleEl.innerHTML = wrapForeignNames(escapeHtml(newsItems[1].headline));
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
            }, 100);
        });
    }

    // Dynamically populate archives select options based on window.FOUNDATION_ARCHIVES keys
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

    // Parse URL Query Parameters
    const urlParams = new URLSearchParams(window.location.search);
    const paramMode = urlParams.get('mode');
    const paramIssue = urlParams.get('issue');

    // Initialize Mode
    if (paramMode === 'read') {
        setMode('read');
    } else if (paramMode === 'edit') {
        setMode('edit');
    } else {
        // Fallback to localStorage or default
        const savedMode = localStorage.getItem('foundation_gazette_mode');
        if (savedMode === 'read') {
            setMode('read');
        } else {
            setMode('edit');
        }
    }

    // --- Initial Startup Data Load ---
    let restoredFromLocal = false;
    
    // Check URL parameters first!
    if (paramIssue) {
        if (selectArchive) selectArchive.value = paramIssue;
        loadArchiveEdition(paramIssue);
        restoredFromLocal = true;
    } else {
        try {
            const savedDraft = localStorage.getItem('foundation_gazette_auto_draft');
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

    // Auto-open share modal if openShare=true query parameter is present (useful for headless testing)
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
    } catch (e) {
        alert("⚠️ 捕獲到 app.js 執行期錯誤：\n\n錯誤描述: " + e.message + "\n\n詳細堆疊資訊:\n" + e.stack);
    }
});
