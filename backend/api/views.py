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