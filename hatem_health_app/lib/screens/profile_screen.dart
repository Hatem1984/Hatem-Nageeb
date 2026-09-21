import 'package:flutter/material.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('ملفي الصحي')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('الملف الشخصي', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                SizedBox(height: 8),
                Text('لم تتم إضافة بيانات شخصية لهذه النسخة المبدئية حفاظًا على الخصوصية.'),
                SizedBox(height: 8),
                Text('سيتم لاحقًا إضافة البيانات محليًا على الهاتف وربطها بالمستندات والتحاليل.'),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}
