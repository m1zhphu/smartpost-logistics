from typing import Optional
import datetime
import decimal

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKeyConstraint, Integer, Numeric, PrimaryKeyConstraint, Sequence, String, Text, UniqueConstraint, text, ForeignKey, Identity, and_
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from datetime import datetime # Đảm bảo import đúng class datetime

from core.database import Base


class Departments(Base):
    __tablename__ = 'departments'
    __table_args__ = (
        PrimaryKeyConstraint('department_id', name='departments_pkey'),
        UniqueConstraint('department_code', name='departments_department_code_key')
    )

    department_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    department_code: Mapped[str] = mapped_column(String(50), nullable=False)
    department_name: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[Optional[bool]] = mapped_column(Boolean, server_default=text('true'))

    users: Mapped[list['Users']] = relationship('Users', back_populates='department')


class Hubs(Base):
    __tablename__ = 'hubs'
    __table_args__ = (
        ForeignKeyConstraint(['manager_id'], ['users.user_id'], name='fk_hubs_manager'),
        PrimaryKeyConstraint('hub_id', name='hubs_pkey'),
        UniqueConstraint('hub_code', name='hubs_hub_code_key')
    )

    hub_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    hub_code: Mapped[str] = mapped_column(String(20), nullable=False)
    hub_name: Mapped[str] = mapped_column(String(150), nullable=False)
    hub_type: Mapped[Optional[str]] = mapped_column(String(50))
    province_id: Mapped[Optional[int]] = mapped_column(Integer)
    address_detail: Mapped[Optional[str]] = mapped_column(String(255))
    manager_id: Mapped[Optional[int]] = mapped_column(Integer)
    status: Mapped[Optional[bool]] = mapped_column(Boolean, server_default=text('true'))

    manager: Mapped[Optional['Users']] = relationship('Users', foreign_keys=[manager_id], back_populates='hubs_manager')
    users_primary_hub: Mapped[list['Users']] = relationship('Users', foreign_keys='[Users.primary_hub_id]', back_populates='primary_hub')
    bags: Mapped[list['Bags']] = relationship('Bags', back_populates='dest_hub')
    incidents: Mapped[list['Incidents']] = relationship('Incidents', back_populates='hub')
    manifests_from_hub: Mapped[list['Manifests']] = relationship('Manifests', foreign_keys='[Manifests.from_hub_id]', back_populates='from_hub')
    manifests_to_hub: Mapped[list['Manifests']] = relationship('Manifests', foreign_keys='[Manifests.to_hub_id]', back_populates='to_hub')
    user_data_access: Mapped[list['UserDataAccess']] = relationship('UserDataAccess', back_populates='accessible_hub')
    booking_requests: Mapped[list['BookingRequests']] = relationship('BookingRequests', back_populates='target_hub')
    waybills_dest_hub: Mapped[list['Waybills']] = relationship('Waybills', foreign_keys='[Waybills.dest_hub_id]', back_populates='dest_hub')
    waybills_origin_hub: Mapped[list['Waybills']] = relationship('Waybills', foreign_keys='[Waybills.origin_hub_id]', back_populates='origin_hub')


class MailTrips(Base):
    __tablename__ = 'mail_trips'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='mail_trips_pkey'),
        UniqueConstraint('trip_code', name='mail_trips_trip_code_key')
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    trip_code: Mapped[str] = mapped_column(String(50), nullable=False)
    transport_method: Mapped[Optional[str]] = mapped_column(String(50))
    vehicle_plate: Mapped[Optional[str]] = mapped_column(String(20))
    driver_phone: Mapped[Optional[str]] = mapped_column(String(20))
    departure_time: Mapped[Optional[datetime]] = mapped_column(DateTime)
    status: Mapped[Optional[str]] = mapped_column(String(20))


class PaymentTransactions(Base):
    __tablename__ = 'payment_transactions'
    __table_args__ = (
        PrimaryKeyConstraint('transaction_id', name='payment_transactions_pkey'),
    )

    transaction_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    statement_id: Mapped[Optional[int]] = mapped_column(Integer)
    amount_paid: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(15, 2))
    bank_ref_code: Mapped[Optional[str]] = mapped_column(String(100))
    payment_date: Mapped[Optional[datetime]] = mapped_column(DateTime)


class PricingPolicies(Base):
    __tablename__ = 'pricing_policies'
    __table_args__ = (
        PrimaryKeyConstraint('policy_id', name='pricing_policies_pkey'),
        UniqueConstraint('policy_code', name='pricing_policies_policy_code_key')
    )

    policy_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    policy_code: Mapped[str] = mapped_column(String(50), nullable=False)
    policy_name: Mapped[str] = mapped_column(String(255), nullable=False)
    policy_type: Mapped[str] = mapped_column(String(20), nullable=False)
    valid_from: Mapped[Optional[datetime]] = mapped_column(DateTime)
    valid_to: Mapped[Optional[datetime]] = mapped_column(DateTime)
    is_approved: Mapped[Optional[bool]] = mapped_column(Boolean, server_default=text('false'))
    is_active: Mapped[Optional[bool]] = mapped_column(Boolean, server_default=text('true'))

    customer_price_mapping: Mapped[list['CustomerPriceMapping']] = relationship('CustomerPriceMapping', back_populates='policy')

    rules: Mapped[list['PricingRules']] = relationship('PricingRules', back_populates='policy')

class Roles(Base):
    __tablename__ = 'roles'
    __table_args__ = (
        PrimaryKeyConstraint('role_id', name='roles_pkey'),
    )

    role_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    role_name: Mapped[str] = mapped_column(String(100), nullable=False)
    permissions: Mapped[Optional[dict]] = mapped_column(JSONB)
    is_active: Mapped[Optional[bool]] = mapped_column(Boolean, server_default=text('true'))

    users: Mapped[list['Users']] = relationship('Users', back_populates='role')


class SystemConfigs(Base):
    __tablename__ = 'system_configs'
    __table_args__ = (
        PrimaryKeyConstraint('config_key', name='system_configs_pkey'),
    )

    config_key: Mapped[str] = mapped_column(String(100), primary_key=True)
    config_value: Mapped[Optional[str]] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text)


class TrackingLogs(Base):
    __tablename__ = 'tracking_logs'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='tracking_logs_pkey'),
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(start=1), primary_key=True)
    system_time: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    waybill_id: Mapped[Optional[int]] = mapped_column(BigInteger)
    status_id: Mapped[Optional[str]] = mapped_column(String(100))
    user_id: Mapped[Optional[int]] = mapped_column(Integer)
    hub_id: Mapped[Optional[int]] = mapped_column(Integer)
    manifest_id: Mapped[Optional[int]] = mapped_column(BigInteger)
    action_time: Mapped[Optional[datetime]] = mapped_column(DateTime)

    note: Mapped[Optional[str]] = mapped_column(Text)

class TrackingLogsCurrent(Base):
    __tablename__ = 'tracking_logs_current'
    __table_args__ = (
        PrimaryKeyConstraint('id', 'system_time', name='tracking_logs_current_pkey'),
    )

    id: Mapped[int] = mapped_column(BigInteger, Sequence('tracking_logs_id_seq'), primary_key=True)
    system_time: Mapped[datetime] = mapped_column(DateTime, primary_key=True)
    waybill_id: Mapped[Optional[int]] = mapped_column(BigInteger)
    status_id: Mapped[Optional[str]] = mapped_column(String(100))
    user_id: Mapped[Optional[int]] = mapped_column(Integer)
    hub_id: Mapped[Optional[int]] = mapped_column(Integer)
    manifest_id: Mapped[Optional[int]] = mapped_column(BigInteger)
    action_time: Mapped[Optional[datetime]] = mapped_column(DateTime)

    note: Mapped[Optional[str]] = mapped_column(Text)

