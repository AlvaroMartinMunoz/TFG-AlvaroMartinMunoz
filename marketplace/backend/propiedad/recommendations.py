
from sklearn.feature_extraction import DictVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from propiedad.models.propiedad import Propiedad
from usuario.models.usuario import Usuario
from django.db.models import Count, Q
import numpy as np
import joblib
from django.contrib.auth.models import User
from propiedad.models.favorito import Favorito

class ContentRecommender:
    def __init__(self):
        self.vectorizer = DictVectorizer(sparse=False)
        self._load_data()
    
    def _load_data(self):
        propiedades = Propiedad.objects.all().values(
            'id', 'tipo_de_propiedad', 'wifi', 'precio_por_noche', 
            'ciudad', 'numero_de_habitaciones'
        )
        self.features = list(propiedades)
        self.vectors = self.vectorizer.fit_transform(self.features)
        joblib.dump(self.vectorizer, 'content_vectorizer.joblib')
    
    def get_similar(self, property_id, top=5):
        idx = next(i for i, f in enumerate(self.features) if f['id'] == property_id)
        sim_scores = cosine_similarity([self.vectors[idx]], self.vectors)[0]
        return [self.features[i]['id'] for i in np.argsort(sim_scores)[-top-1:-1]]

class CollaborativeRecommender:
    def get_user_recommendations(self, user_id):
        print("user_id", user_id)
        
        # Obtener el usuario con el user_id (relación OneToOne entre User y Usuario)
        usuario = Usuario.objects.get(usuario=user_id)
        
        # Obtener las propiedades que el usuario tiene en reservas
        reservas_propiedades = usuario.reservas.values('propiedad')
        
        # Obtener las propiedades favoritas del usuario a través del modelo Favorito
        favoritos_propiedades = Favorito.objects.filter(usuario=usuario).values('propiedad')
        
        # Obtener usuarios similares basados en reservas o propiedades favoritas
        similar_users = Usuario.objects.filter(
            Q(reservas__propiedad__in=reservas_propiedades) | 
            Q(favoritos__propiedad__in=favoritos_propiedades)
        ).annotate(
            similarity=Count('reservas__propiedad') + Count('favoritos__propiedad')
        ).order_by('-similarity')[:5]

        # Obtener las propiedades de los usuarios similares, ordenadas por popularidad
        return Propiedad.objects.filter(
            Q(reservas__usuario__in=similar_users) | 
            Q(favoritos__usuario__in=similar_users)
        ).distinct().annotate(
            popularity=Count('reservas') + Count('favoritos')
        ).order_by('-popularity')[:20]
