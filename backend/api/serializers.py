from rest_framework import serializers
from .models import User, Desafio,UsuarioDesafio, Publicacion, Trofeo,ComentarioPublicacion, FormularioFeedback, Snippet, FormularioContacto, RecursosDidacticos
import re
import bleach
from django.conf import settings

class DesafioSerializer(serializers.ModelSerializer):
    liked_by_user = serializers.SerializerMethodField()

    # Listas de valores permitidos
    DIFICULTADES_PERMITIDAS = ["Principiante", "Intermedio", "Avanzado", "Experto"]
    TEMATICAS_PERMITIDAS = [
        "Cifrado", "XSS", "Inyección SQL", "Ejecución de Código", 
        "Path Traversal", "Denegación de Servicio", "Manipulación de Estado del Cliente", 
        "XSRF", "XSSI", "Vulnerabilidades de Configuración", "Ajax", "Otros"
    ]

    solucionado = serializers.SerializerMethodField()

    def get_solucionado(self, obj):
        user = self.context['request'].user
        return UsuarioDesafio.objects.filter(usuario=user, desafio=obj).exists()

    class Meta:
        model = Desafio
        fields = '__all__'

    def get_liked_by_user(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return request.user in obj.likes.all()
        return False

    # Validación para dificultad
    def validate_nivel_dificultad(self, value):
        if value not in self.DIFICULTADES_PERMITIDAS:
            raise serializers.ValidationError(f"Dificultad no válida. Debe ser una de: {', '.join(self.DIFICULTADES_PERMITIDAS)}.")
        return value

    # Validación para temática
    def validate_tematica(self, value):
        if value not in self.TEMATICAS_PERMITIDAS:
            raise serializers.ValidationError(f"Temática no válida. Debe ser una de: {', '.join(self.TEMATICAS_PERMITIDAS)}.")
        return value


class TrofeoSerializer(serializers.ModelSerializer):
    imagen_actual = serializers.SerializerMethodField()
    imagen_bloqueada = serializers.SerializerMethodField()
    imagen_desbloqueada = serializers.SerializerMethodField()
    desbloqueado_para_el_usuario = serializers.SerializerMethodField()
    notificacion_mostrada = serializers.SerializerMethodField() # nuevo

    class Meta:
        model = Trofeo
        fields = [
            'id',
            'nombre',
            'descripcion',
            'imagen_actual',
            'imagen_bloqueada',
            'imagen_desbloqueada',
            'nivel_requerido',
            'fecha_obtenido',
            'desbloqueo_por_nivel',
            'notificacion_mostrada',
            'desbloqueado_para_el_usuario'

        ]

    def get_notificacion_mostrada(self, obj):
        usuario = self.context['request'].user
        return obj.usuarios_notificados.filter(id=usuario.id).exists()

    def get_imagen_bloqueada(self, obj):
        return obj.imagen_bloqueada

    def get_imagen_desbloqueada(self, obj):
        return obj.imagen_desbloqueada

    def get_imagen_actual(self, obj):
        return obj.imagen_bloqueada
    
    def get_desbloqueado_para_el_usuario(self, obj):
        usuario = self.context['request'].user
        desbloqueado = usuario in obj.usuarios_desbloqueados.all()
        print(f"Trofeo: {obj.nombre} desbloqueado para usuario: {desbloqueado}")
        return desbloqueado

    

class UserSerializer(serializers.ModelSerializer):
    points = serializers.IntegerField(source='profile.points', read_only=True)
    profile_image = serializers.URLField(source='profile.profile_image', required=False)
    is2fa_enabled = serializers.BooleanField(source="profile.is2fa_enabled", read_only=True)  # Agregar el campo
    is_staff = serializers.BooleanField(read_only=True)
    is_superuser = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'points', 'profile_image', 'is2fa_enabled', 'is_staff', 'is_superuser']
        
    def get_points(self, obj):
        """Obtiene los puntos desde el perfil del usuario."""
        return obj.profile.points if hasattr(obj, "profile") else 0


