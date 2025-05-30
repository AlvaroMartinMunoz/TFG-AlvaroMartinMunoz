from rest_framework import viewsets
from .models.propiedad import Propiedad
from .serializers import ReservaSerializer
from .models.fotoPropiedad import FotoPropiedad
from .serializers import FotoPropiedadSerializer
from .serializers import PropiedadSerializer
from .models.valoracionPropiedad import ValoracionPropiedad
from .serializers import ValoracionPropiedadSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from .models.propiedad import FechaBloqueada
from .serializers import FechaBloqueadaSerializer
from .models.reserva import Reserva
from rest_framework.permissions import IsAuthenticated, AllowAny
from usuario.models.usuario import Usuario
from datetime import timedelta, datetime
from django.db import IntegrityError
from django.db.models import Avg
import stripe
from collections import defaultdict
from django.db.models import Q
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
from django.views.decorators.http import require_POST
from django.db import transaction
from .models.favorito import Favorito
from django.shortcuts import get_object_or_404
from .serializers import FavoritoSerializer
from propiedad.recommendations import ContentRecommender, CollaborativeRecommender
from propiedad.serializers import PropiedadRecommendationSerializer
import numpy as np
from django.core.mail import send_mail
from .models.precioEspecial import PrecioEspecial
from .serializers import PrecioEspecialSerializer
from rest_framework.decorators import api_view, permission_classes
from paypalcheckoutsdk.core import PayPalHttpClient, SandboxEnvironment
from paypalcheckoutsdk.orders import OrdersCreateRequest
from paypalcheckoutsdk.orders import OrdersCaptureRequest
from datetime import datetime
from datetime import timedelta
from dateutil.relativedelta import relativedelta
from rest_framework.response import Response
from rest_framework import status
from dateutil.relativedelta import relativedelta
from django.utils import timezone
from .models.clickPropiedad import ClickPropiedad
from .serializers import ReservaPaypalTemporalSerializer
from .models.reservaPaypalTemporal import ReservaPaypalTemporal







#STRIPE      
stripe.api_key = settings.STRIPE_SECRET_KEY


@csrf_exempt
def create_checkout_session(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            reservationdata = data['reservationData']
            amount = int(reservationdata['precio_total']*100)
            currency = reservationdata['currency']
            propiedad_id = reservationdata['propiedad']
            fecha_llegada = reservationdata['fecha_llegada']
            fecha_salida = reservationdata['fecha_salida']
            numero_personas = reservationdata['numero_personas']
            usuario_id = reservationdata['usuario']
            anfitrion_id = reservationdata['anfitrion']
            precio_por_noche = reservationdata['precio_por_noche']
            precio_total = reservationdata['precio_total']
            estado = reservationdata['estado']
            metodo_pago = reservationdata['metodo_pago']
            comentarios_usuario = reservationdata['comentarios_usuario']
            nombrePropiedad = reservationdata['nombrePropiedad']
            correo = reservationdata['correo']
                        

            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': currency,
                        'product_data': {
                            'name': 'Reserva de propiedad',
                        },
                        'unit_amount': amount,
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url='http://localhost:3000/mis-reservas?session_id={CHECKOUT_SESSION_ID}',
                cancel_url='http://localhost:3000/detalles/' + str(propiedad_id),
                metadata={
                    'propiedad_id': propiedad_id,
                    'fecha_llegada': fecha_llegada,
                    'fecha_salida': fecha_salida,
                    'numero_personas': numero_personas,
                    'usuario_id': usuario_id,
                    'anfitrion_id': anfitrion_id,
                    'precio_por_noche': precio_por_noche,
                    'precio_total': precio_total,
                    'estado': estado,
                    'metodo_pago': metodo_pago,
                    'comentarios_usuario': comentarios_usuario,
                    'nombrePropiedad': nombrePropiedad,
                    'correo': correo,

                }
            )
            return JsonResponse({
                'id': session.id
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
def confirmar_pago(request, session_id):
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        
        if session.payment_status == 'paid':
            metadata = session.metadata
            
            reserva = Reserva.objects.create(
                propiedad_id=metadata['propiedad_id'],
                usuario_id=metadata['usuario_id'],
                anfitrion_id=metadata['anfitrion_id'],
                fecha_llegada=metadata['fecha_llegada'],
                fecha_salida=metadata['fecha_salida'],
                numero_personas=metadata['numero_personas'],
                precio_por_noche=metadata['precio_por_noche'],
                precio_total=metadata['precio_total'],
                estado=metadata['estado'],
                metodo_pago=metadata['metodo_pago'],
                comentarios_usuario=metadata['comentarios_usuario'],
                fecha_aceptacion_rechazo = datetime.now() - timedelta(hours=1), 
            )

            subject = 'Confirmacion de reserva'
            message = (
                    f"Hola,\n\n"
                    f"Su reserva ha sido confirmada exitosamente. A continuación, los detalles:\n"
                    f"Propiedad: {metadata['nombrePropiedad']}\n"
                    f"Fecha de llegada: {metadata['fecha_llegada']}\n"
                    f"Fecha de salida: {metadata['fecha_salida']}\n"
                    f"Número de personas: {metadata['numero_personas']}\n"
                    f"Precio total: {float(metadata['precio_total']):.2f} EUR\n\n"
                    f"Gracias por confiar en nosotros."
                )
            
            recipient_list = [metadata['correo']]
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, recipient_list)
            
            return JsonResponse({
                'status': 'success',
                'reserva_id': reserva.id
            })
        
        return JsonResponse({'status': 'unpaid'}, status=402)
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
    
#PAYPAL

def get_paypal_client():
    environment = SandboxEnvironment(
        client_id=settings.PAYPAL_CLIENT_ID, 
        client_secret=settings.PAYPAL_CLIENT_SECRET
    )
    return PayPalHttpClient(environment)

@require_POST
@csrf_exempt
def create_payment(request):

    data = json.loads(request.body)
    reservationdata = data['reservationData']
    amount = reservationdata['precio_total']

    client = get_paypal_client()

    try:
        request_order = OrdersCreateRequest()
        request_order.prefer('return=representation')
        request_order.request_body({
            "intent": "CAPTURE",
            "purchase_units": [{
                "amount": {
                    "currency_code": "EUR",
                    "value": f"{float(amount):.2f}"
                },
                "description": "Pago para reserva de propiedad"
            }],
            "application_context": {
                "return_url": "http://localhost:3000/mis-reservas",
                "cancel_url": "http://localhost:3000/detalles",
                "brand_name": "Best Rent Properties",
                "user_action": "PAY_NOW" 
            }
        })

        response = client.execute(request_order)
        approval_url = next(link.href for link in response.result.links if link.rel == 'approve')

        return JsonResponse({"approval_url": approval_url, "orderID": response.result.id})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)
