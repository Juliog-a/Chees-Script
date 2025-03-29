from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.views import View
from rest_framework.authentication import SessionAuthentication
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.decorators import action, api_view, authentication_classes, permission_classes
from rest_framework.throttling import UserRateThrottle
from django.db.models import F
from django.core.cache import cache
from django.core.mail import send_mail
import logging
import json
import pyotp
import os
from django.conf import settings
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from django.utils.timezone import now
#from defender.decorators import watch_login
from django.contrib.auth.hashers import check_password, make_password
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from rest_framework.viewsets import ViewSet
from django.contrib.auth.views import PasswordResetConfirmView
from django.contrib.auth.hashers import check_password
from django.contrib import messages
from django.urls import reverse_lazy
from django.shortcuts import render

from .serializers import (
    DesafioSerializer, PublicacionSerializer, ComentarioPublicacionSerializer,
    FormularioFeedbackSerializer, SnippetSerializer, FormularioContactoSerializer,
    RecursosDidacticosSerializer, UserSerializer, FormularioFeedbackSerializer, TrofeoSerializer
)

from .models import (
    Desafio, Publicacion, ComentarioPublicacion, FormularioFeedback, 
    Snippet, FormularioContacto, RecursosDidacticos, Profile, FormularioFeedback,
    UsuarioDesafio, Trofeo
)


logger = logging.getLogger(__name__)  


#VIEWS RELACIONADOS CON DESAFIOS:


class ListarDesafiosView(APIView):
    permission_classes = [IsAuthenticated]

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
    """ Devuelve información limitada del usuario autenticado """
    usuario = request.user
    return Response({
        "id": usuario.id,
        "username": usuario.username,
        "is_superuser": usuario.is_superuser,
    })



