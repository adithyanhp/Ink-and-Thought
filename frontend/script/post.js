// script/post.js

// This script is for the post.html page, which displays a single post in full detail.


const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('id');

// We updated these IDs to match the new Stitch template!
const titleElement = document.getElementById('post-title');
const authorNameElement = document.getElementById('post-author-name');
const authorHandleElement = document.getElementById('post-author-handle');
const dateElement = document.getElementById('post-date');
const contentElement = document.getElementById('post-content');
const imageElement = document.getElementById('post-image');
const categoryElement = document.getElementById('post-category');
const likesCountElement = document.getElementById('post-likes-count');
const commentsCountElement = document.getElementById('post-comments-count');

async function getSinglePost() {
    if (!postId) {
        titleElement.innerText = "Post not found!";
        contentElement.innerText = "No post ID was provided in the URL.";
        return; 
    }

    try {
        // We added { cache: 'no-cache' } to ensure the browser fetches the latest data from the server, rather than using a potentially stale cached version.👇 
        const response = await fetch(`http://127.0.0.1:8000/api/posts/${postId}/`, { cache: 'no-cache' });
        
        if (!response.ok) {
            throw new Error("Post not found in database");
        }

        const postData = await response.json();

        // Inject the text into the exact right spots in our new design
        titleElement.innerText = postData.title;
        authorNameElement.innerText = postData.author;
        authorHandleElement.innerText = `@${postData.author}`;
        
        const date = new Date(postData.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        dateElement.innerText = date;
        
        // Use the image if it exists, otherwise use a placeholder
        imageElement.src = postData.image ? postData.image : 'https://placehold.co/800x450/e7eeff/111c2d?text=No+Image';
        
        // Show category if it exists
        categoryElement.innerText = postData.category ? postData.category : 'Article';

        // Update likes and comments count
        likesCountElement.innerText = postData.likes_count || 0;
        commentsCountElement.innerText = postData.comments ? postData.comments.length : 0;

        // --- NEW: Inject the post content into the page ---
        contentElement.innerHTML = postData.content;

        // --- NEW: Unhide Edit Button if the logged-in user is the author ---
        const token = localStorage.getItem('access_token');
        if (token) {
            const userRes = await fetch('http://127.0.0.1:8000/api/users/me/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (userRes.ok) {
                const userData = await userRes.json();
                if (userData.username === postData.author) {
                    const editBtn = document.getElementById('edit-post-btn');
                    if (editBtn) {
                        editBtn.style.display = 'inline-flex';
                        editBtn.href = `editor.html?id=${postId}`;
                    }
                }
            }
        }

    } catch (error) {
        console.error("Something went wrong:", error);
        titleElement.innerText = "Error loading the post.";
        contentElement.innerText = "We couldn't load this post. Please try again later.";
    }
}

// We use the pageshow event instead of DOMContentLoaded because it fires both on a fresh page load and when the user navigates back to this page using the browser's back button. This ensures that the post data is always up-to-date, especially after actions like liking a post or adding a comment. 
// getSinglePost();
// window.addEventListener('pageshow', getSinglePost);
// Run BOTH functions when the page loads


// this pageshow event is used here to ensure that the post data and comments are refreshed whenever the user navigates back to this page, such as after liking a post or adding a comment. This keeps the displayed information current without requiring a full page reload.👇
window.addEventListener('pageshow', () => {
    getSinglePost();
    loadComments();
});


// --- NEW: Authentication & Like Post Logic ---

async function togglePostLike() {
    // 1. Grab the VIP pass from browser memory
    const token = localStorage.getItem('access_token');

    // 2. Stop the user if they aren't logged in
    if (!token) {
        alert("You need to log in to like a post!");
        window.location.href = 'login.html';
        return;
    }

    try {
        // 3. Send the request to your Django backend with the token
        const response = await fetch('http://127.0.0.1:8000/api/likes/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ 
                post: postId  // This uses the postId you already extracted at the top of the file!
            })
        });

        if (response.ok) {
            // If successful, reload the post data to update the like count instantly
            getSinglePost(); 
        } else if (response.status === 401) {
            alert("Your session expired. Please log in again.");
            localStorage.removeItem('access_token');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error("Error toggling like:", error);
    }
}

