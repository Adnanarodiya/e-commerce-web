-- Database Schema for BloomShop

-- 1. Create books table
CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ur TEXT NOT NULL,
  price NUMERIC NOT NULL,
  description_en TEXT,
  description_ur TEXT,
  image TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  weight INTEGER NOT NULL DEFAULT 80, -- Weight in grams (default 80g per book)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY, -- We'll use order IDs like "NM-123456"
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  delivery_type TEXT NOT NULL, -- 'courier' | 'post' | 'in_person'
  payment_type TEXT NOT NULL,  -- 'cash' | 'bank'
  subtotal NUMERIC NOT NULL,
  discount NUMERIC NOT NULL DEFAULT 0,
  packaging_charge NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'ready_to_pack' | 'packed'
  payment_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
  book_id INTEGER REFERENCES books(id) ON DELETE SET NULL,
  book_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price NUMERIC NOT NULL
);

-- 4. Create settings table (for QR Code, UPI ID etc.)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Insert default settings
INSERT INTO settings (key, value) VALUES
('upi_id', '9426880068@kotak')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO settings (key, value) VALUES
('payee_name', 'ADNAN IBADULLAH ARODIYA')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO settings (key, value) VALUES
('qr_code_url', '/images/qr-code.png')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Seed default books only if the table is empty (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM books) THEN
    INSERT INTO books (name_en, name_ur, price, description_en, description_ur, image, stock, weight) VALUES
    ('Makhfoozat Ka Aasan Nisab', 'ملفوظات کا آسان نصاب', 150, 'An easy-to-learn syllabus of memorized passages, prayers, and basic Islamic teachings designed specifically for young students and beginners.', 'ملفوظات، دعائیں اور بنیادی اسلامی تعلیمات کا ایک آسان نصاب جو خاص طور پر نوجوان طلباء اور مبتدیوں کے لیے تیار کیا گیا ہے۔', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRK_84LHfiZSUCzdVOn1mJwIQEg-jTv-dWckEO2p8MqzQ&s=10', 50, 80),
    ('Bachon Ka Tohfa - Part 1', 'بچوں کا تحفہ - حصہ اول', 160, 'Part 1 of the introductory Islamic learning guide for young kids. Focuses on foundational moral values, basic beliefs, and engaging learning exercises.', 'چھوٹے بچوں کے لیے تعارفی اسلامی سیکھنے کی گائیڈ کا پہلا حصہ۔ بنیادی اخلاقی اقدار، عقائد اور سیکھنے کی مشقوں پر توجہ مرکوز کرتا ہے۔', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRUl8sNjlvktA5XILdFZhIV7ddHdgjhJTJOK3z4VDUBRQ&s=10', 60, 80),
    ('Bachon Ka Tohfa - Part 2', 'بچوں کا تحفہ - حصہ دوم', 180, 'Part 2 of the popular series ''Bachon Ka Tohfa''. Includes advanced lessons on Islamic ethics, stories of the prophets, and daily practices for children.', 'مقبول سیریز ''بچوں کا تحفہ'' کا دوسرا حصہ۔ اس میں بچوں کے لیے اسلامی اخلاقیات، انبیاء کے قصص اور روزمرہ کے معمولات پر اسباق شامل ہیں۔', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfBo68cmQqfaQqRxNrkFh1d4ItA2QzZzm75O78qK6vL_w&s=10', 45, 90),
    ('Bachon Ko Hifz Kaise Karayein', 'بچوں کو حفظ کیسے کروائیں', 220, 'A comprehensive guidebook for parents and educators outlining practical, time-tested methods to help children memorize the Holy Quran easily and effectively.', 'والدین اور اساتذہ کے لیے ایک جامع گائیڈ بک جس میں بچوں کو قرآن پاک کو آسانی اور مؤثر طریقے سے یاد کرنے میں مدد دینے کے عملی طریقے بیان کیے گئے ہیں۔', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxTDMnupNp_7Wfb-ORBe8M9B727TN_r98f9VwF9mFIFQ&s=10', 2, 120),
    ('Noorani Urdu Qaida', 'نورانی اردو قاعدہ', 120, 'A beautifully structured guide for children to learn basic Urdu letters, pronunciation, and vocabulary in a step-by-step interactive manner.', 'بچوں کے لیے بنیادی اردو حروف، تلفظ اور الفاظ کو مرحلہ وار انٹرایکٹو طریقے سے سیکھنے کے لیے ایک خوبصورت گائیڈ۔', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8NTKfzHLIyjKK9DCpC51frO1uB0xvpU7_jWPQ_DtI6CnUQIcdGRj_j88&s=10', 0, 80),
    ('Deeniyat Course - Beginner Guide', 'دینیات کورس - مبتدی گائیڈ', 140, 'An essential starter course book for basic Deeniyat studies, covering daily prayers, Islamic supplications, and fundamental manners.', 'بنیادی دینیات کے مطالعہ کے لیے ایک ضروری تعارفی کتاب، جس میں روزمرہ کی نمازیں، دعائیں اور بنیادی آداب شامل ہیں۔', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsheDpskd6NSFI-wNQkb26vFS6Epk3gb-xgBmHBf5Kq284bGzjIPOYSSk&s=10', 80, 100),
    ('Taysirul Quran', 'تیسیرالقرآن - آسان اردو ترجمہ مع تشریحی فوائد', 750, 'An easy Urdu translation of the Holy Quran with explanatory benefits, designed for beginners and general readers.', 'قرآن پاک کا آسان اردو ترجمہ، تشریحی فوائد کے ساتھ، جو مبتدیوں اور عام قارئین کے لیے تیار کیا گیا ہے۔', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRK_84LHfiZSUCzdVOn1mJwIQEg-jTv-dWckEO2p8MqzQ&s=10', 20, 600),
    ('Rauzatul Atfal', 'روضۃ الاطفال', 90, 'A foundational book teaching children the recitation of the Holy Quran from the very beginning, step by step.', 'بچوں کو قرآن پاک کی تلاوت ابتدا سے، مرحلہ وار سکھانے والی بنیادی کتاب۔', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRUl8sNjlvktA5XILdFZhIV7ddHdgjhJTJOK3z4VDUBRQ&s=10', 80, 80),
    ('Haroof-e-Tahajji Takhti', 'حروف تہجی تختی (جدید)', 10, 'A modern tablet board printed with the Arabic alphabet to help young children recognize and learn the letters.', 'بچوں کو حروف پہچاننے اور سیکھنے میں مدد کے لیے جدید تختی جس پر عربی حروف درج ہیں۔', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8NTKfzHLIyjKK9DCpC51frO1uB0xvpU7_jWPQ_DtI6CnUQIcdGRj_j88&s=10', 200, 80),
    ('Syllabus Of Maktab', 'نصاب مکتب', 100, 'The complete syllabus guide for maktab teachers, outlining what to teach at each stage of a child''s learning.', 'مکتب کے اساتذہ کے لیے مکمل نصاب گائیڈ، جس میں بچے کی سیکھنے کی ہر منزل پر کیا پڑھانا ہے اس کی تفصیل دی گئی ہے۔', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsheDpskd6NSFI-wNQkb26vFS6Epk3gb-xgBmHBf5Kq284bGzjIPOYSSk&s=10', 100, 80);
  END IF;
END
$$;
