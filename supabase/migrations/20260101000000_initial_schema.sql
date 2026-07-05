-- ============= EXTENSIONS =============
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============= USERS (Base table for all roles) =============
CREATE TABLE public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'CUSTOMER'
              CHECK (role IN ('CUSTOMER', 'CLEANER', 'ADMIN')),
  avatar      TEXT,
  address     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============= PLANS =============
CREATE TABLE public.plans (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT NOT NULL,
  monthly_price  NUMERIC(10,2) NOT NULL,
  total_washes   INTEGER NOT NULL,
  description    TEXT NOT NULL,
  features       JSONB NOT NULL DEFAULT '[]',
  popular        BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============= CUSTOMERS =============
CREATE TABLE public.customers (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  active_plan_id     UUID REFERENCES public.plans(id),
  subscription_start TIMESTAMPTZ,
  subscription_end   TIMESTAMPTZ,
  remaining_washes   INTEGER NOT NULL DEFAULT 0,
  status             TEXT NOT NULL DEFAULT 'ACTIVE'
                     CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============= CLEANERS =============
CREATE TABLE public.cleaners (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'ACTIVE'
                  CHECK (status IN ('ACTIVE', 'INACTIVE', 'ON_LEAVE')),
  rating          NUMERIC(3,2) NOT NULL DEFAULT 5.0,
  total_completed INTEGER NOT NULL DEFAULT 0,
  total_assigned  INTEGER NOT NULL DEFAULT 0,
  vehicle_number  TEXT,
  zone            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============= CARS =============
CREATE TABLE public.cars (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id   UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  make          TEXT NOT NULL,
  model         TEXT NOT NULL,
  year          INTEGER NOT NULL,
  license_plate TEXT NOT NULL,
  color         TEXT NOT NULL,
  details       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============= BOOKINGS =============
CREATE TABLE public.bookings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id   UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  car_id        UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  cleaner_id    UUID REFERENCES public.cleaners(id) ON DELETE SET NULL,
  date          TIMESTAMPTZ NOT NULL,
  time_slot     TEXT NOT NULL,
  duration      INTEGER NOT NULL DEFAULT 60,
  address       TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'PENDING'
                CHECK (status IN ('PENDING','ASSIGNED','IN_PROGRESS','COMPLETED','MISSED','CANCELLED')),
  miss_reason   TEXT,
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============= PHOTOS =============
CREATE TABLE public.photos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id  UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL,
  type        TEXT NOT NULL DEFAULT 'AFTER'
              CHECK (type IN ('BEFORE', 'AFTER', 'PROGRESS')),
  image_url   TEXT NOT NULL,
  file_name   TEXT,
  file_size   INTEGER,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============= PAYMENTS =============
CREATE TABLE public.payments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id   UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  plan_name     TEXT NOT NULL,
  amount        NUMERIC(10,2) NOT NULL,
  period        TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'PENDING'
                CHECK (status IN ('PENDING', 'PAID', 'OVERDUE', 'REFUNDED')),
  method        TEXT CHECK (method IN ('CASH', 'UPI', 'CARD', 'BANK_TRANSFER')),
  paid_at       TIMESTAMPTZ,
  due_date      TIMESTAMPTZ NOT NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============= NOTIFICATIONS =============
CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  related_id  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============= ATTENDANCE =============
CREATE TABLE public.attendance (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cleaner_id     UUID NOT NULL REFERENCES public.cleaners(id) ON DELETE CASCADE,
  date           TIMESTAMPTZ NOT NULL,
  check_in_time  TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  total_hours    NUMERIC(5,2),
  status         TEXT NOT NULL DEFAULT 'ABSENT'
                 CHECK (status IN ('PRESENT', 'ABSENT', 'HALF_DAY')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============= SUBSCRIPTION REQUESTS =============
CREATE TABLE public.subscription_requests (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id       UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  requested_plan_id UUID NOT NULL REFERENCES public.plans(id),
  current_plan_id   UUID,
  status            TEXT NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============= AUTO-UPDATE updated_at =============
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_plans_updated_at BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_cleaners_updated_at BEFORE UPDATE ON cleaners FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_cars_updated_at BEFORE UPDATE ON cars FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_sub_requests_updated_at BEFORE UPDATE ON subscription_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============= TRIGGER: Auto-create User Profile on Signup =============
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'CUSTOMER')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============= RLS POLICIES =============
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaners ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_requests ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admins can read all users" ON users FOR SELECT USING (get_user_role() = 'ADMIN');
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Anyone can read plans" ON plans FOR SELECT USING (true);
CREATE POLICY "Admins can manage plans" ON plans FOR ALL USING (get_user_role() = 'ADMIN');

CREATE POLICY "Customer reads own record" ON customers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can manage customers" ON customers FOR ALL USING (get_user_role() = 'ADMIN');

CREATE POLICY "Cleaner reads own record" ON cleaners FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can manage cleaners" ON cleaners FOR ALL USING (get_user_role() = 'ADMIN');

CREATE POLICY "Customer reads own cars" ON cars FOR SELECT USING (
  customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can manage cars" ON cars FOR ALL USING (get_user_role() = 'ADMIN');

CREATE POLICY "Customer reads own bookings" ON bookings FOR SELECT USING (
  customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
);
CREATE POLICY "Cleaner reads assigned bookings" ON bookings FOR SELECT USING (
  cleaner_id IN (SELECT id FROM cleaners WHERE user_id = auth.uid())
);
CREATE POLICY "Cleaner updates assigned bookings" ON bookings FOR UPDATE USING (
  cleaner_id IN (SELECT id FROM cleaners WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can manage bookings" ON bookings FOR ALL USING (get_user_role() = 'ADMIN');

CREATE POLICY "Users read photos of their bookings" ON photos FOR SELECT USING (
  booking_id IN (
    SELECT id FROM bookings WHERE
      customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
      OR cleaner_id IN (SELECT id FROM cleaners WHERE user_id = auth.uid())
  )
);
CREATE POLICY "Cleaners insert photos" ON photos FOR INSERT WITH CHECK (get_user_role() = 'CLEANER');
CREATE POLICY "Admins manage photos" ON photos FOR ALL USING (get_user_role() = 'ADMIN');

CREATE POLICY "Customer reads own payments" ON payments FOR SELECT USING (
  customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can manage payments" ON payments FOR ALL USING (get_user_role() = 'ADMIN');

CREATE POLICY "User reads own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "User updates own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System/Admin inserts notifications" ON notifications FOR INSERT WITH CHECK (get_user_role() = 'ADMIN');

CREATE POLICY "Cleaner reads own attendance" ON attendance FOR SELECT USING (
  cleaner_id IN (SELECT id FROM cleaners WHERE user_id = auth.uid())
);
CREATE POLICY "Cleaner manages own attendance" ON attendance FOR INSERT WITH CHECK (
  cleaner_id IN (SELECT id FROM cleaners WHERE user_id = auth.uid())
);
CREATE POLICY "Cleaner updates own attendance" ON attendance FOR UPDATE USING (
  cleaner_id IN (SELECT id FROM cleaners WHERE user_id = auth.uid())
);
CREATE POLICY "Admins manage attendance" ON attendance FOR ALL USING (get_user_role() = 'ADMIN');

CREATE POLICY "Customer reads own requests" ON subscription_requests FOR SELECT USING (
  customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
);
CREATE POLICY "Customer creates requests" ON subscription_requests FOR INSERT WITH CHECK (
  customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
);
CREATE POLICY "Admins manage requests" ON subscription_requests FOR ALL USING (get_user_role() = 'ADMIN');
