import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../api.dart';
import 'document_detail_screen.dart';
import 'upload_screen.dart';

const Map<String, String> _statusLabels = {
  'submitted': 'Enviado',
  'in_review': 'En revisión',
  'observed': 'Con observaciones',
  'corrected': 'Corregido',
  'approved': 'Aprobado',
  'rejected': 'Rechazado',
};

const Map<String, Color> _statusColors = {
  'submitted': Color(0xFF3B82F6),
  'in_review': Color(0xFF8B5CF6),
  'observed': Color(0xFFF59E0B),
  'corrected': Color(0xFF06B6D4),
  'approved': Color(0xFF10B981),
  'rejected': Color(0xFFEF4444),
};

String statusLabel(String? status) => _statusLabels[status] ?? status ?? '—';
Color statusColor(String? status) => _statusColors[status] ?? Colors.grey;

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<dynamic> _docs = [];
  Map<String, dynamic>? _user;
  String? _role;
  String _statusFilter = '';
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
      _user ??= await ApiClient.getMe();
      _role ??= _user?['role'] as String?;
      final docs = await ApiClient.getDocuments(
        status: _statusFilter.isEmpty ? null : _statusFilter,
      );
      setState(() {
        _docs = docs;
        _loading = false;
      });
    } on ApiException catch (e) {
      setState(() {
        _error = e.message;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Error de conexión: $e';
        _loading = false;
      });
    }
  }

  Future<void> _logout() async {
    await ApiClient.logout();
    if (mounted) {
      // AuthGate redirige automáticamente al no haber sesión
      setState(() {
        _user = null;
        _role = null;
        _docs = [];
      });
    }
  }

  String _studentName(Map<String, dynamic> doc) {
    final s = doc['student'];
    if (s is Map) {
      final p = s['profile'];
      if (p is Map && p['full_name'] != null) return p['full_name'];
    }
    return '';
  }

  String _periodName(Map<String, dynamic> doc) {
    final p = doc['academic_period'];
    if (p is Map && p['name'] != null) return p['name'];
    return '';
  }

  @override
  Widget build(BuildContext context) {
    final isStudent = _role == 'student';
    final filters = ['', 'submitted', 'in_review', 'observed', 'corrected', 'approved', 'rejected'];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Documentos de Estadías'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.account_circle),
            onSelected: (v) {
              if (v == 'logout') _logout();
            },
            itemBuilder: (_) => [
              PopupMenuItem(
                enabled: false,
                child: Text(_user?['full_name'] ?? '',
                    style: const TextStyle(fontWeight: FontWeight.bold)),
              ),
              PopupMenuItem(
                enabled: false,
                child: Text('Rol: ${_role ?? '...'}',
                    style: const TextStyle(color: Colors.grey, fontSize: 12)),
              ),
              const PopupMenuDivider(),
              const PopupMenuItem(value: 'logout', child: Text('Cerrar sesión')),
            ],
          ),
        ],
      ),
      floatingActionButton: isStudent
          ? FloatingActionButton.extended(
              onPressed: () async {
                final result = await Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const UploadScreen()),
                );
                if (result == true) _load();
              },
              icon: const Icon(Icons.upload_file),
              label: const Text('Subir documento'),
              backgroundColor: const Color(0xFFF97316),
            )
          : null,
      body: Column(
        children: [
          SizedBox(
            height: 48,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              children: filters.map((f) {
                final selected = _statusFilter == f;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(f.isEmpty ? 'Todos' : statusLabel(f)),
                    selected: selected,
                    onSelected: (_) {
                      setState(() => _statusFilter = f);
                      _load();
                    },
                    selectedColor: const Color(0xFF1E3A8A).withValues(alpha: 0.15),
                  ),
                );
              }).toList(),
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(_error!, textAlign: TextAlign.center),
                            const SizedBox(height: 12),
                            FilledButton(onPressed: _load, child: const Text('Reintentar')),
                          ],
                        ),
                      )
                    : _docs.isEmpty
                        ? const Center(child: Text('No hay documentos'))
                        : RefreshIndicator(
                            onRefresh: _load,
                            child: ListView.builder(
                              padding: const EdgeInsets.all(12),
                              itemCount: _docs.length,
                              itemBuilder: (context, i) {
                                final doc = _docs[i] as Map<String, dynamic>;
                                final status = doc['status'] as String?;
                                final student = _studentName(doc);
                                return Card(
                                  margin: const EdgeInsets.only(bottom: 10),
                                  child: ListTile(
                                    contentPadding: const EdgeInsets.symmetric(
                                        horizontal: 16, vertical: 8),
                                    title: Text(doc['title'] ?? '',
                                        style: const TextStyle(fontWeight: FontWeight.w600)),
                                    subtitle: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(doc['document_type'] ?? '',
                                            style: const TextStyle(fontSize: 12)),
                                        const SizedBox(height: 4),
                                        Wrap(
                                          spacing: 8,
                                          children: [
                                            if (student.isNotEmpty)
                                              Text(student,
                                                  style: const TextStyle(
                                                      fontSize: 12, color: Colors.grey)),
                                            if (_periodName(doc).isNotEmpty)
                                              Text(_periodName(doc),
                                                  style: const TextStyle(
                                                      fontSize: 12, color: Colors.grey)),
                                            Text(
                                              DateFormat('dd/MM/yyyy')
                                                  .format(DateTime.tryParse(
                                                          doc['submitted_at'] ?? '') ??
                                                      DateTime.now()),
                                              style: const TextStyle(
                                                  fontSize: 12, color: Colors.grey),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                    trailing: Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: statusColor(status).withValues(alpha: 0.12),
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(
                                            color: statusColor(status), width: 1),
                                      ),
                                      child: Text(
                                        statusLabel(status),
                                        style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w600,
                                            color: statusColor(status)),
                                      ),
                                    ),
                                    onTap: () async {
                                      final changed = await Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (_) => DocumentDetailScreen(
                                              documentId: doc['id'] as String,
                                              role: _role ?? ''),
                                        ),
                                      );
                                      if (changed == true) _load();
                                    },
                                  ),
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}
