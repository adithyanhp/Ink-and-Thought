from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Post, Comment, Like

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 
            'username', 
            'email', 
            'first_name',
            'last_name',
            'profile_picture', 
            'bio', 
            'location', 
            'website'
        ]
        # ADDED: Make core identity fields read-only so they safely load without being overwritten
        read_only_fields = ['id', 'username', 'email']

class CommentSerializer(serializers.ModelSerializer):
    author = serializers.ReadOnlyField(source='author.username')
    # NEW: Send the comment author's profile picture
    author_image = serializers.ImageField(source='author.profile_picture', read_only=True)

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
    # NEW: Send the post author's profile picture
    author_image = serializers.ImageField(source='author.profile_picture', read_only=True)
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
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

# PostFeedSerializer is designed to provide a summarized view of posts for the feed. It includes the author's username and profile picture, as well as counts for likes and comments, making it suitable for displaying in a feed or list view.
class PostFeedSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.username')
    author_image = serializers.ImageField(source='author.profile_picture', read_only=True)
    
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'title', 'slug', 'synopsis', 'category', 'image', 
            'author_name', 'author_image', 'created_at', 
            'likes_count', 'comments_count'
        ]

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_comments_count(self, obj):
        return obj.comments.count()