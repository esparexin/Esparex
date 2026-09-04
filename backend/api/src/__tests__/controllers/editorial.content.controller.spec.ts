jest.mock('@esparex/core/services/PageContentService', () => ({
  __esModule: true,
  findContentBySlug: jest.fn(),
  upsertContentBySlug: jest.fn(),
  getAllContent: jest.fn(),
}));

import type { Request, Response } from 'express';
import {
  findContentBySlug,
  upsertContentBySlug,
  getAllContent as fetchAllContent,
} from '@esparex/core/services/PageContentService';
import * as editorialController from '../../controllers/content/editorial.content.controller';

const mockFindContentBySlug = findContentBySlug as jest.MockedFunction<typeof findContentBySlug>;
const mockUpsertContentBySlug = upsertContentBySlug as jest.MockedFunction<typeof upsertContentBySlug>;
const mockGetAllContent = fetchAllContent as jest.MockedFunction<typeof fetchAllContent>;

const createMockResponse = () => {
  const res: Partial<Response> & {
    statusCode?: number;
    responseData?: unknown;
  } = {};
  res.status = jest.fn().mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn().mockImplementation((data: unknown) => {
    res.responseData = data;
    return res;
  });
  return res as Response & { statusCode?: number; responseData?: unknown };
};

describe('EditorialContentController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getContentBySlug', () => {
    it('returns existing editorial content when slug is found', async () => {
      const mockDoc = {
        slug: 'terms',
        title: 'Terms of Service',
        content: 'Official terms and conditions',
        items: [],
        updatedAt: new Date(),
      };
      mockFindContentBySlug.mockResolvedValue(mockDoc as never);

      const req: Partial<Request> = {
        params: { slug: 'terms' },
      };
      const res = createMockResponse();

      await editorialController.getContentBySlug(req as Request, res);

      expect(mockFindContentBySlug).toHaveBeenCalledWith('terms');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.responseData).toEqual(
        expect.objectContaining({
          success: true,
          data: mockDoc,
        })
      );
    });

    it('returns standardized default fallback when slug is not found', async () => {
      mockFindContentBySlug.mockResolvedValue(null);

      const req: Partial<Request> = {
        params: { slug: 'privacy' },
      };
      const res = createMockResponse();

      await editorialController.getContentBySlug(req as Request, res);

      expect(mockFindContentBySlug).toHaveBeenCalledWith('privacy');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.responseData).toEqual(
        expect.objectContaining({
          success: true,
          data: {
            slug: 'privacy',
            title: 'Privacy',
            content: '',
            items: [],
          },
        })
      );
    });

    it('handles service errors gracefully with 500 response', async () => {
      mockFindContentBySlug.mockRejectedValue(new Error('Database unavailable'));

      const req: Partial<Request> = {
        params: { slug: 'terms' },
      };
      const res = createMockResponse();

      await editorialController.getContentBySlug(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateContentBySlug', () => {
    it('calls upsertContentBySlug with payload and admin credentials', async () => {
      const updatedDoc = {
        slug: 'terms',
        title: 'Updated Terms',
        content: 'Revised marketplace policy',
        items: [],
        updatedBy: 'admin-42',
      };
      mockUpsertContentBySlug.mockResolvedValue(updatedDoc as never);

      const req: Partial<Request> & { admin?: { id?: string } } = {
        params: { slug: 'terms' },
        body: {
          title: 'Updated Terms',
          content: 'Revised marketplace policy',
          items: [],
        },
        admin: { id: 'admin-42' },
      };
      const res = createMockResponse();

      await editorialController.updateContentBySlug(req as Request, res);

      expect(mockUpsertContentBySlug).toHaveBeenCalledWith('terms', {
        title: 'Updated Terms',
        content: 'Revised marketplace policy',
        items: [],
        metadata: undefined,
        updatedBy: 'admin-42',
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.responseData).toEqual(
        expect.objectContaining({
          success: true,
          message: 'Content for terms updated successfully',
          data: updatedDoc,
        })
      );
    });

    it('extracts admin ID from _id if id is not present', async () => {
      const updatedDoc = {
        slug: 'terms',
        title: 'Terms',
        content: 'Content',
        items: [],
        updatedBy: 'admin-mongo-id',
      };
      mockUpsertContentBySlug.mockResolvedValue(updatedDoc as never);

      const req: Partial<Request> & { admin?: { _id?: { toString(): string } } } = {
        params: { slug: 'terms' },
        body: { title: 'Terms', content: 'Content' },
        admin: { _id: { toString: () => 'admin-mongo-id' } },
      };
      const res = createMockResponse();

      await editorialController.updateContentBySlug(req as Request, res);

      expect(mockUpsertContentBySlug).toHaveBeenCalledWith(
        'terms',
        expect.objectContaining({
          updatedBy: 'admin-mongo-id',
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('handles update service errors with 500 response', async () => {
      mockUpsertContentBySlug.mockRejectedValue(new Error('Write error'));

      const req: Partial<Request> = {
        params: { slug: 'terms' },
        body: { title: 'Terms' },
      };
      const res = createMockResponse();

      await editorialController.updateContentBySlug(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAllContent', () => {
    it('returns all published content slugs from PageContentService', async () => {
      const allDocs = [
        { slug: 'terms', title: 'Terms of Service', updatedAt: new Date() },
        { slug: 'privacy', title: 'Privacy Policy', updatedAt: new Date() },
      ];
      mockGetAllContent.mockResolvedValue(allDocs as never);

      const req: Partial<Request> = {};
      const res = createMockResponse();

      await editorialController.getAllContent(req as Request, res);

      expect(mockGetAllContent).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.responseData).toEqual(
        expect.objectContaining({
          success: true,
          data: allDocs,
        })
      );
    });

    it('handles fetch all service errors with 500 response', async () => {
      mockGetAllContent.mockRejectedValue(new Error('Query error'));

      const req: Partial<Request> = {};
      const res = createMockResponse();

      await editorialController.getAllContent(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
