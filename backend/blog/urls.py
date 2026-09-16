# blog/urls.py

# urls.py is the file where we define the URL patterns for our blog application. 
# It maps URLs to the corresponding views, allowing users to access different parts of the application.

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, PostViewSet, CommentViewSet, LikeViewSet

# DefaultRouter automatically generates RESTful URL patterns for our ViewSets.
router = DefaultRouter()

# Registers standard routes: /api/users/, /api/users/<id>/
# PLUS custom action route:  /api/users/me/
router.register(r'users', UserViewSet)

# Registers standard routes: /api/posts/, /api/posts/<id>/
# PLUS custom action route:  /api/posts/my_stories/
router.register(r'posts', PostViewSet)

# Registers standard routes: /api/comments/, /api/comments/<id>/
router.register(r'comments', CommentViewSet)

# Registers standard routes: /api/likes/, /api/likes/<id>/
router.register(r'likes', LikeViewSet)

urlpatterns = [
    # The empty string '' here means all router URLs will be prefixed with 'api/'
    # as defined in this list. 
    path('api/', include(router.urls)),
]
