import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import 'config.dart';

class ApiException implements Exception {
  final String message;
  final int statusCode;
  ApiException(this.message, this.statusCode);
  @override
  String toString() => message;
}

class ApiClient {
  static final SupabaseClient _supabase = Supabase.instance.client;

  static Future<String?> _token() async {
    final session = _supabase.auth.currentSession;
    if (session == null) return null;
    // Refresca si está por expirar
    if (session.isExpired) {
      try {
        final res = await _supabase.auth.refreshSession();
        return res.session?.accessToken;
      } catch (_) {
        return session.accessToken;
      }
    }
    return session.accessToken;
  }

  static Map<String, String> _headers(String? token, {bool json = true}) => {
        if (token != null) 'Authorization': 'Bearer $token',
        if (json) 'Content-Type': 'application/json',
      };

  static Future<dynamic> _request(
    String method,
    String path, {
    Map<String, String>? query,
    Object? body,
    bool auth = true,
  }) async {
    final token = auth ? await _token() : null;
    final uri = Uri.parse('$apiBaseUrl$path').replace(queryParameters: query);
    final headers = _headers(token);

    http.Response res;
    switch (method) {
      case 'GET':
        res = await http.get(uri, headers: headers);
        break;
      case 'POST':
        res = await http.post(uri, headers: headers, body: jsonEncode(body));
        break;
      case 'PATCH':
        res = await http.patch(uri, headers: headers, body: jsonEncode(body));
        break;
      case 'DELETE':
        res = await http.delete(uri, headers: headers);
        break;
      default:
        throw ApiException('Método no soportado', 400);
    }

    dynamic data;
    try {
      data = jsonDecode(utf8.decode(res.bodyBytes));
    } catch (_) {
      data = {'message': res.body};
    }

    if (res.statusCode >= 400) {
      throw ApiException(data['message'] ?? 'Error ${res.statusCode}', res.statusCode);
    }
    return data;
  }

  // ---------- Documentos ----------

  static Future<List<dynamic>> getDocuments({String? status, String? search}) {
    return _request('GET', '/documents', query: {
      if (status != null && status.isNotEmpty) 'status': status,
      if (search != null && search.isNotEmpty) 'search': search,
    }).then((d) => d['documents'] as List<dynamic>);
  }

  static Future<Map<String, dynamic>> getDocument(String id) async {
    final d = await _request('GET', '/documents/$id');
    return d['document'] as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> uploadDocument({
    required String filePath,
    required String fileName,
    required String academicPeriodId,
    required String title,
    required String documentType,
  }) async {
    final token = await _token();
    final uri = Uri.parse('$apiBaseUrl/documents/upload');
    final request = http.MultipartRequest('POST', uri);
    if (token != null) request.headers['Authorization'] = 'Bearer $token';
    request.fields['academicPeriodId'] = academicPeriodId;
    request.fields['title'] = title;
    request.fields['documentType'] = documentType;
    request.files.add(await http.MultipartFile.fromPath('file', filePath, filename: fileName));

    final streamed = await request.send();
    final res = await http.Response.fromStream(streamed);
    dynamic data;
    try {
      data = jsonDecode(utf8.decode(res.bodyBytes));
    } catch (_) {
      data = {'message': res.body};
    }
    if (res.statusCode >= 400) {
      throw ApiException(data['message'] ?? 'Error ${res.statusCode}', res.statusCode);
    }
    return data['document'] as Map<String, dynamic>;
  }

  static Future<String> getFileUrl(String path) async {
    final d = await _request('GET', '/documents/file-url', query: {'path': path});
    return d['url'] as String;
  }

  static Future<void> addObservation(String documentId, String observation, String severity) {
    return _request('POST', '/documents/$documentId/observations', body: {
      'observation': observation,
      'severity': severity,
    });
  }

  static Future<void> decide(String documentId, String decision, {String? notes}) {
    return _request('POST', '/documents/$documentId/decision', body: {
      'decision': decision,
      'notes': notes,
    });
  }

  static Future<void> submitCorrection(String documentId, {String? storagePath, String? notes}) {
    return _request('POST', '/documents/$documentId/correction', body: {
      'storagePath': storagePath,
      'notes': notes,
    });
  }

  // ---------- Periodos ----------

  static Future<List<dynamic>> getAcademicPeriods() {
    return _request('GET', '/academic-periods').then((d) => d['periods'] as List<dynamic>);
  }

  // ---------- Perfil ----------

  static Future<Map<String, dynamic>> getMe() async {
    final d = await _request('GET', '/auth/me');
    return d['user'] as Map<String, dynamic>;
  }

  static Future<void> logout() => _supabase.auth.signOut();
}
