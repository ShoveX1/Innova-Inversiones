from rest_framework import serializers
from database.models import Cliente, relacion_cliente_lote


class ClienteSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Cliente
    """
    class Meta:
        model = Cliente
        fields = [
            'id',
            'nombre',
            'apellidos',
            'dni',
            'direccion',
            'telefono',
            'email',
            'fecha_nacimiento',
            'estado',
            'creado_en',
            'actualizado_en'
        ]
        read_only_fields = ['id', 'creado_en', 'actualizado_en']
    
    def validate_dni(self, value):
        """Validar que el DNI tenga 8 dígitos si se proporciona"""
        if value and len(value) != 8:
            raise serializers.ValidationError("El DNI debe tener exactamente 8 dígitos")
        if value and not value.isdigit():
            raise serializers.ValidationError("El DNI solo debe contener números")
        return value
    
    def validate_telefono(self, value):
        """Validar formato de teléfono"""
        if value and not value.replace('+', '').replace(' ', '').isdigit():
            raise serializers.ValidationError("El teléfono solo debe contener números")
        return value
    
    def validate_email(self, value):
        """Validar que el email sea único (excepto para el mismo cliente en actualización)"""
        if value:
            # Si estamos actualizando, excluir el cliente actual de la verificación
            if self.instance:
                if Cliente.objects.filter(email=value).exclude(id=self.instance.id).exists():
                    raise serializers.ValidationError("Ya existe un cliente con este email")
            else:
                # Si estamos creando, verificar que no exista
                if Cliente.objects.filter(email=value).exists():
                    raise serializers.ValidationError("Ya existe un cliente con este email")
        return value

class RelacionClienteLoteSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo RelacionClienteLote
    """
    class Meta:
        model = relacion_cliente_lote
        fields = [
            'id',
            'cliente',
            'lote',
            'tipo_relacion',
            'porcentaje_participacion',
            'fecha',
        ]
        read_only_fields = ['id', 'fecha']
    
    def validate_porcentaje_participacion(self, value):
        """Validar que el porcentaje de participación sea entre 0 y 100"""
        if value < 0 or value > 100:
            raise serializers.ValidationError("El porcentaje de participación debe estar entre 0 y 100")
        return value
class ClienteDetalleSerializer(serializers.ModelSerializer):
    compras = RelacionClienteLoteSerializer(many=True, read_only=True)
    total_lotes = serializers.SerializerMethodField()

    class Meta(ClienteSerializer.Meta):
        fields = ClienteSerializer.Meta.fields + ['compras', 'total_lotes']

    def get_total_lotes(self, obj):
        """Obtener el total de lotes comprados por el cliente"""
        return obj.compras.count()