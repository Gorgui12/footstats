import type { NotificationPreference, User, UserFavorite } from "@/domain/users/types";
import type { FavoriteEntityType } from "@/domain/football/enums";

export interface UserRepository {
  upsert(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
}

export interface FavoriteRepository {
  add(favorite: UserFavorite): Promise<void>;
  remove(userId: string, entityType: FavoriteEntityType, entityId: string): Promise<void>;
  isFavorite(userId: string, entityType: FavoriteEntityType, entityId: string): Promise<boolean>;
  listByUser(userId: string): Promise<UserFavorite[]>;
}

export interface NotificationPreferenceRepository {
  upsert(preference: NotificationPreference): Promise<void>;
  findByUserId(userId: string): Promise<NotificationPreference | null>;
}
