import 'package:flutter/material.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  Widget _metric(BuildContext context, String title, IconData icon) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(icon, size: 26),
          const SizedBox(height: 12),
          Text(title, style: Theme.of(context).textTheme.labelLarge),
          const SizedBox(height: 8),
          Text('لا توجد بيانات', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          const Text('أضف تقريرًا أو نتيجة تحليل', style: TextStyle(fontSize: 12)),
        ]),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Hatem Health', style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        const Text('ملف صحي شخصي • نسخة تجريبية V0.1'),
        const SizedBox(height: 20),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: .95,
          children: [
            _metric(context, 'الدهون', Icons.favorite_outline),
            _metric(context, 'الغدة', Icons.monitor_heart_outlined),
            _metric(context, 'السكر', Icons.water_drop_outlined),
            _metric(context, 'الوزن', Icons.monitor_weight_outlined),
          ],
        ),
        const SizedBox(height: 20),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('ما الذي تفعله هذه النسخة؟', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 10),
              const Text('• رفع صور التحاليل والروشتات وملفات PDF من الهاتف.\n• تجهيز أقسام التحاليل والخط الزمني والملف الصحي.\n• لا تحتوي نسخة البناء على أي بيانات طبية شخصية مضمّنة حفاظًا على الخصوصية.'),
            ]),
          ),
        ),
      ],
    );
  }
}
