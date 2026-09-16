from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.text import slugify

# 1. Custom User for Profile Pictures and Settings
class User(AbstractUser):
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)
    bio = models.TextField(max_length=500, blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)
    website = models.URLField(max_length=200, blank=True, null=True)
    # Note: Username, email, first_name, last_name, and password are automatically included by Django

# 2. Blog Post Model
class Post(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=250, unique=True, blank=True)
    subtitle = models.CharField(max_length=250, blank=True, null=True)
    synopsis = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True) # For the 'Publication Hub'
    tags = models.CharField(max_length=200, blank=True, null=True) # Store as comma-separated values
    
    content = models.TextField()
    image = models.ImageField(upload_to='blog_images/', blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at'] # Shows newest posts first

    def __str__(self):
        return self.title
        
    # Automatically generate a URL slug from the title if one isn't provided
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

# 3. Comment Model
class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Comment by {self.author.username} on {self.post.title}'

# 4. Like Model
class Like(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='likes')

    class Meta:
        unique_together = ('post', 'user') # Prevents a user from liking the same post twice

    def __str__(self):
        return f'{self.user.username} likes {self.post.title}'
    