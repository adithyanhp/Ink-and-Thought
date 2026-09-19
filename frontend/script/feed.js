// script/feed.js
// Home page feed script

// The URL to your Django API endpoint
const API_URL = 'http://127.0.0.1:8000/api/posts/';

const postsGrid = document.getElementById('posts-grid');

// Function to fetch and display posts
async function loadPosts() {
    try {
        const response = await fetch(API_URL);
        const posts = await response.json();

        postsGrid.innerHTML = '';

        posts.forEach(post => {
            const imageUrl = post.image ? post.image : 'https://placehold.co/600x400/22c55e/ffffff?text=No+Image';
            const date = new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            // 👇 WE CHANGED THE <article> TAG AND THE <a> TAG BELOW 👇
            const articleHTML = `
            <article 
                onclick="window.location.href='post.html?id=${post.id}'" 
                style="cursor: pointer;" 
                class="group bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm hover:shadow-md p-spacing-lg flex flex-col justify-between transition-all duration-200 hover:-translate-y-1">
                
                <div>
                    <div class="relative w-full h-48 rounded-lg overflow-hidden mb-spacing-md bg-surface-container">
                        <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="${imageUrl}" alt="${post.title}">
                        ${post.category ? `<span class="absolute bottom-spacing-xs left-spacing-xs px-spacing-xs py-spacing-3xs rounded-md bg-amber-highlight text-secondary border border-secondary/20 font-label-badge text-xs font-bold">${post.category}</span>` : ''}
                    </div>
                    <div class="flex items-center gap-spacing-2xs text-on-surface-variant font-label-sm text-label-sm mb-spacing-xs">
                        <span class="font-medium text-charcoal-dark">@${post.author}</span>
                        <span>·</span>
                        <span>${date}</span>
                    </div>
                    <h3 class="font-headline-sm text-headline-sm font-bold text-on-surface group-hover:text-primary transition-colors leading-snug">
                        <a href="post.html?id=${post.id}" class="">${post.title}</a>
                    </h3>
                    <p class="font-body-sm text-body-sm text-on-surface-variant mt-spacing-xs line-clamp-3">
                        ${post.subtitle || post.content.substring(0, 100) + '...'}
                    </p>
                </div>
                <div class="pt-spacing-md mt-spacing-md flex items-center justify-between border-t border-outline-variant/15">
                    <div class="flex items-center gap-spacing-sm">
                        <button class="inline-flex items-center gap-1 text-on-surface-variant hover:text-error transition-colors text-label-sm font-label-sm">
                            <span class="material-symbols-outlined text-body-default">favorite</span>
                            <span>${post.likes_count}</span>
                        </button>
                        <button class="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors text-label-sm font-label-sm">
                            <span class="material-symbols-outlined text-body-default">chat_bubble</span>
                            <span>${post.comments ? post.comments.length : 0}</span>
                        </button>
                    </div>
                </div>
            </article>
            `;
            
            postsGrid.innerHTML += articleHTML;
        });

    } catch (error) {
        console.error('Error fetching posts:', error);
        postsGrid.innerHTML = '<p class="text-error">Failed to load stories. Make sure your Django server is running!</p>';
    }
}

document.addEventListener('DOMContentLoaded', loadPosts);