class Users(Base):
    __tablename__ = 'users'
    __table_args__ = (
        ForeignKeyConstraint(['customer_id'], ['customers.customer_id'], name='users_customer_id_fkey'),
        ForeignKeyConstraint(['department_id'], ['departments.department_id'], name='users_department_id_fkey'),
        ForeignKeyConstraint(['managed_by_cskh_id'], ['users.user_id'], name='users_managed_by_cskh_id_fkey'),
        ForeignKeyConstraint(['primary_hub_id'], ['hubs.hub_id'], name='users_primary_hub_id_fkey'),
        ForeignKeyConstraint(['role_id'], ['roles.role_id'], name='users_role_id_fkey'),
        PrimaryKeyConstraint('user_id', name='users_pkey'),
        UniqueConstraint('username', name='users_username_key')
    )

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(50), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone_number: Mapped[Optional[str]] = mapped_column(String(20))
    email: Mapped[Optional[str]] = mapped_column(String(150), unique=True, index=True)
    role_id: Mapped[Optional[int]] = mapped_column(Integer)
    customer_id: Mapped[Optional[int]] = mapped_column(Integer)
    department_id: Mapped[Optional[int]] = mapped_column(Integer)
    primary_hub_id: Mapped[Optional[int]] = mapped_column(Integer)
    managed_by_cskh_id: Mapped[Optional[int]] = mapped_column(Integer)
    vehicle_plate: Mapped[Optional[str]] = mapped_column(String(50))
    status: Mapped[Optional[bool]] = mapped_column(Boolean, server_default=text('true'))
    push_token: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_online: Mapped[bool] = mapped_column(Boolean, server_default=text('false'), default=False)
    online_status_updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    last_seen_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    hubs_manager: Mapped[list['Hubs']] = relationship('Hubs', foreign_keys='[Hubs.manager_id]', back_populates='manager')
    department: Mapped[Optional['Departments']] = relationship('Departments', back_populates='users')
    primary_hub: Mapped[Optional['Hubs']] = relationship('Hubs', foreign_keys=[primary_hub_id], back_populates='users_primary_hub')
    role: Mapped[Optional['Roles']] = relationship('Roles', back_populates='users')
    customer_account: Mapped[Optional['Customers']] = relationship('Customers', foreign_keys=[customer_id], back_populates='user_accounts')
    bags: Mapped[list['Bags']] = relationship('Bags', back_populates='users')
    customers: Mapped[list['Customers']] = relationship('Customers', foreign_keys='[Customers.staff_in_charge_id]', back_populates='staff_in_charge')
    incidents: Mapped[list['Incidents']] = relationship('Incidents', back_populates='users')
    manifests: Mapped[list['Manifests']] = relationship('Manifests', back_populates='shipper')
    pods_created_by: Mapped[list['Pods']] = relationship('Pods', foreign_keys='[Pods.created_by]', back_populates='users')
    pods_shipper: Mapped[list['Pods']] = relationship('Pods', foreign_keys='[Pods.shipper_id]', back_populates='shipper')
    support_tickets: Mapped[list['SupportTickets']] = relationship('SupportTickets', back_populates='users')
    user_data_access: Mapped[list['UserDataAccess']] = relationship('UserDataAccess', back_populates='user')
    booking_requests: Mapped[list['BookingRequests']] = relationship('BookingRequests', back_populates='assigned_shipper')
    incident_logs: Mapped[list['IncidentLogs']] = relationship('IncidentLogs', back_populates='users')
    delivery_results: Mapped[list['DeliveryResults']] = relationship('DeliveryResults', back_populates='shipper')
    managed_by_cskh: Mapped[Optional['Users']] = relationship('Users', remote_side=[user_id], foreign_keys=[managed_by_cskh_id])

    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text('true'), default=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean, server_default=text('false'), default=False)

    @property
    def accessible_hub_ids(self):
        return [access.accessible_hub_id for access in self.user_data_access if access.accessible_hub_id]

    @property
    def accessible_hubs(self):
        return [access.accessible_hub for access in self.user_data_access if access.accessible_hub]
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=text('now()'), default=datetime.utcnow)
    
class Vendors(Base):
    __tablename__ = 'vendors'
    __table_args__ = (
        PrimaryKeyConstraint('vendor_id', name='vendors_pkey'),
        UniqueConstraint('vendor_code', name='vendors_vendor_code_key')
    )

    vendor_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    vendor_code: Mapped[str] = mapped_column(String(50), nullable=False)
    vendor_name: Mapped[str] = mapped_column(String(255), nullable=False)
    service_type: Mapped[Optional[str]] = mapped_column(String(50))
    status: Mapped[Optional[bool]] = mapped_column(Boolean, server_default=text('true'))

    manifests: Mapped[list['Manifests']] = relationship('Manifests', back_populates='vendor')


class Bags(Base):
    __tablename__ = 'bags'
    __table_args__ = (
        ForeignKeyConstraint(['created_by'], ['users.user_id'], name='bags_created_by_fkey'),
        ForeignKeyConstraint(['dest_hub_id'], ['hubs.hub_id'], name='bags_dest_hub_id_fkey'),
        ForeignKeyConstraint(['customer_id'], ['customers.customer_id'], name='bags_customer_id_fkey'),
        ForeignKeyConstraint(['booking_request_id'], ['booking_requests.request_id'], name='bags_booking_request_id_fkey'),
        PrimaryKeyConstraint('bag_id', name='bags_pkey'),
        UniqueConstraint('bag_code', name='bags_bag_code_key')
    )

    bag_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    bag_code: Mapped[str] = mapped_column(String(50), nullable=False)
    seal_number: Mapped[Optional[str]] = mapped_column(String(50))
    dest_hub_id: Mapped[Optional[int]] = mapped_column(Integer)
    total_weight: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(10, 2))
    created_by: Mapped[Optional[int]] = mapped_column(Integer)
    status: Mapped[Optional[str]] = mapped_column(String(50))
    
    # NEW FIELDS FOR PICKUP BAGS
    bag_type: Mapped[Optional[str]] = mapped_column(String(20), server_default=text("'EXPORT'")) # PICKUP hoặc EXPORT
    est_quantity: Mapped[Optional[int]] = mapped_column(Integer)
    pickup_time: Mapped[Optional[datetime]] = mapped_column(DateTime)
    customer_id: Mapped[Optional[int]] = mapped_column(Integer)
    booking_request_id: Mapped[Optional[int]] = mapped_column(Integer, unique=True)
    product_type: Mapped[Optional[str]] = mapped_column(String(50))
    actual_quantity: Mapped[Optional[int]] = mapped_column(Integer, server_default=text('0'))
    materialization_status: Mapped[Optional[str]] = mapped_column(String(30), server_default=text("'PENDING'"))
    received_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    opened_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    users: Mapped[Optional['Users']] = relationship('Users', back_populates='bags')
    dest_hub: Mapped[Optional['Hubs']] = relationship('Hubs', back_populates='bags')
    customer: Mapped[Optional['Customers']] = relationship('Customers')
    booking_request: Mapped[Optional['BookingRequests']] = relationship('BookingRequests', back_populates='pickup_bag')
    bag_items: Mapped[list['BagItems']] = relationship('BagItems', back_populates='bag')

    manifest_details: Mapped[list['ManifestDetails']] = relationship('ManifestDetails', back_populates='bag')

    @property
    def customer_code(self):
        return self.customer.customer_code if self.customer else None

    @property
    def customer_name(self):
        return self.customer.company_name if self.customer else None

    @property
    def shipper_name(self):
        return self.users.full_name if self.users else None



class CustomerDepartments(Base):
    __tablename__ = 'customer_departments'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='customer_departments_pkey'),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    customer_id: Mapped[int] = mapped_column(Integer, ForeignKey('customers.customer_id', ondelete='CASCADE'), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=text('now()'), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=text('now()'), default=datetime.utcnow, onupdate=datetime.utcnow)

    customer: Mapped['Customers'] = relationship('Customers', back_populates='departments')


