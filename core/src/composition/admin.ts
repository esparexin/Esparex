import { MongoAdminDashboardRepositoryAdapter } from '../adapters/outbound/database/admin/MongoAdminDashboardRepositoryAdapter';
import { AdminDashboardRepositoryPort } from '../domains/admin';

export const adminDashboardRepository: AdminDashboardRepositoryPort = new MongoAdminDashboardRepositoryAdapter();
