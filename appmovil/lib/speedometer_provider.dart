import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

class SpeedometerProvider extends ChangeNotifier {
  Position? _currentPosition;
  double _currentSpeed = 0.0;
  double _maxSpeed = 0.0;
  double _totalDistance = 0.0;
  double _accuracy = 0.0;
  double _altitude = 0.0;
  bool _isTracking = false;
  StreamSubscription<Position>? _positionStream;

  double get currentSpeed => _currentSpeed;
  double get maxSpeed => _maxSpeed;
  double get totalDistance => _totalDistance;
  double get accuracy => _accuracy;
  double get altitude => _altitude;
  bool get isTracking => _isTracking;
  Position? get currentPosition => _currentPosition;

  Future<void> startTracking() async {
    // Verificar permisos
    final permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      final result = await Geolocator.requestPermission();
      if (result == LocationPermission.denied) {
        throw Exception('Permiso de ubicación denegado');
      }
    }

    // Verificar si el servicio de ubicación está habilitado
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw Exception('El servicio de ubicación está deshabilitado');
    }

    _isTracking = true;
    _currentSpeed = 0.0;
    _maxSpeed = 0.0;
    _totalDistance = 0.0;
    notifyListeners();

    // Configurar opciones de ubicación para alta precisión
    const locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 0, // Actualizar cada cambio
    );

    // Iniciar escucha de posición
    _positionStream = Geolocator.getPositionStream(
      locationSettings: locationSettings,
    ).listen(
      (Position position) {
        _updatePosition(position);
      },
      onError: (error) {
        debugPrint('Error en stream de ubicación: $error');
      },
    );
  }

  void _updatePosition(Position position) {
    _currentPosition = position;

    // Calcular velocidad en km/h
    // position.speed está en m/s, convertir a km/h
    _currentSpeed = position.speed * 3.6;

    // Actualizar velocidad máxima
    if (_currentSpeed > _maxSpeed) {
      _maxSpeed = _currentSpeed;
    }

    // Calcular distancia total (en km)
    if (_currentPosition != null) {
      final distance = Geolocator.distanceBetween(
        _currentPosition!.latitude,
        _currentPosition!.longitude,
        position.latitude,
        position.longitude,
      );
      _totalDistance += distance / 1000; // Convertir a km
    }

    // Actualizar precisión y altitud
    _accuracy = position.accuracy;
    _altitude = position.altitude;

    notifyListeners();
  }

  Future<void> stopTracking() async {
    _positionStream?.cancel();
    _positionStream = null;
    _isTracking = false;
    _currentSpeed = 0.0;
    notifyListeners();
  }

  @override
  void dispose() {
    _positionStream?.cancel();
    super.dispose();
  }
}
