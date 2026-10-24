// script/feed.js
// Home page feed script

// The URL to your Django API endpoint
// const API_URL = "http://127.0.0.1:8000/api/posts/";
const API_URL = "http://127.0.0.1:8000/api/feed/";

const postsGrid = document.getElementById("posts-grid");

// Function to fetch and display posts
async function loadPosts() {
  try {
    const response = await fetch(API_URL, { cache: "no-cache" });
    const posts = await response.json();

    postsGrid.innerHTML = "";

    posts.forEach((post) => {
      const imageUrl = post.image
        ? post.image
        : "https://placehold.co/600x400/22c55e/ffffff?text=No+Image";

      const date = new Date(post.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      // Use the new author_image, or a fallback avatar if they don't have one
      const authorImg = post.author_image
        ? post.author_image
        : `https://ui-avatars.com/api/?name=${post.author_name}&background=006860&color=fff`;

      const articleHTML = `
    <article 
        onclick="window.location.href='post.html?id=${post.id}'" 
        style="cursor: pointer;" 
        class="group bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm hover:shadow-md p-spacing-lg flex flex-col justify-between transition-all duration-200 hover:-translate-y-1">
        
        <div>
            <div class="relative w-full h-48 rounded-lg overflow-hidden mb-spacing-md bg-surface-container">
                <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="${imageUrl}" alt="${post.title}">
                ${post.category ? `<span class="absolute bottom-spacing-xs left-spacing-xs px-spacing-xs py-spacing-3xs rounded-md bg-amber-highlight text-secondary border border-secondary/20 font-label-badge text-xs font-bold">${post.category}</span>` : ""}
            </div>
            
            <div class="flex items-center gap-spacing-xs mb-spacing-xs">
                <img src="${authorImg}" alt="${post.author_name}" class="w-6 h-6 rounded-full object-cover border border-outline-variant/50">
                <div class="flex items-center gap-spacing-2xs text-on-surface-variant font-label-sm text-label-sm">
                    <span class="font-medium text-charcoal-dark">@${post.author_name}</span>
                    <span>·</span>
                    <span>${date}</span>
                </div>
            </div>
            
            <h3 class="font-headline-sm text-headline-sm font-bold text-on-surface group-hover:text-primary transition-colors leading-snug">
                <a href="post.html?id=${post.id}" class="">${post.title}</a>
            </h3>
            
            <p class="font-body-sm text-body-sm text-on-surface-variant mt-spacing-xs line-clamp-3">
                ${post.synopsis ? post.synopsis : ""}
            </p>
        </div>
        
        <div class="pt-spacing-md mt-spacing-md flex items-center justify-between border-t border-outline-variant/15">
            <div class="flex items-center gap-spacing-sm">
                <button onclick="likePost(event, ${post.id})" class="inline-flex items-center gap-1 text-on-surface-variant hover:text-error transition-colors text-label-sm font-label-sm">
                    <span class="material-symbols-outlined text-body-default">favorite</span>
                    <span>${post.likes_count}</span>
                </button>
                <button class="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors text-label-sm font-label-sm">
                    <span class="material-symbols-outlined text-body-default">chat_bubble</span>
                    <span>${post.comments_count}</span>
                </button>
            </div>
        </div>
    </article>
    `;

      postsGrid.innerHTML += articleHTML;
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    postsGrid.innerHTML =
      '<p class="text-error">Failed to load stories. Make sure your Django server is running!</p>';
  }
}

// DOMContentLoaded, which only fires on a brand new page load, not when someone hits the "Back" button.👇
// document.addEventListener("DOMContentLoaded", loadPosts);

// pageshow, which fires on both a brand new page load AND when someone hits the "Back" button. 👇
window.addEventListener("pageshow", loadPosts);

// Function to handle liking a post
async function likePost(event, postId) {
  // 1. Stop the card from clicking through to the post page!
  event.stopPropagation();

  // 2. Grab the VIP pass from browser memory
  const token = localStorage.getItem("access_token");

  // 3. Stop the user if they aren't logged in
  if (!token) {
    alert("You need to log in to like a post!");
    window.location.href = "login.html";
    return;
  }

  try {
    // 4. Send the request to your Django backend with the token
    const response = await fetch("http://127.0.0.1:8000/api/likes/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // THIS ATTACHES THE SECRET TOKEN:
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        post: postId,
      }),
    });

    if (response.ok) {
      // If successful, reload the posts to show the updated like count
      loadPosts();
    } else if (response.status === 401) {
      alert("Your session expired. Please log in again.");
      localStorage.removeItem("access_token");
      window.location.href = "login.html";
    }
  } catch (error) {
    console.error("Error liking post:", error);
  }
}
