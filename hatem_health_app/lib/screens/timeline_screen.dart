import 'package:flutter/material.dart';

class TimelineScreen extends StatelessWidget {
  const TimelineScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('الخط الزمني الطبي')),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text('سيظهر هنا كل تحليل، دواء، عرض، قياس أو تقرير بالترتيب الزمني.', textAlign: TextAlign.center),
        ),
      ),
    );
  }
}
