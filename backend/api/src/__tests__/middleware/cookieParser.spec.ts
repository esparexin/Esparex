import { Request, Response, NextFunction } from 'express';
import { cookieParser } from '../../middleware/cookieParser';

describe('cookieParser middleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockReq = {
            headers: {},
        };
        mockRes = {};
        mockNext = jest.fn();
    });

    it('should initialize empty cookies when header is absent', () => {
        cookieParser(mockReq as Request, mockRes as Response, mockNext);

        expect(mockReq.cookies).toEqual({});
        expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should parse single cookie correctly', () => {
        mockReq.headers = { cookie: 'esparex_auth=eyJhbGciOiJIUzI1NiJ9' };
        cookieParser(mockReq as Request, mockRes as Response, mockNext);

        expect(mockReq.cookies).toEqual({
            esparex_auth: 'eyJhbGciOiJIUzI1NiJ9',
        });
        expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should parse multiple semicolon-separated cookies', () => {
        mockReq.headers = {
            cookie: 'esparex_auth=jwt123; esparex_csrf=csrf456; theme=dark',
        };
        cookieParser(mockReq as Request, mockRes as Response, mockNext);

        expect(mockReq.cookies).toEqual({
            esparex_auth: 'jwt123',
            esparex_csrf: 'csrf456',
            theme: 'dark',
        });
        expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should handle URL-encoded cookie values', () => {
        mockReq.headers = {
            cookie: 'user_name=John%20Doe; greeting=Hello%2C%20World%21',
        };
        cookieParser(mockReq as Request, mockRes as Response, mockNext);

        expect(mockReq.cookies).toEqual({
            user_name: 'John Doe',
            greeting: 'Hello, World!',
        });
    });

    it('should unquote quoted cookie values according to RFC 6265', () => {
        mockReq.headers = {
            cookie: 'quoted_val="hello world"; plain_val=unquoted',
        };
        cookieParser(mockReq as Request, mockRes as Response, mockNext);

        expect(mockReq.cookies).toEqual({
            quoted_val: 'hello world',
            plain_val: 'unquoted',
        });
    });

    it('should handle empty or malformed cookie segments safely', () => {
        mockReq.headers = {
            cookie: '; ; valueless; key=; =missingKey; ;',
        };
        cookieParser(mockReq as Request, mockRes as Response, mockNext);

        expect(mockReq.cookies).toEqual({
            valueless: '',
            key: '',
            '': 'missingKey',
        });
    });
});
