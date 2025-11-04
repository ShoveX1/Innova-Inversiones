from rest_framework import serializers
from database.models import Cliente, relacion_cliente_lote, Lote


class RelacionClienteLoteSerializer(serializers.ModelSerializer):
    """
    Serializer para la relación Cliente-Lote
    Permite crear y actualizar relaciones entre clientes y lotes
    """
    lote_codigo = serializers.CharField(source='lote.codigo', read_only=True)
    lote_manzana = serializers.CharField(source='lote.manzana', read_only=True)
    lote_numero = serializers.CharField(source='lote.lote_numero', read_only=True)
    cliente_nombre = serializers.CharField(source='cliente.nombre', read_only=True)
    cliente_apellidos = serializers.CharField(source='cliente.apellidos', read_only=True)
    
    class Meta:
        model = relacion_cliente_lote
        fields = [
            'id',
            'cliente',
            'lote',
            'lote_codigo',
            'lote_manzana',
            'lote_numero',
            'cliente_nombre',
            'cliente_apellidos',
            'tipo_relacion',
            'porcentaje_participacion',
            'fecha',
        ]
        read_only_fields = ['id', 'fecha']
    
    def validate_tipo_relacion(self, value):
        """Validar que el tipo de relación sea válido"""
        opciones_validas = ['Propietario', 'reservante', 'copropietario', 'declinado']
        if value not in opciones_validas:
            raise serializers.ValidationError(
                f"Tipo de relación inválido. Debe ser uno de: {', '.join(opciones_validas)}"
            )
        return value
    
    def validate_porcentaje_participacion(self, value):
        """Validar que el porcentaje esté entre 0 y 100"""
        if value is not None:
            if value < 0 or value > 100:
                raise serializers.ValidationError(
                    "El porcentaje de participación debe estar entre 0 y 100"
                )
        return value


class ClienteSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Cliente
    """
    lotes = serializers.SerializerMethodField()
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
            'actualizado_en',
            'lotes'
        ]
        read_only_fields = ['id', 'creado_en', 'actualizado_en']

    def get_lotes(self,obj):
        # usa prefetch en la vista :'compras__lote', 'compras__lote__estado'
        relaciones = obj.compras.select_related('lote', 'lote__estado').all()
        return [
            {
                "id": rel.lote.id,
                "codigo": rel.lote.codigo,
                "manzana": rel.lote.manzana,
                "lote_numero": rel.lote.lote_numero,
                "estado": rel.lote.estado.id,
                "area_lote": rel.lote.area_lote,
                "precio": rel.lote.precio,
                "tipo_relacion": rel.tipo_relacion,
                "porcentaje_participacion": rel.porcentaje_participacion,
            }
            for rel in relaciones
        ]
    
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

