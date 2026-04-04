import 'package:flutter_test/flutter_test.dart';
import 'package:damk_3alena/main.dart';

void main() {
  testWidgets('App renders without error', (WidgetTester tester) async {
    await tester.pumpWidget(const DamkApp());
    expect(find.text('Damk 3alena'), findsWidgets);
  });
}
