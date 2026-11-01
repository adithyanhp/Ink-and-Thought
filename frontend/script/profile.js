// script/profile.js
// This script handles the profile page functionality, including fetching user data, previewing avatar images, and submitting profile updates.

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Map all UI elements
    const avatarInput = document.getElementById('avatarInput');
    const avatarPreview = document.getElementById('avatarPreview');
    const headerAvatar = document.getElementById('headerAvatar'); // NEW: Targets the top navbar image
    const saveBtn = document.getElementById('save-btn');

    const bioEl = document.getElementById('bio');
    const locationEl = document.getElementById('location');
    const websiteEl = document.getElementById('website');
    const usernameEl = document.getElementById('username');
    const firstNameEl = document.getElementById('first-name'); // NEW: Separated First Name
    const lastNameEl = document.getElementById('last-name');   // NEW: Separated Last Name
    const emailEl = document.getElementById('email');

    // 1. Fetch and Populate Profile Data
    try {
        const response = await fetch('http://127.0.0.1:8000/api/users/me/', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Populate text fields securely
            if (bioEl) bioEl.value = data.bio || '';
            if (locationEl) locationEl.value = data.location || '';
            if (websiteEl) websiteEl.value = data.website || '';
            if (emailEl) emailEl.value = data.email || ''; 
            if (usernameEl) usernameEl.value = data.username ? `@${data.username}` : '';
            
            // Set explicit First and Last name fields
            if (firstNameEl) firstNameEl.value = data.first_name || '';
            if (lastNameEl) lastNameEl.value = data.last_name || '';
            
            // Set existing avatar in both the edit preview AND the top header
            if (data.profile_picture) {
                if (avatarPreview) avatarPreview.src = data.profile_picture;
                if (headerAvatar) headerAvatar.src = data.profile_picture;
            }
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
    }

    // 2. Local Avatar Preview Generation
    avatarInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && avatarPreview) {
            const reader = new FileReader();
            reader.onload = (event) => { 
                avatarPreview.src = event.target.result; 
                // We don't update the top header here until they actually hit "Save"
            };
            reader.readAsDataURL(file);
        }
    });

    // 3. Submit Profile Updates
    saveBtn?.addEventListener('click', async () => {
        // Capture original button state and trigger loading UI
        const originalHtml = saveBtn.innerHTML;
        saveBtn.innerHTML = '<span class="material-symbols-outlined text-base animate-spin">refresh</span><span>Saving...</span>';
        saveBtn.disabled = true;

        const formData = new FormData();
        
        if (bioEl) formData.append('bio', bioEl.value);
        if (locationEl) formData.append('location', locationEl.value);
        if (websiteEl) formData.append('website', websiteEl.value);
        
        // Append explicit first and last names
        if (firstNameEl) formData.append('first_name', firstNameEl.value.trim());
        if (lastNameEl) formData.append('last_name', lastNameEl.value.trim());
        
        // Attach the image file if a new one was selected
        if (avatarInput && avatarInput.files.length > 0) {
            formData.append('profile_picture', avatarInput.files[0]);
        }

        try {
            const updateResponse = await fetch('http://127.0.0.1:8000/api/users/me/', {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (updateResponse.ok) {
                const updatedData = await updateResponse.json();
                
                // Update the top header image instantly on successful save
                if (headerAvatar && updatedData.profile_picture) {
                    headerAvatar.src = updatedData.profile_picture;
                }

                // Trigger success UI state
                saveBtn.innerHTML = '<span class="material-symbols-outlined text-base">done_all</span><span>Saved!</span>';
            } else {
                saveBtn.innerHTML = '<span class="material-symbols-outlined text-base">error</span><span>Error</span>';
                const err = await updateResponse.json();
                console.error(err);
                alert('Failed to update profile. Check console for details.');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            saveBtn.innerHTML = '<span class="material-symbols-outlined text-base">error</span><span>Error</span>';
            alert('A network error occurred.');
        } finally {
            // Restore original button state after 2 seconds
            setTimeout(() => {
                saveBtn.innerHTML = originalHtml;
                saveBtn.disabled = false;
            }, 2000);
        }
    });
});
