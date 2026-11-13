import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'speedometer_screen.dart';
import 'speedometer_provider.dart';

void main() {
  runApp(const SpeedometerApp());
}

class SpeedometerApp extends StatelessWidget {
  const SpeedometerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => SpeedometerProvider(),
      child: MaterialApp(
        title: 'Velocímetro GPS',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF1E3A8A),
            brightness: Brightness.dark,
          ),
          useMaterial3: true,
          fontFamily: 'Roboto',
        ),
        home: const SpeedometerScreen(),
      ),
    );
  }
}
