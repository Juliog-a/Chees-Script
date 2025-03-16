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

    # Campo virtual para indicar si ESTE usuario lo tiene desbloqueado
    desbloqueado_para_el_usuario = serializers.SerializerMethodField()

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
            'desbloqueado_para_el_usuario',  # <-- ¡nuevo!
        ]

    def get_imagen_actual(self, obj):
        request = self.context.get('request')
        imagen_url = obj.imagen_bloqueada.url if obj.imagen_bloqueada else None
        return request.build_absolute_uri(imagen_url) if request and imagen_url else None

    def get_imagen_bloqueada(self, obj):
        request = self.context.get('request')
        imagen_url = obj.imagen_bloqueada.url if obj.imagen_bloqueada else None
        return request.build_absolute_uri(imagen_url) if request and imagen_url else None

    def get_imagen_desbloqueada(self, obj):
        request = self.context.get('request')
        imagen_url = obj.imagen_desbloqueada.url if obj.imagen_desbloqueada else None
        return request.build_absolute_uri(imagen_url) if request and imagen_url else None

    def get_desbloqueado_para_el_usuario(self, obj):
        usuario = self.context['request'].user
        desbloqueado = usuario in obj.usuarios_desbloqueados.all()
        print(f"Trofeo: {obj.nombre} desbloqueado para usuario: {desbloqueado}")
        return desbloqueado

    

class UserSerializer(serializers.ModelSerializer):
    points = serializers.IntegerField(source='profile.points', read_only=True)
    profile_image = serializers.URLField(source='profile.profile_image', required=False)
    is2fa_enabled = serializers.BooleanField(source="profile.is2fa_enabled", read_only=True)  # Agregar el campo


    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'points', 'profile_image', 'is2fa_enabled']
        
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
        """ Evita que los comentarios sean mayores a 100 caracteres """
        if len(value) > 100:
            raise serializers.ValidationError("El comentario no puede superar los 100 caracteres.")
        return value


class PublicacionSerializer(serializers.ModelSerializer):
    """Serializador de Publicaciones con Comentarios Incluidos """
    usuario_nombre = serializers.CharField(source="usuario.username", read_only=True)  # Obtener el nombre del usuario
    liked_by_user = serializers.SerializerMethodField()  # Verifica si el usuario autenticado ha dado like
    likes_count = serializers.IntegerField(source="likes.count", read_only=True)  # Número total de likes
    comentarios = ComentarioPublicacionSerializer(many=True, read_only=True)  # INCLUIR COMENTARIOS EN LA RESPUESTA

    url_imagen = serializers.CharField(
        max_length=256, 
        allow_blank=True,  # Permite cadenas vacías
        allow_null=True,    # Permite valores nulos
        required=False      # No es obligatorio
    )


    contenido = serializers.CharField(
        max_length=130,  
        error_messages={"max_length": "El contenido no puede superar los 200 caracteres."}
    )


    class Meta:
        model = Publicacion
        fields = ['id', 'titulo', 'contenido', 'fecha_creacion', 'url_imagen', 'likes_count', 
                  'liked_by_user', 'usuario_nombre', 'usuario', 'comentarios']  # Se incluyó `comentarios`

    def validate_contenido(self, value):
        """ Validar que el contenido no supere 200 caracteres """
        if len(value) > 200:
            raise serializers.ValidationError("El contenido no puede tener más de 200 caracteres.")

        # Sanitiza la entrada con bleach para evitar XSS
        value = bleach.clean(value)
        return value

    def validate_url_imagen(self, value):
        """ Valida que la URL sea una imagen válida """
    def validate_url_imagen(self, value):
        """ Valida que la URL sea segura y apunte a una imagen """
        if value:
            regex = r"^https?:\/\/.*\.(?:png|jpg|jpeg|gif|bmp|webp|svg)$"
            if not re.match(regex, value, re.IGNORECASE):
                raise serializers.ValidationError("La URL debe ser una imagen válida (png, jpg, jpeg, gif, bmp, webp, svg).")

            # Prevenir URLs sospechosas (evitar inyecciones)
            if "javascript:" in value or "data:" in value:
                raise serializers.ValidationError("URL inválida por razones de seguridad.")
        
        return value
    
    def get_liked_by_user(self, obj):
        """Devuelve `True` si el usuario autenticado ha dado like, `False` en caso contrario."""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return request.user in obj.likes.all()
        return False
    

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