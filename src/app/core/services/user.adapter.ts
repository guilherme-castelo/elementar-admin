import { IUser, IUserDTO } from '../models/user.model';

export class UserAdapter {
  static toModel(dto: any): IUser {
    // Backend might return objects already if using Prisma JSON types? 
    // Prisma SQLite stores as String, so we need to parse if DTO has string.
    // If backend middleware parses it, great. But let's be safe.
    
    let preferences = dto.preferences;
    if (typeof dto.preferences === 'string') {
      try { preferences = JSON.parse(dto.preferences); } catch (e) { console.error('Error parsing preferences', e); }
    }

    let address = dto.address;
    if (typeof dto.address === 'string') {
        try { address = JSON.parse(dto.address); } catch (e) { console.error('Error parsing address', e); }
    }

    return {
      ...dto,
      preferences,
      address,
      // Ensure IDs are numbers
      id: Number(dto.id),
      companyId: dto.companyId ? Number(dto.companyId) : undefined,
      roleId: dto.roleId ? Number(dto.roleId) : undefined,
      isActive: dto.isActive ?? true 
    };
  }

  static toDTO(model: Partial<IUser>): any {
      const dto: any = { ...model };
      if (model.preferences) {
          dto.preferences = JSON.stringify(model.preferences);
      }
      if (model.address) {
          dto.address = JSON.stringify(model.address);
      }
      return dto;
  }
}
