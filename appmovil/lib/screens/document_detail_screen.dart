import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../api.dart';
import 'home_screen.dart';

class DocumentDetailScreen extends StatefulWidget {
  final String documentId;
  final String role;

  const DocumentDetailScreen({
    super.key,
    required this.documentId,
    required this.role,
  });

  @override
  State<DocumentDetailScreen> createState() => _DocumentDetailScreenState();
}

class _DocumentDetailScreenState extends State<DocumentDetailScreen> {
  Map<String, dynamic>? _doc;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final doc = await ApiClient.getDocument(widget.documentId);
      setState(() {
        _doc = doc;
        _loading = false;
      });
    } on ApiException catch (e) {
      setState(() {
        _error = e.message;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Error: $e';
        _loading = false;
      });
    }
  }

  Future<void> _viewFile() async {
    final path = _doc?['storage_path'];
    if (path == null) return;
    try {
      final url = await ApiClient.getFileUrl(path);
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        _toast('No se pudo abrir el archivo');
      }
    } catch (e) {
      _toast('Error al obtener el archivo');
    }
  }

  void _toast(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  Future<void> _addObservation() async {
    final ctrl = TextEditingController();
    String severity = 'media';
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) => AlertDialog(
          title: const Text('Nueva observación'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: ctrl,
                maxLines: 4,
                decoration: const InputDecoration(
                  labelText: 'Describe la observación',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: severity,
                decoration: const InputDecoration(
                  labelText: 'Severidad',
                  border: OutlineInputBorder(),
                ),
                items: const [
                  DropdownMenuItem(value: 'baja', child: Text('Baja')),
                  DropdownMenuItem(value: 'media', child: Text('Media')),
                  DropdownMenuItem(value: 'alta', child: Text('Alta')),
                ],
                onChanged: (v) => setS(() => severity = v ?? 'media'),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
            FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Guardar'),
            ),
          ],
        ),
      ),
    );
    if (ok != true || ctrl.text.trim().isEmpty) return;
    try {
      await ApiClient.addObservation(widget.documentId, ctrl.text.trim(), severity);
      _toast('Observación registrada');
      _load();
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      _toast(e is ApiException ? e.message : 'Error al registrar');
    }
  }

  Future<void> _decide(String decision) async {
    final label = decision == 'approve' ? 'Aprobar' : 'Rechazar';
    final notesCtrl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('$label documento'),
        content: TextField(
          controller: notesCtrl,
          maxLines: 3,
          decoration: const InputDecoration(
            labelText: 'Notas (opcional)',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: decision == 'approve' ? Colors.green : Colors.red,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(label),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ApiClient.decide(widget.documentId, decision,
          notes: notesCtrl.text.trim().isEmpty ? null : notesCtrl.text.trim());
      _toast(decision == 'approve' ? 'Documento aprobado' : 'Documento rechazado');
      _load();
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      _toast(e is ApiException ? e.message : 'Error al decidir');
    }
  }

  Future<void> _correct() async {
    final ctrl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Corregir y reenviar'),
        content: TextField(
          controller: ctrl,
          maxLines: 4,
          decoration: const InputDecoration(
            labelText: 'Describe las correcciones realizadas',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Reenviar')),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ApiClient.submitCorrection(widget.documentId,
          notes: ctrl.text.trim().isEmpty ? null : ctrl.text.trim());
      _toast('Corrección enviada');
      _load();
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      _toast(e is ApiException ? e.message : 'Error al corregir');
    }
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
              width: 110,
              child: Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13))),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 14))),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final status = _doc?['status'] as String?;
    final canReview = widget.role == 'reviewer' && status == 'in_review';
    final canObserve = widget.role == 'reviewer' &&
        (status == 'in_review' || status == 'corrected');
    final canCorrect = widget.role == 'student' && status == 'observed';
    final observations = (_doc?['observations'] as List?) ?? [];
    final versions = (_doc?['versions'] as List?) ?? [];
    final student = _doc?['student'];
    final period = _doc?['academic_period'];
    final reviewer = _doc?['reviewer'];

    return Scaffold(
      appBar: AppBar(title: const Text('Detalle del documento')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _doc == null
                  ? const Center(child: Text('Sin datos'))
                  : ListView(
                      padding: const EdgeInsets.all(16),
                      children: [
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(_doc!['title'] ?? '',
                                          style: const TextStyle(
                                              fontSize: 18, fontWeight: FontWeight.bold)),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: statusColor(status).withValues(alpha: 0.12),
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(
                                            color: statusColor(status), width: 1),
                                      ),
                                      child: Text(statusLabel(status),
                                          style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w600,
                                              color: statusColor(status))),
                                    ),
                                  ],
                                ),
                                const Divider(height: 24),
                                _row('Tipo', _doc!['document_type'] ?? '—'),
                                _row('Versión', 'v${_doc!['version'] ?? 1}'),
                                if (student is Map)
                                  _row('Estudiante',
                                      '${student['profile']?['full_name'] ?? ''} · ${student['student_code'] ?? ''}'),
                                if (period is Map) _row('Periodo', period['name'] ?? '—'),
                                if (reviewer is Map)
                                  _row('Revisor', reviewer['full_name'] ?? '—'),
                                _row(
                                  'Enviado',
                                  _doc!['submitted_at'] != null
                                      ? DateFormat('dd/MM/yyyy HH:mm').format(
                                          DateTime.parse(_doc!['submitted_at']))
                                      : '—',
                                ),
                                if (_doc!['approved_at'] != null)
                                  _row(
                                    'Aprobado',
                                    DateFormat('dd/MM/yyyy HH:mm').format(
                                        DateTime.parse(_doc!['approved_at'])),
                                  ),
                                if (_doc!['storage_path'] != null)
                                  Align(
                                    alignment: Alignment.centerLeft,
                                    child: TextButton.icon(
                                      onPressed: _viewFile,
                                      icon: const Icon(Icons.picture_as_pdf_outlined),
                                      label: const Text('Ver archivo'),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ),
                        if (observations.isNotEmpty) ...[
                          const SizedBox(height: 16),
                          const Text('Observaciones',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          ...observations.map((o) {
                            final obs = o as Map<String, dynamic>;
                            final reviewerName =
                                (obs['reviewer'] as Map?)?['full_name'] ?? '';
                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: ListTile(
                                leading: Icon(
                                  obs['status'] == 'resolved'
                                      ? Icons.check_circle_outline
                                      : Icons.warning_amber_outlined,
                                  color: obs['status'] == 'resolved'
                                      ? Colors.green
                                      : Colors.orange,
                                ),
                                title: Text(obs['observation'] ?? ''),
                                subtitle: Text(
                                  '${obs['severity'] ?? ''} · $reviewerName · ${DateFormat('dd/MM/yyyy').format(DateTime.tryParse(obs['created_at'] ?? '') ?? DateTime.now())}',
                                  style: const TextStyle(fontSize: 12),
                                ),
                              ),
                            );
                          }),
                        ],
                        if (versions.length > 1) ...[
                          const SizedBox(height: 16),
                          Text('Historial de versiones (${versions.length})',
                              style: const TextStyle(
                                  fontSize: 16, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          ...versions.map((v) {
                            final ver = v as Map<String, dynamic>;
                            return ListTile(
                              dense: true,
                              leading: const Icon(Icons.history, size: 20),
                              title: Text('Versión ${ver['version_number']}'),
                              subtitle: Text(
                                DateFormat('dd/MM/yyyy HH:mm').format(
                                    DateTime.tryParse(ver['created_at'] ?? '') ??
                                        DateTime.now()),
                                style: const TextStyle(fontSize: 12),
                              ),
                            );
                          }),
                        ],
                        const SizedBox(height: 90),
                      ],
                    ),
      bottomNavigationBar: (_doc != null && (canReview || canObserve || canCorrect))
          ? SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    if (canObserve)
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _addObservation,
                          icon: const Icon(Icons.comment_outlined),
                          label: const Text('Observación'),
                        ),
                      ),
                    if (canObserve && canReview) const SizedBox(width: 8),
                    if (canReview) ...[
                      Expanded(
                        child: FilledButton.icon(
                          style: FilledButton.styleFrom(backgroundColor: Colors.red),
                          onPressed: () => _decide('reject'),
                          icon: const Icon(Icons.close),
                          label: const Text('Rechazar'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: FilledButton.icon(
                          style: FilledButton.styleFrom(backgroundColor: Colors.green),
                          onPressed: () => _decide('approve'),
                          icon: const Icon(Icons.check),
                          label: const Text('Aprobar'),
                        ),
                      ),
                    ],
                    if (canCorrect) ...[
                      Expanded(
                        child: FilledButton.icon(
                          style: FilledButton.styleFrom(backgroundColor: Colors.orange),
                          onPressed: _correct,
                          icon: const Icon(Icons.edit_outlined),
                          label: const Text('Corregir'),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            )
          : null,
    );
  }
}
