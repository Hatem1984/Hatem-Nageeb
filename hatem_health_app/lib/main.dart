import 'package:flutter/material.dart';
import 'screens/home_shell.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const HatemHealthApp());
}

class HatemHealthApp extends StatelessWidget {
  const HatemHealthApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Hatem Health',
      locale: const Locale('ar'),
      builder: (context, child) => Directionality(
        textDirection: TextDirection.rtl,
        child: child ?? const SizedBox.shrink(),
      ),
      theme: ThemeData(
        useMaterial3: true,
        colorSchemeSeed: const Color(0xFF0E6B63),
        scaffoldBackgroundColor: const Color(0xFFF7F8F8),
      ),
      home: const HomeShell(),
    );
  }
}