class Customers(Base):
    __tablename__ = 'customers'
    __table_args__ = (
        ForeignKeyConstraint(['parent_customer_id'], ['customers.customer_id'], name='customers_parent_customer_id_fkey'),
        ForeignKeyConstraint(['staff_in_charge_id'], ['users.user_id'], name='customers_staff_in_charge_id_fkey'),
        PrimaryKeyConstraint('customer_id', name='customers_pkey'),
        UniqueConstraint('customer_code', name='customers_customer_code_key')
    )

    customer_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    customer_code: Mapped[str] = mapped_column(String(50), nullable=False)
    customer_type: Mapped[str] = mapped_column(String(20), nullable=False)
    tax_code: Mapped[Optional[str]] = mapped_column(String(50))
    company_name: Mapped[Optional[str]] = mapped_column(String(255))
    transaction_name: Mapped[Optional[str]] = mapped_column(String(255))
    email: Mapped[Optional[str]] = mapped_column(String(150), unique=True, index=True)
    phone_number: Mapped[Optional[str]] = mapped_column(String(20))
    identity_no: Mapped[Optional[str]] = mapped_column(String(50))
    representative_name: Mapped[Optional[str]] = mapped_column(String(100))
    province_id: Mapped[Optional[int]] = mapped_column(Integer)
    district_id: Mapped[Optional[int]] = mapped_column(Integer)
    ward_id: Mapped[Optional[int]] = mapped_column(Integer)
    country: Mapped[Optional[str]] = mapped_column(String(100))
    province_name: Mapped[Optional[str]] = mapped_column(String(150))
    ward_name: Mapped[Optional[str]] = mapped_column(String(150))
    street_address: Mapped[Optional[str]] = mapped_column(String(255))
    address_detail: Mapped[Optional[str]] = mapped_column(String(255))
    # Old province name before 2025 administrative merger - used for sorting/loading onto vehicles
    old_province: Mapped[Optional[str]] = mapped_column(String(150))
    parent_customer_id: Mapped[Optional[int]] = mapped_column(Integer)
    staff_in_charge_id: Mapped[Optional[int]] = mapped_column(Integer)
    status: Mapped[Optional[str]] = mapped_column(String(20), server_default=text("'ACTIVE'::character varying"))

    parent_customer: Mapped[Optional['Customers']] = relationship('Customers', remote_side=[customer_id], back_populates='parent_customer_reverse')
    parent_customer_reverse: Mapped[list['Customers']] = relationship('Customers', remote_side=[parent_customer_id], back_populates='parent_customer')
    staff_in_charge: Mapped[Optional['Users']] = relationship('Users', foreign_keys=[staff_in_charge_id], back_populates='customers')
    user_accounts: Mapped[list['Users']] = relationship('Users', foreign_keys='[Users.customer_id]', back_populates='customer_account')
    bank_accounts: Mapped[Optional['BankAccounts']] = relationship('BankAccounts', uselist=False, back_populates='customer')
    booking_requests: Mapped[list['BookingRequests']] = relationship('BookingRequests', back_populates='customer')
    customer_price_mapping: Mapped[list['CustomerPriceMapping']] = relationship('CustomerPriceMapping', back_populates='customer')
    statement_cod: Mapped[list['StatementCOD']] = relationship('StatementCOD', back_populates='customer')
    statement_debt: Mapped[list['StatementDebt']] = relationship('StatementDebt', back_populates='customer')
    waybills: Mapped[list['Waybills']] = relationship('Waybills', back_populates='customer')
    departments: Mapped[list['CustomerDepartments']] = relationship('CustomerDepartments', back_populates='customer', cascade='all, delete-orphan')



class Incidents(Base):
    __tablename__ = 'incidents'
    __table_args__ = (
        ForeignKeyConstraint(['created_by'], ['users.user_id'], name='incidents_created_by_fkey'),
        ForeignKeyConstraint(['hub_id'], ['hubs.hub_id'], name='incidents_hub_id_fkey'),
        PrimaryKeyConstraint('incident_id', name='incidents_pkey')
    )

    incident_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    reference_type: Mapped[Optional[str]] = mapped_column(String(20))
    reference_code: Mapped[Optional[str]] = mapped_column(String(50))
    incident_category: Mapped[Optional[str]] = mapped_column(String(100))
    hub_id: Mapped[Optional[int]] = mapped_column(Integer)
    created_by: Mapped[Optional[int]] = mapped_column(Integer)
    surcharge_amount: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(15, 2))
    incident_image_url: Mapped[Optional[str]] = mapped_column(String(255))
    action_required: Mapped[Optional[str]] = mapped_column(String(50))
    status: Mapped[Optional[str]] = mapped_column(String(50))

    users: Mapped[Optional['Users']] = relationship('Users', back_populates='incidents')
    hub: Mapped[Optional['Hubs']] = relationship('Hubs', back_populates='incidents')
    incident_logs: Mapped[list['IncidentLogs']] = relationship('IncidentLogs', back_populates='incident')


class Manifests(Base):
    __tablename__ = 'manifests'
    __table_args__ = (
        ForeignKeyConstraint(['from_hub_id'], ['hubs.hub_id'], name='manifests_from_hub_id_fkey'),
        ForeignKeyConstraint(['shipper_id'], ['users.user_id'], name='manifests_shipper_id_fkey'),
        ForeignKeyConstraint(['to_hub_id'], ['hubs.hub_id'], name='manifests_to_hub_id_fkey'),
        ForeignKeyConstraint(['vendor_id'], ['vendors.vendor_id'], name='manifests_vendor_id_fkey'),
        PrimaryKeyConstraint('manifest_id', name='manifests_pkey'),
        UniqueConstraint('manifest_code', name='manifests_manifest_code_key')
    )

    manifest_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    manifest_code: Mapped[str] = mapped_column(String(50), nullable=False)
    manifest_type: Mapped[Optional[str]] = mapped_column(String(50))
    from_hub_id: Mapped[Optional[int]] = mapped_column(Integer)
    to_hub_id: Mapped[Optional[int]] = mapped_column(Integer)
    vehicle_number: Mapped[Optional[str]] = mapped_column(String(50))
    vendor_id: Mapped[Optional[int]] = mapped_column(Integer)
    shipper_id: Mapped[Optional[int]] = mapped_column(Integer)
    total_weight: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(10, 2))
    total_items: Mapped[Optional[int]] = mapped_column(Integer)
    dispatched_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    from_hub: Mapped[Optional['Hubs']] = relationship('Hubs', foreign_keys=[from_hub_id], back_populates='manifests_from_hub')
    shipper: Mapped[Optional['Users']] = relationship('Users', back_populates='manifests')
    to_hub: Mapped[Optional['Hubs']] = relationship('Hubs', foreign_keys=[to_hub_id], back_populates='manifests_to_hub')
    vendor: Mapped[Optional['Vendors']] = relationship('Vendors', back_populates='manifests')
    manifest_details: Mapped[list['ManifestDetails']] = relationship('ManifestDetails', back_populates='manifest')


