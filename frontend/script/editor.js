// Editor Script for Article Creation

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        alert("You must be logged in to write a post.");
        window.location.href = "login.html";
        return;
    }

    // --- 1. INITIALIZE QUILL WYSIWYG ---
    const quill = new Quill('#editor-container', {
        theme: 'snow',
        placeholder: 'Write your story here...',
        modules: { toolbar: false } 
    });

    // --- 2. CONNECT CUSTOM FORMATTING BUTTONS ---
    function format(command, value = true) {
        quill.focus();
        const currentFormat = quill.getFormat();
        if (currentFormat[command] === value) {
            quill.format(command, false);
        } else {
            quill.format(command, value);
        }
    }

    document.getElementById('t-bold').addEventListener('click', () => format('bold'));
    document.getElementById('t-italic').addEventListener('click', () => format('italic'));
    document.getElementById('t-h1').addEventListener('click', () => format('header', 1));
    document.getElementById('t-h2').addEventListener('click', () => format('header', 2));
    document.getElementById('t-quote').addEventListener('click', () => format('blockquote'));
    document.getElementById('t-code').addEventListener('click', () => format('code-block'));
    document.getElementById('t-bullet').addEventListener('click', () => format('list', 'bullet'));
    document.getElementById('t-number').addEventListener('click', () => format('list', 'ordered'));
    
    // FIX: HTTP Auto-Injector for Links
    document.getElementById('t-link').addEventListener('click', () => {
        let url = prompt("Enter the URL:");
        if (url) {
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            format('link', url);
        }
    });

    // --- 3. DYNAMIC CATEGORY MANAGEMENT ---
    const categoryEl = document.getElementById('articleCategory');
    const defaultCategories = ["Thought Leadership & Essays", "Design & Human Centered UI", "Engineering Musings"];

    function loadCategories() {
        if(!categoryEl) return;
        let stored = JSON.parse(localStorage.getItem('custom_categories') || '[]');
        if(stored.length === 0) stored = defaultCategories;
        categoryEl.innerHTML = '';
        stored.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.innerText = cat;
            categoryEl.appendChild(opt);
        });
    }
    loadCategories();

    function saveCategories() {
        if(!categoryEl) return;
        const options = Array.from(categoryEl.options).map(o => o.value);
        localStorage.setItem('custom_categories', JSON.stringify(options));
    }

    document.getElementById('addCatBtn')?.addEventListener('click', () => {
        const newCat = prompt("Enter new category name:");
        if(newCat && newCat.trim() && categoryEl) {
            const opt = document.createElement('option');
            opt.value = newCat.trim();
            opt.innerText = newCat.trim();
            categoryEl.appendChild(opt);
            categoryEl.value = newCat.trim();
            saveCategories();
        }
    });

    document.getElementById('editCatBtn')?.addEventListener('click', () => {
        if(!categoryEl) return;
        const selected = categoryEl.value;
        if(!selected) return;
        const renamed = prompt("Rename category:", selected);
        if(renamed && renamed.trim()) {
            categoryEl.options[categoryEl.selectedIndex].value = renamed.trim();
            categoryEl.options[categoryEl.selectedIndex].innerText = renamed.trim();
            saveCategories();
        }
    });

    document.getElementById('deleteCatBtn')?.addEventListener('click', () => {
        if(!categoryEl) return;
        if(categoryEl.options.length <= 1) {
            alert("You must have at least one category.");
            return;
        }
        if(confirm(`Delete category "${categoryEl.value}"?`)) {
            categoryEl.remove(categoryEl.selectedIndex);
            saveCategories();
        }
    });

    // --- 4. PREVIEW TOGGLE ---
    const previewBtn = document.getElementById('previewBtn');
    let isPreviewing = false;
    previewBtn?.addEventListener('click', () => {
        isPreviewing = !isPreviewing;
        if (isPreviewing) {
            document.getElementById('custom-toolbar').style.display = 'none';
            quill.disable(); // Locks the editor for reading
            previewBtn.innerHTML = `<span class="material-symbols-outlined text-body-md text-primary">edit</span><span class="hidden md:inline">Edit</span>`;
        } else {
            document.getElementById('custom-toolbar').style.display = 'flex';
            quill.enable(); // Unlocks the editor
            previewBtn.innerHTML = `<span class="material-symbols-outlined text-body-md text-primary">visibility</span><span class="hidden md:inline">Preview</span>`;
        }
    });

    // --- 5. EDIT MODE & AUTO-SAVE LOGIC ---
    const titleEl = document.getElementById('articleTitle');
    const subtitleEl = document.getElementById('articleSubtitle');
    const synopsisEl = document.getElementById('articleSynopsis');
    const imageInput = document.getElementById('articleImage');
    const imagePreview = document.getElementById('coverPreview');
    const publishBtn = document.getElementById('publishBtn');
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    const saveStatus = document.getElementById('saveStatus');

    const urlParams = new URLSearchParams(window.location.search);
    const editPostId = urlParams.get('id');
    let isEditMode = !!editPostId;
    let tagsArray = [];

    if (isEditMode) {
        const statusLabel = document.getElementById('editorModeLabel');
        if (statusLabel) statusLabel.innerText = "Editing Post";
        if (publishBtn) publishBtn.innerHTML = `<span class="material-symbols-outlined text-body-md">update</span><span>Update Post</span>`;
        
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/posts/${editPostId}/`);
            if (res.ok) {
                const post = await res.json();
                if(titleEl) titleEl.value = post.title || "";
                if(subtitleEl) subtitleEl.value = post.subtitle || "";
                if(categoryEl) categoryEl.value = post.category || "";
                if(synopsisEl) synopsisEl.value = post.synopsis || "";
                quill.root.innerHTML = post.content || ""; 
                
                if (post.image && imagePreview) imagePreview.src = post.image;
                if (post.tags) {
                    tagsArray = post.tags.split(',').map(t => t.trim()).filter(t => t);
                    renderTags();
                }
            }
        } catch (err) {
            console.error("Failed to load post", err);
        }
    } else {
        const savedDraft = localStorage.getItem('blog_draft');
        if (savedDraft) {
            const draft = JSON.parse(savedDraft);
            if(titleEl) titleEl.value = draft.title || "";
            quill.root.innerHTML = draft.content || "";
            if (saveStatus) saveStatus.textContent = "Draft loaded";
        }
    }

    function saveDraft() {
        if (isEditMode) return; 
        const draft = {
            title: titleEl ? titleEl.value : "",
            content: quill.root.innerHTML
        };
        localStorage.setItem('blog_draft', JSON.stringify(draft));
        if (saveStatus) saveStatus.textContent = `Saved locally at ${new Date().toLocaleTimeString()}`;
    }
    
    titleEl?.addEventListener('input', saveDraft);
    quill.on('text-change', saveDraft);

    saveDraftBtn?.addEventListener('click', () => {
        saveDraft();
        alert("Draft saved to your browser securely!");
    });

    // --- 6. TAGS HANDLING ---
    const tagInput = document.getElementById('tagInput');
    const tagsContainer = document.getElementById('tagsContainer');

    function renderTags() {
        if (!tagsContainer) return;
        Array.from(tagsContainer.children).forEach(child => {
            if (child.tagName === 'SPAN') child.remove();
        });
        tagsArray.forEach((tag, index) => {
            const span = document.createElement('span');
            span.className = "inline-flex items-center gap-space-2xs px-space-sm py-space-2xs rounded-full bg-surface-container text-on-surface-variant font-label-badge text-label-badge font-semibold border border-outline-variant/30";
            span.innerHTML = `#${tag} <button type="button" class="material-symbols-outlined text-label-badge hover:text-error cursor-pointer" onclick="removeTag(${index})">close</button>`;
            tagsContainer.insertBefore(span, tagsContainer.lastElementChild);
        });
    }

    window.removeTag = function(index) {
        tagsArray.splice(index, 1);
        renderTags();
    };

    tagInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault(); 
            const newTag = tagInput.value.trim().replace(/,/g, ''); 
            if (newTag && !tagsArray.includes(newTag)) {
                tagsArray.push(newTag);
                renderTags();
            }
            tagInput.value = ''; 
        }
    });

    // --- 7. IMAGE PREVIEW ---
    if (imageInput) {
        imageInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    if(imagePreview) imagePreview.src = e.target.result;
                }
                reader.readAsDataURL(file);
            }
        });
    }

    // --- 8. PUBLISH / UPDATE ---
    // FIX: Added robust error handling to prevent the button from freezing
    if (publishBtn) {
        publishBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const title = titleEl ? titleEl.value.trim() : "";
            const content = quill.root.innerHTML.trim(); 

            if (!title || content === '<p><br></p>' || !content) {
                alert("Title and Content are required.");
                return;
            }

            const originalText = publishBtn.innerHTML;
            publishBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-body-md">progress_activity</span><span>Saving...</span>`;
            publishBtn.disabled = true;

            try {
                const formData = new FormData();
                formData.append('title', title);
                formData.append('content', content);
                if (subtitleEl) formData.append('subtitle', subtitleEl.value.trim());
                if (categoryEl) formData.append('category', categoryEl.value);
                if (synopsisEl) formData.append('synopsis', synopsisEl.value.trim());
                if (tagsArray.length > 0) formData.append('tags', tagsArray.join(',')); 
                if (imageInput && imageInput.files[0]) formData.append('image', imageInput.files[0]);

                const url = isEditMode ? `http://127.0.0.1:8000/api/posts/${editPostId}/` : `http://127.0.0.1:8000/api/posts/`;
                const method = isEditMode ? 'PATCH' : 'POST';

                const response = await fetch(url, {
                    method: method,
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });

                if (response.ok) {
                    const savedPost = await response.json();
                    localStorage.removeItem('blog_draft'); 
                    window.location.href = `post.html?id=${savedPost.id}`; 
                } else {
                    console.error(await response.json());
                    alert("Failed to save post.");
                    publishBtn.innerHTML = originalText;
                    publishBtn.disabled = false;
                }
            } catch (error) {
                console.error("Network Error:", error);
                alert("A network error occurred.");
                publishBtn.innerHTML = originalText;
                publishBtn.disabled = false;
            }
        });
    }
});

