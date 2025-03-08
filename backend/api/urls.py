from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    DesafioViewSet, PublicacionViewSet,
    FormularioFeedbackViewSet, FormularioContactoViewSet,
    RecursosDidacticosViewSet, HomeDataView, UserDetailView, UserUpdateView,
    UserDeleteView, CustomAuthToken, ComentarioPublicacionViewSet, RegisterView, ChangePasswordView, ListarDesafiosView,
    EliminarPublicacionAPIView,obtener_usuario,TwoFactorAuthView, Verify2FAView, enable_2fa, confirm_2fa, disable_2fa
)

router = DefaultRouter()
router.register(r'feedbacks', FormularioFeedbackViewSet, basename='formulariofeedback')
router.register(r'contacto', FormularioContactoViewSet, basename="contacto")
router.register(r'desafios', DesafioViewSet, basename='desafio')
router.register(r'blog', PublicacionViewSet, basename='blog')
router.register(r'comentarios', ComentarioPublicacionViewSet, basename='comentariopublicacion')
router.register(r'recursos', RecursosDidacticosViewSet, basename='recursosdidacticos')

urlpatterns = [
    path('', include(router.urls)),  
    path('token/', CustomAuthToken.as_view(), name='custom_token'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('user/', UserDetailView.as_view(), name='user_detail'),
    path('user/update/', UserUpdateView.as_view(), name='user_update'),
    path('user/delete/', UserDeleteView.as_view(), name='user_delete'),
    path("home/", HomeDataView.as_view(), name="home"),
    path("register/", RegisterView.as_view(), name="register"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("desafios/", ListarDesafiosView.as_view(), name="listar_desafios"),
    path("desafios/<int:pk>/toggle_like/", DesafioViewSet.as_view({'post': 'toggle_like'}), name="toggle_like"),
    path('desafios/mis_favoritos/', DesafioViewSet.as_view({'get': 'mis_favoritos'}), name='mis_favoritos'),
    path('blog/<int:publicacion_id>/comentarios/', ComentarioPublicacionViewSet.as_view({'get': 'list'}), name='comentarios-publicacion-list'),
    path('blog/<int:publicacion_id>/comentarios/nuevo/', ComentarioPublicacionViewSet.as_view({'post': 'create'}), name='comentarios-publicacion-create'),
    path('blog/<int:publicacion_id>/eliminar/', EliminarPublicacionAPIView.as_view(), name='eliminar-publicacion'),
    path("usuario/", obtener_usuario, name="obtener_usuario"),
    path("desafios/<int:pk>/", DesafioViewSet.as_view({'get': 'retrieve'}), name="detalle-desafio"),
    path("2fa/", TwoFactorAuthView.as_view(), name="two_factor_auth"),

    # URL para login (con y sin 2FA)
    path("login/", TwoFactorAuthView.as_view(), name="login"),

    # URL para verificar OTP
    path("login/verify-otp/", Verify2FAView.as_view(), name="verify-otp"),

    # Mantén estas URLs para el manejo de 2FA (activar/desactivar)
    path("enable-2fa/", enable_2fa, name="enable_2fa"),
    path("disable-2fa/", disable_2fa, name="disable_2fa"),
    path("verify-2fa/", Verify2FAView.as_view(), name="verify_2fa"),
    path("confirm-2fa/", confirm_2fa, name="confirm_2fa"),



]