class Pods(Base):
    __tablename__ = 'pods'
    __table_args__ = (
        ForeignKeyConstraint(['created_by'], ['users.user_id'], name='pods_created_by_fkey'),
        ForeignKeyConstraint(['shipper_id'], ['users.user_id'], name='pods_shipper_id_fkey'),
        PrimaryKeyConstraint('id', name='pods_pkey'),
        UniqueConstraint('pod_code', name='pods_pod_code_key')
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    pod_code: Mapped[str] = mapped_column(String(50), nullable=False)
    shipper_id: Mapped[Optional[int]] = mapped_column(Integer)
    created_by: Mapped[Optional[int]] = mapped_column(Integer)
    total_waybills: Mapped[Optional[int]] = mapped_column(Integer)
    status: Mapped[Optional[str]] = mapped_column(String(20))
    returned_time: Mapped[Optional[datetime]] = mapped_column(DateTime)

    users: Mapped[Optional['Users']] = relationship('Users', foreign_keys=[created_by], back_populates='pods_created_by')
    shipper: Mapped[Optional['Users']] = relationship('Users', foreign_keys=[shipper_id], back_populates='pods_shipper')


class SupportTickets(Base):
    __tablename__ = 'support_tickets'
    __table_args__ = (
        ForeignKeyConstraint(['assigned_to'], ['users.user_id'], name='support_tickets_assigned_to_fkey'),
        PrimaryKeyConstraint('id', name='support_tickets_pkey'),
        UniqueConstraint('ticket_code', name='support_tickets_ticket_code_key')
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    ticket_code: Mapped[str] = mapped_column(String(50), nullable=False)
    customer_id: Mapped[Optional[int]] = mapped_column(BigInteger)
    waybill_id: Mapped[Optional[int]] = mapped_column(BigInteger)
    issue_category: Mapped[Optional[str]] = mapped_column(String(50))
    content: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[Optional[str]] = mapped_column(String(20))
    assigned_to: Mapped[Optional[int]] = mapped_column(Integer)

    users: Mapped[Optional['Users']] = relationship('Users', back_populates='support_tickets')


class UserDataAccess(Base):
    __tablename__ = 'user_data_access'
    __table_args__ = (
        ForeignKeyConstraint(['accessible_hub_id'], ['hubs.hub_id'], name='user_data_access_accessible_hub_id_fkey'),
        ForeignKeyConstraint(['user_id'], ['users.user_id'], name='user_data_access_user_id_fkey'),
        PrimaryKeyConstraint('access_id', name='user_data_access_pkey')
    )

    access_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(Integer)
    accessible_hub_id: Mapped[Optional[int]] = mapped_column(Integer)

    accessible_hub: Mapped[Optional['Hubs']] = relationship('Hubs', back_populates='user_data_access')
    user: Mapped[Optional['Users']] = relationship('Users', back_populates='user_data_access')


class BankAccounts(Base):
    __tablename__ = 'bank_accounts'
    __table_args__ = (
        ForeignKeyConstraint(['customer_id'], ['customers.customer_id'], name='bank_accounts_customer_id_fkey'),
        PrimaryKeyConstraint('account_id', name='bank_accounts_pkey'),
        UniqueConstraint('customer_id', name='bank_accounts_customer_id_key')
    )

    account_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    bank_name: Mapped[str] = mapped_column(String(255), nullable=False)
    account_number: Mapped[str] = mapped_column(String(50), nullable=False)
    account_name: Mapped[str] = mapped_column(String(100), nullable=False)
    customer_id: Mapped[Optional[int]] = mapped_column(Integer)
    is_verified: Mapped[Optional[bool]] = mapped_column(Boolean, server_default=text('false'))

    customer: Mapped[Optional['Customers']] = relationship('Customers', back_populates='bank_accounts')


class BookingRequests(Base):
    __tablename__ = 'booking_requests'
    __table_args__ = (
        ForeignKeyConstraint(['assigned_shipper_id'], ['users.user_id'], name='booking_requests_assigned_shipper_id_fkey'),
        ForeignKeyConstraint(['customer_id'], ['customers.customer_id'], name='booking_requests_customer_id_fkey'),
        ForeignKeyConstraint(['target_hub_id'], ['hubs.hub_id'], name='booking_requests_target_hub_id_fkey'),
        PrimaryKeyConstraint('request_id', name='booking_requests_pkey'),
        UniqueConstraint('request_code', name='booking_requests_request_code_key')
    )

    request_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    request_code: Mapped[str] = mapped_column(String(50), nullable=False)
    source: Mapped[Optional[str]] = mapped_column(String(50))
    shop_order_code: Mapped[Optional[str]] = mapped_column(String(100))
    customer_id: Mapped[Optional[int]] = mapped_column(Integer)
    sender_phone: Mapped[Optional[str]] = mapped_column(String(20))
    pickup_address: Mapped[Optional[str]] = mapped_column(String(255))
    target_hub_id: Mapped[Optional[int]] = mapped_column(Integer)
    product_type: Mapped[Optional[str]] = mapped_column(String(50), server_default=text("'PARCEL'"))
    est_weight: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(10, 2))
    is_vehicle_required: Mapped[Optional[bool]] = mapped_column(Boolean, server_default=text('false'))
    status: Mapped[Optional[str]] = mapped_column(String(50))
    assigned_shipper_id: Mapped[Optional[int]] = mapped_column(Integer)
    requested_pickup_time: Mapped[Optional[datetime]] = mapped_column(DateTime)
    pickup_method: Mapped[Optional[str]] = mapped_column(String(50))
    confirmed_by_user_id: Mapped[Optional[int]] = mapped_column(Integer)
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    pickup_assigned_by_user_id: Mapped[Optional[int]] = mapped_column(Integer)
    pickup_assigned_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    dispatched_by_user_id: Mapped[Optional[int]] = mapped_column(Integer)
    dispatched_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    dispatch_note: Mapped[Optional[str]] = mapped_column(Text)
    rejected_by_user_id: Mapped[Optional[int]] = mapped_column(Integer)
    rejected_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    rejection_note: Mapped[Optional[str]] = mapped_column(Text)

    # NEW FIELDS FOR PICKUP REQUESTS
    est_quantity: Mapped[Optional[int]] = mapped_column(Integer)
    priority: Mapped[Optional[str]] = mapped_column(String(20), server_default=text("'NORMAL'")) # NORMAL, URGENT, VIP, HT
    sla_deadline: Mapped[Optional[datetime]] = mapped_column(DateTime)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    pickup_mode: Mapped[Optional[str]] = mapped_column(String(30), server_default=text("'SINGLE_WAYBILL'"))
    actual_quantity: Mapped[Optional[int]] = mapped_column(Integer, server_default=text('0'))
    materialization_status: Mapped[Optional[str]] = mapped_column(String(30), server_default=text("'NOT_REQUIRED'"))
    customer_department_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey('customer_departments.id', ondelete='SET NULL'))

    assigned_shipper: Mapped[Optional['Users']] = relationship('Users', back_populates='booking_requests')
    customer: Mapped[Optional['Customers']] = relationship('Customers', back_populates='booking_requests')
    target_hub: Mapped[Optional['Hubs']] = relationship('Hubs', back_populates='booking_requests')
    waybills: Mapped[list['Waybills']] = relationship('Waybills', back_populates='request')
    logs: Mapped[list['BookingRequestLogs']] = relationship('BookingRequestLogs', back_populates='request')
    pickup_bag: Mapped[Optional['Bags']] = relationship('Bags', back_populates='booking_request', uselist=False)
    customer_department: Mapped[Optional['CustomerDepartments']] = relationship('CustomerDepartments')


    @property
    def customer_code(self):
        return self.customer.customer_code if self.customer else None

    @property
    def customer_name(self):
        return self.customer.company_name if self.customer else None

    @property
    def assigned_shipper_name(self):
        return self.assigned_shipper.full_name if self.assigned_shipper else None

    @property
    def target_hub_name(self):
        return self.target_hub.hub_name if self.target_hub else None

    @property
    def bag_code(self):
        if self.pickup_bag:
            return self.pickup_bag.bag_code
        if not self.waybills or not self.waybills[0].bag_items:
            return None
        bag = self.waybills[0].bag_items[0].bag
        return bag.bag_code if bag else None

    @property
    def bag_item_count(self):
        if self.pickup_bag:
            return len(self.pickup_bag.bag_items)
        if not self.waybills or not self.waybills[0].bag_items:
            return None
        bag = self.waybills[0].bag_items[0].bag
        return len(bag.bag_items) if bag else None

    @property
    def total_estimated_weight(self):
        if self.pickup_mode == "BULK_MAIL":
            return None
        if not self.waybills or not self.waybills[0].bag_items:
            return None
        bag = self.waybills[0].bag_items[0].bag
        if not bag:
            return None
        return sum(float(item.waybill.estimated_weight or 0) for item in bag.bag_items if item.waybill)

    @property
    def waybill_items(self):
        source_waybills = []
        if self.pickup_bag:
            source_waybills = [
                item.waybill
                for item in sorted(self.pickup_bag.bag_items, key=lambda item: item.bag_item_id or 0)
                if item.waybill
            ]
        else:
            source_waybills = sorted(self.waybills or [], key=lambda waybill: waybill.waybill_id or 0)

        return [
            {
                "waybill_id": waybill.waybill_id,
                "waybill_code": waybill.waybill_code,
                "status": waybill.status,
                "receiver_name": waybill.receiver_name,
                "receiver_phone": waybill.receiver_phone,
                "receiver_address": waybill.receiver_address,
            }
            for waybill in source_waybills
        ]

    @property
    def latest_request_at(self):
        if not self.logs:
            return None
        return max((log.created_at for log in self.logs if log.created_at), default=None)

    @property
    def created_at(self):
        if self.logs:
            first_log_at = min((log.created_at for log in self.logs if log.created_at), default=None)
            if first_log_at:
                return first_log_at
        return (
            self.requested_pickup_time
            or self.confirmed_at
            or self.pickup_assigned_at
            or self.dispatched_at
        )


