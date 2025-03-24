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
from rest_framework import status
from .models.propiedad import FechaBloqueada
from .serializers import FechaBloqueadaSerializer
from .models.reserva import Reserva
from rest_framework.permissions import IsAuthenticated, AllowAny
from usuario.models.usuario import Usuario
from datetime import timedelta
from datetime import datetime
from django.db import IntegrityError
from django.db.models import Avg
import stripe
from django.db.models import Q
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
import paypalrestsdk
from django.views.decorators.http import require_POST
from django.db import transaction
from .models.favorito import Favorito
from .serializers import FavoritoSerializer




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
                    'comentarios_usuario': comentarios_usuario
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
                fecha_aceptacion_rechazo = datetime.now() - timedelta(hours=1)
            )
            
            return JsonResponse({
                'status': 'success',
                'reserva_id': reserva.id
            })
        
        return JsonResponse({'status': 'unpaid'}, status=402)
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
    
#PAYPAL
paypalrestsdk.configure({
    "client_id": settings.PAYPAL_CLIENT_ID,
    "client_secret": settings.PAYPAL_CLIENT_SECRET,
    "mode": "sandbox"
    })

@require_POST
@csrf_exempt
def create_payment(request):

    data = json.loads(request.body)
    reservationdata = data['reservationData']
    amount = reservationdata['precio_total']
    descripcion = "Pago para reserva de propiedad"

    payment = paypalrestsdk.Payment({
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "transactions": [{
            "amount": {
                "total": f"{amount:.2f}",
                "currency": 'EUR'
            },
            "description": descripcion
        }],
        "redirect_urls": {
            "return_url": "http://localhost:3000/mis-reservas",
            "cancel_url": "http://localhost:3000/detalles"
        }
    })

    if payment.create():
        approval_url = None
        for link in payment.links:
            if link.rel == "approval_url":
                approval_url = link.href
                break
        if approval_url:
            return JsonResponse({"approval_url": approval_url})
        else:
            return JsonResponse({"error": "No se encontró la URL de aprobación"}, status=400)
    else:
        return JsonResponse({"error": payment.error}, status=400)
    
@require_POST
@csrf_exempt
def confirmar_pago_paypal(request):
    try:
        data = json.loads(request.body)
        payment_id = data['paymentId']
        payer_id = data['payerId']

        if not payer_id or not payment_id:
            return JsonResponse({'error': 'Se requieren paymentId y payerId'}, status=400)

        with transaction.atomic():
            reserva_existente = Reserva.objects.select_for_update().filter(payment_id=payment_id).first()
            
            if reserva_existente:
                print("⛔ Reserva ya existe con payment_id:", payment_id)
                return JsonResponse({'status': 'success', 'message': 'Pago ya procesado'})

            payment = paypalrestsdk.Payment.find(payment_id)
            
            if payment.state == 'approved':
                print("⚠️ Pago ya aprobado en PayPal pero sin registro local")
                return JsonResponse({'error': 'Inconsistencia detectada'}, status=409)

            if payment.execute({"payer_id": payer_id}):
                datos = data['reservationData']
                
                reserva = Reserva.objects.create(
                    propiedad_id=datos['propiedad'],
                    usuario_id=datos['usuario'],
                    anfitrion_id=datos['anfitrion'],
                    fecha_aceptacion_rechazo=datetime.now() - timedelta(hours=1),  
                    fecha_llegada=datos['fecha_llegada'],
                    fecha_salida=datos['fecha_salida'],
                    numero_personas=datos['numero_personas'],
                    precio_por_noche=datos['precio_por_noche'],
                    precio_total=datos['precio_total'],
                    estado=datos['estado'],
                    metodo_pago='PayPal',
                    comentarios_usuario=datos['comentarios_usuario'],
                    payment_id=payment_id
                )
                print("✅ Reserva creada ID:", reserva.id)
                return JsonResponse({'status': 'success', 'reserva_id': reserva.id})
            
            return JsonResponse({'error': payment.error}, status=400)

    except Exception as e:
        print(f"🔥 Error crítico: {str(e)}")
        return JsonResponse({'error': 'Error procesando el pago'}, status=500)

    
