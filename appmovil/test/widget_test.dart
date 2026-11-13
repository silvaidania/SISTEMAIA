import 'package:flutter_test/flutter_test.dart';
import 'package:speedometer/speedometer_provider.dart';

void main() {
  test('SpeedometerProvider initializes correctly', () {
    final provider = SpeedometerProvider();
    expect(provider.currentSpeed, 0.0);
    expect(provider.isTracking, false);
    expect(provider.maxSpeed, 0.0);
    expect(provider.totalDistance, 0.0);
  });
}