class BookingRequestLogs(Base):
    __tablename__ = 'booking_request_logs'
    __table_args__ = (
        ForeignKeyConstraint(['request_id'], ['booking_requests.request_id'], name='booking_request_logs_request_id_fkey'),
        ForeignKeyConstraint(['user_id'], ['users.user_id'], name='booking_request_logs_user_id_fkey'),
        PrimaryKeyConstraint('log_id', name='booking_request_logs_pkey')
    )

    log_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    request_id: Mapped[int] = mapped_column(Integer)
    user_id: Mapped[Optional[int]] = mapped_column(Integer)
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    note: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    request: Mapped['BookingRequests'] = relationship('BookingRequests', back_populates='logs')
    user: Mapped[Optional['Users']] = relationship('Users')


class BulkMailDraftItems(Base):
    __tablename__ = 'bulk_mail_draft_items'
    __table_args__ = (
        ForeignKeyConstraint(['request_id'], ['booking_requests.request_id'], name='bulk_mail_draft_items_request_id_fkey'),
        ForeignKeyConstraint(['bag_id'], ['bags.bag_id'], name='bulk_mail_draft_items_bag_id_fkey'),
        ForeignKeyConstraint(['waybill_id'], ['waybills.waybill_id'], name='bulk_mail_draft_items_waybill_id_fkey'),
        PrimaryKeyConstraint('draft_item_id', name='bulk_mail_draft_items_pkey'),
        UniqueConstraint('request_id', 'sequence_no', name='bulk_mail_draft_items_request_sequence_key'),
    )

    draft_item_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    request_id: Mapped[int] = mapped_column(Integer, nullable=False)
    bag_id: Mapped[Optional[int]] = mapped_column(Integer)
    waybill_id: Mapped[Optional[int]] = mapped_column(Integer)
    sequence_no: Mapped[int] = mapped_column(Integer, nullable=False)
    customer_reference_code: Mapped[Optional[str]] = mapped_column(String(100))
    receiver_name: Mapped[Optional[str]] = mapped_column(String(100))
    receiver_phone: Mapped[Optional[str]] = mapped_column(String(20))
    receiver_address: Mapped[Optional[str]] = mapped_column(String(255))
    note: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(30), server_default=text("'PENDING_OCR'"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CustomerPriceMapping(Base):
    __tablename__ = 'customer_price_mapping'
    __table_args__ = (
        ForeignKeyConstraint(['customer_id'], ['customers.customer_id'], name='customer_price_mapping_customer_id_fkey'),
        ForeignKeyConstraint(['policy_id'], ['pricing_policies.policy_id'], name='customer_price_mapping_policy_id_fkey'),
        PrimaryKeyConstraint('mapping_id', name='customer_price_mapping_pkey')
    )

    mapping_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    customer_id: Mapped[Optional[int]] = mapped_column(Integer)
    policy_id: Mapped[Optional[int]] = mapped_column(Integer)

    customer: Mapped[Optional['Customers']] = relationship('Customers', back_populates='customer_price_mapping')
    policy: Mapped[Optional['PricingPolicies']] = relationship('PricingPolicies', back_populates='customer_price_mapping')


class IncidentLogs(Base):
    __tablename__ = 'incident_logs'
    __table_args__ = (
        ForeignKeyConstraint(['action_by'], ['users.user_id'], name='incident_logs_action_by_fkey'),
        ForeignKeyConstraint(['incident_id'], ['incidents.incident_id'], name='incident_logs_incident_id_fkey'),
        PrimaryKeyConstraint('log_id', name='incident_logs_pkey')
    )

    log_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    incident_id: Mapped[Optional[int]] = mapped_column(Integer)
    action_by: Mapped[Optional[int]] = mapped_column(Integer)
    action_detail: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    users: Mapped[Optional['Users']] = relationship('Users', back_populates='incident_logs')
    incident: Mapped[Optional['Incidents']] = relationship('Incidents', back_populates='incident_logs')

class StatementDebt(Base):
    __tablename__ = 'statement_debt'
    __table_args__ = (
        ForeignKeyConstraint(['customer_id'], ['customers.customer_id'], name='statement_debt_customer_id_fkey'),
        PrimaryKeyConstraint('statement_id', name='statement_debt_pkey'),
        UniqueConstraint('statement_code', name='statement_debt_statement_code_key')
    )

    statement_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    statement_code: Mapped[str] = mapped_column(String(50), nullable=False)
    customer_id: Mapped[Optional[int]] = mapped_column(Integer)
    total_main_fee: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(15, 2))
    total_extra_fee: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(15, 2))
    total_vat: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(15, 2))
    grand_total: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(15, 2))

    # Accounting fields
    status: Mapped[str] = mapped_column(String(50), server_default=text("'DRAFT'")) 
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey('users.user_id'))

    customer: Mapped[Optional['Customers']] = relationship('Customers', back_populates='statement_debt')
    details: Mapped[list['StatementDetails']] = relationship(
        'StatementDetails',
        primaryjoin="and_(StatementDebt.statement_id == StatementDetails.statement_id, StatementDetails.statement_type == 'DEBT')",
        foreign_keys="[StatementDetails.statement_id]",
        overlaps="details"
    )


