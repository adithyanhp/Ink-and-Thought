# blog/views.py

#views.py is the file where we define the logic for our API endpoints. It handles incoming requests, interacts with the database through models, and returns responses in JSON format using serializers.

from rest_framework import viewsets, permissions, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import Post, Comment, Like
from .serializers import UserSerializer, PostSerializer, CommentSerializer, LikeSerializer, RegisterSerializer
from rest_framework.permissions import AllowAny


User = get_user_model()

#user viewset to handle user-related operations. It allows for CRUD operations on users and includes a custom endpoint to fetch or update the logged-in user's profile.
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


# comment viewset to handle comment-related operations. It allows for CRUD operations on comments and includes logic to ensure that users can only edit or delete their own comments.
class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer

    # Override the default queryset to allow filtering comments by post ID. This enables the frontend to fetch comments specific to a particular post.
    def get_queryset(self):
        queryset = super().get_queryset()
        post_id = self.request.query_params.get('post')
        if post_id is not None:
            queryset = queryset.filter(post_id=post_id)
        return queryset
    
    # Override the creation process to automatically set the author of the comment to the logged-in user
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    # NEW: Intercept delete requests to ensure the user owns the comment
    def destroy(self, request, *args, **kwargs):
        comment = self.get_object()
        if comment.author != request.user:
            return Response({"detail": "You cannot delete someone else's comment."}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    # NEW: Intercept edit requests to ensure the user owns the comment
    def update(self, request, *args, **kwargs):
        comment = self.get_object()
        if comment.author != request.user:
            return Response({"detail": "You cannot edit someone else's comment."}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)
    


# LikeViewSet handles the "like" functionality for posts. It allows users to like or unlike a post. The create method is overridden to implement a toggle effect: if the user has already liked the post, it will remove the like; otherwise, it will add a new like.
class LikeViewSet(viewsets.ModelViewSet):
    queryset = Like.objects.all()
    serializer_class = LikeSerializer

    # NEW: Override the creation process to create a toggle effect
    def create(self, request, *args, **kwargs):
        post_id = request.data.get('post')
        
        # Check if this exact user already liked this exact post
        existing_like = Like.objects.filter(user=request.user, post_id=post_id)
        
        if existing_like.exists():
            # UNLIKE: If the like exists, delete it and tell the frontend we succeeded
            existing_like.delete()
            return Response({"message": "Unliked successfully"}, status=status.HTTP_200_OK)
        else:
            # LIKE: If it doesn't exist, proceed with normal creation
            return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

#RegisterView is a generic view that allows new users to register. It uses the RegisterSerializer to validate and create new user instances. The permission_classes = [AllowAny] line means that anyone (even unauthenticated users) can access this endpoint to register.
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    # We will import this from your serializers file next
    serializer_class = RegisterSerializer

