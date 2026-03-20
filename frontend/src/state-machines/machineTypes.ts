export type MachineState = string;
export type MachineEvent = string;

export interface MachineConfig<S extends MachineState, E extends MachineEvent> {
    initial: S;
    states: {
        [state in S]: {
            on?: Partial<Record<E, S>>;
        };
    };
}
