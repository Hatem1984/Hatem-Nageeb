import 'package:flutter/material.dart';

class LabsScreen extends StatelessWidget {
  const LabsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('التحاليل')),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text('لم تُضف نتائج بعد.\nفي النسخة التالية سيتم استخراج القيم من التقارير بعد مراجعتك وتأكيدها.', textAlign: TextAlign.center),
        ),
      ),
    );
  }
}
