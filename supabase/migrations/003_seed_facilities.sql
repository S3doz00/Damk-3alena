-- ============================================
-- Damk 3alena - Seed Jordanian Hospitals & Blood Banks
-- 003_seed_facilities.sql
-- ============================================

INSERT INTO facilities (name, type, address, city, region, latitude, longitude, phone, working_hours) VALUES
    ('King Hussein Cancer Center', 'hospital', 'Queen Rania Al Abdullah St', 'Amman', 'Amman', 31.9770, 35.8570, '+962-6-5300460', 'Sun-Thu 08:00-16:00'),
    ('Jordan University Hospital', 'hospital', 'Queen Rania St, University of Jordan', 'Amman', 'Amman', 32.0137, 35.8740, '+962-6-5353444', 'Sun-Thu 08:00-17:00'),
    ('Al-Bashir Hospital', 'hospital', 'Al-Ashrafiyah', 'Amman', 'Amman', 31.9530, 35.9460, '+962-6-4756400', 'Sun-Sat 00:00-23:59'),
    ('King Abdullah University Hospital', 'hospital', 'Ar-Ramtha', 'Irbid', 'North', 32.5220, 35.9880, '+962-2-7200600', 'Sun-Thu 08:00-16:00'),
    ('Prince Hamzah Hospital', 'hospital', 'Marj Al-Hamam', 'Amman', 'Amman', 31.9230, 35.8310, '+962-6-5737100', 'Sun-Sat 00:00-23:59'),
    ('Al-Khalidi Hospital', 'hospital', 'Ibn Khaldoun St', 'Amman', 'Amman', 31.9560, 35.9110, '+962-6-4644281', 'Sun-Sat 00:00-23:59'),
    ('Islamic Hospital', 'hospital', 'Abdali', 'Amman', 'Amman', 31.9620, 35.9080, '+962-6-5680680', 'Sun-Sat 00:00-23:59'),
    ('Princess Basma Hospital', 'hospital', 'Jabal Al-Ashrafiyeh', 'Irbid', 'North', 32.5510, 35.8520, '+962-2-7245211', 'Sun-Thu 08:00-16:00'),
    ('National Blood Bank', 'blood_bank', 'Jabal Al-Hussein', 'Amman', 'Amman', 31.9610, 35.9200, '+962-6-5664111', 'Sun-Thu 08:00-15:00'),
    ('Jordan Red Crescent Blood Bank', 'blood_bank', 'Shmeisani', 'Amman', 'Amman', 31.9740, 35.8950, '+962-6-5685432', 'Sun-Thu 08:00-14:00'),
    ('Zarqa Governmental Hospital', 'hospital', 'Al-Zarqa', 'Zarqa', 'Central', 32.0660, 36.0880, '+962-5-3986700', 'Sun-Sat 00:00-23:59'),
    ('Prince Faisal Hospital', 'hospital', 'Al-Salt', 'Salt', 'Central', 32.0390, 35.7270, '+962-5-3553091', 'Sun-Thu 08:00-16:00'),
    ('Aqaba Hospital', 'hospital', 'Aqaba', 'Aqaba', 'South', 29.5270, 35.0070, '+962-3-2014111', 'Sun-Sat 00:00-23:59'),
    ('Ma''an Governmental Hospital', 'hospital', 'Ma''an', 'Ma''an', 'South', 30.1960, 35.7340, '+962-3-2132861', 'Sun-Thu 08:00-16:00'),
    ('Karak Governmental Hospital', 'hospital', 'Al-Karak', 'Karak', 'South', 31.1850, 35.7040, '+962-3-2352121', 'Sun-Thu 08:00-16:00');