class Waybills(Base):
    __tablename__ = 'waybills'
    __table_args__ = (
        ForeignKeyConstraint(['customer_id'], ['customers.customer_id'], name='waybills_customer_id_fkey'),
        ForeignKeyConstraint(['dest_hub_id'], ['hubs.hub_id'], name='waybills_dest_hub_id_fkey'),
        ForeignKeyConstraint(['origin_hub_id'], ['hubs.hub_id'], name='waybills_origin_hub_id_fkey'),
        ForeignKeyConstraint(['request_id'], ['booking_requests.request_id'], name='waybills_request_id_fkey'),
        ForeignKeyConstraint(['holding_hub_id'], ['hubs.hub_id'], name='waybills_holding_hub_id_fkey'),
        ForeignKeyConstraint(['holding_shipper_id'], ['users.user_id'], name='waybills_holding_shipper_id_fkey'),
        PrimaryKeyConstraint('waybill_id', name='waybills_pkey'),
        UniqueConstraint('waybill_code', name='waybills_waybill_code_key')
    )


    waybill_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    waybill_code: Mapped[str] = mapped_column(String(50), nullable=False)
    request_id: Mapped[Optional[int]] = mapped_column(Integer)
    customer_id: Mapped[Optional[int]] = mapped_column(Integer)
    receiver_name: Mapped[Optional[str]] = mapped_column(String(100))
    receiver_phone: Mapped[Optional[str]] = mapped_column(String(20))
    receiver_address: Mapped[Optional[str]] = mapped_column(String(255))
    origin_hub_id: Mapped[Optional[int]] = mapped_column(Integer)
    dest_hub_id: Mapped[Optional[int]] = mapped_column(Integer)
    service_type: Mapped[Optional[str]] = mapped_column(String(50))
    delivery_type: Mapped[Optional[str]] = mapped_column(String(50))
    actual_weight: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(10, 2))
    converted_weight: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(10, 2))
    payment_method: Mapped[Optional[str]] = mapped_column(String(50))
    cod_amount: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(15, 2), server_default=text('0'))
    shipping_fee: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(15, 2), server_default=text('0'))
    extra_services_fee: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(15, 2), server_default=text('0'))
    vat_amount: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(15, 2), server_default=text('0'))
    total_amount_to_collect: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(15, 2), server_default=text('0'))
    status: Mapped[Optional[str]] = mapped_column(String(50))
    product_name: Mapped[Optional[str]] = mapped_column(String(255))
    note: Mapped[Optional[str]] = mapped_column(String(255))
    version: Mapped[Optional[int]] = mapped_column(Integer, server_default=text('1'))
    
    # Bill verification and OCR
    bill_image_url: Mapped[Optional[str]] = mapped_column(String(255))
    pickup_image_url: Mapped[Optional[str]] = mapped_column(String(255))
    pickup_image_urls: Mapped[Optional[str]] = mapped_column(Text)
    ocr_status: Mapped[Optional[str]] = mapped_column(String(50), server_default=text("'PENDING'"))
    verify_status: Mapped[Optional[str]] = mapped_column(String(50), server_default=text("'PENDING'"))
    verify_error_msg: Mapped[Optional[str]] = mapped_column(String(255))

    # SLA Control and Holding Units
    sla_deadline: Mapped[Optional[datetime]] = mapped_column(DateTime)
    holding_hub_id: Mapped[Optional[int]] = mapped_column(Integer)
    holding_shipper_id: Mapped[Optional[int]] = mapped_column(Integer)

    # Waybill Creator smart details & dimensions
    sender_name: Mapped[Optional[str]] = mapped_column(String(100))
    sender_phone: Mapped[Optional[str]] = mapped_column(String(20))
    sender_address: Mapped[Optional[str]] = mapped_column(String(255))
    sender_province_id: Mapped[Optional[int]] = mapped_column(Integer)
    sender_district_id: Mapped[Optional[int]] = mapped_column(Integer)
    sender_ward_id: Mapped[Optional[int]] = mapped_column(Integer)
    sender_province_name: Mapped[Optional[str]] = mapped_column(String(150))
    sender_district_name: Mapped[Optional[str]] = mapped_column(String(150))
    sender_ward_name: Mapped[Optional[str]] = mapped_column(String(150))
    receiver_province_id: Mapped[Optional[int]] = mapped_column(Integer)
    receiver_district_id: Mapped[Optional[int]] = mapped_column(Integer)
    receiver_ward_id: Mapped[Optional[int]] = mapped_column(Integer)
    receiver_province_name: Mapped[Optional[str]] = mapped_column(String(150))
    receiver_district_name: Mapped[Optional[str]] = mapped_column(String(150))
    receiver_ward_name: Mapped[Optional[str]] = mapped_column(String(150))
    shop_order_code: Mapped[Optional[str]] = mapped_column(String(100))
    order_type: Mapped[Optional[str]] = mapped_column(String(30))
    delivery_note_option: Mapped[Optional[str]] = mapped_column(String(100))
    cod_receiver_pays_fee: Mapped[Optional[bool]] = mapped_column(Boolean, server_default=text('false'))
    cod_fee_payment_method: Mapped[Optional[str]] = mapped_column(String(50))
    pickup_method: Mapped[Optional[str]] = mapped_column(String(50))
    delivery_method: Mapped[Optional[str]] = mapped_column(String(50))
    requested_pickup_time: Mapped[Optional[datetime]] = mapped_column(DateTime)
    estimated_weight: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(10, 2))
    estimated_converted_weight: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(10, 2))
    estimated_shipping_fee: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(15, 2), server_default=text('0'))
    estimated_extra_services_fee: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(15, 2), server_default=text('0'))
    estimated_vat_amount: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(15, 2), server_default=text('0'))
    estimated_total_amount: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(15, 2), server_default=text('0'))
    final_weight: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(10, 2))
    final_converted_weight: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(10, 2))
    final_shipping_fee: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(15, 2), server_default=text('0'))
    final_extra_services_fee: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(15, 2), server_default=text('0'))
    final_vat_amount: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(15, 2), server_default=text('0'))
    final_total_amount: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(15, 2), server_default=text('0'))
    price_status: Mapped[Optional[str]] = mapped_column(String(30), server_default=text("'ESTIMATED'"))
    length: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(10, 2))
    width: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(10, 2))
    height: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(10, 2))

    customer: Mapped[Optional['Customers']] = relationship('Customers', back_populates='waybills')
    dest_hub: Mapped[Optional['Hubs']] = relationship('Hubs', foreign_keys=[dest_hub_id], back_populates='waybills_dest_hub')
    origin_hub: Mapped[Optional['Hubs']] = relationship('Hubs', foreign_keys=[origin_hub_id], back_populates='waybills_origin_hub')
    holding_hub: Mapped[Optional['Hubs']] = relationship('Hubs', foreign_keys=[holding_hub_id])
    holding_shipper: Mapped[Optional['Users']] = relationship('Users', foreign_keys=[holding_shipper_id])

    request: Mapped[Optional['BookingRequests']] = relationship('BookingRequests', back_populates='waybills')
    bag_items: Mapped[list['BagItems']] = relationship('BagItems', back_populates='waybill')
    delivery_results: Mapped[list['DeliveryResults']] = relationship('DeliveryResults', back_populates='waybill')
    manifest_details: Mapped[list['ManifestDetails']] = relationship('ManifestDetails', back_populates='waybill')
    statement_details: Mapped[list['StatementDetails']] = relationship('StatementDetails', back_populates='waybill')
    waybill_documents: Mapped[list['WaybillDocuments']] = relationship('WaybillDocuments', back_populates='waybill')
    waybill_extra_services: Mapped[list['WaybillExtraServices']] = relationship('WaybillExtraServices', back_populates='waybill')
    waybill_items: Mapped[list['WaybillItems']] = relationship('WaybillItems', back_populates='waybill')

    is_deleted: Mapped[bool] = mapped_column(Boolean, server_default=text('false'), default=False)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)


class BagItems(Base):
    __tablename__ = 'bag_items'
    __table_args__ = (
        ForeignKeyConstraint(['bag_id'], ['bags.bag_id'], name='bag_items_bag_id_fkey'),
        ForeignKeyConstraint(['waybill_id'], ['waybills.waybill_id'], name='bag_items_waybill_id_fkey'),
        PrimaryKeyConstraint('bag_item_id', name='bag_items_pkey')
    )

    bag_item_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    bag_id: Mapped[Optional[int]] = mapped_column(Integer)
    waybill_id: Mapped[Optional[int]] = mapped_column(Integer)

    bag: Mapped[Optional['Bags']] = relationship('Bags', back_populates='bag_items')
    waybill: Mapped[Optional['Waybills']] = relationship('Waybills', back_populates='bag_items')