// This function is called when the user clicks the like button. It checks if the user is logged in, sends a request to the backend to toggle the like status for the current post, and then refreshes the post data to reflect any changes in the like count.
// --- NEW: Load Comments Logic (With Edit/Delete UI) ---
// This version asks Django who is currently logged in, and if their username matches the comment author, it adds the buttons!
// --- NEW: Load Comments Logic (With Timestamps & Modal UI Triggers) ---
async function loadComments() {
    try {
        let currentUser = null;
        const token = localStorage.getItem('access_token');
        if (token) {
            const userRes = await fetch('http://127.0.0.1:8000/api/users/me/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (userRes.ok) {
                const userData = await userRes.json();
                currentUser = userData.username; 
            }
        }

        const response = await fetch(`http://127.0.0.1:8000/api/comments/?post=${postId}`);
        if (!response.ok) throw new Error("Could not fetch comments");
        
        const comments = await response.json();
        const commentsList = document.getElementById('comments-list');
        const sectionCount = document.getElementById('section-comments-count');
        
        if (commentsList) {
            commentsList.innerHTML = ''; 
            if (sectionCount) sectionCount.innerText = comments.length;

            if (comments.length === 0) {
                commentsList.innerHTML = '<p class="text-on-surface-variant text-sm text-center">No comments yet. Be the first to share your thoughts!</p>';
                return;
            }

            comments.forEach(comment => {
                const authorName = comment.author || 'User';
                const firstLetter = authorName.charAt(0).toUpperCase();
                
                // --- NEW: Formatted Date & Time (e.g., Oct 15, 2026 at 2:41 PM) ---
                const dateObj = new Date(comment.created_at);
                const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                const fullDateTime = `${formattedDate} at ${formattedTime}`;

                const isOwner = (currentUser === authorName);
                
                // --- NEW: Buttons now trigger the modern modals ---
                const ownerActionsHTML = isOwner ? `
                    <div class="flex gap-4 mt-3 pt-3 border-t border-surface-container">
                        <button onclick="openEditModal(${comment.id})" class="text-xs font-semibold text-primary hover:text-primary-container transition-colors">Edit</button>
                        <button onclick="openDeleteModal(${comment.id})" class="text-xs font-semibold text-error hover:text-error/80 transition-colors">Delete</button>
                    </div>
                ` : '';

                const commentHTML = `
                    <div class="bg-surface-container-lowest border border-surface-container-high rounded-xl p-4 shadow-sm">
                        <div class="flex items-center gap-3 mb-2">
                            <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                                ${firstLetter}
                            </div>
                            <div>
                                <p class="font-semibold text-sm text-on-surface">${authorName}</p>
                                <p class="text-xs text-on-surface-variant">${fullDateTime}</p>
                            </div>
                        </div>
                        <p class="text-on-surface text-sm leading-relaxed whitespace-pre-wrap" id="comment-content-${comment.id}">${comment.content}</p>
                        ${ownerActionsHTML}
                    </div>
                `;
                commentsList.innerHTML += commentHTML;
            });
        }
    } catch (error) {
        console.error('Error loading comments:', error);
        document.getElementById('comments-list').innerHTML = '<p class="text-error text-center">Failed to load comments.</p>';
    }
}


// This function fetches comments for the current post and displays them in the comments section. It also updates the comment count displayed on the page. If there are no comments, it shows a friendly message encouraging users to comment.
// --- NEW: Submit Comment Logic ---
async function submitComment() {
    const commentInput = document.getElementById('comment-input');
    const content = commentInput.value.trim();
    
    if (!content) {
        alert("Comment cannot be empty!");
        return;
    }

    const token = localStorage.getItem('access_token');
    
    if (!token) {
        alert("You must be logged in to comment.");
        window.location.href = "login.html"; 
        return;
    }

    const submitBtn = document.getElementById('submit-comment-btn');
    submitBtn.innerText = "Posting...";
    submitBtn.disabled = true;

    try {
        // FIXED URL: We now post to the root /api/comments/ endpoint
        const response = await fetch(`http://127.0.0.1:8000/api/comments/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            // FIXED BODY: We must send the postId inside the JSON data!
            body: JSON.stringify({ 
                post: postId, 
                content: content 
            })
        });

        if (response.ok) {
            commentInput.value = '';
            loadComments(); 
            getSinglePost(); 
        } else {
            const data = await response.json();
            alert(data.detail || "Error posting comment.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Network error occurred.");
    } finally {
        submitBtn.innerText = "Post Comment";
        submitBtn.disabled = false;
    }
}



// --- NEW: Modern Modal Logic for Edit & Delete ---

let activeCommentId = null; // Remembers which comment we are editing or deleting

function closeModals() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById('modal-overlay').classList.remove('flex');
    document.getElementById('delete-modal').classList.add('hidden');
    document.getElementById('edit-modal').classList.add('hidden');
    activeCommentId = null;
}

function openDeleteModal(commentId) {
    activeCommentId = commentId;
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('modal-overlay').classList.add('flex');
    document.getElementById('delete-modal').classList.remove('hidden');
}

function openEditModal(commentId) {
    activeCommentId = commentId;
    // Grab the existing text from the page and put it in the modal's text box
    const currentText = document.getElementById(`comment-content-${commentId}`).innerText;
    document.getElementById('edit-comment-input').value = currentText;
    
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('modal-overlay').classList.add('flex');
    document.getElementById('edit-modal').classList.remove('hidden');
}

async function confirmDeleteComment() {
    if (!activeCommentId) return;

    const token = localStorage.getItem('access_token');
    const btn = document.getElementById('confirm-delete-btn');
    btn.innerText = "Deleting...";
    
    try {
        const response = await fetch(`http://127.0.0.1:8000/api/comments/${activeCommentId}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            closeModals();
            loadComments(); 
            getSinglePost(); 
        } else {
            alert("Failed to delete comment.");
        }
    } catch (error) {
        console.error("Error deleting comment:", error);
    } finally {
        btn.innerText = "Delete";
    }
}

async function confirmEditComment() {
    if (!activeCommentId) return;

    const newText = document.getElementById('edit-comment-input').value.trim();
    if (newText === "") return;

    const token = localStorage.getItem('access_token');
    const btn = document.getElementById('confirm-edit-btn');
    btn.innerText = "Saving...";

    try {
        const response = await fetch(`http://127.0.0.1:8000/api/comments/${activeCommentId}/`, {
            method: 'PATCH', 
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ content: newText })
        });

        if (response.ok) {
            closeModals();
            loadComments(); 
        } else {
            alert("Failed to update comment.");
        }
    } catch (error) {
        console.error("Error updating comment:", error);
    } finally {
        btn.innerText = "Save Changes";
    }
}


