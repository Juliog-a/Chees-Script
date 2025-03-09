from django import forms
from django.contrib import admin
from .models import Profile, Desafio, Publicacion, ComentarioPublicacion, RecursosDidacticos


admin.site.register(Publicacion)
admin.site.register(Profile)
admin.site.register(ComentarioPublicacion)



# Definir las opciones permitidas
DIFICULTADES_PERMITIDAS = [
    ("Principiante", "Principiante"),
    ("Intermedio", "Intermedio"),
    ("Avanzado", "Avanzado"),
    ("Experto", "Experto"),
]

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

class DesafioForm(forms.ModelForm):
    nivel_dificultad = forms.ChoiceField(choices=DIFICULTADES_PERMITIDAS)
    tematica = forms.ChoiceField(choices=TEMATICAS_PERMITIDAS)

    class Meta:
        model = Desafio
        fields = '__all__'


@admin.register(Desafio)
class DesafioAdmin(admin.ModelAdmin):
    """ Configuración del panel de administración para desafíos """
    form = DesafioForm

    list_display = ('id', 'nombre', 'tematica', 'nivel_dificultad', 'puntuacion', 'usuario', 'fecha_creacion')  
    list_filter = ('tematica', 'nivel_dificultad')  
    search_fields = ('nombre', 'tematica')
    ordering = ('tematica', 'nivel_dificultad')  

    list_editable = ('puntuacion',)

    fieldsets = (
        ("Información General", {"fields": ("nombre", "descripcion", "puntuacion")}),
        ("Clasificación", {"fields": ("tematica", "nivel_dificultad")}),
        ("Usuario", {"fields": ("usuario",)}),
        ("Cifrado (Solo si aplica)", {"fields": ("enunciado", "texto_cifrado", "clave_cifrado", "tipo_cifrado", "solucion")}),
    )

    def get_readonly_fields(self, request, obj=None):
        """ Solo los superusuarios pueden modificar el usuario del desafío """
        if not request.user.is_superuser:
            return ["usuario"]
        return []

    actions = ['delete_selected']

    def delete_selected(self, request, queryset):
        queryset.delete()
        self.message_user(request, "Desafíos seleccionados eliminados correctamente.")

    delete_selected.short_description = "Eliminar los desafíos seleccionados"


@admin.register(RecursosDidacticos)
class RecursosDidacticosAdmin(admin.ModelAdmin):
    list_display = ("id", "nombre", "tipo", "desafio", "url_contenido", "fecha_publicacion")
    list_filter = ("tipo", "desafio")
    search_fields = ("nombre", "desafio__nombre", "contenido")

    def get_readonly_fields(self, request, obj=None):
        """ Hace que 'url_contenido' sea solo lectura en Django Admin para que se genere automáticamente """
        return ["url_contenido", "fecha_publicacion"]

    fieldsets = (
        ("Información General", {"fields": ("nombre", "tipo", "desafio")}),
        ("Contenido", {"fields": ("contenido",)}),
        ("Información Automática", {"fields": ("url_contenido",)}), 
    )

    def save_model(self, request, obj, form, change):
        """
        Asegura que la URL se genere automáticamente antes de guardar el recurso.
        """
        obj.save() 
