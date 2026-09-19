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
        const response = await fetch(`http://127.0.0.1:8000/api/posts/${postId}/`);
        
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

        // Inject the content (using innerHTML allows basic formatting like paragraphs if your backend sends it)
        contentElement.innerHTML = `<p>${postData.content}</p>`;

    } catch (error) {
        console.error("Something went wrong:", error);
        titleElement.innerText = "Error loading the post.";
        contentElement.innerText = "We couldn't load this post. Please try again later.";
    }
}

getSinglePost();
