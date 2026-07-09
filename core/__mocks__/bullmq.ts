export const Queue = jest.fn().mockImplementation((name, opts) => {
    return {
        name,
        opts,
        add: jest.fn().mockResolvedValue({ id: `mock-job-${Date.now()}` }),
        addBulk: jest.fn().mockResolvedValue([]),
        pause: jest.fn().mockResolvedValue(undefined),
        resume: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
        getJobCounts: jest.fn().mockResolvedValue({
            waiting: 0,
            active: 0,
            delayed: 0,
            failed: 0,
            completed: 0,
        }),
        getJob: jest.fn().mockResolvedValue(null),
    };
});

export const Worker = jest.fn().mockImplementation((name, processor, opts) => {
    return {
        name,
        opts,
        close: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
    };
});

export const QueueEvents = jest.fn().mockImplementation((name, opts) => {
    return {
        name,
        opts,
        close: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
    };
});