@require_POST
@csrf_exempt
def confirmar_pago_paypal(request):
    try:
        data_entrada = json.loads(request.body)
        order_id = data_entrada.get('orderID')

        if not order_id:
            return JsonResponse({'error': 'Falta el OrderID de PayPal en la solicitud.'}, status=400)

        client = get_paypal_client()

        if Reserva.objects.filter(payment_id=order_id).exists():
            return JsonResponse({'error': 'Este pago ya ha sido procesado y una reserva existe.'}, status=409)

        request_capture = OrdersCaptureRequest(order_id)
        response_paypal = client.execute(request_capture)

        if response_paypal.result.status == 'COMPLETED':
            try:
                reserva_temporal = ReservaPaypalTemporal.objects.get(order_id=order_id)
                datos_raw = reserva_temporal.datos_reserva # <--- CAMBIO 1: Obtener como 'datos_raw'
            except ReservaPaypalTemporal.DoesNotExist:
                return JsonResponse({'error': 'Reserva temporal no encontrada para este pago.'}, status=404)

            # ***** INICIO DEL BLOQUE AÑADIDO/MODIFICADO *****
            if isinstance(datos_raw, str):
                try:
                    datos = json.loads(datos_raw) # Parsea si es una cadena
                except json.JSONDecodeError:
                    print(f"Error CRÍTICO: datos_reserva para order_id {order_id} es una cadena pero no es JSON válido: {datos_raw}")
                    return JsonResponse({'error': 'Error interno: Formato de datos de reserva temporal corrupto.'}, status=500)
            elif isinstance(datos_raw, dict):
                datos = datos_raw # Úsalo directamente si ya es un diccionario
            else:
                print(f"Error CRÍTICO: datos_reserva para order_id {order_id} no es ni cadena ni diccionario. Tipo: {type(datos_raw)}")
                return JsonResponse({'error': 'Error interno: Tipo de datos de reserva temporal inesperado.'}, status=500)
            
            # Convertir precios a float
            try:
                precio_total_float = float(datos['precio_total'])
                precio_por_noche_float = float(datos['precio_por_noche'])
            except ValueError:
                print(f"Error: ValueError al convertir precios. precio_total='{datos.get('precio_total')}', precio_por_noche='{datos.get('precio_por_noche')}'")
                return JsonResponse({'error': 'Los valores de precio_total o precio_por_noche guardados no son números válidos.'}, status=400)
            except KeyError as e: # Si 'precio_total' o 'precio_por_noche' faltan en 'datos'
                 print(f"Error: KeyError al acceder a precios en 'datos' - {e}. Contenido de 'datos': {datos}")
                 return JsonResponse({'error': f'Falta el dato de precio ({e}) en la información de la reserva guardada.'}, status=400)


            reserva = Reserva.objects.create(
                propiedad_id=datos['propiedad'],
                usuario_id=datos['usuario'], 
                anfitrion_id=datos['anfitrion'], 
                fecha_llegada=datos['fecha_llegada'],
                fecha_salida=datos['fecha_salida'],
                numero_personas=datos['numero_personas'],
                precio_por_noche=precio_por_noche_float,
                comentarios_usuario=datos.get('comentarios_usuario', ''),
                fecha_aceptacion_rechazo=timezone.now(),
                precio_total=precio_total_float,
                estado='Aceptada',
                metodo_pago='PayPal',
                payment_id=order_id,
            )

            subject = 'Confirmacion de reserva'
            message = (
                f"Hola,\n\n"
                f"Su reserva ha sido confirmada exitosamente. A continuación, los detalles:\n"
                f"Propiedad: {datos.get('nombrePropiedad', 'N/A')}\n"
                f"Fecha de llegada: {datos['fecha_llegada']}\n"
                f"Fecha de salida: {datos['fecha_salida']}\n"
                f"Número de personas: {datos['numero_personas']}\n"
                f"Precio total: {precio_total_float:.2f} EUR\n\n"
                f"ID de Reserva: {reserva.id}\n"
                f"ID de Pago PayPal: {order_id}\n\n"
                f"Gracias por confiar en nosotros."
            )

            recipient_list = [datos['correo']]
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, recipient_list)

            return JsonResponse({'status': 'success', 'reserva_id': reserva.id})
        else:
            paypal_status = response_paypal.result.status
            print(f"Intento de captura para order_id {order_id} no fue COMPLETED. Estado PayPal: {paypal_status}. Respuesta: {response_paypal.result}")
            return JsonResponse({'error': f'El pago en PayPal no se completó. Estado: {paypal_status}'}, status=400)

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Cuerpo de la solicitud JSON inválido.'}, status=400)
    except KeyError as e:
        
        data_para_log = locals().get('data_entrada', 'data_entrada no definida')
        datos_para_log = locals().get('datos', 'datos no definidos')
        print(f"Error: KeyError en confirmar_pago_paypal - {e}. data_entrada: {data_para_log}, datos: {datos_para_log}")
        return JsonResponse({'error': f'Dato faltante ({e}) en la solicitud o en datos guardados.'}, status=400)
    except Exception as e:
        import traceback 
        data_para_log_ex = locals().get('data_entrada', {}).get('orderID', 'DESCONOCIDO')
        print(f"Error inesperado en confirmar_pago_paypal para order_id {data_para_log_ex}:")
        print(traceback.format_exc()) 
        return JsonResponse({'error': f'Ocurrió un error interno en el servidor: {str(e)}'}, status=500)


    
