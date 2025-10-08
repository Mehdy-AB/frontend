import { notificationApiClient } from '../notificationClient';
import {
  FolderResDto,
  CreateFolderDto,
  FolderRepoResDto,
  TypeShareAccessWithTypeReq,
  TypeShareAccessRes,
  SortFields,
  PageResponse
} from '../../types/api';

export class FolderService {
  /**
   * Create folder
   */
  static async createFolder(data: CreateFolderDto, options?: any): Promise<FolderResDto> {
    return notificationApiClient.createFolder(data, options);
  }

  /**
   * Get folder by ID
   */
  static async getFolder(
    id: number,
    params: {
      page?: number;
      size?: number;
      name?: string;
      showFolder?: boolean;
      desc?: boolean;
      sort?: SortFields;
    } = {},
    options?: any
  ): Promise<FolderRepoResDto> {
    return notificationApiClient.getFolder(id, params, options);
  }

  /**
   * Get folder by path
   */
  static async getFolderByPath(
    path: string,
    params: {
      page?: number;
      size?: number;
      name?: string;
      showFolder?: boolean;
      desc?: boolean;
      sort?: SortFields;
    } = {},
    options?: any
  ): Promise<FolderRepoResDto> {
    return notificationApiClient.getFolderByPath(path, params, options);
  }

  /**
   * Get repository (root folders)
   */
  static async getRepository(params: {
    page?: number;
    size?: number;
    name?: string;
    desc?: boolean;
    sort?: SortFields;
  } = {}, options?: any): Promise<PageResponse<FolderResDto>> {
    return notificationApiClient.getRepository(params, options);
  }

  /**
   * Get shared folders
   */
  static async getSharedFolders(params: {
    page?: number;
    size?: number;
    name?: string;
    showFolder?: boolean;
    desc?: boolean;
    sort?: SortFields;
  } = {}, options?: any): Promise<FolderRepoResDto> {
    return notificationApiClient.getSharedFolders(params, options);
  }

  /**
   * Rename folder
   */
  static async renameFolder(id: number, name: string, options?: any): Promise<void> {
    return notificationApiClient.renameFolder(id, name, options);
  }

  /**
   * Move folder
   */
  static async moveFolder(id: number, to: number, options?: any): Promise<void> {
    return notificationApiClient.moveFolder(id, to, options);
  }

  /**
   * Get folder shared permissions
   */
  static async getFolderShared(id: number, params: {
    page?: number;
    size?: number;
  } = {}, options?: any): Promise<PageResponse<TypeShareAccessRes>> {
    return notificationApiClient.getFolderShared(id, params, options);
  }

  /**
   * Create or update folder shared permission
   */
  static async createOrUpdateFolderShared(
    folderId: number,
    data: TypeShareAccessWithTypeReq,
    options?: any
  ): Promise<TypeShareAccessRes> {
    return notificationApiClient.createOrUpdateFolderShared(folderId, data, options);
  }

  /**
   * Delete folder shared permission
   */
  static async deleteFolderShared(folderId: number, granteeId: string, inherits: boolean, options?: any): Promise<void> {
    return notificationApiClient.deleteFolderShared(folderId, granteeId, inherits, options);
  }

  /**
   * Delete folder
   */
  static async deleteFolder(id: number, options?: any): Promise<void> {
    return notificationApiClient.deleteFolder(id, options);
  }
}

export default FolderService;
