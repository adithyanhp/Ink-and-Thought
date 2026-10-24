# blog/urls.py

# urls.py is the file where we define the URL patterns for our blog application. 
# It maps URLs to the corresponding views, allowing users to access different parts of the application.

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import UserViewSet, PostViewSet, CommentViewSet, LikeViewSet, RegisterView, PostFeedListAPIView


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

    # 1. Custom endpoints MUST go before the router include!
    path('api/feed/', PostFeedListAPIView.as_view(), name='api-feed'),

    # The empty string '' here means all router URLs will be prefixed with 'api/'
    # as defined in this list. 
    # 2. The router catches everything else starting with api/
    path('api/', include(router.urls)),

    # 3. Registration endpoint (Creates the user)
    path('api/register/', RegisterView.as_view(), name='auth_register'),
    
    # 4. Login endpoint (Returns the JWT when given a valid username/password)
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'), 
    
    # 5. Refresh endpoint (Renews the token before it expires)
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    
]
