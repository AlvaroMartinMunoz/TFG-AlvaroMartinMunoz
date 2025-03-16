import requests
from bs4 import BeautifulSoup
import os
import sys
import django
import time
import random
from background_task import background
from background_task.models import Task

# Añade el path del proyecto Django al sys.path
sys.path.append('C:\\Users\\alvar\\OneDrive\\Escritorio\\4º Año Ingenieria\\TFG\\TFG-AlvaroMartinMunoz\\marketplace\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from evento.models import Evento

@background(schedule=0)
def extraer_eventos():
    print(f"Extrayendo eventos")

    Evento.objects.all().delete()
    print(f"Todos los eventos existentes han sido eliminados")

    lista = []
    url = "https://www.spain.info/es/agenda/"
    response = requests.get(url)

    s = BeautifulSoup(response.text, 'lxml')

    body = s.find("div", id="cuerpo")
    if body:
        print(f"Body encontrado")
        contenedor_general = body.find("section", class_="module carrousel-rot bg-light-gray")
    else:
        print("Body no encontrado")
        return lista

    if contenedor_general:
        print(f"Contenedor general encontrado")
        contenedor_general_dos = contenedor_general.find("div", class_="container position-relative")
        if contenedor_general_dos:
            print(f"Contenedor general dos encontrado")
            eventos = contenedor_general_dos.find_all("div", class_="item position-relative bg-dark-gradient")
            if eventos:
                print(f"Eventos encontrados")

                for evento in eventos:
                            
                            time.sleep(random.uniform(1,3))

                            imagen = evento.find("img")['src'] if evento.find("img") else None
                            imagen = ("https://www.spain.info" + imagen) if imagen else None
                            print(f"Imagen encontrada: {imagen}")
                            url_detalle = evento.find("a")['href'] if evento.find("a") else None
                            print(f"URL detalle encontrada: {url_detalle}")

                            url_detalle = "https://www.spain.info" + url_detalle if url_detalle else None
                            response = requests.get(url_detalle)
                            s = BeautifulSoup(response.text, 'lxml')

                            descripcion_principal = s.find("p", class_="text-destacado")
                            print(f"Descripcion principal encontrada: {descripcion_principal.text.strip() if descripcion_principal else 'No disponible'}")
                            descripcion_secundaria = s.find("p", class_="text-secundario")
                            print(f"Descripcion secundaria encontrada: {descripcion_secundaria.text.strip() if descripcion_secundaria else 'No disponible'}")

                            datos_evento = evento.find("div", class_="position-absolute content left bottom text-white")
                            if datos_evento:
                                print(f"Datos de evento encontrados")

                                fecha = datos_evento.find("p", class_="title small pb-2")
                                nombre = datos_evento.find("h2", class_="text-uppercase pb-2")
                                lugar = datos_evento.find("span", class_="small d-block pb-2")
                                categoria = datos_evento.find("span", class_="small d-block pb-2").find_next_sibling("span")
                                


                                evento_obj = Evento(
                                    nombre=nombre.text.strip() if nombre else "No disponible",
                                    fecha=fecha.text.strip() if fecha else "No disponible",
                                    lugar=lugar.text.strip() if lugar else "No disponible",
                                    imagen=imagen,
                                    categoria=categoria.text.strip() if categoria else "No disponible",
                                    descripcion_principal=descripcion_principal.text.strip() if descripcion_principal else "No disponible",
                                    descripcion_secundaria=descripcion_secundaria.text.strip() if descripcion_secundaria else "No disponible"
                                )
                                evento_obj.save()
                                lista.append(evento_obj)
                print(f"Eventos extraidos: {len(lista)}")
    return lista


Task.objects.filter(task_name='evento.tasks.extraer_eventos').delete()
extraer_eventos(repeat=Task.DAILY)