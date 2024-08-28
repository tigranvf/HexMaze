from django.urls import path
from . import views

urlpatterns = [
    path('', views.main, name="maze"),
    path('3d', views.rayMaze),
    path('test', views.test),
]

