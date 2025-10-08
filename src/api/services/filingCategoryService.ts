import { notificationApiClient } from '../notificationClient';
import {
  FilingCategoryRequestDto,
  FilingCategoryResponseDto,
  MetaDataListReq,
  MetaDataListRes,
  PageResponse
} from '../../types/api';

export class FilingCategoryService {
  /**
   * Create filing category
   */
  static async createFilingCategory(data: FilingCategoryRequestDto): Promise<FilingCategoryResponseDto> {
    return notificationApiClient.createFilingCategory(data);
  }

  /**
   * Get all filing categories
   */
  static async getAllFilingCategories(params: {
    name?: string;
    page?: number;
    size?: number;
  } = {}): Promise<PageResponse<FilingCategoryResponseDto>> {
    return notificationApiClient.getAllFilingCategories(params);
  }

  /**
   * Get filing category by ID
   */
  static async getFilingCategoryById(id: number): Promise<FilingCategoryResponseDto> {
    return notificationApiClient.getFilingCategoryById(id);
  }

  /**
   * Update filing category
   */
  static async updateFilingCategory(id: number, data: FilingCategoryRequestDto): Promise<FilingCategoryResponseDto> {
    return notificationApiClient.updateFilingCategory(id, data);
  }

  /**
   * Delete filing category
   */
  static async deleteFilingCategory(id: number): Promise<void> {
    return notificationApiClient.deleteFilingCategory(id);
  }
}

export class MetadataListService {
  /**
   * Create metadata list
   */
  static async createMetadataList(data: MetaDataListReq): Promise<MetaDataListRes> {
    return notificationApiClient.createMetadataList(data);
  }

  /**
   * Get all metadata lists
   */
  static async getAllMetadataLists(params: {
    name?: string;
    page?: number;
    size?: number;
  } = {}): Promise<PageResponse<MetaDataListRes>> {
    return notificationApiClient.getAllMetadataLists(params);
  }

  /**
   * Get metadata list by ID
   */
  static async getMetadataListById(id: number): Promise<MetaDataListRes> {
    return notificationApiClient.getMetadataListById(id);
  }

  /**
   * Update metadata list
   */
  static async updateMetadataList(id: number, data: MetaDataListReq): Promise<MetaDataListRes> {
    return notificationApiClient.updateMetadataList(id, data);
  }

  /**
   * Delete metadata list
   */
  static async deleteMetadataList(id: number): Promise<void> {
    return notificationApiClient.deleteMetadataList(id);
  }
}

export default FilingCategoryService;
