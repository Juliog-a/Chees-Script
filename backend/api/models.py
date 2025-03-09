from django.db import models
from django.contrib.auth.models import User  # Usa auth_user
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.text import slugify

# ---------------------- MODELOS ----------------------

class Desafio(models.Model):
    TEMATICAS_PERMITIDAS = [
        ("Cifrado", "Cifrado"),
        ("XSS", "XSS"),
        ("Inyección SQL", "Inyección SQL"),
        ("Ejecución de Código", "Ejecución de Código"),
        ("Path Traversal", "Path Traversal"),
        ("Denegación de Servicio", "Denegación de Servicio"),
        ("Manipulación de Estado del Cliente", "Manipulación de Estado del Cliente"),
        ("XSRF", "XSRF"),
        ("XSSI", "XSSI"),
        ("Vulnerabilidades de Configuración", "Vulnerabilidades de Configuración"),
        ("Ajax", "Ajax"),
        ("Depuración ", "Depuración "),
    ]

    DIFICULTADES_PERMITIDAS = [
        ("Principiante", "Principiante"),
        ("Intermedio", "Intermedio"),
        ("Avanzado", "Avanzado"),
        ("Experto", "Experto"),
    ]

    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    nombre = models.CharField(max_length=128)
    descripcion = models.TextField()
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    nivel_dificultad = models.CharField(max_length=64, choices=DIFICULTADES_PERMITIDAS, default="Principiante")
    tematica = models.CharField(max_length=64, choices=TEMATICAS_PERMITIDAS, default="Otros")
    puntuacion = models.IntegerField(default=0)
    hecho = models.BooleanField(default=False)
    likes = models.ManyToManyField(User, related_name="desafios_likeados", blank=True) 

    # Campos específicos para desafíos de cifrado
    enunciado = models.TextField(blank=True, null=True)  # Explicación del reto
    texto_cifrado = models.TextField(blank=True, null=True)  # Texto cifrado que el usuario debe descifrar
    clave_cifrado = models.CharField(max_length=128, blank=True, null=True)  # Clave usada en el cifrado
    tipo_cifrado = models.CharField(
        max_length=64,
        choices=[
            ("ROT13", "ROT13"),
            ("César", "César"),
            ("AES", "AES"),
            ("Base64", "Base64"),
            ("SHA256", "SHA256"),
            ("Otros", "Otros"),
        ],
        default="Otros",
        blank=True,
        null=True
    )  # Tipo de cifrado aplicado al texto
    solucion = models.CharField(max_length=256, blank=True, null=True)  # Respuesta correcta

    def __str__(self):
        return f"{self.nombre} ({self.tematica} - {self.nivel_dificultad})"
  
class RecursosDidacticos(models.Model):
    TIPOS_CHOICES = [
        ('teoria', 'Teoría'),
        ('pista', 'Pista'),
    ]

    desafio = models.ForeignKey('Desafio', on_delete=models.CASCADE)
    tipo = models.CharField(max_length=10, choices=TIPOS_CHOICES, default='teoria')
    nombre = models.CharField(max_length=100, default="Recurso sin nombre")
    url_contenido = models.CharField(max_length=256, blank=True) 
    fecha_publicacion = models.DateTimeField(auto_now_add=True)
    contenido = models.TextField(blank=True, null=True) 

    def save(self, *args, **kwargs):
        """
        Generar automáticamente la URL del recurso basado en su tipo y el ID del desafío.
        """
        base_url = "http://localhost:5173" 
        slug = slugify(self.nombre) 

        # Crear la URL automática basada en el tipo y el ID del desafío
        self.url_contenido = f"{base_url}/{self.tipo}/{self.desafio.id}/{slug}"
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.desafio.nombre} - {self.tipo} - {self.nombre}"

    def delete_selected(self, request, queryset):
        queryset.delete()
        self.message_user(request, "Recursos seleccionados eliminados correctamente.")
    
    delete_selected.short_description = "Eliminar los recursos seleccionados"

class UsuarioDesafio(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    desafio = models.ForeignKey(Desafio, on_delete=models.CASCADE)
    fecha_completado = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("usuario", "desafio")  # Un usuario no puede resolver el mismo desafío más de una vez

    def __str__(self):
        return f"{self.usuario.username} - {self.desafio.nombre}"




class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    points = models.IntegerField(default=0)
    profile_image = models.URLField(max_length=500, blank=True, null=True)
    
    # Campos para 2FA
    otp_secret = models.CharField(max_length=32, blank=True, null=True)  # Clave para 2FA
    is2fa_enabled = models.BooleanField(default=False)  # Si el usuario tiene 2FA activo

    def __str__(self):
        return f"{self.user.username} - {self.points} puntos"


class Publicacion(models.Model):
    titulo = models.CharField(max_length=128)
    contenido = models.TextField()
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    url_imagen = models.CharField(max_length=256, blank=True, null=True)
    likes = models.ManyToManyField(User, related_name="publicaciones_likeadas", blank=True)
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.titulo

class ComentarioPublicacion(models.Model):
    contenido = models.TextField(max_length=100)  #Se limita a 120 caracteres
    fecha_publicacion = models.DateTimeField(auto_now_add=True)
    autor = models.CharField(max_length=64)
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    publicacion = models.ForeignKey(Publicacion, on_delete=models.CASCADE, related_name="comentarios")

    def __str__(self):
        return f"Comentario de {self.autor} en {self.publicacion.titulo}"


class FormularioFeedback(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    desafio = models.ForeignKey(Desafio, on_delete=models.CASCADE)
    autor = models.CharField(max_length=64)
    codigo = models.TextField()
    fecha_envio = models.DateTimeField(auto_now_add=True)
    puntuacion = models.IntegerField(default=0)

    def __str__(self):
        return f"Feedback de {self.autor} en {self.desafio.nombre}"


class Snippet(models.Model):#NO SE USA
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    nombre = models.CharField(max_length=64)
    titulo = models.CharField(max_length=128)
    codigo = models.TextField()
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.titulo


class FormularioContacto(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)  # Permitir NULL
    autor = models.CharField(max_length=64)
    mensaje = models.TextField()
    estado = models.CharField(max_length=16, default="Pendiente")
    fecha_envio = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Mensaje de {self.autor}"

  



# ---------------------- SEÑALES ----------------------
@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    """
    Cada vez que se crea un User, si es nuevo (created=True),
    creamos automáticamente su Profile con points = 0.
    """
    if created:
        Profile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_profile(sender, instance, **kwargs):
    """
    Cada vez que se guarde un User, también guardamos su Profile 
    para asegurar la sincronización.
    """
    instance.profile.save()



