import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans

import logging
from django.db import models
from django.db.models import Q, Case, When, F, Value, FloatField, Count, Avg
from django.db.models.functions import Coalesce
from django.contrib.contenttypes.models import ContentType
from apps.authentication.models import User, UserInteraction
from apps.safar.models import Place, Experience, Flight
from apps.geographic_data.models import City, Region, Country
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class RecommendationEngine:
    """
    Enhanced recommendation engine using scikit-learn for machine learning capabilities
    """
    
    INTERACTION_WEIGHTS = {
        'booking_complete': 1.0,
        'booking_start': 0.7,
        'wishlist_add': 0.6,
        'rating_given': 0.8,
        'review_added': 0.5,
        'view_place': 0.3,
        'view_experience': 0.3,
        'recommendation_click': 0.4
    }
    
    TEMPORAL_DECAY_RATE = 0.1  # 10% reduction per month
    
    def __init__(self, user):
        if not isinstance(user, User):
            raise ValueError("Must provide a valid User instance")
        self.user = user
        self.profile = user.profile
        self.user_item_matrix = None
        self.item_features = None
        self.user_features = None
        self.svd_model = None
        self.kmeans_model = None
        
    def recommend_places(self, limit=5, filters=None, boost_user_preferences=True):
        try:
            filters = filters or {}
            query = Place.objects.filter(
                is_available=True,
                is_deleted=False,
                **filters
            ).select_related('category', 'country', 'city', 'region')
            
            # Build feature matrices if not already built
            self._build_feature_matrices('place')
            
            # Apply ML-based recommendations
            if self.user_item_matrix is not None and self.svd_model is not None:
                query = self._apply_matrix_factorization(query, 'place')
            
            if boost_user_preferences:
                query = self._apply_preference_boosting(query)
            
            # Apply content-based filtering if we have item features
            if self.item_features is not None:
                query = self._apply_content_based_filtering(query, 'place')
            
            # Apply collaborative filtering
            query = self._apply_collaborative_filtering(query, 'place')
            
            # Apply temporal popularity and user interaction boosts
            query = self._apply_temporal_popularity(query)
            query = self._boost_user_interactions(query, 'place')
            
            return query.order_by(
                '-ml_score',
                '-similarity_score',
                '-personalization_score', 
                '-interaction_boost',
                '-recent_popularity',
                '-rating'
            ).distinct()[:limit]
            
        except Exception as e:
            logger.error(f"Error recommending places: {str(e)}", exc_info=True)
            return self._fallback_recommendations(Place, filters, limit)
    
    def recommend_experiences(self, limit=5, filters=None):
        try:
            filters = filters or {}
            query = Experience.objects.filter(
                is_available=True,
                is_deleted=False,
                **filters
            ).select_related('category', 'place', 'owner')
            
            # Build feature matrices if not already built
            self._build_feature_matrices('experience')
            
            # Apply ML-based recommendations
            if self.user_item_matrix is not None and self.svd_model is not None:
                query = self._apply_matrix_factorization(query, 'experience')
            
            query = self._apply_preference_boosting(query)
            
            # Apply content-based filtering if we have item features
            if self.item_features is not None:
                query = self._apply_content_based_filtering(query, 'experience')
            
            # Apply collaborative filtering
            query = self._apply_collaborative_filtering(query, 'experience')
            
            # Apply temporal popularity and user interaction boosts
            query = self._apply_temporal_popularity(query)
            query = self._boost_user_interactions(query, 'experience')
            
            return query.order_by(
                '-ml_score',
                '-similarity_score',
                '-personalization_score',
                '-interaction_boost',
                '-recent_popularity',
                '-rating'
            ).distinct()[:limit]
            
        except Exception as e:
            logger.error(f"Error recommending experiences: {str(e)}", exc_info=True)
            return self._fallback_recommendations(Experience, filters, limit)
    
    def recommend_flights(self, origin, destination, date_range, limit=5):
        try:
            start_date, end_date = date_range
            query = Flight.objects.filter(
                departure_airport=origin,
                arrival_airport=destination,
                departure_time__gte=start_date,
                departure_time__lte=end_date,
                is_deleted=False
            )
            
            # Apply user preference boosting for airlines
            if self.profile.travel_history and isinstance(self.profile.travel_history, list):
                preferred_airlines = list(set(
                    flight.get('airline') for flight in self.profile.travel_history
                    if flight.get('airline')
                ))
                
                if preferred_airlines:
                    # Use sklearn to calculate airline preference scores
                    airline_counts = {}
                    for flight in self.profile.travel_history:
                        airline = flight.get('airline')
                        if airline:
                            airline_counts[airline] = airline_counts.get(airline, 0) + 1
                    
                    total_flights = sum(airline_counts.values())
                    airline_scores = {
                        airline: count / total_flights
                        for airline, count in airline_counts.items()
                    }
                    
                    # Apply airline preference scores
                    query = query.annotate(
                        airline_score=Case(
                            *[When(airline=airline, then=Value(score, FloatField())) 
                              for airline, score in airline_scores.items()],
                            default=Value(0.0, FloatField()),
                            output_field=FloatField()
                        )
                    )
                    
                    # Calculate price score (lower is better)
                    query = query.annotate(
                        price_score=Case(
                            When(price__lte=500, then=0.8),
                            When(price__lte=1000, then=0.6),
                            When(price__lte=1500, then=0.4),
                            When(price__lte=2000, then=0.2),
                            default=0.1,
                            output_field=FloatField()
                        )
                    )
                    
                    # Combine scores with weights
                    query = query.annotate(
                        combined_score=F('airline_score') * 0.6 + F('price_score') * 0.4
                    ).order_by('-combined_score', 'price')
                else:
                    query = query.order_by('price')
            else:
                query = query.order_by('price')
            
            return query[:limit]
            
        except Exception as e:
            logger.error(f"Error recommending flights: {str(e)}", exc_info=True)
            return Flight.objects.none()
    
    def recommend_for_box(self, destination, duration_days, limit_per_category=3):
        try:
            destination_filters = self._create_destination_filters(destination)
            
            places = self.recommend_places(
                limit=limit_per_category * 3,
                filters=destination_filters
            )
            
            experiences = self.recommend_experiences(
                limit=limit_per_category * 2,
                filters=destination_filters
            )
            
            return {
                'places': places,
                'experiences': experiences
            }
            
        except Exception as e:
            logger.error(f"Error recommending for box: {str(e)}", exc_info=True)
            return {'places': Place.objects.none(), 'experiences': Experience.objects.none()}
    
    def _build_feature_matrices(self, item_type):
        """Build user-item interaction matrix and feature matrices for ML algorithms"""
        try:
            # Get content type for the item type
            if item_type == 'place':
                content_type = ContentType.objects.get_for_model(Place)
            elif item_type == 'experience':
                content_type = ContentType.objects.get_for_model(Experience)
            else:
                return
            
            # Get all interactions for this item type
            interactions = UserInteraction.objects.filter(
                content_type=content_type,
                interaction_type__in=self.INTERACTION_WEIGHTS.keys()
            ).values('user_id', 'object_id', 'interaction_type', 'created_at')
            
            if not interactions:
                return
            
            # Convert to DataFrame
            df = pd.DataFrame(list(interactions))
            
            # Apply weights to interactions
            df['weight'] = df['interaction_type'].map(self.INTERACTION_WEIGHTS)
            
            # Apply temporal decay
            now = datetime.now()
            df['days_old'] = df['created_at'].apply(lambda x: (now - x).days)
            df['time_decay'] = df['days_old'].apply(
                lambda days: max(0.1, 1 - (days / 365) * self.TEMPORAL_DECAY_RATE)
            )
            df['final_weight'] = df['weight'] * df['time_decay']
            
            # Create user-item matrix
            user_item_df = df.pivot_table(
                index='user_id', 
                columns='object_id', 
                values='final_weight', 
                aggfunc='sum',
                fill_value=0
            )
            
            self.user_item_matrix = user_item_df.values
            self.user_ids = user_item_df.index.tolist()
            self.item_ids = user_item_df.columns.tolist()
            
            # Train SVD model for matrix factorization
            self.svd_model = TruncatedSVD(n_components=min(50, min(self.user_item_matrix.shape) - 1))
            self.user_factors = self.svd_model.fit_transform(self.user_item_matrix)
            self.item_factors = self.svd_model.components_.T
            
            # Build item features
            if item_type == 'place':
                items = Place.objects.filter(id__in=self.item_ids).values(
                    'id', 'name', 'category__name', 'country__name', 'city__name', 
                    'region__name', 'rating', 'metadata'
                )
            else:
                items = Experience.objects.filter(id__in=self.item_ids).values(
                    'id', 'name', 'category__name', 'place__name', 'rating', 'metadata'
                )
            
            if not items:
                return
            
            # Convert to DataFrame
            items_df = pd.DataFrame(list(items))
            
            # Extract features
            feature_columns = []
            
            # Process categorical features
            categorical_features = ['category__name', 'country__name', 'city__name', 'region__name']
            for feature in categorical_features:
                if feature in items_df.columns:
                    # One-hot encode
                    dummies = pd.get_dummies(items_df[feature], prefix=feature.split('__')[0])
                    items_df = pd.concat([items_df, dummies], axis=1)
                    feature_columns.extend(dummies.columns)
            
            # Process numerical features
            if 'rating' in items_df.columns:
                items_df['rating_scaled'] = items_df['rating'] / 5.0  # Normalize to 0-1
                feature_columns.append('rating_scaled')
            
            # Process metadata (tags)
            if 'metadata' in items_df.columns:
                # Extract tags from metadata
                items_df['tags'] = items_df['metadata'].apply(
                    lambda x: ' '.join(x.get('tags', [])) if isinstance(x, dict) else ''
                )
                
                # Use TF-IDF for tags
                tfidf = TfidfVectorizer(max_features=50)
                if items_df['tags'].str.strip().any():  # Check if there are any non-empty tags
                    tag_features = tfidf.fit_transform(items_df['tags'].fillna(''))
                    tag_feature_df = pd.DataFrame(
                        tag_features.toarray(),
                        columns=[f'tag_{i}' for i in range(tag_features.shape[1])],
                        index=items_df.index
                    )
                    items_df = pd.concat([items_df, tag_feature_df], axis=1)
                    feature_columns.extend(tag_feature_df.columns)
            
            # Create final feature matrix
            if feature_columns:
                self.item_features = items_df[feature_columns].values
                self.item_id_to_idx = {item_id: idx for idx, item_id in enumerate(items_df['id'])}
                
                # Cluster items
                if self.item_features.shape[0] > 10:  # Only cluster if we have enough items
                    n_clusters = min(10, self.item_features.shape[0] // 2)
                    self.kmeans_model = KMeans(n_clusters=n_clusters, random_state=42)
                    self.item_clusters = self.kmeans_model.fit_predict(self.item_features)
                    
                    # Create mapping from item_id to cluster
                    self.item_id_to_cluster = {
                        item_id: self.item_clusters[i] 
                        for i, item_id in enumerate(items_df['id'])
                    }
            
            # Build user features
            users = User.objects.filter(id__in=self.user_ids).values(
                'id', 'profile__preferred_countries', 'profile__travel_interests',
                'profile__gender', 'membership_level'
            )
            
            if users:
                users_df = pd.DataFrame(list(users))
                # Process user features here if needed
                self.user_features = None  # Placeholder for future implementation
        
        except Exception as e:
            logger.error(f"Error building feature matrices: {str(e)}", exc_info=True)
            self.user_item_matrix = None
            self.item_features = None
            self.user_features = None
            self.svd_model = None
    
    def _apply_matrix_factorization(self, queryset, item_type):
        """Apply matrix factorization recommendations using SVD"""
        try:
            if self.user_item_matrix is None or self.svd_model is None:
                return queryset.annotate(ml_score=Value(0, FloatField()))
            
            # Get user index
            try:
                user_idx = self.user_ids.index(self.user.id)
            except ValueError:
                # User not in the matrix, use average user vector
                user_idx = None
                user_vector = np.mean(self.user_factors, axis=0)
            
            if user_idx is not None:
                user_vector = self.user_factors[user_idx]
            
            # Calculate predicted ratings for all items
            predicted_ratings = np.dot(user_vector, self.svd_model.components_)
            
            # Map item IDs to their predicted ratings
            item_ratings = {
                self.item_ids[i]: float(predicted_ratings[i])
                for i in range(len(self.item_ids))
            }
            
            # Normalize ratings to 0-1 scale
            if item_ratings:
                min_rating = min(item_ratings.values())
                max_rating = max(item_ratings.values())
                rating_range = max_rating - min_rating
                
                if rating_range > 0:
                    normalized_ratings = {
                        item_id: (rating - min_rating) / rating_range
                        for item_id, rating in item_ratings.items()
                    }
                else:
                    normalized_ratings = {
                        item_id: 0.5 for item_id in item_ratings
                    }
                
                # Apply ratings to queryset
                return queryset.annotate(
                    ml_score=Case(
                        *[
                            When(id=item_id, then=Value(score, FloatField()))
                            for item_id, score in normalized_ratings.items()
                        ],
                        default=Value(0, FloatField()),
                        output_field=FloatField()
                    )
                )
            
            return queryset.annotate(ml_score=Value(0, FloatField()))
        
        except Exception as e:
            logger.error(f"Error applying matrix factorization: {str(e)}", exc_info=True)
            return queryset.annotate(ml_score=Value(0, FloatField()))
    
    def _apply_content_based_filtering(self, queryset, item_type):
        """Apply content-based filtering using item features"""
        try:
            if self.item_features is None or not hasattr(self, 'item_id_to_idx'):
                return queryset
            
            # Get user's past interactions
            user_interactions = UserInteraction.objects.filter(
                user=self.user,
                interaction_type__in=self.INTERACTION_WEIGHTS.keys()
            )
            
            if item_type == 'place':
                user_interactions = user_interactions.filter(content_type__model='place')
            elif item_type == 'experience':
                user_interactions = user_interactions.filter(content_type__model='experience')
            
            if not user_interactions:
                return queryset
            
            # Get item IDs the user has interacted with
            interacted_item_ids = user_interactions.values_list('object_id', flat=True)
            
            # Get indices of items the user has interacted with
            interacted_indices = [
                self.item_id_to_idx[item_id] 
                for item_id in interacted_item_ids 
                if item_id in self.item_id_to_idx
            ]
            
            if not interacted_indices:
                return queryset
            
            # Get features of items the user has interacted with
            interacted_features = self.item_features[interacted_indices]
            
            # Calculate user profile as the average of interacted item features
            user_profile = np.mean(interacted_features, axis=0)
            
            # Calculate similarity between user profile and all items
            similarities = cosine_similarity([user_profile], self.item_features)[0]
            
            # Map item IDs to their similarity scores
            item_similarities = {
                item_id: float(similarities[self.item_id_to_idx[item_id]])
                for item_id in self.item_id_to_idx
                if item_id in queryset.values_list('id', flat=True)
            }
            
            # Apply similarity scores to queryset
            return queryset.annotate(
                content_similarity=Case(
                    *[
                        When(id=item_id, then=Value(score, FloatField()))
                        for item_id, score in item_similarities.items()
                    ],
                    default=Value(0, FloatField()),
                    output_field=FloatField()
                )
            )
        
        except Exception as e:
            logger.error(f"Error applying content-based filtering: {str(e)}", exc_info=True)
            return queryset
    
    def _apply_collaborative_filtering(self, queryset, item_type):
        """Apply collaborative filtering using user-item interactions"""
        try:
            similar_users = self._find_similar_users()
            
            if not similar_users:
                return queryset.annotate(similarity_score=Value(0, FloatField()))
            
            interactions = UserInteraction.objects.filter(
                user__in=similar_users,
                interaction_type__in=self.INTERACTION_WEIGHTS.keys()
            )
            
            if item_type == 'place':
                interactions = interactions.filter(content_type__model='place')
            elif item_type == 'experience':
                interactions = interactions.filter(content_type__model='experience')
            
            time_decay = Case(
                *[
                    When(
                        created_at__gte=datetime.now() - timedelta(days=30*i),
                        then=1 - (self.TEMPORAL_DECAY_RATE * i)
                    ) for i in range(0, 12)
                ],
                default=0.1,
                output_field=FloatField()
            )
            
            weighted_interactions = interactions.annotate(
                interaction_weight=Case(
                    *[
                        When(interaction_type=k, then=v) 
                        for k, v in self.INTERACTION_WEIGHTS.items()
                    ],
                    default=0.1,
                    output_field=FloatField()
                ),
                time_decay=time_decay,
                total_weight=F('interaction_weight') * F('time_decay')
            )
            
            item_scores = weighted_interactions.values('object_id').annotate(
                similarity_score=Coalesce(
                    Avg('total_weight'),
                    Value(0, FloatField())
                )
            )
            
            if not item_scores:
                return queryset.annotate(similarity_score=Value(0, FloatField()))
            
            score_mapping = {
                score['object_id']: score['similarity_score']
                for score in item_scores
            }
            
            return queryset.annotate(
                similarity_score=Case(
                    *[
                        When(id=item_id, then=score)
                        for item_id, score in score_mapping.items()
                    ],
                    default=Value(0, FloatField()),
                    output_field=FloatField()
                )
            )
        
        except Exception as e:
            logger.error(f"Error applying collaborative filtering: {str(e)}", exc_info=True)
            return queryset.annotate(similarity_score=Value(0, FloatField()))
    
    def _find_similar_users(self):
        """Find users similar to the current user using multiple methods"""
        try:
            # Use matrix factorization if available
            if hasattr(self, 'user_factors') and self.user.id in self.user_ids:
                user_idx = self.user_ids.index(self.user.id)
                user_vector = self.user_factors[user_idx]
                
                # Calculate similarity between this user and all other users
                user_similarities = cosine_similarity([user_vector], self.user_factors)[0]
                
                # Get top similar users (excluding self)
                similar_indices = np.argsort(user_similarities)[::-1][1:101]  # Top 100 similar users
                similar_user_ids = [self.user_ids[idx] for idx in similar_indices]
                
                return User.objects.filter(id__in=similar_user_ids)
            
            # Fall back to traditional methods
            similar_users_content = self._find_similar_users_content_based()
            similar_users_behavior = self._find_similar_users_behavior_based()
            
            return (similar_users_content | similar_users_behavior).distinct()
        
        except Exception as e:
            logger.error(f"Error finding similar users: {str(e)}", exc_info=True)
            return User.objects.none()
    
    def _find_similar_users_content_based(self):
        """Find users with similar preferences"""
        similar_users = User.objects.exclude(id=self.user.id)
        
        if self.profile.preferred_countries.exists():
            country_overlap = Count(
                'profile__preferred_countries',
                filter=Q(profile__preferred_countries__in=self.profile.preferred_countries.all())
            )
            similar_users = similar_users.annotate(
                country_similarity=country_overlap
            ).filter(country_similarity__gt=0)
        
        if self.profile.travel_interests:
            interest_overlap = Count(
                'profile__travel_interests',
                filter=Q(profile__travel_interests__overlap=self.profile.travel_interests)
            )
            similar_users = similar_users.annotate(
                interest_similarity=interest_overlap
            ).filter(interest_similarity__gt=0)
        
        return similar_users.order_by('-country_similarity', '-interest_similarity')[:100]
    
    def _find_similar_users_behavior_based(self):
        """Find users with similar behavior patterns"""
        user_interactions = self.user.interactions.filter(
            interaction_type__in=self.INTERACTION_WEIGHTS.keys()
        ).values_list('content_type', 'object_id', 'interaction_type')
        
        if not user_interactions:
            return User.objects.none()
        
        similar_users = UserInteraction.objects.filter(
            content_type__in=[x[0] for x in user_interactions],
            object_id__in=[x[1] for x in user_interactions],
            interaction_type__in=[x[2] for x in user_interactions]
        ).exclude(user=self.user).values('user').annotate(
            similarity=Count('id')
        ).order_by('-similarity').values_list('user', flat=True)[:100]
        
        return User.objects.filter(id__in=similar_users)
    
    def _apply_preference_boosting(self, queryset):
        """Apply boosting based on user preferences"""
        queryset = queryset.annotate(
            base_score=Case(
                When(rating__gte=4.5, then=0.3),
                When(rating__gte=4.0, then=0.2),
                When(rating__gte=3.0, then=0.1),
                default=0.0,
                output_field=models.FloatField()
            )
        )
        
        if self.profile.preferred_countries.exists():
            queryset = queryset.annotate(
                country_score=Case(
                    When(country__in=self.profile.preferred_countries.all(), then=0.3),
                    default=0.0,
                    output_field=models.FloatField()
                )
            )
        
        if self.profile.travel_interests:
            category_boost = Case(
                When(category__name__in=self.profile.travel_interests, then=0.2),
                default=0.0,
                output_field=models.FloatField()
            )
            
            tag_boost = Case(
                When(metadata__tags__overlap=self.profile.travel_interests, then=0.15),
                default=0.0,
                output_field=models.FloatField()
            )
            
            queryset = queryset.annotate(
                interest_score=category_boost + tag_boost
            )
        
        score_components = ['base_score']
        if 'country_score' in queryset.query.annotations:
            score_components.append('country_score')
        if 'interest_score' in queryset.query.annotations:
            score_components.append('interest_score')
        
        queryset = queryset.annotate(
            personalization_score=models.ExpressionWrapper(
                models.F('+'.join(score_components)),
                output_field=models.FloatField()
            )
        )
        
        return queryset
    
    def _apply_temporal_popularity(self, queryset):
        """Apply boosting based on recent popularity"""
        recent_interactions = UserInteraction.objects.filter(
            created_at__gte=datetime.now() - timedelta(days=90)
        )
        
        popularity = recent_interactions.values(
            'content_type', 'object_id'
        ).annotate(
            popularity_score=Count('id') * Case(
                When(created_at__gte=datetime.now() - timedelta(days=7), then=1.0),
                When(created_at__gte=datetime.now() - timedelta(days=30), then=0.7),
                default=0.3,
                output_field=FloatField()
            )
        )
        
        if not popularity:
            return queryset.annotate(recent_popularity=Value(0, FloatField()))
        
        model = queryset.model
        content_type = ContentType.objects.get_for_model(model)
        
        popularity_scores = {
            x['object_id']: x['popularity_score']
            for x in popularity
            if x['content_type'] == content_type.id
        }
        
        return queryset.annotate(
            recent_popularity=Case(
                *[
                    When(id=item_id, then=score)
                    for item_id, score in popularity_scores.items()
                ],
                default=Value(0, FloatField()),
                output_field=FloatField()
            )
        )
    
    def _boost_user_interactions(self, queryset, item_type):
        """Boost items the user has interacted with"""
        interactions = self.user.interactions.filter(
            content_type__model=item_type,
            interaction_type__in=self.INTERACTION_WEIGHTS.keys()
        ).annotate(
            weight=Case(
                *[
                    When(interaction_type=k, then=v)
                    for k, v in self.INTERACTION_WEIGHTS.items()
                ],
                default=0.1,
                output_field=FloatField()
            )
        )
        
        if not interactions:
            return queryset.annotate(interaction_boost=Value(0, FloatField()))
        
        boost_mapping = {
            i.object_id: i.weight * (
                1 - (datetime.now() - i.created_at).days/365 * self.TEMPORAL_DECAY_RATE
            )
            for i in interactions
        }
        
        return queryset.annotate(
            interaction_boost=Case(
                *[
                    When(id=item_id, then=score)
                    for item_id, score in boost_mapping.items()
                ],
                default=Value(0, FloatField()),
                output_field=FloatField()
            )
        )
    
    def _fallback_recommendations(self, model_class, filters, limit):
        """Provide fallback recommendations when ML methods fail"""
        try:
            queryset = model_class.objects.filter(
                is_available=True,
                is_deleted=False,
                **filters
            )
            
            # Try to use user preferences if available
            if self.profile.preferred_countries.exists():
                pref_country_query = queryset.filter(
                    country__in=self.profile.preferred_countries.all()
                ).order_by('-rating', '-created_at')[:limit]
                
                if pref_country_query.count() >= limit:
                    return pref_country_query
            
            # If we have item clusters, try to recommend from clusters the user has interacted with
            if hasattr(self, 'item_id_to_cluster') and hasattr(self, 'kmeans_model'):
                user_interactions = self.user.interactions.filter(
                    content_type__model=model_class.__name__.lower()
                ).values_list('object_id', flat=True)
                
                # Get clusters of items the user has interacted with
                user_clusters = [
                    self.item_id_to_cluster.get(item_id)
                    for item_id in user_interactions
                    if item_id in self.item_id_to_cluster
                ]
                
                if user_clusters:
                    # Count frequency of each cluster
                    cluster_counts = {}
                    for cluster in user_clusters:
                        if cluster is not None:
                            cluster_counts[cluster] = cluster_counts.get(cluster, 0) + 1
                    
                    # Get most frequent clusters
                    preferred_clusters = sorted(
                        cluster_counts.keys(),
                        key=lambda c: cluster_counts[c],
                        reverse=True
                    )[:3]
                    
                    # Get items from preferred clusters
                    preferred_items = [
                        item_id for item_id, cluster in self.item_id_to_cluster.items()
                        if cluster in preferred_clusters
                    ]
                    
                    if preferred_items:
                        cluster_query = queryset.filter(id__in=preferred_items).order_by('-rating')[:limit]
                        if cluster_query.count() > 0:
                            return cluster_query
            
            # Fall back to popular items
            popular_query = queryset.order_by('-rating', '-created_at')[:limit]
            if popular_query.exists():
                return popular_query
            
            # Last resort: newest items
            return queryset.order_by('-created_at')[:limit]
            
        except Exception as e:
            logger.error(f"Fallback recommendation failed: {str(e)}")
            return model_class.objects.none()
    
    def _create_destination_filters(self, destination):
        """Create filters based on destination type"""
        if isinstance(destination, City):
            return {'city': destination}
        elif isinstance(destination, Region):
            return {'region': destination}
        elif isinstance(destination, Country):
            return {'country': destination}
        else:
            raise ValueError("Invalid destination type")
    
    def calculate_personalization_score(self, item):
        """Calculate personalization score for a single item"""
        score = 0.0
        
        if hasattr(item, 'country') and item.country and self.profile.preferred_countries.exists():
            if item.country in self.profile.preferred_countries.all():
                score += 0.3
        
        if hasattr(item, 'category') and self.profile.travel_interests:
            if item.category.name in self.profile.travel_interests:
                score += 0.2
            elif any(tag in self.profile.travel_interests for tag in item.metadata.get('tags', [])):
                score += 0.15
        
        if hasattr(item, 'rating'):
            score += item.rating * 0.1
        
        if hasattr(item, 'price') and item.price and self.profile.metadata.get('price_preference'):
            user_pref = self.profile.metadata['price_preference']
            price_score = max(0, 1 - (item.price / user_pref['max']))
            score += price_score * 0.1
        
        return min(max(score, 0.0), 1.0)