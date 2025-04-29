import os
import numpy as np
from sklearn.feature_extraction import DictVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from propiedad.models.propiedad import Propiedad
from usuario.models.usuario import Usuario
from django.db.models import Count, Q
from propiedad.models.favorito import Favorito
from .models.clickPropiedad import ClickPropiedad
from sklearn.preprocessing import StandardScaler
from collections import Counter
from copy import deepcopy
from collections import defaultdict
from joblib import dump as joblib_dump, load as joblib_load

class ContentRecommender:
    def __init__(self):
        self.location_weight = 5
        self.scaler_precio = StandardScaler()
        self.scaler_habitaciones = StandardScaler()
        self.vectorizer = DictVectorizer(sparse=False)
        self.user_clicks = defaultdict(Counter) 
        
        self._load_data()
        
        if os.path.exists('content_vectorizer.joblib'):
            old_vectorizer = joblib_load('content_vectorizer.joblib')
            if old_vectorizer.feature_names_ != self.vectorizer.feature_names_:
                self.vectorizer = DictVectorizer(sparse=False)
                self._load_data()

    def _load_data(self):
        propiedades = Propiedad.objects.all().values(
            'id', 'tipo_de_propiedad', 'wifi', 'precio_por_noche', 
            'ciudad', 'numero_de_habitaciones','tamano', 'numero_de_banos',
            'numero_de_camas', 'politica_de_cancelacion', 'calefaccion',
            'aire_acondicionado', 'parking', 'mascotas', 'permitido_fumar'
            
        )
        self.features = list(propiedades)

        precios = np.array([f['precio_por_noche'] for f in self.features]).reshape(-1, 1)
        habitaciones = np.array([f['numero_de_habitaciones'] for f in self.features]).reshape(-1, 1)
        
        precios_norm = self.scaler_precio.fit_transform(precios)
        habitaciones_norm = self.scaler_habitaciones.fit_transform(habitaciones)
        
        for i, f in enumerate(self.features):
            f['precio_por_noche'] = precios_norm[i][0]
            f['numero_de_habitaciones'] = habitaciones_norm[i][0]

        raw_vectors = self.vectorizer.fit_transform(self.features)
        feature_names = self.vectorizer.get_feature_names_out()
        self.feature_index = {name: idx for idx, name in enumerate(feature_names)}

        ciudad_columns = [idx for name, idx in self.feature_index.items() if name.startswith('ciudad=')]
        if ciudad_columns:
            raw_vectors[:, ciudad_columns] *= self.location_weight
        
        self.vectors = raw_vectors
        self.similarity_matrix = cosine_similarity(self.vectors)
        joblib_dump(self.vectorizer, 'content_vectorizer.joblib')

    def get_similar(self, property_id, top=5, user_id=None): 
        try:
            idx = next(i for i, f in enumerate(self.features) if f['id'] == property_id)
        except StopIteration:
            return []

        base_vector = deepcopy(self.vectors[idx])
        if user_id:
            user_clicks = self.user_clicks.get(user_id, {})
            for ciudad, count in user_clicks.items():
                col_name = f'ciudad={ciudad}'
                if col_name in self.feature_index:
                    col_idx = self.feature_index[col_name]
                    base_vector[col_idx] *= (1 + count * 0.3)  

        similarities = cosine_similarity([base_vector], self.vectors)[0]
        
        sorted_indices = np.argsort(similarities)[::-1]
        results = []
        for i in sorted_indices:
            if i == idx:
                continue
            results.append((
                self.features[i]['id'],
                similarities[i],
                round(similarities[i] * 100, 2)
            ))
            if len(results) >= top:
                break
        return results

    def record_click(self, user_id, property_id): 
        try:
            propiedad = next(f for f in self.features if f['id'] == property_id)
            ciudad = propiedad['ciudad']
            self.user_clicks[user_id][ciudad] += 1
        except StopIteration:
            pass

    def refresh_data(self):
        self._load_data()

class CollaborativeRecommender:
    def get_user_recommendations(self, user_id):
        
    
        usuario = Usuario.objects.get(pk=user_id)
        reservas_propiedades = list(usuario.reservas.values_list('propiedad', flat=True))
        favoritos_propiedades = list(Favorito.objects.filter(usuario=usuario).values_list('propiedad', flat=True))
        # click_propiedades = list(ClickPropiedad.objects.filter(usuario=usuario).values_list('propiedad', flat=True))
        interacted_propiedades = reservas_propiedades + favoritos_propiedades 
        
        similar_users = Usuario.objects.filter(
            Q(reservas__propiedad__in=interacted_propiedades) |
            Q(favoritos__propiedad__in=interacted_propiedades) | 
            Q(clickpropiedad__propiedad__in=interacted_propiedades)
        ).exclude(usuario=user_id).distinct().annotate(
            similarity=Count('reservas__propiedad', filter=Q(reservas__propiedad__in=interacted_propiedades)) * 1.0 +
                       Count('favoritos__propiedad', filter=Q(favoritos__propiedad__in=interacted_propiedades)) * 0.8 +
                       Count('clickpropiedad__propiedad', filter=Q(clickpropiedad__propiedad__in=interacted_propiedades)) * 0.5
        ).order_by('-similarity')[:5]

        if not similar_users.exists():
            return Propiedad.objects.annotate(
                popularidad_global=Count('reservas') + Count('favoritos')
            ).order_by('-popularidad_global')[:20]
        recommended_properties = Propiedad.objects.filter(
            Q(reservas__usuario__in=similar_users) | 
            Q(favoritos__usuario__in=similar_users) |
            Q(clicks__usuario__in=similar_users)
        ).exclude(id__in=interacted_propiedades).distinct().annotate(
            popularity=Count('reservas', filter=Q(reservas__usuario__in=similar_users)) * 2.0 + Count('favoritos', filter=Q(favoritos__usuario__in=similar_users)) * 1.5 + Count('clicks', filter=Q(clicks__usuario__in=similar_users)) * 0.7
        ).order_by('-popularity')[:20]
        return recommended_properties