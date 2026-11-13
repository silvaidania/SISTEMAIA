import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';
import 'speedometer_provider.dart';

class SpeedometerScreen extends StatefulWidget {
  const SpeedometerScreen({super.key});

  @override
  State<SpeedometerScreen> createState() => _SpeedometerScreenState();
}

class _SpeedometerScreenState extends State<SpeedometerScreen> {
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _checkPermissions();
  }

  Future<void> _checkPermissions() async {
    final status = await Permission.location.status;
    if (status.isDenied) {
      final result = await Permission.location.request();
      if (result.isDenied) {
        setState(() {
          _errorMessage = 'Se requiere permiso de ubicación para usar el velocímetro';
        });
      }
    }
  }

  Future<void> _startTracking() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final provider = Provider.of<SpeedometerProvider>(context, listen: false);
      await provider.startTracking();
    } catch (e) {
      setState(() {
        _errorMessage = 'Error al iniciar el rastreo: $e';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _stopTracking() async {
    final provider = Provider.of<SpeedometerProvider>(context, listen: false);
    await provider.stopTracking();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        title: const Text('Velocímetro GPS'),
        backgroundColor: const Color(0xFF1E3A8A),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: Consumer<SpeedometerProvider>(
        builder: (context, provider, child) {
          return Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Velocímetro circular
                _buildSpeedometer(provider),
                const SizedBox(height: 32),

                // Información adicional
                _buildInfoSection(provider),
                const SizedBox(height: 32),

                // Botones de control
                _buildControlButtons(provider),

                // Mensaje de error
                if (_errorMessage != null) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.red),
                    ),
                    child: Text(
                      _errorMessage!,
                      style: const TextStyle(color: Colors.red, fontSize: 14),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildSpeedometer(SpeedometerProvider provider) {
    final speed = provider.currentSpeed;
    final maxSpeed = 200.0; // km/h máximo para el velocímetro
    final progress = (speed / maxSpeed).clamp(0.0, 1.0);

    return Container(
      width: 280,
      height: 280,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Círculo de fondo
          Container(
            width: 280,
            height: 280,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFF1E293B),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.3),
                  blurRadius: 20,
                  spreadRadius: 5,
                ),
              ],
            ),
          ),

          // Arco de progreso
          CustomPaint(
            size: const Size(280, 280),
            painter: SpeedometerPainter(
              progress: progress,
              color: _getSpeedColor(speed),
            ),
          ),

          // Velocidad central
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                speed.toStringAsFixed(0),
                style: const TextStyle(
                  fontSize: 64,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const Text(
                'km/h',
                style: TextStyle(
                  fontSize: 20,
                  color: Colors.grey,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInfoSection(SpeedometerProvider provider) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF334155)),
      ),
      child: Column(
        children: [
          _buildInfoRow('Estado', provider.isTracking ? 'Rastreando' : 'Detenido'),
          _buildInfoRow('Precisión', provider.accuracy.toStringAsFixed(1) + ' m'),
          _buildInfoRow('Altitud', provider.altitude.toStringAsFixed(1) + ' m'),
          _buildInfoRow(
            'Velocidad Máxima',
            provider.maxSpeed.toStringAsFixed(0) + ' km/h',
          ),
          _buildInfoRow(
            'Distancia',
            provider.totalDistance.toStringAsFixed(2) + ' km',
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(color: Colors.grey, fontSize: 14),
          ),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildControlButtons(SpeedometerProvider provider) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (!provider.isTracking)
          ElevatedButton.icon(
            onPressed: _isLoading ? null : _startTracking,
            icon: _isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.play_arrow),
            label: const Text('Iniciar'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF3B82F6),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          )
        else
          ElevatedButton.icon(
            onPressed: _stopTracking,
            icon: const Icon(Icons.stop),
            label: const Text('Detener'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
      ],
    );
  }

  Color _getSpeedColor(double speed) {
    if (speed < 50) return Colors.green;
    if (speed < 80) return Colors.orange;
    return Colors.red;
  }
}

class SpeedometerPainter extends CustomPainter {
  final double progress;
  final Color color;

  SpeedometerPainter({required this.progress, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 20;

    // Dibujar arco de fondo
    final backgroundPaint = Paint()
      ..color = const Color(0xFF334155)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 20
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -2.4, // inicio del arco (en radianes)
      4.8,  // longitud del arco
      false,
      backgroundPaint,
    );

    // Dibujar arco de progreso
    final progressPaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 20
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -2.4,
      4.8 * progress,
      false,
      progressPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