class ComentarioPublicacionSerializer(serializers.ModelSerializer):
    """ Serializador de Comentarios con validación de longitud """
    
    publicacion_id = serializers.PrimaryKeyRelatedField(
        queryset=Publicacion.objects.all(), source="publicacion", write_only=True
    )

    class Meta:
        model = ComentarioPublicacion
        fields = ["id", "contenido", "fecha_publicacion", "autor", "usuario", "publicacion_id"]

    def validate_contenido(self, value):
        """ Evita comentarios vacíos o maliciosos """
        value = bleach.clean(value, tags=[], strip=True).strip()

        if not value:
            raise serializers.ValidationError("El comentario no puede estar vacío o contener solo contenido no permitido.")

        if len(value) > 100:
            raise serializers.ValidationError("El comentario no puede superar los 100 caracteres.")

        return value



class PublicacionSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source="usuario.username", read_only=True)
    usuario = serializers.PrimaryKeyRelatedField(read_only=True)  # <--- ESENCIAL!
    liked_by_user = serializers.SerializerMethodField()
    likes_count = serializers.IntegerField(source="likes.count", read_only=True)
    comentarios = ComentarioPublicacionSerializer(many=True, read_only=True)

    url_imagen = serializers.CharField(
        max_length=256, allow_blank=True, allow_null=True, required=False
    )

    contenido = serializers.CharField(
        max_length=130,
        error_messages={"max_length": "El contenido no puede superar los 130 caracteres."}
    )

    titulo = serializers.CharField(
        max_length=32,
        error_messages={"max_length": "El título no puede superar los 32 caracteres."}
    )


    class Meta:
        model = Publicacion
        fields = [
            'id', 'titulo', 'contenido', 'fecha_creacion', 'url_imagen',
            'likes_count', 'liked_by_user', 'usuario_nombre', 'usuario', 'comentarios'
        ]

    def validate_contenido(self, value):
        if len(value) > 130:
            raise serializers.ValidationError("El contenido no puede tener más de 130 caracteres.")
        return bleach.clean(value, tags=[], strip=True)

    def validate_url_imagen(self, value):
        """ Valida que la URL sea segura y apunte a una imagen """
        if value:
            regex = r"^https?:\/\/[^\s]+?\.(png|jpg|jpeg|gif|bmp|webp|svg)$"
            if not re.match(regex, value, re.IGNORECASE):
                raise serializers.ValidationError("La URL debe ser una imagen válida.")
            if "javascript:" in value.lower() or "data:" in value.lower():
                raise serializers.ValidationError("La URL no puede contener esquemas inseguros.")
        return value

    
    def get_liked_by_user(self, obj):
        """Devuelve `True` si el usuario autenticado ha dado like, `False` en caso contrario."""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return request.user in obj.likes.all()
        return False
    
    def validate_titulo(self, value):
        return bleach.clean(value, tags=[], strip=True)

    def validate(self, data):
        """ Verifica que la publicación tenga título y contenido """
        if "titulo" not in data or not data["titulo"].strip():
            raise serializers.ValidationError({"titulo": "El título es obligatorio."})
        if "contenido" not in data or not data["contenido"].strip():
            raise serializers.ValidationError({"contenido": "El contenido no puede estar vacío."})
        return data



class FormularioFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormularioFeedback
        fields = ["id", "autor", "codigo", "fecha_envio", "puntuacion", "desafio_id", "usuario_id"]
    def validate_codigo(self, value):
        """ Evita que se inyecten scripts maliciosos en el código enviado """
        if "<script>" in value or "</script>" in value:
            raise serializers.ValidationError("El código no puede contener scripts.")
        # Escapa caracteres peligrosos usando bleach
        value = bleach.clean(value)
        return value


class FormularioContactoSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormularioContacto
        fields = ["usuario", "autor", "mensaje", "estado", "fecha_envio"]
        read_only_fields = ["estado", "fecha_envio"]

    def validate(self, data):
        """
        Si el usuario no está autenticado, `usuario` será `None`.
        """
        if "usuario" not in data:
            data["usuario"] = None
        return data



class RecursosDidacticosSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecursosDidacticos
        fields = ["id", "tipo", "nombre", "contenido", "fecha_publicacion", "desafio"] 
        



 #NO SE USA
class SnippetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Snippet
        fields = '__all__'