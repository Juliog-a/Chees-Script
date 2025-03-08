from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
import json
from rest_framework.decorators import action
from rest_framework.decorators import api_view
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
import logging
from rest_framework.throttling import UserRateThrottle
from django.db.models import F
import pyotp
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.views import View
import pyotp
import json
from django.contrib.auth import authenticate
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from django.core.cache import cache




from .serializers import (
    DesafioSerializer, PublicacionSerializer, ComentarioPublicacionSerializer,
    FormularioFeedbackSerializer, SnippetSerializer, FormularioContactoSerializer,
    RecursosDidacticosSerializer, UserSerializer, FormularioFeedbackSerializer
)

from .models import (
    Desafio, Publicacion, ComentarioPublicacion, FormularioFeedback, 
    Snippet, FormularioContacto, RecursosDidacticos, Profile, FormularioFeedback,
    UsuarioDesafio
)

from django.contrib.auth.hashers import check_password, make_password

logger = logging.getLogger(__name__)  


#VIEWS RELACIONADOS CON DESAFIOS:


class ListarDesafiosView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        desafios = Desafio.objects.all()
        serializer = DesafioSerializer(desafios, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class UsuarioView(APIView):
    def get(self, request):
        return Response({"mensaje": "Hola, este es el endpoint de usuarios"}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def obtener_usuario(request):
    """ Devuelve la información del usuario autenticado """
    usuario = request.user
    return Response({
        "id": usuario.id,
        "username": usuario.username,
        "email": usuario.email,
        "is_staff": usuario.is_staff,
        "is_superuser": usuario.is_superuser,
    })


class DesafioViewSet(viewsets.ModelViewSet):
    queryset = Desafio.objects.all()
    serializer_class = DesafioSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        """ Permite crear un desafío usando `usuario_id` en la petición. """
        data = request.data.copy()
        usuario_id = data.get("usuario_id")

        if not usuario_id:
            return Response({"error": "El campo usuario_id es obligatorio."}, status=status.HTTP_400_BAD_REQUEST)

        usuario = get_object_or_404(User, id=usuario_id)
        data["usuario"] = usuario.id

        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            serializer.save(usuario=usuario)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def toggle_like(self, request, pk=None):
        """ Permite a los usuarios dar o quitar "Me gusta" a un desafío. """
        desafio = self.get_object()
        user = request.user

        if user in desafio.likes.all():
            desafio.likes.remove(user)  # Quitar like
            liked = False
        else:
            desafio.likes.add(user)  # Dar like
            liked = True

        return Response({"liked": liked})
    
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def mis_favoritos(self, request):
        """ Obtiene los desafíos que el usuario ha marcado como favoritos """
        user = request.user
        favoritos = Desafio.objects.filter(likes=user)  # Filtramos solo los que tienen el like del usuario

        serializer = self.get_serializer(favoritos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def destroy(self, request, pk=None):
        """ Permite eliminar un desafío solo si es del usuario creador. """
        desafio = get_object_or_404(Desafio, pk=pk)

        if desafio.usuario != request.user:
            return Response({"error": "No tienes permiso para eliminar este desafío."}, status=status.HTTP_403_FORBIDDEN)

        desafio.delete()
        return Response({"message": "Desafío eliminado correctamente."}, status=status.HTTP_200_OK)

    def retrieve(self, request, *args, **kwargs):
        """ Obtener un desafío por su ID """
        return super().retrieve(request, *args, **kwargs)


    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def verificar_respuesta(self, request, pk=None):
        """ Verifica si la respuesta es correcta y suma puntos solo la primera vez """
        usuario = request.user
        desafio = self.get_object()
        respuesta_usuario = request.data.get("respuesta", "").strip().lower()

        if respuesta_usuario == desafio.solucion.strip().lower():
            # Verificar si el usuario ya resolvió el desafío
            if not UsuarioDesafio.objects.filter(usuario=usuario, desafio=desafio).exists():
                # Registrar el desafío como completado para el usuario
                UsuarioDesafio.objects.create(usuario=usuario, desafio=desafio)

                # Obtener el perfil del usuario
                profile, _ = Profile.objects.get_or_create(user=usuario)

                # Sumar puntos
                profile.points = F('points') + desafio.puntuacion
                profile.save()
                profile.refresh_from_db()  # Recargar para obtener los puntos actualizados

                return Response({
                    "mensaje": "¡Correcto! Has resuelto el desafío.",
                    "solucionado": True,
                    "puntos": profile.points
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    "mensaje": "Ya has resuelto este desafío antes.",
                    "solucionado": True,
                    "puntos": usuario.profile.points
                }, status=status.HTTP_200_OK)
        else:
            return Response({
                "mensaje": "Incorrecto. Inténtalo de nuevo.",
                "solucionado": False
            }, status=status.HTTP_400_BAD_REQUEST)




class FormularioFeedbackViewSet(viewsets.ModelViewSet):
    queryset = FormularioFeedback.objects.all()
    serializer_class = FormularioFeedbackSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        print("Datos recibidos en el request:", request.data)  # Para Depuración

        usuario_id = request.data.get("usuario_id") 
        desafio_id = request.data.get("desafio_id")

        if not usuario_id or not desafio_id:
            return Response({"error": "El campo usuario_id y desafio_id son obligatorios."}, status=status.HTTP_400_BAD_REQUEST)

        usuario = get_object_or_404(User, id=usuario_id)
        desafio = get_object_or_404(Desafio, id=desafio_id)

        request.data["usuario"] = usuario.id
        request.data["desafio"] = desafio.id 

        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save(usuario=usuario, desafio=desafio)  
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            print("Error en validación:", serializer.errors)  # Mostrar errores en consola
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)





class RecursosDidacticosViewSet(viewsets.ModelViewSet):
    queryset = RecursosDidacticos.objects.all()
    serializer_class = RecursosDidacticosSerializer

    def list(self, request):
        """
        Permite filtrar recursos por desafio y tipo (teoria/pista).
        """
        desafio_id = request.query_params.get("desafio_id")
        tipo = request.query_params.get("tipo")

        recursos = self.queryset

        if desafio_id:
            recursos = recursos.filter(desafio_id=desafio_id)

        if tipo:
            recursos = recursos.filter(tipo=tipo)

        serializer = self.serializer_class(recursos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)








#VIEWS RELACIONADOS CON EL BLOG:



class BajaFrecuenciaThrottle(UserRateThrottle):
    rate = '5/min'

class EliminarPublicacionAPIView(APIView):
    """ Permite eliminar una publicación si el usuario es admin/staff o el propietario """

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [BajaFrecuenciaThrottle] 
    def delete(self, request, publicacion_id):
        publicacion = get_object_or_404(Publicacion, id=publicacion_id)

        # Permitir eliminación si el usuario es dueño o admin/staff
        if request.user == publicacion.usuario or request.user.is_staff or request.user.is_superuser:
            publicacion.delete()
            return Response({"mensaje": "Publicación eliminada con éxito"}, status=status.HTTP_204_NO_CONTENT)
        else:
            logger.warning(f"Intento de eliminación no autorizado: Usuario {request.user.id} intentó eliminar la publicación {publicacion_id}")
            return Response({"error": "No tienes permiso para eliminar esta publicación"}, status=status.HTTP_403_FORBIDDEN)


class PublicacionViewSet(viewsets.ModelViewSet):
    queryset = Publicacion.objects.all()
    serializer_class = PublicacionSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        """ Crear una publicación con el usuario autenticado """
        print("Datos recibidos en la API:", request.data)

        usuario = request.user
        data = request.data.copy()
        data["usuario"] = usuario.id

        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            serializer.save(usuario=usuario)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        print("Error de validación:", serializer.errors)  
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def list(self, request, *args, **kwargs):
        """ Devuelve todas las publicaciones con la cantidad de likes de cada una """
        publicaciones = self.get_queryset()
        serializer = self.get_serializer(publicaciones, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def retrieve(self, request, pk=None):
        """ Obtener una publicación junto con sus comentarios """
        publicacion = get_object_or_404(Publicacion, pk=pk)
        serializer = self.get_serializer(publicacion)

        comentarios = ComentarioPublicacion.objects.filter(publicacion=publicacion).order_by("-fecha_publicacion")
        comentarios_data = [{"autor": c.autor, "contenido": c.contenido, "fecha": c.fecha_publicacion} for c in comentarios]

        return Response({
            "publicacion": serializer.data,
            "comentarios": comentarios_data 
        }, status=status.HTTP_200_OK)


    @action(detail=True, methods=['post'])
    def toggle_like(self, request, pk=None):
        """ Permite a un usuario dar o quitar 'Me gusta' a una publicación """
        publicacion = get_object_or_404(Publicacion, pk=pk)
        user = request.user

        if publicacion.likes.filter(id=user.id).exists():
            publicacion.likes.remove(user)  # Quitar like
            liked = False
        else:
            publicacion.likes.add(user)  # Dar like
            liked = True

        return Response({
            "liked": liked,
            "likes_count": publicacion.likes.count()  # Devuelve el número actualizado de likes
        }, status=status.HTTP_200_OK)


class ComentarioPublicacionViewSet(viewsets.ModelViewSet):
    """ API para manejar comentarios de publicaciones """
    serializer_class = ComentarioPublicacionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """ Filtra comentarios por publicación específica """
        publicacion_id = self.kwargs.get("publicacion_id")
        if publicacion_id:
            return ComentarioPublicacion.objects.filter(publicacion_id=publicacion_id).order_by("-fecha_publicacion")
        return ComentarioPublicacion.objects.none()

    def create(self, request, *args, **kwargs):
        """ Agregar comentario a una publicación """
        usuario = request.user
        data = request.data.copy()
        publicacion_id = data.get("publicacion_id")

        if not publicacion_id:
            return Response({"error": "El campo publicacion_id es obligatorio."}, status=status.HTTP_400_BAD_REQUEST)

        publicacion = get_object_or_404(Publicacion, id=publicacion_id)

        data["usuario"] = usuario.id 
        data["autor"] = usuario.username 

        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            serializer.save(publicacion=publicacion)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



#VIEWS RELACIONADOS CON EL CONTACTO AL USUARIO:

class FormularioContactoViewSet(viewsets.ModelViewSet):
    queryset = FormularioContacto.objects.all()
    serializer_class = FormularioContactoSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        print("Datos recibidos en el request:", json.dumps(request.data, indent=2))

        usuario = request.user if request.user.is_authenticated else None
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            serializer.save(usuario=usuario)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            print("Errores de validación:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        




#VIEWS RELACIONADOS CON EL MANEJO DE USUARIO, VISTAS Y AUTENTICACIÓN:

class CustomAuthToken(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username_or_email = request.data.get("username")
        password = request.data.get("password")

        if not username_or_email or not password:
            return Response({"error": "Faltan datos."}, status=status.HTTP_400_BAD_REQUEST)

        user = None
        if "@" in username_or_email:
            try:
                user = User.objects.get(email=username_or_email)
            except User.DoesNotExist:
                return Response({"error": "Usuario no encontrado."}, status=status.HTTP_401_UNAUTHORIZED)
        else:
            user = authenticate(username=username_or_email, password=password)

        if user is not None:
            refresh = RefreshToken.for_user(user)
            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            })
        return Response({"error": "Credenciales incorrectas"}, status=status.HTTP_401_UNAUTHORIZED)


class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class UserUpdateView(APIView):
    """Permite actualizar los datos del usuario."""
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        data = request.data

        print("Datos recibidos en Django:", data)  # Para Depuración

        if "username" in data:
            user.username = data["username"]

        if "email" in data:
            user.email = data["email"]

        # Verificar si hay cambio de contraseña
        old_password = data.get("oldPassword", "").strip()
        new_password = data.get("newPassword", "").strip()
        confirm_password = data.get("confirmPassword", "").strip()

        if old_password and new_password and confirm_password:
            if not user.check_password(old_password):
                return Response({"error": "La contraseña actual es incorrecta."}, status=status.HTTP_400_BAD_REQUEST)

            if new_password != confirm_password:
                return Response({"error": "Las nuevas contraseñas no coinciden."}, status=status.HTTP_400_BAD_REQUEST)

            user.set_password(new_password)

        # Forzar guardado de `profile_image`
        if "profile_image" in data:
            print("Actualizando profile_image con:", data["profile_image"])  # Depuración

            if data["profile_image"].strip():
                user.profile.profile_image = data["profile_image"]
                user.profile.save(update_fields=['profile_image'])
                print("Imagen guardada correctamente:", user.profile.profile_image)  # Verificar en consola

        # Guardar cambios en el usuario y asegurarse de que se almacenen
        user.save()

        return Response({
            "message": "Perfil actualizado correctamente.",
            "profile_image": user.profile.profile_image
        }, status=status.HTTP_200_OK)



class UserDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user = request.user
        user.delete()
        return Response({"message": "Cuenta eliminada correctamente."}, status=status.HTTP_200_OK)


class HomeDataView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        players = User.objects.filter(profile__points__gt=0).order_by("-profile__points")[:6]
        ranking = UserSerializer(players, many=True).data
        
        return Response({
            "message": "Bienvenido a Chees Script",
            "ranking": ranking
        })


class RegisterView(APIView):
    permission_classes = [AllowAny] 
    def post(self, request):
        username = request.data.get("username")
        email = request.data.get("email")
        password = request.data.get("password")

        if not username or not email or not password:
            return Response({"error": "Todos los campos son obligatorios"}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({"error": "El usuario ya existe."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({"error": "El email ya está registrado."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, email=email, password=password)

        # Generar los tokens de acceso y refresco para el usuario recién registrado
        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)

        return Response({
            "message": "Usuario registrado con éxito.",
            "access": access,
            "refresh": str(refresh),
        }, status=status.HTTP_201_CREATED)
    

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        old_password = request.data.get("oldPassword")
        new_password = request.data.get("newPassword")

        if not check_password(old_password, user.password):
            return Response({"error": "La contraseña antigua es incorrecta."}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 8:
            return Response({"error": "La nueva contraseña debe tener al menos 8 caracteres."}, status=status.HTTP_400_BAD_REQUEST)

        user.password = make_password(new_password)
        user.save()
    
        refresh = RefreshToken.for_user(user)
        new_access_token = str(refresh.access_token)

        return Response({
            "message": "Contraseña cambiada con éxito.",
            "access_token": new_access_token
        }, status=status.HTTP_200_OK)





@method_decorator(csrf_exempt, name='dispatch')
class TwoFactorAuthView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            username = data.get("username")
            password = data.get("password")

            user = authenticate(username=username, password=password)

            if user:
                if hasattr(user, 'profile') and user.profile.is2fa_enabled:
                    temp_token = RefreshToken.for_user(user).access_token
                    return JsonResponse({
                        "2fa_required": True,
                        "temp_token": str(temp_token),
                        "username": user.username
                    }, status=200)

                refresh = RefreshToken.for_user(user)
                return JsonResponse({
                    "2fa_required": False,
                    "access": str(refresh.access_token),
                    "refresh": str(refresh)
                }, status=200)

            return JsonResponse({"error": "Credenciales incorrectas"}, status=400)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)







@method_decorator(csrf_exempt, name='dispatch')
class Verify2FAView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            temp_token = data.get("temp_token")
            otp_code = data.get("otp_code")
            username = data.get("username")

            if not otp_code or not temp_token or not username:
                return JsonResponse({"error": "Faltan datos."}, status=400)

            user = User.objects.get(username=username)

            attempts_key = f"2fa_attempts_{username}"
            attempts = cache.get(attempts_key, 0)

            if attempts >= 3:
                return JsonResponse({"error": "Has alcanzado el límite de intentos. Inténtalo de nuevo más tarde."}, status=403)

            totp = pyotp.TOTP(user.profile.otp_secret)

            if totp.verify(otp_code):
                cache.delete(attempts_key)
                refresh = RefreshToken.for_user(user)
                return JsonResponse({
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                }, status=200)
            else:
                attempts += 1
                cache.set(attempts_key, attempts, timeout=60) #espera de un min cuando fallas 3 veces en el codigo de verificacion
                return JsonResponse({"error": f"Código incorrecto. Intento {attempts}/3"}, status=400)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


# Función para generar el código QR al activar 2FA

@authentication_classes([JWTAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def enable_2fa(request):
    """Genera un código QR para activar 2FA en la cuenta del usuario."""
    try:
        # ✅ Autenticación manual con JWTAuthentication
        user, _ = JWTAuthentication().authenticate(request)

        if user is None:
            return JsonResponse({"error": "Token inválido o usuario no autenticado"}, status=401)

        if not hasattr(user, "profile"):
            return JsonResponse({"error": "El usuario no tiene un perfil."}, status=500)

        if not user.profile.otp_secret:
            user.profile.otp_secret = pyotp.random_base32()
            user.profile.save()

        totp = pyotp.TOTP(user.profile.otp_secret)
        otp_uri = totp.provisioning_uri(name=user.email, issuer_name="Cheese Script")

        return JsonResponse({"qr_code": otp_uri})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# Función para confirmar el código OTP e indicar que 2FA está activado

@csrf_exempt  # 🔹 Desactiva CSRF para pruebas
@api_view(["POST"])  # 🔹 Define el método POST permitido
@authentication_classes([JWTAuthentication])  # 🔹 Usa JWT para autenticación
@permission_classes([IsAuthenticated])  # 🔹 Asegura que el usuario está autenticado
def confirm_2fa(request):
    """Verifica el código OTP ingresado por el usuario después del login."""
    try:
        print(f"🔹 Usuario autenticado en Django: {request.user}")  # 🔍 Log para ver qué usuario se está autenticando
        print(f"🔹 ¿Está autenticado?: {request.user.is_authenticated}")  

        if not request.user.is_authenticated:  # ✅ Si Django no reconoce el usuario, devuelve error
            return JsonResponse({"error": "Usuario no autenticado"}, status=401)

        data = json.loads(request.body)
        otp_code = data.get("otp_code")
        user = request.user

        if not hasattr(user, "profile"):  # ✅ Verifica si el usuario tiene perfil
            return JsonResponse({"error": "El usuario no tiene un perfil asociado."}, status=400)

        if not otp_code:
            return JsonResponse({"error": "Se requiere un código OTP."}, status=400)

        totp = pyotp.TOTP(user.profile.otp_secret)

        if totp.verify(otp_code):
            user.profile.is2fa_enabled = True
            user.profile.save()
            return JsonResponse({"success": "✅ Código correcto. 2FA activado."}, status=200)

        return JsonResponse({"error": "Código incorrecto."}, status=400)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# Función para desactivar 2FA
@api_view(["POST"])
@authentication_classes([JWTAuthentication])  # Usa autenticación JWT
@permission_classes([IsAuthenticated])  # Asegura que el usuario esté autenticado
def disable_2fa(request):
    """Desactiva el 2FA, pero primero verifica un código OTP."""
    try:
        # Verificar si el usuario está autenticado correctamente
        if not request.user or request.user.is_anonymous:
            return Response({"error": "Usuario no autenticado. Inicia sesión de nuevo."}, status=401)

        # Verificar si el usuario tiene perfil y 2FA activado
        if not hasattr(request.user, "profile") or not request.user.profile.is2fa_enabled:
            return Response({"error": "No tienes 2FA activado."}, status=400)

        # Obtener el código OTP del cuerpo de la petición
        data = json.loads(request.body)
        otp_code = data.get("otp_code")

        if not otp_code:
            return Response({"error": "Debes ingresar un código OTP para desactivar 2FA."}, status=400)

        # Verificar el código OTP
        totp = pyotp.TOTP(request.user.profile.otp_secret)

        if not totp.verify(otp_code):
            return Response({"error": "Código OTP incorrecto."}, status=400)

        # Si el código es correcto, desactivar el 2FA
        request.user.profile.otp_secret = ""
        request.user.profile.is2fa_enabled = False
        request.user.profile.save()

        return Response({"status": "success", "message": "2FA desactivado correctamente."}, status=200)

    except Exception as e:
        return Response({"error": str(e)}, status=500)