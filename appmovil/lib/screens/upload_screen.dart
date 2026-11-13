import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import '../api.dart';

class UploadScreen extends StatefulWidget {
  const UploadScreen({super.key});

  @override
  State<UploadScreen> createState() => _UploadScreenState();
}

class _UploadScreenState extends State<UploadScreen> {
  final _titleCtrl = TextEditingController();
  final _typeCtrl = TextEditingController();
  List<dynamic> _periods = [];
  String? _periodId;
  PlatformFile? _file;
  bool _loadingPeriods = true;
  bool _submitting = false;
  String? _error;

  static const _docTypes = [
    'Reporte final',
    'Bitácora',
    'Constancia de estadía',
    'Carta de presentación',
    'Informe de actividades',
    'Otro',
  ];

  @override
  void initState() {
    super.initState();
    _loadPeriods();
  }

  Future<void> _loadPeriods() async {
    try {
      final periods = await ApiClient.getAcademicPeriods();
      setState(() {
        _periods = periods;
        _loadingPeriods = false;
        if (periods.isNotEmpty) {
          _periodId = periods.first['id'] as String?;
        }
      });
    } catch (e) {
      setState(() {
        _loadingPeriods = false;
        _error = 'No se pudieron cargar los periodos';
      });
    }
  }

  Future<void> _pickFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png'],
    );
    if (result != null && result.files.isNotEmpty) {
      setState(() => _file = result.files.first);
    }
  }

  Future<void> _submit() async {
    final title = _titleCtrl.text.trim();
    final type = _typeCtrl.text.trim();
    if (title.isEmpty || type.isEmpty || _periodId == null || _file == null) {
      setState(() => _error = 'Completa todos los campos y selecciona un archivo');
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await ApiClient.uploadDocument(
        filePath: _file!.path!,
        fileName: _file!.name,
        academicPeriodId: _periodId!,
        title: title,
        documentType: type,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Documento enviado correctamente')),
        );
        Navigator.pop(context, true);
      }
    } on ApiException catch (e) {
      setState(() {
        _error = e.message;
        _submitting = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Error al subir: $e';
        _submitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Subir documento')),
      body: _loadingPeriods
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (_error != null)
                  Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(_error!,
                        style: TextStyle(color: Colors.red.shade700, fontSize: 13)),
                  ),
                TextField(
                  controller: _titleCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Título del documento',
                    hintText: 'Ej. Reporte final de estadía',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.title),
                  ),
                ),
                const SizedBox(height: 16),
                Autocomplete<String>(
                  optionsBuilder: (v) => _docTypes
                      .where((t) => t.toLowerCase().contains(v.text.toLowerCase())),
                  onSelected: (s) => _typeCtrl.text = s,
                  fieldViewBuilder: (ctx, ctrl, focus, onSubmit) {
                    // Sincroniza el controlador externo
                    if (_typeCtrl.text != ctrl.text && ctrl.text.isEmpty) {
                      ctrl.text = _typeCtrl.text;
                    }
                    ctrl.addListener(() => _typeCtrl.text = ctrl.text);
                    return TextField(
                      controller: ctrl,
                      focusNode: focus,
                      decoration: const InputDecoration(
                        labelText: 'Tipo de documento',
                        hintText: 'Ej. Reporte final',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.description_outlined),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  initialValue: _periodId,
                  decoration: const InputDecoration(
                    labelText: 'Periodo académico',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.calendar_month_outlined),
                  ),
                  items: _periods.map((p) {
                    final period = p as Map<String, dynamic>;
                    return DropdownMenuItem(
                      value: period['id'] as String,
                      child: Text(period['name'] ?? ''),
                    );
                  }).toList(),
                  onChanged: (v) => setState(() => _periodId = v),
                ),
                const SizedBox(height: 16),
                InkWell(
                  onTap: _pickFile,
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey.shade400),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          _file == null ? Icons.cloud_upload_outlined : Icons.description,
                          size: 32,
                          color: const Color(0xFF1E3A8A),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Text(
                            _file == null
                                ? 'Toca para seleccionar un archivo\nPDF, Word, Excel o imagen'
                                : '${_file!.name} (${(_file!.size / 1024).toStringAsFixed(0)} KB)',
                            style: TextStyle(
                              color: _file == null ? Colors.grey : Colors.black87,
                            ),
                          ),
                        ),
                        if (_file != null)
                          IconButton(
                            icon: const Icon(Icons.close),
                            onPressed: () => setState(() => _file = null),
                          ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: FilledButton.icon(
                    onPressed: _submitting ? null : _submit,
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFFF97316),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: _submitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.white))
                        : const Icon(Icons.send),
                    label: Text(_submitting ? 'Enviando...' : 'Enviar documento'),
                  ),
                ),
              ],
            ),
    );
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _typeCtrl.dispose();
    super.dispose();
  }
}
