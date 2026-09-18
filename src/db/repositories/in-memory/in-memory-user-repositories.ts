import type { FavoriteEntityType } from "@/domain/football/enums";
import type { NotificationPreference, User, UserFavorite } from "@/domain/users/types";
import type {
  FavoriteRepository,
  NotificationPreferenceRepository,
  UserRepository,
} from "../user-interfaces";

/** Même principe que in-memory-repositories.ts : stub de dev, remplaçable par Postgres sans changer les services. */

export class InMemoryUserRepository implements UserRepository {
  private readonly byId = new Map<string, User>();

  async upsert(user: User): Promise<void> {
    this.byId.set(user.id, user);
  }
  async findById(id: string): Promise<User | null> {
    return this.byId.get(id) ?? null;
  }
}

export class InMemoryFavoriteRepository implements FavoriteRepository {
  private readonly items = new Map<string, UserFavorite>();

  private key(userId: string, entityType: FavoriteEntityType, entityId: string): string {
    return `${userId}:${entityType}:${entityId}`;
  }

  async add(favorite: UserFavorite): Promise<void> {
    this.items.set(this.key(favorite.userId, favorite.entityType, favorite.entityId), favorite);
  }
  async remove(userId: string, entityType: FavoriteEntityType, entityId: string): Promise<void> {
    this.items.delete(this.key(userId, entityType, entityId));
  }
  async isFavorite(userId: string, entityType: FavoriteEntityType, entityId: string): Promise<boolean> {
    return this.items.has(this.key(userId, entityType, entityId));
  }
  async listByUser(userId: string): Promise<UserFavorite[]> {
    return [...this.items.values()].filter((f) => f.userId === userId);
  }
}

export class InMemoryNotificationPreferenceRepository implements NotificationPreferenceRepository {
  private readonly byUserId = new Map<string, NotificationPreference>();

  async upsert(preference: NotificationPreference): Promise<void> {
    this.byUserId.set(preference.userId, preference);
  }
  async findByUserId(userId: string): Promise<NotificationPreference | null> {
    return this.byUserId.get(userId) ?? null;
  }
}
