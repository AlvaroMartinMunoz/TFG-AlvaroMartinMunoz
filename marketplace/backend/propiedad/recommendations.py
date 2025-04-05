import os
import numpy as np
import joblib
from sklearn.feature_extraction import DictVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from propiedad.models.propiedad import Propiedad
from usuario.models.usuario import Usuario
from django.db.models import Count, Q
from propiedad.models.favorito import Favorito

class ContentRecommender:
    def __init__(self):
        self.location_weight = 5  # Peso para la ubicación
        if os.path.exists('content_vectorizer.joblib'):
            self.vectorizer = joblib.load('content_vectorizer.joblib')
        else:
            self.vectorizer = DictVectorizer(sparse=False)
        self._load_data()
    
    def _load_data(self):
        propiedades = Propiedad.objects.all().values(
            'id', 'tipo_de_propiedad', 'wifi', 'precio_por_noche', 
            'ciudad', 'numero_de_habitaciones'
        )
        self.features = list(propiedades)
        self.vectors = self.vectorizer.fit_transform(self.features)
        
        # Aplicar peso extra a la ubicación
        if hasattr(self.vectorizer, 'get_feature_names_out'):
            feature_names = self.vectorizer.get_feature_names_out()
        else:  # Para versiones antiguas de scikit-learn
            feature_names = self.vectorizer.feature_names_
        
        ciudad_columns = [i for i, name in enumerate(feature_names) if name.startswith('ciudad=')]
        if ciudad_columns:
            self.vectors[:, ciudad_columns] *= self.location_weight
        
        self.similarity_matrix = cosine_similarity(self.vectors)
        joblib.dump(self.vectorizer, 'content_vectorizer.joblib')
    
    def get_similar(self, property_id, top=5):
        idx = next((i for i, f in enumerate(self.features) if f['id'] == property_id), None)
        if idx is None:
            return []
        sim_scores = self.similarity_matrix[idx]
        similar_indices = np.argsort(sim_scores)[::-1]
        similar_indices = [i for i in similar_indices if i != idx][:top]
        return [
            (self.features[i]['id'], sim_scores[i], round(sim_scores[i] * 100, 2))
            for i in similar_indices
        ]

class CollaborativeRecommender:
    def get_user_recommendations(self, user_id):
        usuario = Usuario.objects.get(usuario=user_id)
        reservas_propiedades = list(usuario.reservas.values_list('propiedad', flat=True))
        favoritos_propiedades = list(Favorito.objects.filter(usuario=usuario).values_list('propiedad', flat=True))
        interacted_propiedades = reservas_propiedades + favoritos_propiedades
        
        similar_users = Usuario.objects.filter(
            Q(reservas__propiedad__in=interacted_propiedades) |
            Q(favoritos__propiedad__in=interacted_propiedades)
        ).exclude(usuario=user_id).annotate(
            similarity=Count('reservas__propiedad', filter=Q(reservas__propiedad__in=interacted_propiedades)) +
                       Count('favoritos__propiedad', filter=Q(favoritos__propiedad__in=interacted_propiedades))
        ).order_by('-similarity')[:5]

        recommended_properties = Propiedad.objects.filter(
            Q(reservas__usuario__in=similar_users) | 
            Q(favoritos__usuario__in=similar_users)
        ).distinct().annotate(
            popularity=Count('reservas') + Count('favoritos')
        ).order_by('-popularity')[:20]
        return recommended_properties