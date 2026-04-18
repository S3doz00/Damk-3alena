-- ============================================
-- Damk 3alena - Seed Jordanian Hospitals & Blood Banks
-- 003_seed_facilities.sql
-- ============================================

INSERT INTO facilities (name, type, address, city, region, latitude, longitude, phone, working_hours) VALUES
    ('King Hussein Cancer Center', 'hospital', 'Queen Rania Al Abdullah St', 'Amman', 'Amman', 32.0045, 35.8750, '+962-6-5300460', 'Sun-Thu 08:00-16:00'),
    ('Jordan University Hospital', 'hospital', 'Queen Rania St, University of Jordan', 'Amman', 'Amman', 32.0075, 35.8747, '+962-6-5353444', 'Sun-Thu 08:00-17:00'),
    ('Al-Bashir Hospital', 'hospital', 'Al-Ashrafiyah', 'Amman', 'Amman', 31.9519, 35.9439, '+962-6-4756400', 'Sun-Sat 00:00-23:59'),
    ('King Abdullah University Hospital', 'hospital', 'Ar-Ramtha', 'Irbid', 'North', 32.5017, 35.9942, '+962-2-7200600', 'Sun-Thu 08:00-16:00'),
    ('Prince Hamzah Hospital', 'hospital', 'Tabarbour', 'Amman', 'Amman', 31.9844, 35.9361, '+962-6-5737100', 'Sun-Sat 00:00-23:59'),
    ('Al-Khalidi Hospital', 'hospital', 'Ibn Khaldoun St', 'Amman', 'Amman', 31.9503, 35.9036, '+962-6-4644281', 'Sun-Sat 00:00-23:59'),
    ('Islamic Hospital', 'hospital', 'Abdali', 'Amman', 'Amman', 31.9669, 35.9078, '+962-6-5680680', 'Sun-Sat 00:00-23:59'),
    ('Princess Basma Hospital', 'hospital', 'Al-Barha', 'Irbid', 'North', 32.5568, 35.8570, '+962-2-7245211', 'Sun-Thu 08:00-16:00'),
    ('National Blood Bank', 'blood_bank', 'Jabal Al-Hussein', 'Amman', 'Amman', 31.9592, 35.9183, '+962-6-5664111', 'Sun-Thu 08:00-15:00'),
    ('Jordan Red Crescent Blood Bank', 'blood_bank', 'Shmeisani', 'Amman', 'Amman', 31.9720, 35.8965, '+962-6-5685432', 'Sun-Thu 08:00-14:00'),
    ('Zarqa Governmental Hospital', 'hospital', 'Al-Zarqa', 'Zarqa', 'Central', 32.0632, 36.0875, '+962-5-3986700', 'Sun-Sat 00:00-23:59'),
    ('Prince Faisal Hospital', 'hospital', 'Al-Salt', 'Salt', 'Central', 32.0372, 35.7285, '+962-5-3553091', 'Sun-Thu 08:00-16:00'),
    ('Aqaba Hospital', 'hospital', 'Aqaba', 'Aqaba', 'South', 29.5267, 35.0078, '+962-3-2014111', 'Sun-Sat 00:00-23:59'),
    ('Ma''an Governmental Hospital', 'hospital', 'Ma''an', 'Ma''an', 'South', 30.1962, 35.7341, '+962-3-2132861', 'Sun-Thu 08:00-16:00'),
    ('Karak Governmental Hospital', 'hospital', 'Al-Karak', 'Karak', 'South', 31.1832, 35.7052, '+962-3-2352121', 'Sun-Thu 08:00-16:00');