class DesafioViewSet(viewsets.ModelViewSet):
    queryset = Desafio.objects.all()
    serializer_class = DesafioSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        """ El usuario autenticado crea el desafío, sin permitir `usuario_id` externo """
        data = request.data.copy()
        data["usuario"] = request.user.id  # Asegura que el creador es el usuario autenticado

        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            serializer.save(usuario=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    def toggle_like(self, request, pk=None):
        """ Permite a los usuarios dar o quitar "Me gusta" a un desafío. """
        desafio = self.get_object()
        user = request.user
        """ Protege contra spam de likes """

        if desafio.likes.filter(id=user.id).exists():
            desafio.likes.remove(user)
            liked = False
        else:
            desafio.likes.add(user)
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
        usuario = request.user
        desafio = self.get_object()
        respuesta_usuario = request.data.get("respuesta", "").strip().lower()

        if respuesta_usuario == desafio.solucion.strip().lower():
            completado, creado = UsuarioDesafio.objects.get_or_create(usuario=usuario, desafio=desafio)

            if creado:
                profile, _ = Profile.objects.get_or_create(user=usuario)
                profile.points = F('points') + desafio.puntuacion
                profile.save()
                profile.refresh_from_db()
                print("Puntos actuales tras actualización:", profile.points)
                for trofeo in desafio.trofeos_desbloqueables.all():
                    if usuario not in trofeo.usuarios_desbloqueados.all():
                        trofeo.fecha_obtenido = now()
                        trofeo.usuarios_desbloqueados.add(usuario)
                        trofeo.save()
                Trofeo.check_desafio_completados(usuario)

                return Response({
                        "mensaje": "¡Correcto! Has resuelto el desafío.",
                    "solucionado": True,
                    "puntos": profile.points
                })

            else:
                return Response({
                    "mensaje": "Ya has resuelto este desafío antes.",
                    "solucionado": True,
                    "puntos": usuario.profile.points
                })
        else:
            return Response({
                "mensaje": "Incorrecto. Inténtalo de nuevo.",
                "solucionado": False
            }, status=status.HTTP_400_BAD_REQUEST)

class TrofeosUsuarioView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        usuario = request.user
        
        try:
            profile = usuario.profile
            puntos_usuario = profile.points
        except Profile.DoesNotExist:
            puntos_usuario = 0

        Trofeo.check_desafio_completados(usuario)

        trofeos = Trofeo.objects.all()
        serializer = TrofeoSerializer(trofeos, many=True, context={'request': request})

        trofeos_data = serializer.data

        # Añade información si el usuario ya ha sido notificado
        for trofeo in trofeos_data:
            trofeo_obj = Trofeo.objects.get(pk=trofeo['id'])
            trofeo['ya_notificado'] = usuario in trofeo_obj.usuarios_notificados.all()

        return Response({
            "usuario": {
                "username": usuario.username,
                "puntos": puntos_usuario
            },
            "trofeos": trofeos_data
        })

    def post(self, request):
        trofeo_id = request.data.get("trofeo_id")
        usuario = request.user

        if not trofeo_id:
            return Response({"mensaje": "Debe proporcionar el ID del trofeo."}, status=400)

        try:
            trofeo = Trofeo.objects.get(pk=trofeo_id)
            trofeo.marcar_notificado(usuario)
            return Response({"mensaje": "Trofeo marcado como notificado."}, status=200)
        except Trofeo.DoesNotExist:
            return Response({"mensaje": "El trofeo no existe."}, status=404)



class DesbloquearTrofeoView(APIView):
    """
    Vista para manejar la asignación automática de trofeos al completar desafíos.
    """
    permission_classes = [IsAuthenticated]

    

class FormularioFeedbackViewSet(viewsets.ModelViewSet):
    queryset = FormularioFeedback.objects.all()
    serializer_class = FormularioFeedbackSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        print("Datos recibidos en el request:", request.data)

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
            print("Error en validación:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)





class RecursosDidacticosViewSet(viewsets.ModelViewSet):
    queryset = RecursosDidacticos.objects.all()
    serializer_class = RecursosDidacticosSerializer

    def list(self, request):
        """
        Filtra recursos asegurando que `desafio_id` y `tipo` sean válidos.
        """
        desafio_id = request.query_params.get("desafio_id")
        tipo = request.query_params.get("tipo")

        recursos = self.queryset

        if desafio_id:
            if not desafio_id.isdigit():
                return Response({"error": "El ID del desafío debe ser un número."}, status=status.HTTP_400_BAD_REQUEST)
            recursos = recursos.filter(desafio_id=int(desafio_id))

        if tipo:
            if tipo not in ["teoria", "pista"]:
                return Response({"error": "Tipo inválido. Debe ser 'teoria' o 'pista'."}, status=status.HTTP_400_BAD_REQUEST)
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
        """ Evita ataques de fuerza bruta limitando intentos de eliminación """
        cache_key = f"delete_attempts_{request.user.id}"
        intentos = cache.get(cache_key, 0)

        if intentos >= 5:
            return Response({"error": "Demasiados intentos de eliminación. Intenta más tarde."}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        cache.set(cache_key, intentos + 1, timeout=600)  # Bloquea después de 5 intentos por 10 minutos

        publicacion = get_object_or_404(Publicacion, id=publicacion_id)

        if request.user == publicacion.usuario or request.user.is_staff or request.user.is_superuser:
            publicacion.delete()
            cache.delete(cache_key)  # Restablece intentos si fue exitoso
            return Response({"mensaje": "Publicación eliminada con éxito"}, status=status.HTTP_204_NO_CONTENT)

        logger.warning(f"Intento de eliminación no autorizado: Usuario {request.user.id} intentó eliminar la publicación {publicacion_id}")
        return Response({"error": "No tienes permiso para eliminar esta publicación"}, status=status.HTTP_403_FORBIDDEN)


class PublicacionViewSet(viewsets.ModelViewSet):
    queryset = Publicacion.objects.all()
    serializer_class = PublicacionSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        """ Crea una publicación, con opción de asociarla a un desafío """
        usuario = request.user  # Usuario autenticado

        data = request.data.copy()
        data["usuario"] = usuario.id  # Se asegura de que el usuario autenticado es el creador

        # Si se proporciona un `desafio_id`, intenta asociarlo; de lo contrario, es `None`
        desafio_id = data.get("desafio_id")
        if desafio_id:
            desafio = get_object_or_404(Desafio, id=desafio_id)
            data["desafio"] = desafio.id  # Asigna el ID del desafío

        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            serializer.save(usuario=usuario)  # Guarda la publicación sin exigir `desafio`
            return Response(serializer.data, status=status.HTTP_201_CREATED)

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
    permission_classes = [IsAuthenticated]

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

    #@watch_login  # Proteger contra ataques de fuerza bruta
    def post(self, request):
        username_or_email = request.data.get("username")
        password = request.data.get("password")

        # Verificar intentos fallidos en cache
        cache_key = f"failed_attempts_{username_or_email}"
        failed_attempts = cache.get(cache_key, 0)

        if failed_attempts >= 5:
            return Response({"error": "Demasiados intentos fallidos. Inténtalo más tarde."}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        user = None
        if "@" in username_or_email:
            try:
                user = User.objects.get(email=username_or_email)
                user = authenticate(username=user.username, password=password)
            except User.DoesNotExist:
                cache.set(cache_key, failed_attempts + 1, timeout=300)  # Bloqueo por 5 min
                return Response({"error": "Usuario no encontrado."}, status=status.HTTP_401_UNAUTHORIZED)
        else:
            user = authenticate(username=username_or_email, password=password)

        if user is not None:
            cache.delete(cache_key)  # Reiniciar intentos fallidos al hacer login correctamente
            refresh = RefreshToken.for_user(user)
            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            })

        cache.set(cache_key, failed_attempts + 1, timeout=300)  # Aumentar intento fallido
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

        # Verificar si el username está en uso y excluir al usuario actual
        if "username" in data:
            new_username = data["username"].strip()

            if User.objects.filter(username=new_username).exclude(id=user.id).exists():
                return Response({"error": "El nombre de usuario ya está en uso."}, status=status.HTTP_400_BAD_REQUEST)

            user.username = new_username

        # Verificar si el email se debe actualizar
        if "email" in data:
            email = data["email"].strip()
    
            try:
                validate_email(email)
            except ValidationError:
                return Response({"error": "El email ingresado no es válido."}, status=status.HTTP_400_BAD_REQUEST)

            if User.objects.filter(email=email).exclude(id=user.id).exists():
                return Response({"error": "El email ya está en uso."}, status=status.HTTP_400_BAD_REQUEST)

            user.email = email

        # Manejo de cambio de contraseña
        old_password = data.get("oldPassword", "").strip()
        new_password = data.get("newPassword", "").strip()
        confirm_password = data.get("confirmPassword", "").strip()

        if old_password and new_password and confirm_password:
            if not user.check_password(old_password):
                return Response({"error": "La contraseña actual es incorrecta."}, status=status.HTTP_400_BAD_REQUEST)

            if new_password != confirm_password:
                return Response({"error": "Las nuevas contraseñas no coinciden."}, status=status.HTTP_400_BAD_REQUEST)

            user.set_password(new_password)
        # Actualización de la imagen de perfil
        if "profile_image" in data:
            if data["profile_image"].strip():
                user.profile.profile_image = data["profile_image"]
                user.profile.save(update_fields=['profile_image'])
        user.save() # Guardar cambios en el usuario
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

        try:
            validate_password(password)
        except ValidationError as e:
            return Response({"error": " ".join(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({"error": "El usuario ya existe."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({"error": "El email ya está registrado."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, email=email, password=password)
        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)

        return Response({
            "message": "Usuario registrado con éxito.",
            "access": access,
            "refresh": str(refresh),
        }, status=status.HTTP_201_CREATED)
    


def validate_new_password(user, new_password, old_password=None):
    if old_password and check_password(new_password, old_password):
        raise ValidationError("La nueva contraseña no puede ser igual a la anterior.")
    if len(new_password) < 8:
        raise ValidationError("La nueva contraseña debe tener al menos 8 caracteres.")
    validate_password(new_password, user=user)
    
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        old_password = request.data.get("oldPassword")
        new_password = request.data.get("newPassword")
        cache_key = f"failed_change_attempts_{user.id}"
        failed_attempts = cache.get(cache_key, 0)

        if failed_attempts >= 3:
            return Response({"error": "Demasiados intentos fallidos. Intenta más tarde."}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        if not check_password(old_password, user.password):
            cache.set(cache_key, failed_attempts + 1, timeout=600)  # Bloqueo por 10 minutos
            return Response({"error": "La contraseña antigua es incorrecta."}, status=status.HTTP_400_BAD_REQUEST)
        
        if check_password(new_password, user.password):
            return Response({"error": "La nueva contraseña no puede ser igual a la anterior."}, status=status.HTTP_400_BAD_REQUEST)
        
        if len(new_password) < 8:
            return Response({"error": "La nueva contraseña debe tener al menos 8 caracteres."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return Response({"error": e.messages[0]}, status=status.HTTP_400_BAD_REQUEST)


        user.password = make_password(new_password)
        user.save()

        cache.delete(cache_key)  # Restablecer intentos fallidos
    
        refresh = RefreshToken.for_user(user)
        new_access_token = str(refresh.access_token)

        return Response({
            "message": "Contraseña cambiada con éxito.",
            "access_token": new_access_token
        }, status=status.HTTP_200_OK)

class CustomPasswordResetConfirmView(PasswordResetConfirmView):
    template_name = 'registration/password_reset_confirm.html'
    success_url = reverse_lazy('password_reset_complete')

    def form_valid(self, form):
        user = form.save(commit=False)
        new_password = form.cleaned_data.get('new_password1')

        try:
            validate_new_password(user, new_password)
        except ValidationError as e:
            form.add_error('new_password1', e)
            return self.form_invalid(form)

        user.set_password(new_password)
        user.save()
        return super().form_valid(form)


@method_decorator(csrf_exempt, name='dispatch')
class TwoFactorAuthView(View):

    def post(self, request, *args, **kwargs):
        try:
            data = json.loads(request.body)
            username = data.get("username")
            password = data.get("password")
            cache_key = f"login_attempts_{username}"
            attempts = cache.get(cache_key, 0)

            # Si ya ha fallado 3 veces, bloquear por 1 minutos
            if attempts >= 3:
                return JsonResponse({"error": "Demasiados intentos fallidos. Inténtalo en 1 minutos."}, status=429)

            user = authenticate(username=username, password=password)

            if user:
                cache.delete(cache_key)  # Si el login es correcto, reinicia los intentos

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
            attempts += 1
            cache.set(cache_key, attempts, timeout=60)  # Bloquear por 5 minutos tras 5 intentos fallidos

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
        # Autenticación manual con JWTAuthentication
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

@csrf_exempt
@api_view(["POST"])  # Define el método POST permitido
@authentication_classes([JWTAuthentication])  # Usa JWT para autenticación
@permission_classes([IsAuthenticated])  # Asegura que el usuario está autenticado
def confirm_2fa(request):
    """Verifica el código OTP ingresado por el usuario después del login."""
    try:
        print(f"Usuario autenticado en Django: {request.user}")  # Log para ver qué usuario se está autenticando
        print(f"¿Está autenticado?: {request.user.is_authenticated}")  

        if not request.user.is_authenticated:  # Si Django no reconoce el usuario, devuelve error
            return JsonResponse({"error": "Usuario no autenticado"}, status=401)

        data = json.loads(request.body)
        otp_code = data.get("otp_code")
        user = request.user

        if not hasattr(user, "profile"):  # Verifica si el usuario tiene perfil
            return JsonResponse({"error": "El usuario no tiene un perfil asociado."}, status=400)

        if not otp_code:
            return JsonResponse({"error": "Se requiere un código OTP."}, status=400)

        totp = pyotp.TOTP(user.profile.otp_secret)

        if totp.verify(otp_code):
            user.profile.is2fa_enabled = True
            user.profile.save()
            return JsonResponse({"success": "Código correcto. 2FA activado."}, status=200)

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

        # Enviar notificación por correo al desactivar el 2fa
        send_mail(
            "2FA desactivado en Cheese Script",
            "Has desactivado la autenticación en dos pasos (2FA). Si no fuiste tú, cambia tu contraseña inmediatamente.",
            settings.EMAIL_HOST_USER,
            [request.user.email],
            fail_silently=True,
        )
        return Response({"status": "success", "message": "2FA desactivado correctamente y notificación enviada."}, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=500)