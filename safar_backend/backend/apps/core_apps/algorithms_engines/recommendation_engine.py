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
from django.core.cache import cache
from django.conf import settings

logger = logging.getLogger(__name__)

class RecommendationEngine:
    """
    Enhanced recommendation engine using scikit-learn for machine learning capabilities
    with support for anonymous users and fault tolerance
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
    
    # Cache TTLs
    GLOBAL_CACHE_TTL = 3600  # 1 hour for global recommendations
    USER_CACHE_TTL = 1800    # 30 minutes for user-specific recommendations
    
    def __init__(self, user=None):
        """
        Initialize the recommendation engine
        
        Args:
            user (User, optional): The user to generate recommendations for.
                                  If None, anonymous recommendations will be provided.
        """
        self.user = user
        self.profile = user.profile if user and hasattr(user, 'profile') else None
        self.is_authenticated = user is not None
        self.user_item_matrix = None
        self.item_features = None
        self.user_features = None
        self.svd_model = None
        self.kmeans_model = None
        
    def recommend_places(self, limit=5, filters=None, boost_user_preferences=True):
        """
        Recommend places to the user
        
        Args:
            limit (int): Maximum number of recommendations to return
            filters (dict): Additional filters to apply to the query
            boost_user_preferences (bool): Whether to boost based on user preferences
            
        Returns:
            QuerySet: A queryset of recommended places
        """
        try:
            # For anonymous users, try to get from cache first
            if not self.is_authenticated:
                cache_key = self._get_cache_key('places', filters, limit)
                cached_results = cache.get(cache_key)
                if cached_results is not None:
                    return cached_results
            
            filters = filters or {}
            query = Place.objects.filter(
                is_available=True,
                is_deleted=False,
                **filters
            ).select_related('category', 'country', 'city', 'region')
            
            if self.is_authenticated:
                # Apply personalized recommendations for authenticated users
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
                order_fields = []
                if 'ml_score' in query.query.annotations:
                    order_fields.append('-ml_score')
                if 'similarity_score' in query.query.annotations:
                    order_fields.append('-similarity_score')
                if 'personalization_score' in query.query.annotations:
                    order_fields.append('-personalization_score')
                order_fields.extend(['-interaction_boost', '-recent_popularity', '-rating'])                

                results = query.order_by(*order_fields).distinct()[:limit]
            else:
                # For anonymous users, use popularity-based recommendations
                results = self._get_anonymous_recommendations(query, 'place', limit)
                
                # Cache the results for anonymous users
                cache_key = self._get_cache_key('places', filters, limit)
                cache.set(cache_key, results, self.GLOBAL_CACHE_TTL)
            
            return results
            
        except Exception as e:
            logger.error(f"Error recommending places: {str(e)}", exc_info=True)
            return self._fallback_recommendations(Place, filters, limit)
    
    def recommend_experiences(self, limit=5, filters=None):
        try:
            if not self.is_authenticated:
                cache_key = self._get_cache_key('experiences', filters, limit)
                cached_results = cache.get(cache_key)
                if cached_results is not None:
                    return cached_results
            
            filters = filters or {}
            # Remove is_available from filters if it exists to avoid duplicate
            if 'is_available' in filters:
                del filters['is_available']
                
            query = Experience.objects.filter(
                is_available=True,
                is_deleted=False,
                **filters
            ).select_related('category', 'place', 'owner')
            
            if self.is_authenticated:
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
                
                order_fields = []
                if 'ml_score' in query.query.annotations:
                    order_fields.append('-ml_score')
                if 'similarity_score' in query.query.annotations:
                    order_fields.append('-similarity_score')
                if 'personalization_score' in query.query.annotations:
                    order_fields.append('-personalization_score')
                order_fields.extend(['-interaction_boost', '-recent_popularity', '-rating'])                

                results = query.order_by(*order_fields).distinct()[:limit]
            else:
                # For anonymous users, use popularity-based recommendations
                results = self._get_anonymous_recommendations(query, 'experience', limit)
                
                # Cache the results for anonymous users
                cache_key = self._get_cache_key('experiences', filters, limit)
                cache.set(cache_key, results, self.GLOBAL_CACHE_TTL)
            
            return results
            
        except Exception as e:
            logger.error(f"Error recommending experiences: {str(e)}", exc_info=True)
            return self._fallback_recommendations(Experience, filters, limit)
    
    def _get_anonymous_recommendations(self, queryset, item_type, limit):
        """
        Get recommendations for anonymous users based on popularity and trends
        
        Args:
            queryset: Base queryset to filter from
            item_type: Type of item ('place', 'experience', etc.)
            limit: Maximum number of items to return
            
        Returns:
            QuerySet: A queryset of recommended items
        """
        try:
            # Apply temporal popularity boost
            queryset = self._apply_temporal_popularity(queryset)
            
            # Apply trending boost (items with recent interactions)
            recent_cutoff = datetime.now() - timedelta(days=30)
            content_type = ContentType.objects.get_for_model(queryset.model)
            
            trending_items = UserInteraction.objects.filter(
                content_type=content_type,
                created_at__gte=recent_cutoff
            ).values('object_id').annotate(
                interaction_count=Count('id')
            ).order_by('-interaction_count')[:100]
            
            trending_ids = [item['object_id'] for item in trending_items]
            
            # Combine with high-rated items
            high_rated = queryset.filter(rating__gte=4.0).order_by('-rating')[:50]
            high_rated_ids = list(high_rated.values_list('id', flat=True))
            
            # Combine trending and high-rated, prioritizing items that are in both
            combined_ids = list(set(trending_ids + high_rated_ids))
            
            # Create a Case expression for ordering by position in the combined_ids list
            when_clauses = [
                When(id=id, then=Value(len(combined_ids) - i, output_field=FloatField()))
                for i, id in enumerate(combined_ids)
            ]
            
            if when_clauses:
                queryset = queryset.filter(id__in=combined_ids).annotate(
                    position_score=Case(
                        *when_clauses,
                        default=Value(0, FloatField()),
                        output_field=FloatField()
                    )
                )
                
                # Add diversity by including some items from different categories
                categories = queryset.values_list('category', flat=True).distinct()[:5]
                diverse_items = []
                
                for category in categories:
                    category_items = queryset.filter(category=category).order_by('-rating')[:3]
                    diverse_items.extend(list(category_items.values_list('id', flat=True)))
                
                # Ensure diverse items are included
                diverse_queryset = queryset.filter(id__in=diverse_items)
                
                # Combine and order results
                return queryset.order_by(
                    '-position_score', 
                    '-recent_popularity', 
                    '-rating'
                ).distinct()[:limit]
            else:
                # Fallback to simple popularity-based ordering
                return queryset.order_by('-rating', '-created_at')[:limit]
                
        except Exception as e:
            logger.error(f"Error getting anonymous recommendations: {str(e)}", exc_info=True)
            return queryset.order_by('-rating', '-created_at')[:limit]
    
    def _get_cache_key(self, item_type, filters, limit):
        """Generate a cache key for recommendations"""
        filters_str = '_'.join(f"{k}_{v}" for k, v in (filters or {}).items())
        if self.is_authenticated:
            return f"rec_{item_type}_{self.user.id}_{filters_str}_{limit}"
        else:
            return f"rec_anon_{item_type}_{filters_str}_{limit}"
    
    def recommend_for_box(self, destination, duration_days, limit_per_category=3):
        """
        Recommend items for a travel box
        
        Args:
            destination: The destination (City, Region, or Country)
            duration_days: Number of days for the trip
            limit_per_category: Maximum number of items per category
            
        Returns:
            dict: Dictionary of recommended items by category
        """
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
        if not self.is_authenticated:
            return
            
        try:
            # Try to get from cache first
            cache_key = f"feature_matrices_{item_type}_{self.user.id}"
            cached_matrices = cache.get(cache_key)
            
            if cached_matrices is not None:
                self.user_item_matrix = cached_matrices.get('user_item_matrix')
                self.item_features = cached_matrices.get('item_features')
                self.user_features = cached_matrices.get('user_features')
                self.svd_model = cached_matrices.get('svd_model')
                self.user_ids = cached_matrices.get('user_ids')
                self.item_ids = cached_matrices.get('item_ids')
                self.item_id_to_idx = cached_matrices.get('item_id_to_idx')
                self.kmeans_model = cached_matrices.get('kmeans_model')
                self.item_clusters = cached_matrices.get('item_clusters')
                self.item_id_to_cluster = cached_matrices.get('item_id_to_cluster')
                return
            
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
            
            # Cache the matrices
            matrices_to_cache = {
                'user_item_matrix': self.user_item_matrix,
                'item_features': self.item_features,
                'user_features': self.user_features,
                'svd_model': self.svd_model,
                'user_ids': self.user_ids,
                'item_ids': self.item_ids,
                'item_id_to_idx': self.item_id_to_idx,
                'kmeans_model': self.kmeans_model,
                'item_clusters': getattr(self, 'item_clusters', None),
                'item_id_to_cluster': getattr(self, 'item_id_to_cluster', None)
            }
            
            cache.set(cache_key, matrices_to_cache, self.USER_CACHE_TTL)
        
        except Exception as e:
            logger.error(f"Error building feature matrices: {str(e)}", exc_info=True)
            self.user_item_matrix = None
            self.item_features = None
            self.user_features = None
            self.svd_model = None
    
    def _fallback_recommendations(self, model_class, filters, limit):
        """Provide fallback recommendations when ML methods fail"""
        try:
            # First try to get from cache
            cache_key = f"fallback_{model_class.__name__}_{hash(str(filters))}_{limit}"
            cached_results = cache.get(cache_key)
            
            if cached_results is not None:
                return cached_results
            
            queryset = model_class.objects.filter(
                is_available=True,
                is_deleted=False,
                **filters
            )
            
            # Try to use user preferences if available and user is authenticated
            if self.is_authenticated and self.profile and self.profile.preferred_countries.exists():
                pref_country_query = queryset.filter(
                    country__in=self.profile.preferred_countries.all()
                ).order_by('-rating', '-created_at')[:limit]
                
                if pref_country_query.count() >= limit:
                    return pref_country_query
            
            # If we have item clusters, try to recommend from clusters the user has interacted with
            if self.is_authenticated and hasattr(self, 'item_id_to_cluster') and hasattr(self, 'kmeans_model'):
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
                results = popular_query
            else:
                # Last resort: newest items
                results = queryset.order_by('-created_at')[:limit]
            
            # Cache the results
            cache.set(cache_key, results, self.GLOBAL_CACHE_TTL)
            return results
            
        except Exception as e:
            logger.error(f"Fallback recommendation failed: {str(e)}")
            try:
                # Ultimate fallback - just get any items
                return model_class.objects.filter(is_deleted=False)[:limit]
            except:
                return model_class.objects.none()
    
    # The rest of the methods remain largely the same, but with added checks for self.is_authenticated
    # and appropriate error handling for fault tolerance
    
    def _apply_matrix_factorization(self, queryset, item_type):
        """Apply matrix factorization recommendations using SVD"""
        if not self.is_authenticated:
            return queryset.annotate(ml_score=Value(0, FloatField()))
            
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
        if not self.is_authenticated:
            return queryset
            
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
        if not self.is_authenticated:
            return queryset.annotate(similarity_score=Value(0, FloatField()))
            
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
        
        if self.is_authenticated and self.profile and self.profile.preferred_countries.exists():
            queryset = queryset.annotate(
                country_score=Case(
                    When(country__in=self.profile.preferred_countries.all(), then=0.3),
                    default=0.0,
                    output_field=models.FloatField()
                )
            )
        
        if self.is_authenticated and self.profile and self.profile.travel_interests:
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
        if not self.is_authenticated:
            return queryset.annotate(interaction_boost=Value(0, FloatField()))
            
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

    def _find_similar_users_behavior_based(self):
        """Find users with similar interaction patterns"""
        if not self.is_authenticated:
            return User.objects.none()
        
        try:
            # Get items this user has interacted with
            user_interactions = UserInteraction.objects.filter(
                user=self.user
            ).values_list('content_type', 'object_id', 'interaction_type')
            
            if not user_interactions:
                return User.objects.none()
                
            # Find other users who interacted with the same items
            similar_users = UserInteraction.objects.filter(
                content_type__in=[x[0] for x in user_interactions],
                object_id__in=[x[1] for x in user_interactions],
                interaction_type__in=[x[2] for x in user_interactions]
            ).exclude(user=self.user).values_list('user', flat=True).distinct()
            
            return User.objects.filter(id__in=similar_users)[:100]  # Limit to 100
            
        except Exception as e:
            logger.error(f"Error finding behavior-based similar users: {str(e)}", exc_info=True)
            return User.objects.none()
            
    def _find_similar_users_content_based(self):
        """Find users with similar content preferences"""
        if not self.is_authenticated or not self.profile:
            return User.objects.none()
        
        try:
            # Find users with similar preferred countries
            similar_users = User.objects.filter(
                profile__preferred_countries__in=self.profile.preferred_countries.all()
            ).exclude(id=self.user.id).distinct()
            
            # Find users with similar travel interests
            if self.profile.travel_interests:
                similar_interests = User.objects.filter(
                    profile__travel_interests__overlap=self.profile.travel_interests
                ).exclude(id=self.user.id).distinct()
                similar_users = (similar_users | similar_interests).distinct()
                
            return similar_users[:100]  # Limit to 100 most similar
            
        except Exception as e:
            logger.error(f"Error finding content-based similar users: {str(e)}", exc_info=True)
            return User.objects.none()

    def _find_similar_users(self):
        """Find users similar to the current user using multiple methods"""
        if not self.is_authenticated:
            return User.objects.none()
            
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