class DeliveryResults(Base):
    __tablename__ = 'delivery_results'
    __table_args__ = (
        ForeignKeyConstraint(['shipper_id'], ['users.user_id'], name='delivery_results_shipper_id_fkey'),
        ForeignKeyConstraint(['waybill_id'], ['waybills.waybill_id'], name='delivery_results_waybill_id_fkey'),
        PrimaryKeyConstraint('delivery_id', name='delivery_results_pkey')
    )

    delivery_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    waybill_id: Mapped[Optional[int]] = mapped_column(Integer)
    shipper_id: Mapped[Optional[int]] = mapped_column(Integer)
    actual_cod_collected: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(15, 2))
    pod_image_url: Mapped[Optional[str]] = mapped_column(String(255))
    pod_image_urls: Mapped[Optional[str]] = mapped_column(Text)
    delivery_time: Mapped[Optional[datetime]] = mapped_column(DateTime)
    status: Mapped[Optional[str]] = mapped_column(String(50))

    shipper: Mapped[Optional['Users']] = relationship('Users', back_populates='delivery_results')
    waybill: Mapped[Optional['Waybills']] = relationship('Waybills', back_populates='delivery_results')


class ManifestDetails(Base):
    __tablename__ = 'manifest_details'
    __table_args__ = (
        ForeignKeyConstraint(['bag_id'], ['bags.bag_id'], name='manifest_details_bag_id_fkey'),
        ForeignKeyConstraint(['manifest_id'], ['manifests.manifest_id'], name='manifest_details_manifest_id_fkey'),
        ForeignKeyConstraint(['waybill_id'], ['waybills.waybill_id'], name='manifest_details_waybill_id_fkey'),
        PrimaryKeyConstraint('detail_id', name='manifest_details_pkey')
    )

    detail_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    manifest_id: Mapped[Optional[int]] = mapped_column(Integer)
    waybill_id: Mapped[Optional[int]] = mapped_column(Integer)
    bag_id: Mapped[Optional[int]] = mapped_column(Integer)

    bag: Mapped[Optional['Bags']] = relationship('Bags', back_populates='manifest_details')
    manifest: Mapped[Optional['Manifests']] = relationship('Manifests', back_populates='manifest_details')
    waybill: Mapped[Optional['Waybills']] = relationship('Waybills', back_populates='manifest_details')

class WaybillExtraServices(Base):
    __tablename__ = 'waybill_extra_services'
    __table_args__ = (
        ForeignKeyConstraint(['waybill_id'], ['waybills.waybill_id'], name='waybill_extra_services_waybill_id_fkey'),
        PrimaryKeyConstraint('id', name='waybill_extra_services_pkey')
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    waybill_id: Mapped[Optional[int]] = mapped_column(Integer)
    service_name: Mapped[Optional[str]] = mapped_column(String(100))
    service_fee: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(15, 2), server_default=text('0'))

    waybill: Mapped[Optional['Waybills']] = relationship('Waybills', back_populates='waybill_extra_services')


class WaybillItems(Base):
    __tablename__ = 'waybill_items'
    __table_args__ = (
        ForeignKeyConstraint(['waybill_id'], ['waybills.waybill_id'], name='waybill_items_waybill_id_fkey'),
        PrimaryKeyConstraint('item_id', name='waybill_items_pkey'),
        UniqueConstraint('parcel_code', name='waybill_items_parcel_code_key')
    )

    item_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    parcel_code: Mapped[str] = mapped_column(String(50), nullable=False)
    waybill_id: Mapped[Optional[int]] = mapped_column(Integer)
    product_group: Mapped[Optional[str]] = mapped_column(String(100), server_default=text("'PARCEL'"))
    product_name: Mapped[Optional[str]] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(String(255))
    declared_value: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(15, 2), server_default=text('0'))
    actual_weight: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(10, 2))
    converted_weight: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(10, 2))
    length: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(10, 2))
    width: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(10, 2))
    height: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(10, 2))
    quantity: Mapped[Optional[int]] = mapped_column(Integer, server_default=text('1'))

    waybill: Mapped[Optional['Waybills']] = relationship('Waybills', back_populates='waybill_items')


class WaybillDocuments(Base):
    __tablename__ = 'waybill_documents'
    __table_args__ = (
        ForeignKeyConstraint(['waybill_id'], ['waybills.waybill_id'], name='waybill_documents_waybill_id_fkey'),
        PrimaryKeyConstraint('document_id', name='waybill_documents_pkey')
    )

    document_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    waybill_id: Mapped[Optional[int]] = mapped_column(Integer)
    document_code: Mapped[Optional[str]] = mapped_column(String(100))
    document_name: Mapped[Optional[str]] = mapped_column(String(255))
    quantity: Mapped[Optional[int]] = mapped_column(Integer, server_default=text('1'))
    note: Mapped[Optional[str]] = mapped_column(String(255))

    waybill: Mapped[Optional['Waybills']] = relationship('Waybills', back_populates='waybill_documents')

class PricingRules(Base):
    __tablename__ = 'pricing_rules'
    __table_args__ = (
        PrimaryKeyConstraint('rule_id', name='pricing_rules_pkey'),
        # Đảm bảo không có 2 quy tắc trùng lặp cho cùng một tuyến, dịch vụ và nấc cân
        UniqueConstraint('policy_id', 'from_province_id', 'to_province_id', 'service_type', 'min_weight', 'max_weight', name='unique_pricing_rule')
    )

    rule_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    policy_id: Mapped[int] = mapped_column(Integer, ForeignKey('pricing_policies.policy_id'), nullable=False)
    
    # Tra cứu theo ID Tỉnh (Province) như đặc tả yêu cầu
    from_province_id: Mapped[Optional[int]] = mapped_column(Integer)
    to_province_id: Mapped[Optional[int]] = mapped_column(Integer)
    zone_name: Mapped[Optional[str]] = mapped_column(String(50)) # Hỗ trợ tính giá theo Vùng (Nội tỉnh, Nội vùng...)
    
    service_type: Mapped[str] = mapped_column(String(20), nullable=False) # EXPRESS, STANDARD
    min_weight: Mapped[decimal.Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    max_weight: Mapped[decimal.Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    
    price: Mapped[decimal.Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    pricing_method: Mapped[str] = mapped_column(String(20), nullable=False, server_default=text("'FIXED'"))
    base_weight: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(10, 2))
    increment_weight: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(10, 2))
    increment_price: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(15, 2))
    fuel_surcharge_percent: Mapped[decimal.Decimal] = mapped_column(Numeric(5, 2), nullable=False, server_default=text('10'))
    vat_percent: Mapped[decimal.Decimal] = mapped_column(Numeric(5, 2), nullable=False, server_default=text('8'))
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text('true'))

    # Liên kết ngược lại với chính sách giá
    policy: Mapped['PricingPolicies'] = relationship('PricingPolicies', back_populates='rules')

class RemoteAreas(Base):
    __tablename__ = 'remote_areas'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='remote_areas_pkey'),
        UniqueConstraint('province_id', 'district_id', 'ward_id', name='unique_remote_area')
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    province_id: Mapped[int] = mapped_column(Integer, nullable=False)
    district_id: Mapped[int] = mapped_column(Integer, nullable=False)
    ward_id: Mapped[int] = mapped_column(Integer, nullable=False)
    
    fee: Mapped[decimal.Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text('true'))

class TransactionLedger(Base):
    __tablename__ = 'transaction_ledger'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='transaction_ledger_pkey'),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    parent_transaction_id: Mapped[str] = mapped_column(String(50), index=True) # Dùng để gom cặp Nợ-Có
    waybill_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey('waybills.waybill_id'))
    account_id: Mapped[int] = mapped_column(Integer) # ID của Shipper, Shop hoặc Hub
    entry_type: Mapped[str] = mapped_column(String(10)) # DEBIT hoặc CREDIT
    amount: Mapped[decimal.Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    account_type: Mapped[str] = mapped_column(String(20)) # COD hoặc FEE
    status: Mapped[str] = mapped_column(String(20), server_default=text("'PENDING'")) # PENDING, RECONCILED
    timestamp: Mapped[datetime] = mapped_column(DateTime, server_default=text('now()'))

    is_deleted: Mapped[bool] = mapped_column(Boolean, server_default=text('false'), default=False)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)


