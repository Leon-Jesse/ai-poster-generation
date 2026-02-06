import api from '@/lib/api';
import { ApiResponse } from './paymentService';

export interface GeneratePosterRequest {
  platform?: string; // youtube, xiaohongshu, douyin
  title_text: string; // 封面大字
  background_text?: string; // 背景场景
  emotion: string; // 表情
  selfie_base64?: string; // 用户照片 base64 (可选)
  style_ref_base64?: string; // 风格参考图 base64 (可选)
  advanced_style?: string; // 自定义风格指令 (可选)
}

export interface Poster {
  id: number;
  status: string; // pending, completed, failed
  cost: number;
  prompt: Record<string, any>;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GeneratedThumbnail {
  url: string;
  style: string;
}

export interface GeneratePosterResponse {
  id: number;
  status: string;
  cost: number;
  prompt: Record<string, any>;
  image_url?: string;
  thumbnails?: GeneratedThumbnail[];
}

export const posterService = {
  generate: async (data: GeneratePosterRequest) => {
    return api.post<any, ApiResponse<GeneratePosterResponse>>('/posters/generate', data);
  },

  list: async (page: number = 1, pageSize: number = 20) => {
    return api.get<any, ApiResponse<{ total: number; items: Poster[] }>>('/posters', {
      params: { 
        page: page.toString(), 
        page_size: pageSize.toString() 
      },
    });
  },

  getDetail: async (id: number) => {
    return api.get<any, ApiResponse<Poster>>(`/posters/${id}`);
  },

  getHistory: async (page: number = 1, pageSize: number = 20) => {
    return api.get<any, ApiResponse<{ total: number; items: Poster[] }>>('/posters/history', {
      params: { 
        page: page.toString(), 
        page_size: pageSize.toString() 
      },
    });
  },
};
