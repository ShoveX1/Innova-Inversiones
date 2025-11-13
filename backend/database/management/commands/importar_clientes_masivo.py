from django.core.management.base import BaseCommand
from database.models import Cliente
import re


class Command(BaseCommand):
    help = 'Importa clientes de forma masiva desde una lista de datos'

    def add_arguments(self, parser):
        parser.add_argument(
            '--bulk',
            action='store_true',
            help='Usa bulk_create para inserción masiva (más rápido)',
        )

    def handle(self, *args, **options):
        # Datos de clientes con teléfono, nombre y apellidos separados
        datos_clientes = [
            {"telefono": "O", "nombre": "JOSÉ FERNANDO", "apellidos": "CAHUE LUNA"},
            {"telefono": "959797383", "nombre": "JONATHAN RAFAEL", "apellidos": "CONCHA RODRIGUEZ"},
            {"telefono": "925069500", "nombre": "CHRISTIAN ISAAC", "apellidos": "PALMA PAUCAR"},
            {"telefono": "992676782", "nombre": "NORMA GRACIELA", "apellidos": "TRIVIÑOS CHAVEZ"},
            {"telefono": "991504393", "nombre": "JESUS ALFREDO", "apellidos": "ALVAREZ BRAVO"},
            {"telefono": "953640653", "nombre": "LUISA CONSUELO", "apellidos": "RODRIGUEZ VIZA"},
            {"telefono": "975176258", "nombre": "MARY RUTH", "apellidos": "BENDEZU OLIVARES"},
            {"telefono": "914119066", "nombre": "ALEXIS JAIR", "apellidos": "ARANIBAR GALINDO"},
            {"telefono": "959826715", "nombre": "JORGE ANTONIO", "apellidos": "LERMA CUTIPA"},
            {"telefono": "980472673", "nombre": "PAMELA LIZ", "apellidos": "RAMIREZ LERMA"},
            {"telefono": "970896841", "nombre": "WILSON", "apellidos": "HUAYHUA TAIRO"},
            {"telefono": "951252687", "nombre": "MARIBEL ROSA", "apellidos": "BURGOS MAMANI"},
            {"telefono": "982072501", "nombre": "HENRY", "apellidos": ""},
            {"telefono": "954181757", "nombre": "MILAGROS EMPERATRIZ", "apellidos": "PAZ ALMONTE"},
            {"telefono": "936991920", "nombre": "DIANA CAROLINA", "apellidos": "GUTIERREZ MENDOZA"},
            {"telefono": "924396477", "nombre": "ANGELICA PATRICIA", "apellidos": "MENDOZA DEL CARPIO"},
            {"telefono": "973549920", "nombre": "AGUSTIN ANGEL", "apellidos": "HUAMANI PUMA"},
            {"telefono": "964353528", "nombre": "EVELYN MILAGROS", "apellidos": "VILLAFUERTE VIRA"},
            {"telefono": "912552078", "nombre": "KAROLINE LIZETH", "apellidos": "AVILES ROJAS"},
            {"telefono": "921146439", "nombre": "FRANCISCO NILSON", "apellidos": "CHARCA PINO"},
            {"telefono": "993170246", "nombre": "SONIA LISBED", "apellidos": "SILLCAHUA CHAHUAYO"},
            {"telefono": "974538814", "nombre": "ERIKA NANCY", "apellidos": "ANAMPA CASTRO"},
            {"telefono": "924539955", "nombre": "JOSE ALEJANDRO", "apellidos": "PERALES MUÑOZ"},
            {"telefono": "923751552", "nombre": "ROSAURA", "apellidos": "LIZARAZO GALVIS"},
            {"telefono": "927059213", "nombre": "RAUL ANDRES", "apellidos": "GIL COA"},
            {"telefono": "982962408", "nombre": "MAYRA MARIA ALEXANDRA", "apellidos": "SALAS CASTRO"},
            {"telefono": "910925712", "nombre": "MARISOL ROXANA", "apellidos": "GARCÍA ZAPATA"},
            {"telefono": "950825037", "nombre": "LIDIA DEL PILAR", "apellidos": "BANCES LALOPU"},
            {"telefono": "964874803", "nombre": "JUAN CARLOS", "apellidos": "TICONA VARGAS"},
            {"telefono": "978960057", "nombre": "ISMAEL ALEXANDER", "apellidos": "JERÓNIMO GARNICA"},
            {"telefono": "984979440", "nombre": "DULCE MARIA", "apellidos": "JERÓNIMO GARNICA"},
            {"telefono": "943596073", "nombre": "JUDITH MARIBEL", "apellidos": "MORALES TICONA"},
            {"telefono": "975975524", "nombre": "JOAQUIN MATHEO", "apellidos": "ZARATE FLORES"},
            {"telefono": "954186204", "nombre": "ROBERTO CARLOS", "apellidos": "TICONA BELLIDO"},
            {"telefono": "902516109", "nombre": "DANIELA KAROLINA", "apellidos": "RODRIGUEZ LOPEZ"},
            {"telefono": "921811042", "nombre": "MARJORIE", "apellidos": "HINOSTROZA ARANA"},
            {"telefono": "917875282", "nombre": "JUAN CAMILO", "apellidos": "CORONADO LOPEZ"},
            {"telefono": "981960333", "nombre": "ANDERSON JOEL", "apellidos": "JERONIMO GARNICA"},
            {"telefono": "912458054", "nombre": "MABEL ODALIZ", "apellidos": "NEYRA CONDORI"},
            {"telefono": "900574885", "nombre": "KATHERIN MICHELL", "apellidos": "SALINAS PASTOR"},
            {"telefono": "960147370", "nombre": "MARY CARMEN", "apellidos": "LAREZ GARCIA"},
            {"telefono": "918826843", "nombre": "WHASHINGTON", "apellidos": "DOLMOS PACHECO"},
            {"telefono": "958939262", "nombre": "SABINA NOEMI", "apellidos": "PAREDES PALOMINO"},
            {"telefono": "972564665", "nombre": "MAXIMO JOSE LUIS", "apellidos": "AROTAYPE CONTRERAS"},
            {"telefono": "937380105", "nombre": "DEISSI AIDEE", "apellidos": "CALLO ESTOFANERO"},
            {"telefono": "917848237", "nombre": "ALEX RENATO", "apellidos": "CONDORI VILLALBA"},
            {"telefono": "950471158", "nombre": "MAYRA", "apellidos": "URDANIVIA GUIA"},
            {"telefono": "992759050", "nombre": "MARTÍN ALEXIS", "apellidos": "CACERES CHAVEZ"},
            {"telefono": "987387639", "nombre": "MELVIN NEPTALI", "apellidos": "MURGUIA NEIRA"},
            {"telefono": "907612870", "nombre": "RONALD", "apellidos": "RUIZ CRUZADO"},
            {"telefono": "977905944", "nombre": "CESAR ALBERTO", "apellidos": "CORNEJO GARCÍA"},
            {"telefono": "998007732", "nombre": "MARIA EUGENIA", "apellidos": "HUACO AGUILAR"},
            {"telefono": "957759556", "nombre": "JOSE ALEJANDRO", "apellidos": "MEDINA CHOQUE"},
        ]

        if options['bulk']:
            # Inserción masiva usando bulk_create (más rápido)
            clientes_a_crear = []
            creados = 0
            omitidos = 0
            
            for dato in datos_clientes:
                telefono_raw = dato["telefono"].strip()
                nombre = dato["nombre"].strip()
                apellidos = dato["apellidos"].strip() if dato["apellidos"] else ""
                
                if not nombre:
                    omitidos += 1
                    continue
                
                # Determinar DNI o teléfono
                dni = None
                telefono = None
                numero_limpio = re.sub(r'[^\d]', '', telefono_raw)
                
                if telefono_raw.upper() == "O" or not numero_limpio:
                    dni = None
                    telefono = None
                elif len(numero_limpio) == 8:
                    dni = numero_limpio
                elif len(numero_limpio) == 9:
                    telefono = numero_limpio
                elif len(numero_limpio) > 9:
                    telefono = numero_limpio[:9]
                else:
                    telefono = numero_limpio
                
                # Verificar si ya existe
                existe = False
                if dni:
                    existe = Cliente.objects.filter(dni=dni).exists()
                
                if not existe:
                    existe = Cliente.objects.filter(
                        nombre__iexact=nombre,
                        apellidos__iexact=apellidos
                    ).exists()
                
                if not existe:
                    # Asegurar que apellidos no esté vacío (el modelo no permite blank)
                    apellidos_final = apellidos if apellidos else "SIN APELLIDOS"
                    cliente = Cliente(
                        nombre=nombre,
                        apellidos=apellidos_final,
                        dni=dni if dni else None,
                        telefono=telefono if telefono else None,
                        estado=True
                    )
                    clientes_a_crear.append(cliente)
                else:
                    omitidos += 1
            
            # Crear todos de una vez
            if clientes_a_crear:
                Cliente.objects.bulk_create(clientes_a_crear, ignore_conflicts=True)
                creados = len(clientes_a_crear)
            
            self.stdout.write(
                self.style.SUCCESS(f'\n✅ Inserción masiva completada: {creados} clientes creados, {omitidos} omitidos')
            )
        else:
            # Inserción individual (más control)
            creados = 0
            actualizados = 0
            errores = 0
            omitidos = 0
            
            for dato in datos_clientes:
                telefono_raw = dato["telefono"].strip()
                nombre = dato["nombre"].strip()
                apellidos = dato["apellidos"].strip() if dato["apellidos"] else ""
                
                if not nombre:
                    omitidos += 1
                    continue
                
                # Determinar DNI o teléfono
                dni = None
                telefono = None
                numero_limpio = re.sub(r'[^\d]', '', telefono_raw)
                
                if telefono_raw.upper() == "O" or not numero_limpio:
                    dni = None
                    telefono = None
                elif len(numero_limpio) == 8:
                    dni = numero_limpio
                elif len(numero_limpio) == 9:
                    telefono = numero_limpio
                elif len(numero_limpio) > 9:
                    telefono = numero_limpio[:9]
                else:
                    telefono = numero_limpio
                
                # Verificar si existe
                cliente_existente = None
                if dni:
                    try:
                        cliente_existente = Cliente.objects.get(dni=dni)
                    except Cliente.DoesNotExist:
                        pass
                
                if not cliente_existente:
                    try:
                        cliente_existente = Cliente.objects.get(
                            nombre__iexact=nombre,
                            apellidos__iexact=apellidos
                        )
                    except Cliente.DoesNotExist:
                        pass
                    except Cliente.MultipleObjectsReturned:
                        cliente_existente = Cliente.objects.filter(
                            nombre__iexact=nombre,
                            apellidos__iexact=apellidos
                        ).first()
                
                if cliente_existente:
                    actualizado = False
                    if dni and not cliente_existente.dni:
                        cliente_existente.dni = dni
                        actualizado = True
                    if telefono and not cliente_existente.telefono:
                        cliente_existente.telefono = telefono
                        actualizado = True
                    
                    if actualizado:
                        try:
                            cliente_existente.save()
                            actualizados += 1
                        except Exception as e:
                            errores += 1
                            self.stdout.write(
                                self.style.ERROR(f'Error al actualizar {nombre} {apellidos}: {str(e)}')
                            )
                else:
                    try:
                        # Asegurar que apellidos no esté vacío (el modelo no permite blank)
                        apellidos_final = apellidos if apellidos else "SIN APELLIDOS"
                        Cliente.objects.create(
                            nombre=nombre,
                            apellidos=apellidos_final,
                            dni=dni if dni else None,
                            telefono=telefono if telefono else None,
                            estado=True
                        )
                        creados += 1
                    except Exception as e:
                        errores += 1
                        self.stdout.write(
                            self.style.ERROR(f'Error al crear {nombre} {apellidos}: {str(e)}')
                        )
            
            # Resumen
            self.stdout.write(self.style.SUCCESS('\n' + '='*50))
            self.stdout.write(self.style.SUCCESS('RESUMEN DE IMPORTACIÓN'))
            self.stdout.write(self.style.SUCCESS('='*50))
            self.stdout.write(self.style.SUCCESS(f'✅ Clientes creados: {creados}'))
            self.stdout.write(self.style.SUCCESS(f'🔄 Clientes actualizados: {actualizados}'))
            self.stdout.write(self.style.WARNING(f'⏭️  Omitidos: {omitidos}'))
            self.stdout.write(self.style.ERROR(f'❌ Errores: {errores}'))
            self.stdout.write(self.style.SUCCESS('='*50))