class PropiedadViewSet(viewsets.ModelViewSet):
     
    queryset = Propiedad.objects.all()
    serializer_class = PropiedadSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]
    
    def retrieve(self, request, *args, **kwargs):
        propiedad = self.get_object()

        if request.user.is_authenticated:
            usuario = Usuario.objects.filter(usuario=request.user.id).first()
            propiedades = Propiedad.objects.filter(anfitrion=usuario)
            
            if usuario and propiedad not in propiedades:
                ahora = timezone.now()
                hace_5s = ahora - timedelta(seconds=5)

                # 🔍 Busca clicks recientes
                clicks_recientes = ClickPropiedad.objects.filter(
                    usuario=usuario,
                    propiedad=propiedad,
                    timestamp__gte=hace_5s
                )

                for click in clicks_recientes:
                    print(f"🕒 Click anterior: {click.timestamp}")

                if not clicks_recientes.exists():
                    ClickPropiedad.objects.create(usuario=usuario, propiedad=propiedad)
                    print("✅ Click creado")
                else:
                    print("🚫 Click duplicado ignorado")

        serializer = self.get_serializer(propiedad)
        return Response(serializer.data)

    
    def update(self, request, *args, **kwargs):
        propiedad = self.get_object()
        anfitrionId = propiedad.anfitrion.usuario_id
        usuarioId = request.user.id 

        if anfitrionId != usuarioId:
            return Response({'error': 'No tienes permiso para editar esta propiedad'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        propiedad = self.get_object()
        anfitrionId = propiedad.anfitrion.usuario_id
        usuarioId = request.user.id 

        if anfitrionId != usuarioId:
            return Response({'error': 'No tienes permiso para editar esta propiedad'}, status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):    
        propiedad = self.get_object()
        anfitrionId = propiedad.anfitrion.usuario_id
        usuarioId = request.user.id 
        if anfitrionId != usuarioId:
            return Response({'error': 'No tienes permiso para eliminar esta propiedad'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class ValoracionPropiedadViewSet(viewsets.ModelViewSet):
    queryset = ValoracionPropiedad.objects.all()
    serializer_class = ValoracionPropiedadSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]
    
    def create(self, request, *args, **kwargs):
        propiedad_id = request.data.get('propiedad')
        usuario_id = request.data.get('usuario')
        valoracion = request.data.get('valoracion')
        comentario = request.data.get('comentario', None)
        usuario = Usuario.objects.filter(id=usuario_id).first()        

        if not propiedad_id or not valoracion or not usuario_id or not comentario:
            return Response({'error': 'Todos los campos son obligatorios'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            propiedad = Propiedad.objects.get(id=propiedad_id)
        except Propiedad.DoesNotExist:
            return Response({'error': 'Propiedad no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        
        if valoracion < 1 or valoracion > 5:
            return Response({'error': 'Valoración debe ser un número entre 1 y 5'}, status=status.HTTP_400_BAD_REQUEST)
        
        if propiedad.anfitrion.usuario_id == request.user.id:
            return Response({'error': 'No puedes valorar tu propia propiedad'}, status=status.HTTP_403_FORBIDDEN)
        
        reservas = Reserva.objects.filter(usuario=usuario, propiedad_id=propiedad_id, estado='Aceptada')
        if not reservas.exists():
            return Response({'error': 'Debes tener una reserva confirmada para valorar esta propiedad'}, status=status.HTTP_403_FORBIDDEN)
                
        try:
            ValoracionPropiedad.objects.create(propiedad=propiedad, usuario=usuario, valoracion=valoracion, comentario=comentario)
        except IntegrityError:
            return Response({'error': 'Ya has valorado esta propiedad'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({'status': 'valoración creada'}, status=status.HTTP_201_CREATED)
    
    def partial_update(self, request, *args, **kwargs):
        valoracion = self.get_object()
        user = request.user.id
        usuarioId = Usuario.objects.filter(usuario=user).first().id
        if valoracion.usuario.id != usuarioId:
            return Response({'error': 'No tienes permiso para editar esta valoración'}, status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)

    
    def update(self, request, *args, **kwargs):
        valoracion = self.get_object()
        user = request.user.id
        usuarioId = Usuario.objects.filter(usuario=user).first().id
        propiedad = valoracion.propiedad

        if propiedad.anfitrion.usuario_id == request.user.id:
            return Response({'error': 'No puedes editar valoraciones de tu propia propiedad'}, status=status.HTTP_403_FORBIDDEN)
        if valoracion.usuario.id != usuarioId:
            return Response({'error': 'No tienes permiso para editar esta valoración'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        valoracion = self.get_object()
        usuario = request.user.id
        usuarioId = Usuario.objects.filter(usuario=usuario).first().id
        propiedad = valoracion.propiedad

        if propiedad.anfitrion.usuario_id == request.user.id:
            return Response({'error': 'No puedes eliminar valoraciones de tu propia propiedad'}, status=status.HTTP_403_FORBIDDEN)
        if valoracion.usuario.id != usuarioId:
            return Response({'error': 'No tienes permiso para eliminar esta valoración'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=True, methods=['get'], url_path='media-valoraciones')
    def media_valoraciones(self, request, pk=None):
        try:
            propiedad = Propiedad.objects.get(id=pk)
        except Propiedad.DoesNotExist:
            return Response({'error': 'Propiedad no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        
        media = ValoracionPropiedad.objects.filter(propiedad=propiedad).aggregate(Avg('valoracion'))['valoracion__avg']
        reseñas = ValoracionPropiedad.objects.filter(propiedad=propiedad).count()
        if media is None:
            return Response({'mensaje': 'Esta propiedad no tiene valoraciones todavía'}, status=status.HTTP_200_OK)
        return Response({'media': media, 'reseñas':reseñas}, status=status.HTTP_200_OK)

class FotoPropiedadViewSet(viewsets.ModelViewSet):
    queryset = FotoPropiedad.objects.all()
    serializer_class = FotoPropiedadSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]
    
    def create(self, request, *args, **kwargs):
        propiedad_id = request.data.get('propiedadId')
        try:
            propiedad = Propiedad.objects.get(id=propiedad_id)
        except Propiedad.DoesNotExist:
            return Response({'error': 'Propiedad no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        if propiedad.anfitrion.usuario_id != request.user.id:
             return Response({'error': 'No tienes permiso para subir fotos a esta propiedad'}, status=status.HTTP_403_FORBIDDEN)
        
        foto = request.data.get('foto')
        es_portada_str = request.data.get('es_portada', 'false')
        es_portada = str(es_portada_str).lower() == 'true'

        FotoPropiedad.objects.create(propiedad=propiedad, foto=foto, es_portada=es_portada)
        return Response({'status': 'foto subida'}, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        propiedad_id = request.data.get('propiedadId')
        try:
            propiedad = Propiedad.objects.get(id=propiedad_id)
        except Propiedad.DoesNotExist:
            return Response({'error': 'Propiedad no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        
        if propiedad.anfitrion.usuario_id != request.user.id:
            return Response({'error': 'No tienes permiso para actualizar fotos de esta propiedad'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    
    def partial_update(self, request, *args, **kwargs):
        propiedad_id = request.data.get('propiedadId')
        try:
            propiedad = Propiedad.objects.get(id=propiedad_id)
        except Propiedad.DoesNotExist:
            return Response({'error': 'Propiedad no encontrada'}, status=status.HTTP_404_NOT_FOUND)
       
        if propiedad.anfitrion.usuario_id != request.user.id:
            return Response({'error': 'No tienes permiso para actualizar fotos de esta propiedad'}, status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)
    
    
    def destroy(self, request, *args, **kwargs):
        foto = self.get_object()
        propiedad = foto.propiedad
        if propiedad.anfitrion.usuario_id != request.user.id:
            return Response({'error': 'No tienes permiso para eliminar esta foto'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['post'])
    def upload_photos(self, request):
        propiedad_id = request.data.get('propiedadId')
        try:
            propiedad = Propiedad.objects.get(id=propiedad_id)
        except Propiedad.DoesNotExist:
            return Response({'error': 'Propiedad no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        
        if propiedad.anfitrion.usuario_id != request.user.id:
            return Response({'error': 'No tienes permiso para subir fotos a esta propiedad'}, status=status.HTTP_403_FORBIDDEN)
        
        es_portada_list = request.data.getlist('es_portada')


        for index, file in enumerate(request.FILES.getlist('fotos')):
            
            es_portada = es_portada_list[index].lower() == 'true' if index < len(es_portada_list) else False

            FotoPropiedad.objects.create(propiedad=propiedad, foto=file, es_portada=es_portada)
        return Response({'status': 'fotos subidas'}, status=status.HTTP_201_CREATED)
    
class FechaBloqueadaViewSet(viewsets.ModelViewSet):
    queryset = FechaBloqueada.objects.all()
    serializer_class = FechaBloqueadaSerializer

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]

    def create(self, request, *args, **kwargs):
        propiedad_id = request.data.get("propiedad")
        try:
            propiedad = Propiedad.objects.get(id=propiedad_id)
        except Propiedad.DoesNotExist:
            return Response({'error': 'Propiedad no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        
        anfitrion = propiedad.anfitrion.usuario_id
       
        if anfitrion != request.user.id:
            return Response({'error': 'No tienes permiso para bloquear fechas en esta propiedad'}, status=status.HTTP_403_FORBIDDEN)
        
        fecha = request.data.get("fecha")
        FechaBloqueada.objects.create(propiedad=propiedad, fecha=fecha)
        return Response({'status': 'fechas bloqueadas'}, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        return Response({'error': 'No puedes actualizar fechas bloqueadas'}, status=status.HTTP_403_FORBIDDEN)
    
    def partial_update(self, request, *args, **kwargs):
        return Response({'error': 'No puedes actualizar fechas bloqueadas'}, status=status.HTTP_403_FORBIDDEN)
    
    def destroy(self, request, *args, **kwargs):
        fecha = self.get_object()
        propiedad = fecha.propiedad
       
        if propiedad.anfitrion.usuario_id != request.user.id:
            return Response({'error': 'No tienes permiso para desbloquear esta fecha'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

class ReservaViewSet(viewsets.ModelViewSet):
    queryset = Reserva.objects.all()
    serializer_class = ReservaSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'list', 'retrieve']:
            return [IsAuthenticated()]
        return [AllowAny()]
    
    def create(self, request, *args, **kwargs):
        propiedad = request.data.get('propiedad')
        fecha_inicio_str = request.data.get('fecha_llegada')
        fecha_fin_str = request.data.get('fecha_salida')
        numero_personas = request.data.get('numero_personas')

        if not propiedad or not fecha_inicio_str or not fecha_fin_str or  numero_personas is None:
            return Response({'error': 'Todos los campos son obligatorios'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            fecha_inicio = datetime.strptime(fecha_inicio_str, '%Y-%m-%d').date()
            fecha_fin = datetime.strptime(fecha_fin_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Formato de fecha inválido (debe ser YYYY-MM-DD)'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            numero_personas = int(numero_personas)
            if numero_personas <= 0:
                return Response({'error': 'La cantidad de personas debe ser mayor a 0'}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({'error': 'Número de personas inválido'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            propiedad = Propiedad.objects.get(id=propiedad)
        except Propiedad.DoesNotExist:
            return Response({'error': 'Propiedad no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        if propiedad.anfitrion.usuario_id == request.user.id:
            return Response({'error': 'No puedes reservar tu propia propiedad'}, status=status.HTTP_403_FORBIDDEN)

        if fecha_inicio >= fecha_fin:
            return Response({'error': 'Fecha de llegada debe ser anterior a fecha de salida'}, status=status.HTTP_400_BAD_REQUEST)

        if fecha_inicio < datetime.now().date():
            return Response({'error': 'Fecha de llegada debe ser posterior a la fecha actual'}, status=status.HTTP_400_BAD_REQUEST)

        fechas_bloqueadas = FechaBloqueada.objects.filter(propiedad=propiedad, fecha__range=[fecha_inicio, fecha_fin])
        if fechas_bloqueadas.exists():
            return Response({'error': 'Fechas bloqueadas'}, status=status.HTTP_400_BAD_REQUEST)

        reservas_existentes = Reserva.objects.filter(
            propiedad=propiedad, 
            fecha_llegada__lt=fecha_fin,  
            fecha_salida__gt=fecha_inicio  
        )
        if reservas_existentes.exists():
            return Response({'error': 'Propiedad ocupada en esas fechas'}, status=status.HTTP_400_BAD_REQUEST)

        if numero_personas > propiedad.maximo_huespedes:
            return Response({'error': 'Cantidad de personas excede el límite'}, status=status.HTTP_400_BAD_REQUEST)

        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        reserva = Reserva.objects.get(id=kwargs['pk'])
        propiedad = reserva.propiedad
        estado = request.data.get('estado')
        usuario = Usuario.objects.filter(usuario=request.user).first()
        usuarioId = usuario.id
       

        if not estado:
            return Response({'error': 'Estado es requerido'}, status=status.HTTP_400_BAD_REQUEST)
        
        if estado not in ['Aceptada', 'Cancelada']:
            return Response({'error': 'Estado inválido'}, status=status.HTTP_400_BAD_REQUEST)
        
        
        if propiedad.anfitrion.usuario_id == request.user.id:
            reserva.estado = estado
            reserva.fecha_aceptacion_rechazo = datetime.now() - timedelta(hours=1)

        elif reserva.usuario.id == usuarioId and estado == 'Cancelada':
            reserva.estado = estado
            reserva.fecha_aceptacion_rechazo = datetime.now() - timedelta(hours=1)
        else:
            return Response({'error': 'No tienes permiso para cambiar el estado de esta reserva'}, status=status.HTTP_403_FORBIDDEN)
        
        reserva.save()
        return Response({'status': 'estado actualizado'}, status=status.HTTP_200_OK)
    
    def destroy(self, request, *args, **kwargs):
        return Response({'error': 'No puedes eliminar reservas'}, status=status.HTTP_403_FORBIDDEN)
    
    def partial_update(self, request, *args, **kwargs):
        usuario = Usuario.objects.filter(usuario=request.user).first()
        usuarioId = usuario.id
        reserva = self.get_object()

        
        if reserva.anfitrion.id != usuarioId and reserva.usuario.id != usuarioId:
            return Response({'error': 'No tienes permiso para editar esta reserva'}, status=status.HTTP_403_FORBIDDEN)  
        
        return super().partial_update(request, *args, **kwargs)
    
    def retrieve(self, request, *args, **kwargs):
        reserva = self.get_object()
        usuario = Usuario.objects.filter(usuario=request.user).first()
        usuarioId = usuario.id
        if reserva.usuario.id != usuarioId and reserva.propiedad.anfitrion.id != usuarioId:
            return Response({'error': 'No tienes permiso para ver esta reserva'}, status=status.HTTP_403_FORBIDDEN)
        return super().retrieve(request, *args, **kwargs)
    
    # def list(self, request, *args, **kwargs):
    #     usuario = Usuario.objects.filter(usuario=request.user).first()
    #     usuarioId = usuario.id
    #     print(usuarioId)
    #     queryset = self.queryset.filter(
    #         Q(usuario_id=usuarioId) | Q(anfitrion_id=usuarioId)
    #     )
    #     page = self.paginate_queryset(queryset)
    #     if page is not None:
    #         serializer = self.get_serializer(page, many=True)
    #         return self.get_paginated_response(serializer.data)

    #     serializer = self.get_serializer(queryset, many=True)
    #     return Response(serializer.data)
    
class FavoritoViewSet(viewsets.ModelViewSet):
    queryset = Favorito.objects.all()
    serializer_class = FavoritoSerializer

    def get_permissions(self):
        if self.action in ['create', 'destroy', "update", "partial_update", 'retrieve', 'list']:
            return [IsAuthenticated()]
        return [AllowAny()]
    
    

    # En views.py -> FavoritoViewSet -> create()
    def create(self, request, *args, **kwargs):
        propiedad_id = request.data.get('propiedad')
        # usuario_id = request.data.get('usuario') # Ya no lees el usuario del request

        if not propiedad_id: # Solo validas propiedad
            return Response({'error': 'Propiedad es requerida'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            propiedad = Propiedad.objects.get(id=propiedad_id)
        except Propiedad.DoesNotExist:
            return Response({'error': 'Propiedad no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        # Obtienes el perfil Usuario del usuario autenticado
        usuario_perfil = Usuario.objects.filter(usuario=request.user).first()
        if not usuario_perfil:
            # Manejar caso raro de usuario autenticado sin perfil
            return Response({'error': 'Perfil de usuario no encontrado'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            # Creas el favorito para el usuario autenticado
            Favorito.objects.create(propiedad=propiedad, usuario=usuario_perfil)
        except IntegrityError:
            return Response({'error': 'Ya has marcado esta propiedad como favorita'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'status': 'favorito creado'}, status=status.HTTP_201_CREATED)
    
    def destroy(self, request, *args, **kwargs):
        favorito = self.get_object()
        usuario = Usuario.objects.filter(usuario=request.user).first()
       
        if favorito.usuario.id != usuario.id:
            return Response({'error': 'No tienes permiso para eliminar este favorito'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        return Response({'error': 'No puedes actualizar favoritos'}, status=status.HTTP_403_FORBIDDEN)
    
    def partial_update(self, request, *args, **kwargs):
        return Response({'error': 'No puedes actualizar favoritos'}, status=status.HTTP_403_FORBIDDEN)
    
    def retrieve(self, request, *args, **kwargs):
        favorito = self.get_object()
        usuario = Usuario.objects.filter(usuario=request.user).first()
        
        if favorito.usuario.id != usuario.id:
            return Response({'error': 'No tienes permiso para ver este favorito'}, status=status.HTTP_403_FORBIDDEN)
        return super().retrieve(request, *args, **kwargs)
    
    def list (self, request, *args, **kwargs):
        usuario = Usuario.objects.filter(usuario=request.user).first()
        queryset = self.queryset.filter(usuario=usuario)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
# SISTEMA DE RECOMENDACIONES

class RecommendationAPI(APIView):

    def get(self, request):
        # 1. Autenticación y obtención del perfil de usuario
        user = request.user
        if not user.is_authenticated:
            return Response({"error": "Usuario no autenticado"}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            usuario = Usuario.objects.get(usuario=request.user)
        except Usuario.DoesNotExist:
             return Response({"error": "Perfil de Usuario no encontrado para el usuario autenticado."}, status=status.HTTP_404_NOT_FOUND)

        # 2. Inicializar los sistemas de recomendación
        content_rec = ContentRecommender()
        collab_rec = CollaborativeRecommender()

       
        content_rec.refresh_data()

        # 3. Calcular Puntuación Ponderada de Interacción por Ciudad
        interaction_counts_per_city = defaultdict(float)

        # --- INICIO: Procesamiento de Clics (UNA VEZ por propiedad única) ---
        processed_click_prop_ids = set() # Para no contar la misma propiedad dos veces

        clicked_properties_qs = ClickPropiedad.objects.filter(usuario=usuario).select_related('propiedad')
        for click in clicked_properties_qs:
            prop_id = click.propiedad.id

            # Comprobar si YA hemos procesado esta propiedad_id en esta solicitud
            if prop_id not in processed_click_prop_ids:
                try:
                    prop_features = next(f for f in content_rec.features if f['id'] == prop_id)
                    ciudad = prop_features['ciudad']

                    # Añadir peso del clic a la ciudad SOLO la primera vez
                    interaction_counts_per_city[ciudad] += 0.5 # <-- Peso clic

                    # Registrar clic en ContentRecommender SOLO la primera vez
                    content_rec.record_click(usuario.id, prop_id)

                    # Marcar esta propiedad como procesada
                    processed_click_prop_ids.add(prop_id)
                except StopIteration:
                    # print(f"Advertencia: Propiedad clickeada {prop_id} no encontrada.")
                    pass
            # else: Si ya se procesó, ignorar este clic para la puntuación.
        # --- FIN: Procesamiento de Clics ---

        # 3b. Procesar Favoritos (peso medio)
        fav_cities = usuario.favoritos.values_list('propiedad__ciudad', flat=True)
        for city in fav_cities:
            interaction_counts_per_city[city] += 1.0 # <-- Peso favorito 

        # 3c. Procesar Reservas (peso alto)
        res_cities = usuario.reservas.values_list('propiedad__ciudad', flat=True)
        for city in res_cities:
            interaction_counts_per_city[city] += 1.5 # <-- Peso reserva 

        # 3d. Encontrar el puntaje máximo de ciudad para normalizar
        max_city_score = max(interaction_counts_per_city.values()) if interaction_counts_per_city else 1.0
        if max_city_score == 0: max_city_score = 1.0 # Evitar división por cero


        # 4. Obtener candidatos iniciales del Recomendador Colaborativo
        collab_props = collab_rec.get_user_recommendations(usuario.id)
        if not collab_props:
             return Response([], status=status.HTTP_200_OK) # O devolver populares globales


        # 5. Obtener datos adicionales del usuario para re-ranking
        user_ratings = {
            v.propiedad.id: v.valoracion for v in ValoracionPropiedad.objects.filter(usuario=usuario)
        }
        user_favoritos_ids = set(usuario.favoritos.values_list('propiedad__id', flat=True))

        # Calcular max_popularity del conjunto actual de candidatos
        valid_popularities = [getattr(prop, 'popularity', 0) for prop in collab_props if hasattr(prop, 'popularity')]
        max_popularity = max(valid_popularities) if valid_popularities else 1.0
        if max_popularity == 0: max_popularity = 1.0


        # 6. Bucle de Re-ranking Híbrido
        scored_props = []
        for prop in collab_props:
            # 6a. Calcular similitud de contenido y puntuaciones derivadas
            similares = content_rec.get_similar(prop.id, top=5, user_id=usuario.id)
            rating_scores = [
                similarity * (user_ratings[pid] / 5.0)
                for pid, similarity, _ in similares if pid in user_ratings
            ]
            rating_score = np.nan_to_num(np.nanmean(rating_scores))
            fav_scores = [
                similarity for pid, similarity, _ in similares if pid in user_favoritos_ids
            ]
            fav_score = np.nan_to_num(np.nanmean(fav_scores))

            # 6b. Normalizar popularidad colaborativa
            popularity = getattr(prop, 'popularity', 0)
            normalized_popularity = popularity / max_popularity

            # 6c. Calcular Componente de Ciudad (Normalizado)
            #    Usa los interaction_counts_per_city calculados en el paso 3
            prop_ciudad = prop.ciudad
            current_city_score = interaction_counts_per_city.get(prop_ciudad, 0)
            # Normalización Lineal (0 a 1)
            normalized_city_component = current_city_score / max_city_score
            # Alternativa: Normalización Logarítmica
            # normalized_city_component = math.log1p(current_city_score) / math.log1p(max_city_score) if max_city_score > 0 else 0

            # 6d. Calcular Puntuación Combinada Final (Ajustar pesos si es necesario)
            combined_score = (
                0.50 * normalized_city_component +  # Preferencia de ciudad
                0.30 * rating_score +             # Similitud con valorados
                0.15 * fav_score +                # Similitud con favoritos
                0.05 * normalized_popularity      # Popularidad colaborativa
            )

            # Añadir a la lista para ordenar
            scored_props.append({
                'propiedad': prop,
                'score': round(combined_score * 100, 2),
                'components': { # Para depuración
                    'ciudad_score_norm': round(normalized_city_component, 4),
                    'rating_score_comp': round(0.30 * rating_score, 4),
                    'fav_score_comp': round(0.15 * fav_score, 4),
                    'pop_score_comp': round(0.05 * normalized_popularity, 4)
                 }
            })

        # 7. Ordenar resultados finales y obtener los Top N (ej: 10)
        sorted_results = sorted(scored_props, key=lambda x: x['score'], reverse=True)[:10]

        # 8. Serializar y devolver la respuesta
        serializer = PropiedadRecommendationSerializer(
            [item['propiedad'] for item in sorted_results],
            many=True,
            context={'scores': sorted_results} # Pasar scores/componentes al serializer
        )
        return Response(serializer.data)

    
class PrecioEspecialViewSet(viewsets.ModelViewSet):
    queryset = PrecioEspecial.objects.all()
    serializer_class = PrecioEspecialSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]

    def create(self, request, *args, **kwargs):
        propiedad_id = request.data.get('propiedad')
        fecha_inicio_str = request.data.get('fecha_inicio')
        fecha_fin_str = request.data.get('fecha_fin')
        precio_especial = request.data.get('precio_especial')

        if not propiedad_id or not fecha_inicio_str or not fecha_fin_str or not precio_especial:
            return Response({'error': 'Todos los campos son obligatorios'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            fecha_inicio = datetime.strptime(fecha_inicio_str, '%Y-%m-%d').date()
            fecha_fin = datetime.strptime(fecha_fin_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Formato de fecha inválido (debe ser YYYY-MM-DD)'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            precio_especial = float(precio_especial)
            if precio_especial <= 0:
                return Response({'error': 'El precio especial debe ser mayor a 0'}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({'error': 'Precio especial inválido'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            propiedad = Propiedad.objects.get(id=propiedad_id)
        except Propiedad.DoesNotExist:
            return Response({'error': 'Propiedad no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        if propiedad.anfitrion.usuario_id != request.user.id:
            return Response({'error': 'No tienes permiso para establecer precios especiales en esta propiedad'}, status=status.HTTP_403_FORBIDDEN)

        if fecha_inicio >= fecha_fin:
            return Response({'error': 'Fecha de inicio debe ser anterior a fecha de fin'}, status=status.HTTP_400_BAD_REQUEST)

        if fecha_inicio < datetime.now().date():
            return Response({'error': 'Fecha de inicio debe ser posterior a la fecha actual'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            PrecioEspecial.objects.create(
                propiedad=propiedad,
                fecha_inicio=fecha_inicio,
                fecha_fin=fecha_fin,
                precio_especial=precio_especial
            )
        except IntegrityError:
            return Response({'error': 'Ya existe un precio especial para estas fechas'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({'status': 'precio especial creado'}, status=status.HTTP_201_CREATED)
    
    def partial_update(self, request, *args, **kwargs):
       return Response({'error': 'No puedes actualizar precios especiales'}, status=status.HTTP_403_FORBIDDEN)
    
    def update(self, request, *args, **kwargs):
        return Response({'error': 'No puedes actualizar precios especiales'}, status=status.HTTP_403_FORBIDDEN)
    
    def destroy(self, request, *args, **kwargs):
        precio_especial = self.get_object()
        propiedad = precio_especial.propiedad
        
        if propiedad.anfitrion.usuario_id != request.user.id:
            return Response({'error': 'No tienes permiso para eliminar este precio especial'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def propiedades_por_usuario(request, usuario_id):
    usuario = Usuario.objects.filter(usuario=request.user).first()
    usuarioId = usuario.id
    try:
        if usuarioId != int(usuario_id):
            return Response({'error': 'No tienes permiso para ver estas propiedades'}, status=status.HTTP_403_FORBIDDEN)
        
        propiedades = Propiedad.objects.filter(anfitrion=usuarioId)
        serializer = PropiedadSerializer(propiedades, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Propiedad.DoesNotExist:
        return Response({'error': 'Propiedades no encontradas'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
def valoraciones_por_propiedad(request, propiedad_id):

    propiedad = Propiedad.objects.filter(id=propiedad_id).first()
    if not propiedad:
        return Response({'error': 'Propiedad no encontrada'}, status=status.HTTP_404_NOT_FOUND)
    
    valoraciones = ValoracionPropiedad.objects.filter(propiedad=propiedad_id)
    serializer = ValoracionPropiedadSerializer(valoraciones, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reservas_por_propiedad(request, propiedad_id):

    try:
        propiedad = Propiedad.objects.get(id=propiedad_id)
    except Propiedad.DoesNotExist:
        return Response({'error': 'Propiedad no encontrada'}, status=status.HTTP_404_NOT_FOUND)
    
   
    reservas = Reserva.objects.filter(propiedad=propiedad_id)
    serializer = ReservaSerializer(reservas, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET']) 
def precios_especiales_por_propiedad(request, propiedad_id):
    try:
        propiedad = Propiedad.objects.get(id=propiedad_id)
    except Propiedad.DoesNotExist:
        return Response({'error': 'Propiedad no encontrada'}, status=status.HTTP_404_NOT_FOUND)

    precios_especiales = PrecioEspecial.objects.filter(propiedad=propiedad_id)
    serializer = PrecioEspecialSerializer(precios_especiales, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def favoritos_por_usuario(request, usuario_id): 

    
    usuario_autenticado_profile = Usuario.objects.filter(usuario=request.user).first()
    userId = request.user.id

    
    if usuario_autenticado_profile is None:
        return Response(
            {'error': 'Perfil de usuario asociado al usuario autenticado no encontrado.'},
            status=status.HTTP_404_NOT_FOUND
           
        )

    usuario_autenticado_profile_id = usuario_autenticado_profile.id
    user2 = usuario_autenticado_profile.usuario.id

   
    try:
        requested_user_id = int(usuario_id)
       
              
    except (ValueError, TypeError):
        return Response({'error': 'ID de usuario inválido en la URL.'}, status=status.HTTP_400_BAD_REQUEST)

    if usuario_autenticado_profile_id != requested_user_id:
        return Response({'error': 'No tienes permiso para ver estos favoritos'}, status=status.HTTP_403_FORBIDDEN)

    
    try:
        favoritos = Favorito.objects.filter(usuario=requested_user_id)
        serializer = FavoritoSerializer(favoritos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

   
    except Exception as e:
        
        print(f"Error inesperado en favoritos_por_usuario [ID: {requested_user_id}]: {e}")
        return Response({'error': 'Ocurrió un error interno en el servidor.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def fotos_por_propiedad(request, propiedad_id):
    try :
        propiedad = Propiedad.objects.get(id=propiedad_id)
    except Propiedad.DoesNotExist:
        return Response({'error': 'Propiedad no encontrada'}, status=status.HTTP_404_NOT_FOUND)
    fotos = FotoPropiedad.objects.filter(propiedad=propiedad_id)
    serializer = FotoPropiedadSerializer(fotos, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def solicitudes_de_reserva_anfitrion(request, usuario_id):
    usuario = Usuario.objects.filter(usuario=request.user).first()
    usuarioId = usuario.id
    try:
        if usuarioId != int(usuario_id):
            return Response({'error': 'No tienes permiso para ver estas reservas'}, status=status.HTTP_403_FORBIDDEN)
        
        reservas = Reserva.objects.filter(anfitrion=usuarioId)
        serializer = ReservaSerializer(reservas, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Reserva.DoesNotExist:
        return Response({'error': 'Reservas no encontradas'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def solicitudes_de_reserva_usuario(request, usuario_id):
    usuario = Usuario.objects.filter(usuario=request.user).first()
    usuarioId = usuario.id
    try:
        if usuarioId != int(usuario_id):
            return Response({'error': 'No tienes permiso para ver estas reservas'}, status=status.HTTP_403_FORBIDDEN)
        
        reservas = Reserva.objects.filter(usuario=usuarioId)
        serializer = ReservaSerializer(reservas, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Reserva.DoesNotExist:
        return Response({'error': 'Reservas no encontradas'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
def fechas_bloqueadas_por_propiedad(request, propiedad_id):
    try:
        propiedad = Propiedad.objects.get(id=propiedad_id)
    except Propiedad.DoesNotExist:
        return Response({'error': 'Propiedad no encontrada'}, status=status.HTTP_404_NOT_FOUND)
    
    fechas_bloqueadas = FechaBloqueada.objects.filter(propiedad=propiedad_id)
    serializer = FechaBloqueadaSerializer(fechas_bloqueadas, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ocupacion_tendencia_por_propiedad(request, propiedad_id):
    try:
        propiedad = Propiedad.objects.get(id=propiedad_id)
    except Propiedad.DoesNotExist:
        return Response({'error': 'Propiedad no encontrada'}, status=status.HTTP_404_NOT_FOUND)
    
    now = timezone.now().date()
    start_date = (now - relativedelta(months=11)).replace(day=1)
    end_date = (now + relativedelta(months=1)).replace(day=1)
    
    reservas = Reserva.objects.filter(
        propiedad=propiedad_id,
        fecha_llegada__lt=end_date,
        fecha_salida__gt=start_date,
        estado__in=['Aceptada']
    ).order_by('fecha_llegada')
    
    ocupacion_por_mes = {}
    current_date = start_date
    while current_date < end_date:
        mes_key = current_date.strftime('%Y-%m')
        ocupacion_por_mes[mes_key] = 0
        current_date = current_date.replace(day=1) + relativedelta(months=1)
    
    for reserva in reservas:
        llegada = max(reserva.fecha_llegada, start_date)
        salida = min(reserva.fecha_salida, end_date)
        current = llegada
        while current < salida:
            mes_key = current.strftime('%Y-%m')
            next_month = current.replace(day=1) + relativedelta(months=1)
            dias_en_mes = (min(salida, next_month) - current).days
            ocupacion_por_mes[mes_key] += dias_en_mes
            current = next_month
    
    tendencias = []
    for mes, dias_ocupados in ocupacion_por_mes.items():
        mes_date = datetime.strptime(mes + '-01', '%Y-%m-%d').date()
        total_dias = (mes_date.replace(day=1) + relativedelta(months=1) - mes_date.replace(day=1)).days
        porcentaje = (dias_ocupados / total_dias) * 100 if total_dias > 0 else 0
        tendencias.append({
            'mes': mes,
            'ocupacion': round(porcentaje, 2)
        })
    
    tendencias.sort(key=lambda x: x['mes'])
    
    return Response(tendencias, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def precio_tendencia_por_propiedad(request, propiedad_id):

    try:
        propiedad = Propiedad.objects.get(id=propiedad_id)
    except Propiedad.DoesNotExist:
        return Response({'error': 'Propiedad no encontrada'}, status=status.HTTP_404_NOT_FOUND)
    
    precios_especiales = PrecioEspecial.objects.filter(propiedad=propiedad)
    
    now = timezone.now().date()
    start_date = (now - relativedelta(months=11)).replace(day=1)
    end_date = (now + relativedelta(months=1)).replace(day=1)
        
    months = []
    current_date = start_date
    while current_date < end_date:
        months.append(current_date.strftime("%Y-%m"))
        current_date += relativedelta(months=1)
    
    data = []
    for month in months:
        month_start = datetime.strptime(month + "-01", "%Y-%m-%d")
        month_end = month_start + relativedelta(months=1) - timedelta(days=1)
        
        total_precio = 0
        total_dias = 0
        current_day = month_start
        while current_day <= month_end:
            current_day_date = current_day.date()
            precio_dia = next(
                (pe.precio_especial for pe in precios_especiales 
                 if pe.fecha_inicio <= current_day_date <= pe.fecha_fin),
                propiedad.precio_por_noche 
            )
            total_precio += precio_dia
            total_dias += 1
            current_day += timedelta(days=1)
        
        precio_promedio = total_precio / total_dias if total_dias > 0 else 0
        
        data.append({
            'mes': month,
            'precio': round(precio_promedio, 2)
        })
    
    return Response(data, status=status.HTTP_200_OK)

class ReservaPaypalTemporalView(APIView):
    def post(self, request):
        serializer = ReservaPaypalTemporalSerializer(data=request.data)
        if serializer.is_valid():
            usuario = Usuario.objects.filter(usuario=request.user.id).first()

            serializer.save(usuario=usuario)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ReservaPaypalTemporalDetailView(APIView):
    def get(self, request, order_id):
        reserva = get_object_or_404(ReservaPaypalTemporal, order_id=order_id)
        serializer = ReservaPaypalTemporalSerializer(reserva)
        return Response(serializer.data['datos_reserva'], status=status.HTTP_200_OK)