class AuditLogs(Base):
    __tablename__ = 'audit_logs'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    admin_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.user_id'))
    target_table: Mapped[str] = mapped_column(String(50)) # Ví dụ: 'waybills'
    target_id: Mapped[int] = mapped_column(Integer)      # ID của bản ghi bị sửa
    column_name: Mapped[str] = mapped_column(String(50))  # Cột bị sửa (ví dụ: 'status')
    old_value: Mapped[Optional[str]] = mapped_column(Text)
    new_value: Mapped[Optional[str]] = mapped_column(Text)
    reason: Mapped[str] = mapped_column(Text)            # Lý do can thiệp (Bắt buộc) 
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationship để biết Admin nào đã làm
    admin: Mapped['Users'] = relationship('Users')

class ActivityLogs(Base):
    __tablename__ = 'activity_logs'
    
    id: Mapped[int] = mapped_column(BigInteger, Identity(start=1), primary_key=True)
    waybill_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey('waybills.waybill_id'))
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey('users.user_id'))
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    ip_address: Mapped[Optional[str]] = mapped_column(String(50))
    device_info: Mapped[Optional[str]] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    waybill: Mapped[Optional['Waybills']] = relationship('Waybills')
    user: Mapped[Optional['Users']] = relationship('Users')


class AuthOtpCodes(Base):
    __tablename__ = 'auth_otp_codes'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='auth_otp_codes_pkey'),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    purpose: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    otp_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    attempts: Mapped[int] = mapped_column(Integer, server_default=text('0'), default=0)
    consumed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class StatementCOD(Base):
    __tablename__ = 'statement_cod'
    __table_args__ = {'extend_existing': True}

    # Sửa từ 'id' thành 'statement_id' cho đúng với ảnh CMD của bạn
    statement_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    
    statement_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    customer_id: Mapped[int] = mapped_column(Integer, ForeignKey('customers.customer_id'))
    
    # Bổ sung các cột đang có trong DB nhưng thiếu trong code
    total_bills: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    total_cod_amount: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(15, 2), default=0)
    total_amount: Mapped[decimal.Decimal] = mapped_column(Numeric(15, 2), default=0)
    
    # Trạng thái và thời gian
    status: Mapped[str] = mapped_column(String(50), default="PENDING") 
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Người tạo
    created_by: Mapped[int] = mapped_column(Integer, ForeignKey('users.user_id'))

    # Relationships
    customer: Mapped['Customers'] = relationship('Customers', back_populates='statement_cod')
    details: Mapped[list['StatementDetails']] = relationship(
         'StatementDetails', 
         primaryjoin="and_(StatementCOD.statement_id == StatementDetails.statement_id, StatementDetails.statement_type == 'COD')",
         foreign_keys="[StatementDetails.statement_id]",
         overlaps="details"
     )

class StatementDetails(Base):
    __tablename__ = 'statement_details'
    __table_args__ = (
        # 1. Sửa ForeignKey trỏ về statement_id của bảng mẹ
        # Removed rigid FK to statement_cod to allow polymorphic use (COD/DEBT)
        ForeignKeyConstraint(['ledger_id'], ['transaction_ledger.id'], name='statement_details_ledger_id_fkey'),
        ForeignKeyConstraint(['waybill_id'], ['waybills.waybill_id'], name='statement_details_waybill_id_fkey'),
        
        # 2. QUAN TRỌNG: Sửa PK từ 'id' thành 'mapping_id' cho khớp CMD
        PrimaryKeyConstraint('mapping_id', name='statement_details_pkey'),
        {'extend_existing': True} 
    )

    # 3. Đổi tên trường ở đây nữa
    mapping_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    
    statement_id: Mapped[int] = mapped_column(Integer, nullable=False)
    ledger_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    waybill_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Bổ sung thêm cho đủ bộ với Database của bạn
    type: Mapped[Optional[str]] = mapped_column(String(20))
    statement_type: Mapped[Optional[str]] = mapped_column(String(20))

    # Relationships (Giữ nguyên)
    # Generic reference, no back_populates to avoid circular mapper issues with dynamic primaryjoin
    waybill: Mapped[Optional['Waybills']] = relationship('Waybills', back_populates='statement_details')
    ledger: Mapped['TransactionLedger'] = relationship('TransactionLedger')

class ServiceConfigs(Base):
    """Bảng cấu hình giá động cho các Dịch vụ tiện ích (Bảo hiểm, Đồng kiểm...)"""
    __tablename__ = 'service_configs'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='service_configs_pkey'),
        UniqueConstraint('service_code', name='service_configs_service_code_key')
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    service_code: Mapped[str] = mapped_column(String(50), nullable=False) # VD: 'CO_CHECK', 'INSURANCE'
    service_name: Mapped[str] = mapped_column(String(100), nullable=False) # VD: 'Dịch vụ Đồng kiểm'
    fee_type: Mapped[str] = mapped_column(String(20), nullable=False, server_default=text("'FIXED'")) # 'FIXED' (Giá cố định) hoặc 'PERCENT' (Phần trăm)
    fee_value: Mapped[decimal.Decimal] = mapped_column(Numeric(15, 2), nullable=False, server_default=text('0')) # Số tiền hoặc Số %
    calculation_base: Mapped[str] = mapped_column(String(30), nullable=False, server_default=text("'FIXED'"))
    min_order_value: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(15, 2))
    max_order_value: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(15, 2))
    min_fee: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(15, 2))
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text('true'))

class PackingRules(Base):
    """Cấu hình phí đóng kiện theo loại đóng kiện và mốc cân."""
    __tablename__ = 'packing_rules'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='packing_rules_pkey'),
        UniqueConstraint('packing_type', 'min_weight', 'max_weight', name='unique_packing_rule')
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    packing_type: Mapped[str] = mapped_column(String(20), nullable=False)
    min_weight: Mapped[decimal.Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    max_weight: Mapped[decimal.Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    packing_fee: Mapped[decimal.Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    added_weight: Mapped[decimal.Decimal] = mapped_column(Numeric(10, 2), nullable=False, server_default=text('0'))
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text('true'))

class ProvinceZones(Base):
    """Mapping Tỉnh -> Vùng miền (Zone) - Mục 5 & 6 Đặc tả"""
    __tablename__ = 'province_zones'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='province_zones_pkey'),
    )
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    origin_province_id: Mapped[int] = mapped_column(Integer)
    destination_province_id: Mapped[int] = mapped_column(Integer)
    zone_name: Mapped[str] = mapped_column(String(50)) # Nội tỉnh, Nội vùng, Liên vùng, Xa
    
class StatementAdjustments(Base):
    """Lưu vết điều chỉnh tiền sau khi bảng kê đã chốt - Mục 18 Đặc tả"""
    __tablename__ = 'statement_adjustments'
    __table_args__ = (
        ForeignKeyConstraint(['created_by'], ['users.user_id'], name='fk_adjustments_user'),
        ForeignKeyConstraint(['waybill_id'], ['waybills.waybill_id'], name='fk_adjustments_waybill'),
        PrimaryKeyConstraint('id', name='statement_adjustments_pkey'),
    )
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    statement_id: Mapped[int] = mapped_column(Integer) # Tham chiếu đến StatementDebt hoặc StatementCOD
    statement_type: Mapped[str] = mapped_column(String(20)) # 'DEBT' hoặc 'COD'
    waybill_id: Mapped[int] = mapped_column(Integer)
    amount: Mapped[decimal.Decimal] = mapped_column(Numeric(15, 2)) # Số tiền điều chỉnh (Dương là tăng, Âm là giảm)
    reason: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_by: Mapped[int] = mapped_column(Integer)
