# blog/views.py

#views.py is the file where we define the logic for our API endpoints. It handles incoming requests, interacts with the database through models, and returns responses in JSON format using serializers.

from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import Post, Comment, Like
from .serializers import UserSerializer, PostSerializer, CommentSerializer, LikeSerializer

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    # Custom endpoint for the frontend to easily fetch/update the logged-in user's profile
    @action(detail=False, methods=['get', 'put', 'patch'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        user = request.user
        if request.method == 'GET':
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        else:
            # Handle PUT or PATCH for updating profile (Bio, Location, etc.)
            serializer = self.get_serializer(user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all().order_by('-created_at')
    serializer_class = PostSerializer

    def perform_create(self, serializer):
        # Automatically set the author to the logged-in user when a post is created
        serializer.save(author=self.request.user)

    # Custom endpoint to power the "My Stories" tab in your frontend
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_stories(self, request):
        posts = Post.objects.filter(author=request.user).order_by('-created_at')
        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data)

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class LikeViewSet(viewsets.ModelViewSet):
    queryset = Like.objects.all()
    serializer_class = LikeSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

