from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Post, Comment, Like

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # Added the new fields matching your frontend profile.html
        fields = [
            'id', 
            'username', 
            'email', 
            'profile_picture', 
            'bio', 
            'location', 
            'website'
        ]

class CommentSerializer(serializers.ModelSerializer):
    author = serializers.ReadOnlyField(source='author.username')

    class Meta:
        model = Comment
        fields = '__all__'

class LikeSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Like
        fields = '__all__'

class PostSerializer(serializers.ModelSerializer):
    author = serializers.ReadOnlyField(source='author.username')
    comments = CommentSerializer(many=True, read_only=True)
    likes_count = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = '__all__'

    def get_likes_count(self, obj):
        return obj.likes.count()

# RegisterSerializer is used to handle user registration. It ensures that the password is only written and never sent back to the frontend.
class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'password', 'email')
        # write_only ensures the password is never sent back to the frontend in a response
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        # create_user automatically hashes the password for us
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

# PostFeedSerializer is designed to provide a summarized view of posts for the feed. It includes the author's username and profile picture, as well as counts for likes and comments, making it suitable for displaying in a feed or list view.
class PostFeedSerializer(serializers.ModelSerializer):
    # Grab the author's username and profile picture
    author_name = serializers.ReadOnlyField(source='author.username')
    author_image = serializers.ImageField(source='author.profile_picture', read_only=True)
    
    # Calculate totals for the feed cards
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()

    class Meta:
        model = Post
        # Notice we use 'synopsis' here to match your model!
        fields = [
            'id', 'title', 'slug', 'synopsis', 'category', 'image', 
            'author_name', 'author_image', 'created_at', 
            'likes_count', 'comments_count'
        ]

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_comments_count(self, obj):
        return obj.comments.count()

    