import { Profile } from './profile.entity';

export abstract class ProfileRepository {
  abstract get(): Promise<Profile | null>;
  abstract save(profile: Profile): Promise<void>;
}