class PropiedadViewSet(viewsets.ModelViewSet):
     
    queryset = Propiedad.objects.all()
    serializer_class = PropiedadSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]
    
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
        
        try:
            ValoracionPropiedad.objects.create(propiedad=propiedad, usuario=usuario, valoracion=valoracion, comentario=comentario)
        except IntegrityError:
            return Response({'error': 'Ya has valorado esta propiedad'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({'status': 'valoración creada'}, status=status.HTTP_201_CREATED)
    
    def partial_update(self, request, *args, **kwargs):
        return Response({'error': 'No puedes actualizar valoraciones'}, status=status.HTTP_403_FORBIDDEN)
    
    
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
    
    @action(detail=True, methods=['get'])
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
        print(f"propiedad_id recibido: {propiedad_id}")
        try:
            propiedad = Propiedad.objects.get(id=propiedad_id)
        except Propiedad.DoesNotExist:
            return Response({'error': 'Propiedad no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        if propiedad.anfitrion.usuario_id != request.user.id:
             return Response({'error': 'No tienes permiso para subir fotos a esta propiedad'}, status=status.HTTP_403_FORBIDDEN)
        
        foto = request.data.get('foto')
        es_portada = request.data.get('es_portada', False)
        FotoPropiedad.objects.create(propiedad=propiedad, foto=foto, es_portada=es_portada)
        return Response({'status': 'foto subida'}, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        return Response({'error': 'No puedes actualizar fotos'}, status=status.HTTP_403_FORBIDDEN)
    
    def partial_update(self, request, *args, **kwargs):
        return Response({'error': 'No puedes actualizar fotos'}, status=status.HTTP_403_FORBIDDEN)
    
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
        print(f"es_portada_list recibido: {es_portada_list}")


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
        cantidad_personas = request.data.get('numero_personas')

        if not propiedad or not fecha_inicio_str or not fecha_fin_str or not cantidad_personas:
            return Response({'error': 'Todos los campos son obligatorios'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            fecha_inicio = datetime.strptime(fecha_inicio_str, '%Y-%m-%d').date()
            fecha_fin = datetime.strptime(fecha_fin_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Formato de fecha inválido (debe ser YYYY-MM-DD)'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            cantidad_personas = int(cantidad_personas)
            if cantidad_personas <= 0:
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

        if cantidad_personas > propiedad.maximo_huespedes:
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
        return Response({'error': 'No puedes actualizar reservas'}, status=status.HTTP_403_FORBIDDEN)
    
    def retrieve(self, request, *args, **kwargs):
        reserva = self.get_object()
        usuario = Usuario.objects.filter(usuario=request.user).first()
        usuarioId = usuario.id
        if reserva.usuario.id != usuarioId and reserva.propiedad.anfitrion.id != usuarioId:
            return Response({'error': 'No tienes permiso para ver esta reserva'}, status=status.HTTP_403_FORBIDDEN)
        return super().retrieve(request, *args, **kwargs)
    
    def list(self, request, *args, **kwargs):
        usuario = Usuario.objects.filter(usuario=request.user).first()
        usuarioId = usuario.id
        print(usuarioId)
        queryset = self.queryset.filter(
            Q(usuario_id=usuarioId) | Q(anfitrion_id=usuarioId)
        )
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
class FavoritoViewSet(viewsets.ModelViewSet):
    queryset = Favorito.objects.all()
    serializer_class = FavoritoSerializer

    def get_permissions(self):
        if self.action in ['create', 'destroy', "update", "partial_update", 'retrieve', 'list']:
            return [IsAuthenticated()]
        return [AllowAny()]
    
    

    def create(self, request, *args, **kwargs):
        propiedad_id = request.data.get('propiedad')
        usuario_id = request.data.get('usuario')

        if not propiedad_id or not usuario_id:
            return Response({'error': 'Propiedad y usuario son requeridos'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            propiedad = Propiedad.objects.get(id=propiedad_id)
        except Propiedad.DoesNotExist:
            return Response({'error': 'Propiedad no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        
        usuario = Usuario.objects.filter(id=usuario_id).first()
        if not usuario:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            Favorito.objects.create(propiedad=propiedad, usuario=usuario)
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
    
