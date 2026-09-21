import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';

class DocumentsScreen extends StatefulWidget {
  const DocumentsScreen({super.key});

  @override
  State<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends State<DocumentsScreen> {
  final List<PlatformFile> files = [];

  Future<void> _pick() async {
    final result = await FilePicker.platform.pickFiles(
      allowMultiple: true,
      type: FileType.custom,
      allowedExtensions: const ['pdf', 'jpg', 'jpeg', 'png'],
    );
    if (result != null && mounted) {
      setState(() => files.addAll(result.files));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('خزنة المستندات')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _pick,
        icon: const Icon(Icons.upload_file),
        label: const Text('رفع مستند'),
      ),
      body: files.isEmpty
          ? const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text('ارفع تحليل، روشتة، تقرير، ECG أو صورة طبية.\nهذه النسخة التجريبية تعرض الملفات أثناء الجلسة فقط.', textAlign: TextAlign.center),
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: files.length,
              itemBuilder: (context, i) => Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: ListTile(
                  leading: const Icon(Icons.description_outlined),
                  title: Text(files[i].name),
                  subtitle: Text('${(files[i].size / 1024).toStringAsFixed(1)} KB • جاهز للمراجعة'),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete_outline),
                    onPressed: () => setState(() => files.removeAt(i)),
                  ),
                ),
              ),
            ),
    );
  }
}
