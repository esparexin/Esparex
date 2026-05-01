import { MachineConfig, MachineState, MachineEvent } from './machineTypes';

export function createMachine<S extends MachineState, E extends MachineEvent>(
    config: MachineConfig<S, E>
) {
    return config;
}
