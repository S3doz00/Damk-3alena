import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import '../../config/theme.dart';
import '../../config/supabase_config.dart';
import '../../models/facility_model.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  // ── Map ──────────────────────────────────────────────────────────────────
  final Completer<GoogleMapController> _mapControllerCompleter = Completer();
  GoogleMapController? _mapController;
  Set<Marker> _markers = {};

  static const CameraPosition _jordanInitial = CameraPosition(
    target: LatLng(31.9539, 35.9106),
    zoom: 8,
  );

  // ── Facilities ────────────────────────────────────────────────────────────
  List<Facility> _facilities = [];
  List<Facility> _filtered = [];
  bool _loading = true;
  String? _error;

  // ── Filters ───────────────────────────────────────────────────────────────
  final TextEditingController _searchController = TextEditingController();
  String? _selectedCity;

  // ── Location ──────────────────────────────────────────────────────────────
  bool _locationPermissionDenied = false;

  // ── UI state ──────────────────────────────────────────────────────────────
  bool _showList = false;
  final DraggableScrollableController _sheetController =
      DraggableScrollableController();

  @override
  void initState() {
    super.initState();
    _loadFacilities();
    _requestLocation();
  }

  @override
  void dispose() {
    _mapController?.dispose();
    _searchController.dispose();
    _sheetController.dispose();
    super.dispose();
  }

  Future<void> _loadFacilities() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final response = await SupabaseConfig.client
          .from('facilities')
          .select()
          .order('name');
      final facilities =
          (response as List).map((json) => Facility.fromJson(json)).toList();
      if (!mounted) return;
      setState(() {
        _facilities = facilities;
        _filtered = facilities;
        _loading = false;
      });
      _buildMarkers(facilities);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _loading = false;
      });
    }
  }

  Future<void> _requestLocation() async {
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.deniedForever ||
          permission == LocationPermission.denied) {
        if (mounted) setState(() => _locationPermissionDenied = true);
        return;
      }
      final position = await Geolocator.getCurrentPosition(
        locationSettings:
            const LocationSettings(accuracy: LocationAccuracy.high),
      );
      final controller = await _mapControllerCompleter.future;
      await controller.animateCamera(CameraUpdate.newCameraPosition(
        CameraPosition(
            target: LatLng(position.latitude, position.longitude), zoom: 12),
      ));
    } catch (_) {}
  }

  void _buildMarkers(List<Facility> facilities) {
    final markers = facilities.map((facility) {
      final hue = facility.type.toLowerCase() == 'hospital'
          ? BitmapDescriptor.hueRed
          : BitmapDescriptor.hueViolet;
      return Marker(
        markerId: MarkerId(facility.id),
        position: LatLng(facility.latitude, facility.longitude),
        icon: BitmapDescriptor.defaultMarkerWithHue(hue),
        infoWindow: InfoWindow(
          title: facility.name,
          snippet: _facilityTypeLabel(facility.type),
        ),
        onTap: () => setState(() {}),
      );
    }).toSet();
    if (mounted) setState(() => _markers = markers);
  }

  void _applyFilters() {
    final query = _searchController.text.trim().toLowerCase();
    setState(() {
      _filtered = _facilities.where((f) {
        final matchesSearch = query.isEmpty ||
            f.name.toLowerCase().contains(query) ||
            (f.city?.toLowerCase().contains(query) ?? false) ||
            f.type.toLowerCase().contains(query);
        return matchesSearch &&
            (_selectedCity == null || f.city == _selectedCity);
      }).toList();
    });
  }

  List<String> get _availableCities {
    return _facilities
        .where((f) => f.city != null)
        .map((f) => f.city!)
        .toSet()
        .toList()
      ..sort();
  }

  Future<void> _flyToFacility(Facility facility) async {
    final controller = await _mapControllerCompleter.future;
    await controller.animateCamera(CameraUpdate.newCameraPosition(
      CameraPosition(
          target: LatLng(facility.latitude, facility.longitude), zoom: 14),
    ));
    await controller.showMarkerInfoWindow(MarkerId(facility.id));
    _sheetController.animateTo(0.12,
        duration: const Duration(milliseconds: 350), curve: Curves.easeOut);
    setState(() => _showList = false);
  }

  String _facilityTypeLabel(String type) {
    switch (type.toLowerCase()) {
      case 'hospital':
        return 'Hospital';
      case 'blood_bank':
        return 'Blood Bank';
      case 'clinic':
        return 'Clinic';
      default:
        return type;
    }
  }

  IconData _facilityTypeIcon(String type) {
    switch (type.toLowerCase()) {
      case 'hospital':
        return Icons.local_hospital;
      case 'blood_bank':
        return Icons.bloodtype;
      case 'clinic':
        return Icons.medical_services;
      default:
        return Icons.business;
    }
  }

  Color _facilityTypeColor(String type) {
    switch (type.toLowerCase()) {
      case 'hospital':
        return AppTheme.primary;
      case 'blood_bank':
        return AppTheme.secondary;
      default:
        return AppTheme.onSurfaceVariant;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: _jordanInitial,
            mapType: MapType.normal,
            myLocationEnabled: !_locationPermissionDenied,
            myLocationButtonEnabled: false,
            zoomControlsEnabled: false,
            markers: _markers,
            onMapCreated: (controller) {
              _mapController = controller;
              if (!_mapControllerCompleter.isCompleted) {
                _mapControllerCompleter.complete(controller);
              }
            },
          ),
          if (_locationPermissionDenied)
            Positioned(
              top: MediaQuery.of(context).padding.top + 8,
              left: 16,
              right: 16,
              child: _buildLocationBanner(),
            ),
          Positioned(
            top: MediaQuery.of(context).padding.top + 12,
            right: 16,
            child: _buildToggleButton(),
          ),
          DraggableScrollableSheet(
            controller: _sheetController,
            initialChildSize: 0.12,
            minChildSize: 0.12,
            maxChildSize: 0.72,
            snap: true,
            snapSizes: const [0.12, 0.42, 0.72],
            builder: (context, scrollController) =>
                _buildBottomSheet(scrollController),
          ),
          if (!_locationPermissionDenied)
            Positioned(
              bottom: MediaQuery.of(context).size.height * 0.14 + 12,
              right: 16,
              child: _buildMyLocationFab(),
            ),
        ],
      ),
    );
  }

  Widget _buildLocationBanner() {
    return Material(
      elevation: 4,
      borderRadius: BorderRadius.circular(14),
      color: AppTheme.surfaceContainerLowest,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        child: Row(
          children: [
            const Icon(Icons.location_off, color: AppTheme.primary, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                'Location permission needed to show your position',
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(color: AppTheme.onSurface, fontSize: 12),
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: Geolocator.openAppSettings,
              child: const Text('Settings',
                  style: TextStyle(
                      color: AppTheme.primary,
                      fontWeight: FontWeight.w700,
                      fontSize: 12)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildToggleButton() {
    return Material(
      elevation: 4,
      borderRadius: BorderRadius.circular(14),
      color: AppTheme.surfaceContainerLowest,
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () {
          setState(() => _showList = !_showList);
          _sheetController.animateTo(_showList ? 0.72 : 0.12,
              duration: const Duration(milliseconds: 350),
              curve: Curves.easeInOut);
        },
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Icon(
            _showList ? Icons.map_outlined : Icons.list_rounded,
            color: AppTheme.primary,
            size: 22,
          ),
        ),
      ),
    );
  }

  Widget _buildMyLocationFab() {
    return Material(
      elevation: 4,
      borderRadius: BorderRadius.circular(14),
      color: AppTheme.surfaceContainerLowest,
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: _requestLocation,
        child: const Padding(
          padding: EdgeInsets.all(12),
          child: Icon(Icons.my_location_rounded, color: AppTheme.primary, size: 22),
        ),
      ),
    );
  }

  Widget _buildBottomSheet(ScrollController scrollController) {
    return Container(
      decoration: const BoxDecoration(
        color: AppTheme.surfaceContainerLowest,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [
          BoxShadow(
              color: Color(0x18000000),
              blurRadius: 24,
              offset: Offset(0, -4))
        ],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 10, bottom: 6),
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                  color: AppTheme.outlineVariant,
                  borderRadius: BorderRadius.circular(2)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 4, 20, 0),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Facilities',
                          style: Theme.of(context)
                              .textTheme
                              .headlineSmall
                              ?.copyWith(fontSize: 18)),
                      if (!_loading && _error == null)
                        Text('${_filtered.length} found in Jordan',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                fontSize: 12,
                                color: AppTheme.onSurfaceVariant)),
                    ],
                  ),
                ),
                Row(children: [
                  _legendDot(AppTheme.primary, 'Hospital'),
                  const SizedBox(width: 10),
                  _legendDot(AppTheme.secondary, 'Blood Bank'),
                ]),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: TextField(
              controller: _searchController,
              onChanged: (_) => _applyFilters(),
              decoration: InputDecoration(
                hintText: 'Search by name or city…',
                hintStyle: const TextStyle(fontSize: 14),
                prefixIcon: const Icon(Icons.search_rounded,
                    color: AppTheme.onSurfaceVariant, size: 20),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear_rounded,
                            color: AppTheme.onSurfaceVariant, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          _applyFilters();
                        })
                    : null,
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
            ),
          ),
          const SizedBox(height: 10),
          if (_availableCities.isNotEmpty)
            SizedBox(
              height: 36,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                children: [
                  _buildFilterChip(null, 'All'),
                  ..._availableCities
                      .map((city) => _buildFilterChip(city, city)),
                ],
              ),
            ),
          const SizedBox(height: 8),
          const Divider(height: 1, color: Color(0x12000000)),
          Expanded(
            child: _loading
                ? const Center(
                    child:
                        CircularProgressIndicator(color: AppTheme.primary))
                : _error != null
                    ? _buildErrorState()
                    : _filtered.isEmpty
                        ? _buildEmptyState()
                        : ListView.separated(
                            controller: scrollController,
                            padding:
                                const EdgeInsets.fromLTRB(20, 12, 20, 32),
                            itemCount: _filtered.length,
                            separatorBuilder: (_, __) =>
                                const SizedBox(height: 10),
                            itemBuilder: (context, index) =>
                                _buildFacilityTile(_filtered[index]),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _legendDot(Color color, String label) {
    return Row(children: [
      Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
      const SizedBox(width: 4),
      Text(label,
          style: const TextStyle(
              fontSize: 11,
              color: AppTheme.onSurfaceVariant,
              fontWeight: FontWeight.w500)),
    ]);
  }

  Widget _buildFilterChip(String? city, String label) {
    final selected = _selectedCity == city;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label,
            style: TextStyle(
                color:
                    selected ? AppTheme.onPrimary : AppTheme.onSurface,
                fontWeight: FontWeight.w600,
                fontSize: 12)),
        selected: selected,
        selectedColor: AppTheme.primary,
        backgroundColor: AppTheme.surfaceContainerLow,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(
              color: selected
                  ? AppTheme.primary
                  : AppTheme.outlineVariant.withAlpha(51)),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 0),
        visualDensity: VisualDensity.compact,
        onSelected: (_) {
          setState(() => _selectedCity = city);
          _applyFilters();
        },
      ),
    );
  }

  Widget _buildFacilityTile(Facility facility) {
    final typeColor = _facilityTypeColor(facility.type);
    return InkWell(
      onTap: () => _flyToFacility(facility),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: AppTheme.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
              color: AppTheme.outlineVariant.withAlpha(30)),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withAlpha(6),
                blurRadius: 10,
                offset: const Offset(0, 2))
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                  color: typeColor.withAlpha(18),
                  borderRadius: BorderRadius.circular(12)),
              child: Icon(_facilityTypeIcon(facility.type),
                  color: typeColor, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(facility.name,
                      style: Theme.of(context)
                          .textTheme
                          .titleMedium
                          ?.copyWith(fontSize: 14),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 3),
                  Row(children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 7, vertical: 2),
                      decoration: BoxDecoration(
                          color: typeColor.withAlpha(20),
                          borderRadius: BorderRadius.circular(6)),
                      child: Text(_facilityTypeLabel(facility.type),
                          style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: typeColor)),
                    ),
                    if (facility.city != null) ...[
                      const SizedBox(width: 6),
                      Icon(Icons.location_on_outlined,
                          size: 12,
                          color: AppTheme.onSurfaceVariant
                              .withAlpha(160)),
                      const SizedBox(width: 2),
                      Flexible(
                          child: Text(facility.city!,
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(fontSize: 12),
                              overflow: TextOverflow.ellipsis)),
                    ],
                  ]),
                  if (facility.workingHours != null) ...[
                    const SizedBox(height: 3),
                    Row(children: [
                      const Icon(Icons.schedule_outlined,
                          size: 12, color: AppTheme.onSurfaceVariant),
                      const SizedBox(width: 4),
                      Flexible(
                          child: Text(facility.workingHours!,
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(fontSize: 11),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis)),
                    ]),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 8),
            Icon(Icons.chevron_right_rounded,
                color: AppTheme.onSurfaceVariant.withAlpha(120), size: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
        child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(Icons.error_outline,
            size: 56, color: AppTheme.error.withAlpha(128)),
        const SizedBox(height: 16),
        Text('Failed to load facilities',
            style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 8),
        Text(_error ?? '',
            style: Theme.of(context).textTheme.bodyMedium,
            textAlign: TextAlign.center),
        const SizedBox(height: 24),
        ElevatedButton.icon(
            onPressed: _loadFacilities,
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Retry')),
      ]),
    ));
  }

  Widget _buildEmptyState() {
    return Center(
        child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(Icons.search_off_rounded,
            size: 56, color: AppTheme.onSurfaceVariant.withAlpha(102)),
        const SizedBox(height: 16),
        Text('No Facilities Found',
            style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 8),
        Text('Try adjusting your search or filter.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium),
      ]),
    ));
  }
}
